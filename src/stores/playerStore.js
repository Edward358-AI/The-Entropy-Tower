import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, auth } from '../services/firebase'
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

// All material tiers in order
const TIER_LIST = ['Stone', 'Iron', 'Gold', 'Diamond', 'Astral', 'Void', 'Celestial', 'Ethereal', 'Mythic', 'Transcendent', 'Omega']

// Shop item definitions
const SHOP_ITEMS = {
  // Consumables
  entropyShield: { name: 'Entropy Shield', emoji: '🛡️', price: 50, max: 2, type: 'consumable', desc: 'Blocks next decay that would de-level' },
  streakFreeze: { name: 'Streak Freeze', emoji: '❄️', price: 40, max: 2, type: 'consumable', desc: 'Preserves streak through 1 missed day' },
  xpBoost: { name: 'XP Boost', emoji: '⚡', price: 30, max: 3, type: 'consumable', desc: '×1.5 XP on next 3 completions' },
  doubleCoins: { name: 'Double Coins', emoji: '💰', price: 35, max: 3, type: 'consumable', desc: '2× coins on next 5 completions' },
  decayDampener: { name: 'Decay Dampener', emoji: '🔻', price: 25, max: 1, type: 'consumable', desc: 'Halves all decay for 24h' },
  revivalElixir: { name: 'Revival Elixir', emoji: '💀', price: 75, max: 1, type: 'consumable', desc: 'Restores corrupted quest + 48h deadline' },
  // Premium Themes
  themeCrimson: { name: 'Crimson Forge', emoji: '🔥', price: 150, type: 'cosmetic', category: 'theme', desc: 'Deep reds, ember particles' },
  themeAbyssal: { name: 'Abyssal', emoji: '🌊', price: 150, type: 'cosmetic', category: 'theme', desc: 'Dark ocean blues, bubble effects' },
  themeNeon: { name: 'Neon Circuit', emoji: '💜', price: 200, type: 'cosmetic', category: 'theme', desc: 'Cyberpunk pink/cyan glow' },
  themeAurora: { name: 'Aurora', emoji: '🌌', price: 200, type: 'cosmetic', category: 'theme', desc: 'Northern lights gradient' },
  themeSolar: { name: 'Solar Flare', emoji: '☀️', price: 150, type: 'cosmetic', category: 'theme', desc: 'Warm gold-to-orange radiance' },
  // Heatmap Schemes
  heatmapOcean: { name: 'Ocean', emoji: '🌊', price: 60, type: 'cosmetic', category: 'heatmap', desc: 'Blue shades' },
  heatmapViolet: { name: 'Violet', emoji: '💜', price: 60, type: 'cosmetic', category: 'heatmap', desc: 'Purple shades' },
  heatmapEmber: { name: 'Ember', emoji: '🔥', price: 60, type: 'cosmetic', category: 'heatmap', desc: 'Orange/red shades' },
  heatmapMono: { name: 'Monochrome', emoji: '⬜', price: 60, type: 'cosmetic', category: 'heatmap', desc: 'White/gray shades' },
  // Quest Card Styles
  cardGilded: { name: 'Gilded', emoji: '✨', price: 80, type: 'cosmetic', category: 'cardStyle', desc: 'Gold gradient borders' },
  cardPhantom: { name: 'Phantom', emoji: '👻', price: 80, type: 'cosmetic', category: 'cardStyle', desc: 'Ghostly translucent glow' },
  cardRunic: { name: 'Runic', emoji: '🔮', price: 80, type: 'cosmetic', category: 'cardStyle', desc: 'Angular runic borders' },
  // XP Bar Styles
  xpGradient: { name: 'Gradient Pulse', emoji: '🌈', price: 50, type: 'cosmetic', category: 'xpBar', desc: 'Animated gradient' },
  xpLightning: { name: 'Lightning', emoji: '⚡', price: 50, type: 'cosmetic', category: 'xpBar', desc: 'Electric crackling' },
  xpPrismatic: { name: 'Prismatic', emoji: '💎', price: 50, type: 'cosmetic', category: 'xpBar', desc: 'Rainbow shimmer' },
}

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

  // Coin store
  const coins = ref(0)
  const inventory = ref({
    entropyShield: 0, streakFreeze: 0, xpBoost: 0,
    doubleCoins: 0, decayDampener: 0, revivalElixir: 0
  })
  const activeEffects = ref({
    xpBoost: 0,        // remaining quest completions with ×1.5
    doubleCoins: 0,    // remaining quest completions with 2× coins
    dampenerExpires: null  // ISO timestamp when dampener wears off
  })
  const ownedCosmetics = ref([])    // array of item IDs owned
  const selectedCosmetics = ref({
    theme: null,       // premium theme ID or null
    heatmap: null,     // heatmap scheme ID or null
    cardStyle: null,   // quest card style ID or null
    xpBar: null        // XP bar style ID or null
  })

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
        coins.value = data.coins ?? 0
        if (data.inventory) inventory.value = { ...inventory.value, ...data.inventory }
        if (data.activeEffects) activeEffects.value = { ...activeEffects.value, ...data.activeEffects }
        if (data.ownedCosmetics) ownedCosmetics.value = data.ownedCosmetics
        if (data.selectedCosmetics) selectedCosmetics.value = { ...selectedCosmetics.value, ...data.selectedCosmetics }
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
          coins: 0,
          inventory: inventory.value,
          activeEffects: activeEffects.value,
          ownedCosmetics: [],
          selectedCosmetics: selectedCosmetics.value,
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

    // Apply XP Boost if active
    if (activeEffects.value.xpBoost > 0) {
      amount = Math.round(amount * 1.5)
      activeEffects.value.xpBoost--
    }

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
        coins.value += 20 // 5 level-up + 15 boss clear
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
      coins.value += 5 // Level-up bonus
    }

    await saveStats()
  }


  // Get decay amount, optionally checking if a past date fell within active dampener window
  const getDampenedAmount = (amount, decayDate = null) => {
    if (!activeEffects.value.dampenerExpires) return amount
    const exp = new Date(activeEffects.value.dampenerExpires)
    const start = new Date(exp.getTime() - 24 * 60 * 60 * 1000)
    
    // If we have a specific past exact boundary date, check if it fell in the window
    if (decayDate) {
      if (decayDate >= start && decayDate <= exp) return Math.round(amount / 2)
      return amount
    }
    
    // Otherwise fallback to checking if active RIGHT NOW
    if (new Date() < exp) return Math.round(amount / 2)
    return amount
  }

  const applyDecay = async (amount) => {
    await statsReady // Wait for init to complete

    // Clear expired dampener if checking right now (dampener logic is handled before calling applyDecay)
    if (activeEffects.value.dampenerExpires && new Date() >= new Date(activeEffects.value.dampenerExpires)) {
      activeEffects.value.dampenerExpires = null
    }

    if (amount <= 0) return

    currentXP.value -= amount
    totalXPLost.value += amount

    // De-leveling logic (Entropy wins)
    while (currentXP.value < 0) {
      // Entropy Shield: block de-level
      if (inventory.value.entropyShield > 0) {
        inventory.value.entropyShield--
        currentXP.value = 0
        break
      }
      if (level.value > 1) {
        level.value--
        currentXP.value += (100 + (level.value * 20))
      } else {
        currentXP.value = 0
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
        coins: coins.value,
        inventory: inventory.value,
        activeEffects: activeEffects.value,
        ownedCosmetics: ownedCosmetics.value,
        selectedCosmetics: selectedCosmetics.value,
        lastUpdated: serverTimestamp()
      }))
    } catch (err) {
      console.error("Save stats failed (timeout or offline):", err)
    } finally {
      isSyncing.value = false
    }
  }

  // Add coins (called from questStore on completion)
  const addCoins = (amount) => {
    coins.value += amount
  }

  // Purchase an item from the shop
  const purchaseItem = (itemId) => {
    const item = SHOP_ITEMS[itemId]
    if (!item || coins.value < item.price) return false

    if (item.type === 'consumable') {
      if (inventory.value[itemId] >= item.max) return false
      coins.value -= item.price
      inventory.value[itemId]++
    } else if (item.type === 'cosmetic') {
      if (ownedCosmetics.value.includes(itemId)) return false
      coins.value -= item.price
      ownedCosmetics.value.push(itemId)
    }
    saveStats()
    return true
  }

  // Activate a consumable item
  const activateItem = (itemId) => {
    if (itemId === 'xpBoost' && inventory.value.xpBoost > 0) {
      inventory.value.xpBoost--
      activeEffects.value.xpBoost += 3
      saveStats()
      return true
    }
    if (itemId === 'doubleCoins' && inventory.value.doubleCoins > 0) {
      inventory.value.doubleCoins--
      activeEffects.value.doubleCoins += 5
      saveStats()
      return true
    }
    if (itemId === 'decayDampener' && inventory.value.decayDampener > 0) {
      inventory.value.decayDampener--
      activeEffects.value.dampenerExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      saveStats()
      return true
    }
    return false
  }

  // Select a cosmetic
  const selectCosmetic = (itemId) => {
    const item = SHOP_ITEMS[itemId]
    if (!item || !ownedCosmetics.value.includes(itemId)) return
    const cat = item.category
    // Toggle: if already selected, deselect
    if (selectedCosmetics.value[cat] === itemId) {
      selectedCosmetics.value[cat] = null
    } else {
      selectedCosmetics.value[cat] = itemId
    }
    saveStats()
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
    SHOP_ITEMS,
    statsReady,
    coins,
    inventory,
    activeEffects,
    ownedCosmetics,
    selectedCosmetics,
    getTodayStr,
    initStats,
    addXP,
    addCoins,
    applyDecay,
    saveStats,
    purchaseItem,
    activateItem,
    selectCosmetic,
    getDampenedAmount
  }
})
