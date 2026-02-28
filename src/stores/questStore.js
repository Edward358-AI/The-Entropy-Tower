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
  const heatmapVersion = ref(0) // Bumped after heatmap writes to trigger UI refresh
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

      // Check for decay on load (BEFORE refreshOverdueStatus so raw daysOverdue from Firestore is intact)
      await checkDecay()

      // Mark overdue status based on exact deadline time (visual, every load)
      refreshOverdueStatus()

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
        if (playerStore.streak >= 14) reward *= 2.5
        else if (playerStore.streak >= 7) reward *= 2.0
        else if (playerStore.streak >= 5) reward *= 1.6
        else if (playerStore.streak >= 3) reward *= 1.3

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

      // Signal heatmap to refresh
      heatmapVersion.value++

    } catch (err) {
      console.error("Failed to complete quest:", err)
      // Ideally revert here, but for now just log
    } finally {
      playerStore.isSyncing = false
    }
  }

  const deleteQuest = async (questId) => {
    if (!auth.currentUser) return

    const quest = quests.value.find(q => q.id === questId)

    // Abandonment penalty: if quest is overdue, apply current day's decay
    if (quest && quest.daysOverdue > 0) {
      const penalty = getDecayPenalty(quest.daysOverdue)
      playerStore.streak = 0
      await playerStore.applyDecay(penalty)
    }

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
      Object.assign(quest, originalData)
    } finally {
      playerStore.isSyncing = false
    }
  }

  // Calculate decay penalty for a given daysOverdue value
  const getDecayPenalty = (daysOverdue) => {
    let initialRate, escalation
    if (playerStore.level < 20) { initialRate = 0.10; escalation = 0.05 }
    else if (playerStore.level < 40) { initialRate = 0.15; escalation = 0.05 }
    else if (playerStore.level < 60) { initialRate = 0.20; escalation = 0.10 }
    else if (playerStore.level < 80) { initialRate = 0.25; escalation = 0.10 }
    else if (playerStore.level < 100) { initialRate = 0.25; escalation = 0.15 }
    else { initialRate = 0.30; escalation = 0.20 }

    const dayRate = daysOverdue <= 1
      ? initialRate
      : initialRate + escalation * (daysOverdue - 1)
    return Math.round(playerStore.xpToNextLevel * dayRate)
  }

  // Mark quests overdue based on exact deadline time (runs every load, visual only)
  const refreshOverdueStatus = () => {
    const now = new Date()
    for (const quest of quests.value) {
      if (!quest.deadline) continue
      const deadline = new Date(quest.deadline.seconds * 1000)
      if (now > deadline) {
        quest.daysOverdue = Math.max(1, differenceInCalendarDays(now, deadline))
        if (quest.daysOverdue >= 5) quest.status = 'corrupted'
      } else {
        quest.daysOverdue = 0
      }
    }
  }

  const checkDecay = async () => {
    // Wait for player stats to load so lastDecayDate is accurate
    await playerStore.statsReady
    const today = playerStore.getTodayStr()
    const now = new Date()

    // Detect quests that JUST became overdue (past exact time, not yet penalized)
    const newlyOverdue = quests.value.filter(q => {
      if (!q.deadline) return false
      const deadline = new Date(q.deadline.seconds * 1000)
      return now > deadline && (!q.daysOverdue || q.daysOverdue === 0)
    })

    const isNewDay = playerStore.lastDecayDate !== today

    // Skip if nothing to do: not a new day AND no newly overdue quests
    if (!isNewDay && newlyOverdue.length === 0) return

    if (isNewDay) playerStore.lastDecayDate = today

    let totalPenalty = 0
    const missedDates = {}

    for (const quest of quests.value) {
      if (!quest.deadline) continue

      const deadline = new Date(quest.deadline.seconds * 1000)
      if (!(now > deadline)) continue // Not overdue yet

      const daysUpdate = Math.max(1, differenceInCalendarDays(now, deadline))
      const wasAlreadyOverdue = quest.daysOverdue > 0
      quest.daysOverdue = daysUpdate

      // Apply penalty if: new day (daily escalation) OR first-hit (just became overdue)
      if (isNewDay || !wasAlreadyOverdue) {
        const penalty = getDecayPenalty(daysUpdate)
        totalPenalty += penalty

        // Track TODAY as a missed date for heatmap (each overdue day counts as a miss)
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        missedDates[`missed_${todayStr}`] = increment(1)
      }

      if (daysUpdate >= 5) {
        quest.status = 'corrupted'
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

          // Signal heatmap to refresh
          heatmapVersion.value++
        } catch (err) {
          console.error("Failed to log missed dates:", err)
        }
      }
    } else {
      // Still save the lastDecayDate even if no penalty
      await playerStore.saveStats()
    }

    // Persist daysOverdue for each overdue quest so next load doesn't re-trigger first-hit
    if (auth.currentUser) {
      for (const quest of quests.value) {
        if (quest.daysOverdue > 0 && quest.id && !quest.id.startsWith('temp-')) {
          try {
            const questRef = doc(db, 'users', auth.currentUser.uid, 'quests', quest.id)
            await withTimeout(updateDoc(questRef, { daysOverdue: quest.daysOverdue }))
          } catch (err) {
            console.error('Failed to persist daysOverdue:', err)
          }
        }
      }
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
    heatmapVersion,
    loadQuests,
    addQuest,
    completeQuest,
    deleteQuest,
    editQuest,
    checkDecay,
    computeStreak
  }
})
