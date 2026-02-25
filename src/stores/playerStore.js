import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '../services/firebase'
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

// All material tiers in order
const TIER_LIST = ['Stone', 'Iron', 'Gold', 'Diamond', 'Astral', 'Void', 'Celestial', 'Ethereal', 'Mythic', 'Transcendent', 'Omega']

// Which tier index a level falls into
const tierIndexForLevel = (lvl) => Math.min(Math.floor(lvl / 10), TIER_LIST.length - 1)

export const usePlayerStore = defineStore('player', () => {
  const level = ref(5)
  const currentXP = ref(50)
  const streak = ref(0)
  const totalXPLost = ref(0)
  const isLevelCapped = ref(false)
  const bossXPEarned = ref(0)
  const highestLevel = ref(5)
  const selectedTowerTheme = ref(null) // null = use current tier
  const selectedPageTheme = ref(null)  // null = use current tier
  const loading = ref(false)
  const isSyncing = ref(false)
  const lastActiveDate = ref(null)
  const lastDecayDate = ref(null)

  // Initialization gate — prevents saves from overwriting real data
  let _resolveReady
  const statsReady = new Promise(resolve => { _resolveReady = resolve })

  // Timeout wrapper — prevents Firebase from hanging forever when offline
  const withTimeout = (promise, ms = 10000) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Sync timeout')), ms))
    ])
  }

  // Helper: get today as YYYY-MM-DD in local time
  const getTodayStr = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  // Helper: get yesterday as YYYY-MM-DD in local time
  const getYesterdayStr = () => {
    const now = new Date()
    now.setDate(now.getDate() - 1)
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }

  // XP to next level: 100 + (Level * 20)
  const xpToNextLevel = computed(() => 100 + (level.value * 20))

  const towerMaterial = computed(() => {
    if (level.value < 10) return 'Stone'
    if (level.value < 20) return 'Iron'
    if (level.value < 30) return 'Gold'
    if (level.value < 40) return 'Diamond'
    if (level.value < 50) return 'Astral'
    if (level.value < 60) return 'Void'
    if (level.value < 70) return 'Celestial'
    if (level.value < 80) return 'Ethereal'
    if (level.value < 90) return 'Mythic'
    if (level.value < 100) return 'Transcendent'
    return 'Omega'
  })

  // Unlocked tiers based on highest level ever reached
  const unlockedTiers = computed(() => {
    const maxTierIdx = tierIndexForLevel(highestLevel.value)
    return TIER_LIST.slice(0, maxTierIdx + 1)
  })

  // Active tower material (cosmetic override or current tier)
  const activeTowerMaterial = computed(() => {
    if (selectedTowerTheme.value && unlockedTiers.value.includes(selectedTowerTheme.value)) {
      return selectedTowerTheme.value
    }
    return towerMaterial.value
  })

  // Active page theme (cosmetic override or current tier)
  const activePageTheme = computed(() => {
    if (selectedPageTheme.value && unlockedTiers.value.includes(selectedPageTheme.value)) {
      return selectedPageTheme.value
    }
    return towerMaterial.value
  })

  // Boss gate: which boss number is this? (1 at level 9, 2 at 19, etc.)
  const bossNumber = computed(() => Math.floor(level.value / 10) + 1)

  // Boss HP scales linearly: 150 * bossNumber
  const bossXPRequired = computed(() => 150 * bossNumber.value)

  // Sync with Firestore
  const initStats = async () => {
    if (!auth.currentUser) return
    loading.value = true
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid, 'stats', 'main')
      const snap = await withTimeout(getDoc(userRef))

      if (snap.exists()) {
        const data = snap.data()
        level.value = data.level ?? 5
        currentXP.value = data.currentXP ?? 50
        streak.value = data.streak ?? 0
        totalXPLost.value = data.totalXPLost ?? 0
        isLevelCapped.value = data.isLevelCapped ?? false
        bossXPEarned.value = data.bossXPEarned ?? 0
        highestLevel.value = data.highestLevel ?? data.level ?? 5
        selectedTowerTheme.value = data.selectedTowerTheme || null
        selectedPageTheme.value = data.selectedPageTheme || null
        lastActiveDate.value = data.lastActiveDate || null
        lastDecayDate.value = data.lastDecayDate || null
      } else {
        // Create initial stats
        await withTimeout(setDoc(userRef, {
          level: 5,
          currentXP: 50,
          streak: 0,
          totalXPLost: 0,
          isLevelCapped: false,
          bossXPEarned: 0,
          highestLevel: 5,
          selectedTowerTheme: null,
          selectedPageTheme: null,
          lastActiveDate: null,
          lastDecayDate: null,
          createdAt: serverTimestamp()
        }))
      }
    } catch (err) {
      console.error("Failed to init stats:", err)
    } finally {
      loading.value = false
      _resolveReady() // Unblock any pending saves
    }
  }

  // Fix #2: Update streak based on consecutive daily activity
  const updateStreak = () => {
    const today = getTodayStr()
    const yesterday = getYesterdayStr()

    if (lastActiveDate.value === today) {
      // Already active today, no change
      return
    } else if (lastActiveDate.value === yesterday) {
      // Consecutive day — streak continues
      streak.value++
    } else {
      // Streak broken — reset to 1
      streak.value = 1
    }

    lastActiveDate.value = today
  }

  const addXP = async (amount) => {
    await statsReady // Wait for init to complete

    // If boss gate is active, XP goes toward slaying the boss
    if (isLevelCapped.value) {
      bossXPEarned.value += amount
      updateStreak()

      // Check if boss is slain
      if (bossXPEarned.value >= bossXPRequired.value) {
        isLevelCapped.value = false
        bossXPEarned.value = 0
        currentXP.value = 0
        level.value++
        if (level.value > highestLevel.value) highestLevel.value = level.value
      }

      await saveStats()
      return
    }

    currentXP.value += amount

    // Update streak on any XP-earning activity
    updateStreak()

    // Check Level Up
    while (currentXP.value >= xpToNextLevel.value) {
      // Check for Boss Gate every 10 levels (9, 19, 29, 39...)
      if ((level.value + 1) % 10 === 0) {
        currentXP.value = xpToNextLevel.value // Cap at max
        isLevelCapped.value = true
        bossXPEarned.value = 0
        break
      }

      currentXP.value -= xpToNextLevel.value
      level.value++
      if (level.value > highestLevel.value) highestLevel.value = level.value
    }

    await saveStats()
  }


  const applyDecay = async (amount) => {
    await statsReady // Wait for init to complete
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
    await statsReady // Wait for init to complete
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
        bossXPEarned: bossXPEarned.value,
        highestLevel: highestLevel.value,
        selectedTowerTheme: selectedTowerTheme.value,
        selectedPageTheme: selectedPageTheme.value,
        lastActiveDate: lastActiveDate.value,
        lastDecayDate: lastDecayDate.value,
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
    bossXPEarned,
    bossXPRequired,
    bossNumber,
    highestLevel,
    selectedTowerTheme,
    selectedPageTheme,
    loading,
    isSyncing,
    lastDecayDate,
    xpToNextLevel,
    towerMaterial,
    activeTowerMaterial,
    activePageTheme,
    unlockedTiers,
    TIER_LIST,
    statsReady,
    getTodayStr,
    initStats,
    addXP,
    applyDecay,
    saveStats
  }
})
