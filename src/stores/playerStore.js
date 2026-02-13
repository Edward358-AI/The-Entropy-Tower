import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '../services/firebase'
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

export const usePlayerStore = defineStore('player', () => {
  const level = ref(5)
  const currentXP = ref(50)
  const streak = ref(0)
  const totalXPLost = ref(0)
  const isLevelCapped = ref(false)
  const loading = ref(false)
  const isSyncing = ref(false)

  // Timeout wrapper — prevents Firebase from hanging forever when offline
  const withTimeout = (promise, ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), ms))
    ])
  }

  // XP to next level: 100 + (Level * 20)
  const xpToNextLevel = computed(() => 100 + (level.value * 20))

  const towerMaterial = computed(() => {
    if (level.value < 10) return 'Stone'
    if (level.value < 20) return 'Iron'
    if (level.value < 30) return 'Gold'
    if (level.value < 40) return 'Diamond'
    return 'Astral'
  })

  // Sync with Firestore
  const initStats = async () => {
    if (!auth.currentUser) return
    loading.value = true
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid, 'stats', 'main')
      const snap = await withTimeout(getDoc(userRef))

      if (snap.exists()) {
        const data = snap.data()
        level.value = data.level || 1
        currentXP.value = data.currentXP || 0
        streak.value = data.streak || 0
        totalXPLost.value = data.totalXPLost || 0
        isLevelCapped.value = data.isLevelCapped || false
      } else {
        // Create initial stats
        await withTimeout(setDoc(userRef, {
          level: 5,
          currentXP: 50,
          streak: 0,
          totalXPLost: 0,
          isLevelCapped: false,
          createdAt: serverTimestamp()
        }))
      }
    } catch (err) {
      console.error("Failed to init stats:", err)
    } finally {
      loading.value = false
    }
  }

  const addXP = async (amount) => {
    if (isLevelCapped.value) return // Boss Gate active

    currentXP.value += amount

    // Check Level Up
    while (currentXP.value >= xpToNextLevel.value) {
      // Check for Boss Gate (Levels 19, 29, 39...)
      if ((level.value + 1) % 10 === 0) {
        currentXP.value = xpToNextLevel.value // Cap at max
        isLevelCapped.value = true
        break
      }

      currentXP.value -= xpToNextLevel.value
      level.value++
    }

    await saveStats()
  }

  const applyDecay = async (amount) => {
    currentXP.value -= amount
    totalXPLost.value += amount

    // De-leveling logic (Entropy wins)
    while (currentXP.value < 0) {
      if (level.value > 1) {
        level.value--
        currentXP.value += (100 + (level.value * 20)) // Add back XP of previous level
      } else {
        currentXP.value = 0 // Hit rock bottom
        break
      }
    }

    await saveStats()
  }

  const saveStats = async () => {
    if (!auth.currentUser) return
    isSyncing.value = true
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid, 'stats', 'main')
      await withTimeout(updateDoc(userRef, {
        level: level.value,
        currentXP: currentXP.value,
        streak: streak.value,
        totalXPLost: totalXPLost.value,
        isLevelCapped: isLevelCapped.value,
        lastUpdated: serverTimestamp()
      }))
    } catch (err) {
      console.error("Save stats failed (timeout or offline):", err)
    } finally {
      isSyncing.value = false
    }
  }

  return {
    level,
    currentXP,
    streak,
    totalXPLost,
    isLevelCapped,
    loading,
    isSyncing,
    xpToNextLevel,
    towerMaterial,
    initStats,
    addXP,
    applyDecay
  }
})
