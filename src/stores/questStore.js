import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, auth } from '../services/firebase'
import {
  collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc, setDoc, getDoc, increment
} from 'firebase/firestore'
import { differenceInCalendarDays } from 'date-fns'
import { usePlayerStore } from './playerStore'

export const useQuestStore = defineStore('quest', () => {
  const quests = ref([])
  const loading = ref(false)
  const playerStore = usePlayerStore()

  // Timeout wrapper — prevents Firebase from hanging forever when offline
  const withTimeout = (promise, ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), ms))
    ])
  }

  const loadQuests = async () => {
    if (!auth.currentUser) return
    loading.value = true
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'quests'),
        where('status', '!=', 'completed')
      )
      const snap = await withTimeout(getDocs(q))
      quests.value = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          // Soonest deadline first, no deadline goes to bottom
          const aTime = a.deadline?.seconds ?? Infinity
          const bTime = b.deadline?.seconds ?? Infinity
          return aTime - bTime
        })

      // Check for decay on load
      await checkDecay()

      // Compute streak from history
      await computeStreak()
    } catch (err) {
      console.error("Failed to load quests:", err)
    } finally {
      loading.value = false
    }
  }

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

    // Sort immediately so new quest slots into correct position
    quests.value.sort((a, b) => {
      const aTime = a.deadline?.seconds ?? Infinity
      const bTime = b.deadline?.seconds ?? Infinity
      return aTime - bTime
    })

    playerStore.isSyncing = true
    try {
      const docRef = await withTimeout(addDoc(collection(db, 'users', auth.currentUser.uid, 'quests'), {
        ...questData,
        status: 'active',
        createdAt: serverTimestamp(),
        daysOverdue: 0
      }))

      // Update with real ID
      const index = quests.value.findIndex(q => q.id === tempId)
      if (index !== -1) {
        quests.value[index].id = docRef.id
      }
    } catch (err) {
      console.error("Failed to add quest:", err)
      quests.value = quests.value.filter(q => q.id !== tempId)
      throw err
    } finally {
      playerStore.isSyncing = false
    }
  }

  const completeQuest = async (questId) => {
    const questIndex = quests.value.findIndex(q => q.id === questId)
    if (questIndex === -1) return

    const quest = quests.value[questIndex]

    // Optimistic Update
    quests.value.splice(questIndex, 1)

    playerStore.isSyncing = true
    try {
      // Calculate Reward
      if (quest.status !== 'corrupted') {
        let reward = quest.xpReward

        // Momentum Multiplier
        if (playerStore.streak >= 7) reward *= 1.5
        else if (playerStore.streak >= 3) reward *= 1.2

        // Early Bird Bonus
        if (quest.deadline) {
          const deadline = new Date(quest.deadline.seconds * 1000)
          const today = new Date()
          const daysEarly = differenceInCalendarDays(deadline, today)

          if (daysEarly > 0) {
            const bonus = Math.round(quest.xpReward * (0.1 * daysEarly))
            console.log(`Early Bird Bonus: +${bonus} XP (${daysEarly} days early)`)
            reward += bonus
          }
        }

        await playerStore.addXP(Math.round(reward))
      }

      // Update Quest Status
      const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', questId)
      await withTimeout(updateDoc(questRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      }))

      // Log History for Heatmap
      const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', 'heatmap')
      const now = new Date()
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

      // Use setDoc with merge to ensure doc exists
      await withTimeout(setDoc(historyRef, {
        [todayStr]: increment(1)
      }, { merge: true }))

      // Recompute streak after logging completion
      await computeStreak()

    } catch (err) {
      console.error("Failed to complete quest:", err)
      // Ideally revert here, but for now just log
    } finally {
      playerStore.isSyncing = false
    }
  }

  const deleteQuest = async (questId) => {
    if (!auth.currentUser) return

    // Optimistic Update
    quests.value = quests.value.filter(q => q.id !== questId)

    playerStore.isSyncing = true
    try {
      const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', questId)
      await withTimeout(deleteDoc(questRef))
    } catch (err) {
      console.error("Failed to delete quest:", err)
    } finally {
      playerStore.isSyncing = false
    }
  }

  const editQuest = async (questId, updates) => {
    if (!auth.currentUser) return

    // Optimistic Update
    const quest = quests.value.find(q => q.id === questId)
    if (!quest) return

    const originalData = { ...quest }
    Object.assign(quest, updates)

    // Re-sort by deadline immediately
    quests.value.sort((a, b) => {
      const aTime = a.deadline?.seconds ?? Infinity
      const bTime = b.deadline?.seconds ?? Infinity
      return aTime - bTime
    })

    playerStore.isSyncing = true
    try {
      const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', questId)
      await withTimeout(updateDoc(questRef, updates))
    } catch (err) {
      console.error("Failed to edit quest:", err)
      // Revert on failure
      Object.assign(quest, originalData)
    } finally {
      playerStore.isSyncing = false
    }
  }

  const checkDecay = async () => {
    const today = playerStore.getTodayStr()

    // Fix #3: Only run decay once per day
    if (playerStore.lastDecayDate === today) return
    playerStore.lastDecayDate = today

    const now = new Date()
    let totalPenalty = 0
    const missedDates = {}

    for (const quest of quests.value) {
      if (!quest.deadline) continue

      const deadline = new Date(quest.deadline.seconds * 1000)
      const daysUpdate = differenceInCalendarDays(now, deadline)

      if (daysUpdate > 0) {
        // Apply Rot: 50 * (2 ^ (d - 1))
        const penalty = 50 * Math.pow(2, daysUpdate - 1)
        totalPenalty += penalty
        quest.daysOverdue = daysUpdate

        // Track the deadline date as a missed date for heatmap
        const dlStr = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')}`
        missedDates[`missed_${dlStr}`] = increment(1)

        if (daysUpdate >= 5) {
          quest.status = 'corrupted'
        }
      }
    }

    if (totalPenalty > 0) {
      // Reset streak when quests are overdue
      playerStore.streak = 0
      await playerStore.applyDecay(totalPenalty)

      // Log missed dates to heatmap history
      if (auth.currentUser && Object.keys(missedDates).length > 0) {
        try {
          const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', 'heatmap')
          await withTimeout(setDoc(historyRef, missedDates, { merge: true }))
        } catch (err) {
          console.error("Failed to log missed dates:", err)
        }
      }
    } else {
      // Still save the lastDecayDate even if no penalty
      await playerStore.saveStats()
    }
  }

  // Compute streak from heatmap history data
  const computeStreak = async () => {
    if (!auth.currentUser) return
    try {
      const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', 'heatmap')
      const snap = await withTimeout(getDoc(historyRef))
      if (!snap.exists()) return

      const data = snap.data()
      let streak = 0
      const today = new Date()

      // Count consecutive days backward from today/yesterday
      for (let i = 0; i <= 365; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        const completed = data[dateStr] || 0
        const missed = data[`missed_${dateStr}`] || 0

        if (completed > 0 && missed === 0) {
          streak++
        } else if (i === 0 && completed === 0) {
          // Today has no activity yet — check from yesterday
          continue
        } else {
          break
        }
      }

      playerStore.streak = streak
      await playerStore.saveStats()
    } catch (err) {
      console.error("Failed to compute streak:", err)
    }
  }

  return {
    quests,
    loading,
    loadQuests,
    addQuest,
    completeQuest,
    deleteQuest,
    editQuest,
    checkDecay,
    computeStreak
  }
})
