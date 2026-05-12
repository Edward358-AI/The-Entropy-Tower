import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, auth, functions } from '../services/firebase'
import { httpsCallable } from 'firebase/functions'
import {
  collection, addDoc, query, where, updateDoc, doc, serverTimestamp, onSnapshot, Timestamp
} from 'firebase/firestore'
import { differenceInCalendarDays } from 'date-fns'
import { usePlayerStore } from './playerStore'

export const useQuestStore = defineStore('quest', () => {
  const quests = ref([])
  const loading = ref(false)
  const processingIds = ref(new Set()) // Prevents double-clicks on the same quest
  const playerStore = usePlayerStore()

  let unsubQuests = null // onSnapshot unsubscribe handle

  // Timeout wrapper — prevents Firebase from hanging forever when offline
  const withTimeout = (promise, ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), ms))
    ])
  }

  const sortQuests = (arr) => {
    return arr.sort((a, b) => {
      const aTime = a.deadline?.seconds ?? Infinity
      const bTime = b.deadline?.seconds ?? Infinity
      return aTime - bTime
    })
  }

  /**
   * Load quests via onSnapshot for real-time updates.
   * Also triggers server-side decay processing on initial load.
   */
  const loadQuests = async () => {
    if (!auth.currentUser) return
    loading.value = true

    // Unsubscribe from any previous listener
    if (unsubQuests) {
      unsubQuests()
      unsubQuests = null
    }

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'quests'),
      where('status', '!=', 'completed')
    )

    // Set up real-time listener
    unsubQuests = onSnapshot(q, (snap) => {
      // Skip stale cached snapshots while an optimistic update is in-flight.
      // Allow snapshots that reflect our own pending writes.
      if (playerStore.isSyncing && snap.metadata.fromCache && !snap.metadata.hasPendingWrites) {
        return
      }

      quests.value = sortQuests(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      )

      // Visual-only: fill in overdue data for quests the server hasn't processed yet
      refreshOverdueStatus()

      loading.value = false
    }, (err) => {
      console.error('Quest snapshot error:', err)
      loading.value = false
    })

    // Trigger server-side decay processing (Phase 1)
    try {
      const processMyDecay = httpsCallable(functions, 'processMyDecay')
      await processMyDecay()
    } catch (err) {
      console.warn('Server decay processing failed:', err.message)
    }
  }

  /**
   * Add a new quest (client writes directly — quest data is user-controlled).
   * Optimistic update with server sync.
   */
  const addQuest = async (questData) => {
    if (!auth.currentUser) return

    // Optimistic Update
    const tempId = 'temp-' + Date.now()
    const tempQuest = {
      id: tempId,
      ...questData,
      status: 'active',
      daysOverdue: 0,
      createdAt: { seconds: Date.now() / 1000 }
    }
    quests.value.push(tempQuest)
    sortQuests(quests.value)

    playerStore.isSyncing = true
    try {
      await withTimeout(addDoc(collection(db, 'users', auth.currentUser.uid, 'quests'), {
        ...questData,
        status: 'active',
        createdAt: serverTimestamp(),
        daysOverdue: 0
      }))
      // onSnapshot will replace the temp quest with the real one
    } catch (err) {
      console.error("Failed to add quest:", err)
      quests.value = quests.value.filter(q => q.id !== tempId)
      throw err
    } finally {
      playerStore.isSyncing = false
    }
  }

  /**
   * Complete a quest via server-side Cloud Function.
   * Optimistic removal from UI; server handles all XP/coin/streak logic.
   */
  const completeQuest = async (questId) => {
    if (processingIds.value.has(questId)) return // Already processing
    const questIndex = quests.value.findIndex(q => q.id === questId)
    if (questIndex === -1) return
    processingIds.value.add(questId)

    // Optimistic Update: remove from list immediately
    const removedQuest = quests.value.splice(questIndex, 1)[0]

    // Optimistic XP/coin prediction for instant UI feedback
    const prevXP = playerStore.currentXP
    const prevCoins = playerStore.coins
    const prevStreak = playerStore.streak
    const prevLevel = playerStore.level

    const estimatedXP = removedQuest.xpReward || 0
    const estimatedCoins = Math.max(1, Math.ceil((removedQuest.xpReward || 0) / 40))
    playerStore.currentXP += estimatedXP
    playerStore.coins += estimatedCoins
    if (playerStore.streak === 0) playerStore.streak = 1

    playerStore.isSyncing = true
    try {
      const completeQuestFn = httpsCallable(functions, 'completeQuest')
      await completeQuestFn({ questId })
      // onSnapshot will confirm with the server's authoritative values
    } catch (err) {
      console.error("Failed to complete quest:", err)
      // Revert all optimistic updates
      quests.value.splice(questIndex, 0, removedQuest)
      sortQuests(quests.value)
      playerStore.currentXP = prevXP
      playerStore.coins = prevCoins
      playerStore.streak = prevStreak
      playerStore.level = prevLevel
    } finally {
      processingIds.value.delete(questId)
      playerStore.isSyncing = false
    }
  }

  /**
   * Delete (abandon) a quest via server-side Cloud Function.
   * Optimistic removal from UI; server handles abandonment penalty.
   */
  const deleteQuest = async (questId) => {
    if (!auth.currentUser) return
    if (processingIds.value.has(questId)) return // Already processing
    processingIds.value.add(questId)

    const questIndex = quests.value.findIndex(q => q.id === questId)
    const removedQuest = questIndex !== -1 ? quests.value.splice(questIndex, 1)[0] : null

    playerStore.isSyncing = true
    try {
      const deleteQuestFn = httpsCallable(functions, 'deleteQuest')
      await deleteQuestFn({ questId })
      // Server handles penalty + deletion; onSnapshot will confirm removal
    } catch (err) {
      console.error("Failed to delete quest:", err)
      // Revert optimistic removal
      if (removedQuest && questIndex !== -1) {
        quests.value.splice(questIndex, 0, removedQuest)
        sortQuests(quests.value)
      }
    } finally {
      processingIds.value.delete(questId)
      playerStore.isSyncing = false
    }
  }

  /**
   * Edit a quest (client writes directly — quest data is user-controlled).
   * Optimistic update with server sync.
   */
  const editQuest = async (questId, updates) => {
    if (!auth.currentUser) return

    const quest = quests.value.find(q => q.id === questId)
    if (!quest) return

    const originalData = { ...quest }
    Object.assign(quest, updates)
    sortQuests(quests.value)

    playerStore.isSyncing = true
    try {
      const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', questId)
      await withTimeout(updateDoc(questRef, updates))
    } catch (err) {
      console.error("Failed to edit quest:", err)
      Object.assign(quest, originalData)
    } finally {
      playerStore.isSyncing = false
    }
  }

  /**
   * Revive a corrupted quest via server-side Cloud Function.
   */
  const reviveQuest = async (questId) => {
    if (!auth.currentUser) return false
    if (processingIds.value.has(questId)) return false // Already processing

    const quest = quests.value.find(q => q.id === questId)
    if (!quest || quest.status !== 'corrupted') return false
    processingIds.value.add(questId)

    // Optimistic update
    const originalStatus = quest.status
    const originalDaysOverdue = quest.daysOverdue
    const originalDeadline = quest.deadline
    quest.status = 'active'
    quest.daysOverdue = 0

    playerStore.isSyncing = true
    try {
      const reviveQuestFn = httpsCallable(functions, 'reviveQuest')
      const result = await reviveQuestFn({ questId })

      // Update deadline from server response
      if (result.data?.newDeadline) {
        quest.deadline = Timestamp.fromDate(new Date(result.data.newDeadline))
      }
      sortQuests(quests.value)

      return true
    } catch (err) {
      console.error('Failed to revive quest:', err)
      // Revert optimistic update
      quest.status = originalStatus
      quest.daysOverdue = originalDaysOverdue
      quest.deadline = originalDeadline
      return false
    } finally {
      processingIds.value.delete(questId)
      playerStore.isSyncing = false
    }
  }

  /**
   * Toggle a subtask's completion status.
   * This is a client-side direct write (allowed by Firestore rules).
   * It does NOT trigger XP rewards; the main completeQuest handles that.
   */
  const toggleSubtask = async (questId, subtaskIndex) => {
    if (!auth.currentUser) return

    const quest = quests.value.find(q => q.id === questId)
    if (!quest || !quest.subtasks || !quest.subtasks[subtaskIndex]) return

    const currentStatus = quest.subtasks[subtaskIndex].completed
    const newStatus = !currentStatus

    // Optimistic update
    quest.subtasks[subtaskIndex].completed = newStatus

    playerStore.isSyncing = true
    try {
      const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', questId)
      // We must update the entire subtasks array since Firestore doesn't support updating specific array indices easily
      await withTimeout(updateDoc(questRef, {
        subtasks: quest.subtasks
      }))
    } catch (err) {
      console.error("Failed to toggle subtask:", err)
      // Revert optimistic update
      quest.subtasks[subtaskIndex].completed = currentStatus
    } finally {
      playerStore.isSyncing = false
    }
  }

  /**
   * Visual-only overdue marker.
   * If the server hasn't processed decay yet (daysOverdue is still 0 in Firestore),
   * this fills in the visual overdue state so the user sees immediate feedback.
   * It does NOT override server values — only fills gaps.
   */
  const refreshOverdueStatus = () => {
    const now = new Date()
    for (const quest of quests.value) {
      if (!quest.deadline) continue
      const deadline = new Date(quest.deadline.seconds * 1000)
      if (now > deadline && (!quest.daysOverdue || quest.daysOverdue === 0)) {
        // Server hasn't processed this yet — show visual overdue indicator
        quest.daysOverdue = Math.max(1, differenceInCalendarDays(now, deadline))
      }
      // Never override server-set daysOverdue or status — trust the server
    }
  }

  /**
   * Clean up onSnapshot listener when store is disposed.
   */
  const cleanup = () => {
    if (unsubQuests) {
      unsubQuests()
      unsubQuests = null
    }
  }

  return {
    quests,
    loading,
    processingIds,
    loadQuests,
    addQuest,
    completeQuest,
    deleteQuest,
    editQuest,
    reviveQuest,
    toggleSubtask,
    cleanup
  }
})
