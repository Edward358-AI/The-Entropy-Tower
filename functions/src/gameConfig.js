/**
 * Shared game configuration — single source of truth for all formulas.
 * Used by both Cloud Functions and (optionally) the client.
 */

// All material tiers in order
const TIER_LIST = ['Stone', 'Iron', 'Gold', 'Diamond', 'Astral', 'Void', 'Celestial', 'Ethereal', 'Mythic', 'Transcendent', 'Omega']

// Decay rates by level bracket
const DECAY_RATES = [
  { maxLevel: 20, initial: 0.10, escalation: 0.05 },
  { maxLevel: 40, initial: 0.15, escalation: 0.05 },
  { maxLevel: 60, initial: 0.20, escalation: 0.10 },
  { maxLevel: 80, initial: 0.25, escalation: 0.10 },
  { maxLevel: 100, initial: 0.25, escalation: 0.15 },
  { maxLevel: Infinity, initial: 0.30, escalation: 0.20 },
]

// Streak multiplier thresholds
const STREAK_MULTIPLIERS = [
  { minStreak: 14, multiplier: 2.5 },
  { minStreak: 7, multiplier: 2.0 },
  { minStreak: 5, multiplier: 1.6 },
  { minStreak: 3, multiplier: 1.3 },
]

/**
 * XP required to reach the next level.
 */
const xpToNextLevel = (level) => 100 + (level * 20)

/**
 * Boss HP required to slay the gatekeeper at the current level.
 */
const bossXPRequired = (level) => 150 * (Math.floor(level / 10) + 1)

/**
 * Which tier index a level falls into.
 */
const tierIndexForLevel = (lvl) => Math.min(Math.floor(lvl / 10), TIER_LIST.length - 1)

/**
 * Get the streak multiplier for a given streak count.
 */
const getStreakMultiplier = (streak) => {
  for (const { minStreak, multiplier } of STREAK_MULTIPLIERS) {
    if (streak >= minStreak) return multiplier
  }
  return 1.0
}

/**
 * Calculate decay penalty for a given daysOverdue at a given level.
 */
const getDecayPenalty = (daysOverdue, level) => {
  const bracket = DECAY_RATES.find(r => level < r.maxLevel) || DECAY_RATES[DECAY_RATES.length - 1]
  const dayRate = daysOverdue <= 1
    ? bracket.initial
    : bracket.initial + bracket.escalation * (daysOverdue - 1)
  return Math.round(xpToNextLevel(level) * dayRate)
}

/**
 * Apply de-leveling logic. Returns updated { level, currentXP, shieldsUsed }.
 * Mirrors the client-side applyDecay logic in playerStore.
 */
const applyDecayToStats = (currentXP, level, amount, entropyShields) => {
  let xp = currentXP - amount
  let lvl = level
  let shieldsUsed = 0

  while (xp < 0) {
    if (entropyShields > 0) {
      entropyShields--
      shieldsUsed++
      xp = 0
      break
    }
    if (lvl > 1) {
      lvl--
      xp += xpToNextLevel(lvl)
    } else {
      xp = 0
      break
    }
  }

  return { level: lvl, currentXP: xp, shieldsUsed }
}

/**
 * Check if a decay dampener is active at a given date.
 */
const isDampenerActive = (dampenerExpires, atDate = null) => {
  if (!dampenerExpires) return false
  const exp = new Date(dampenerExpires)
  const checkDate = atDate || new Date()
  return checkDate < exp
}

/**
 * Format a Date as YYYY-MM-DD string in a specified timezone.
 */
const formatDateStr = (date, timeZone = 'America/Los_Angeles') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(date)
    const year = parts.find(p => p.type === 'year').value
    const month = parts.find(p => p.type === 'month').value
    const day = parts.find(p => p.type === 'day').value
    return `${year}-${month}-${day}`
  } catch (err) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(date)
    const year = parts.find(p => p.type === 'year').value
    const month = parts.find(p => p.type === 'month').value
    const day = parts.find(p => p.type === 'day').value
    return `${year}-${month}-${day}`
  }
}

/**
 * Get date parts in the specified timezone.
 */
const getPacificDateParts = (date, timeZone = 'America/Los_Angeles') => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    const parts = formatter.formatToParts(date)
    const year = parseInt(parts.find(p => p.type === 'year').value, 10)
    const month = parseInt(parts.find(p => p.type === 'month').value, 10)
    const day = parseInt(parts.find(p => p.type === 'day').value, 10)
    return { year, month, day }
  } catch (err) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
    const parts = formatter.formatToParts(date)
    const year = parseInt(parts.find(p => p.type === 'year').value, 10)
    const month = parseInt(parts.find(p => p.type === 'month').value, 10)
    const day = parseInt(parts.find(p => p.type === 'day').value, 10)
    return { year, month, day }
  }
}

/**
 * Compute streak from heatmap data object.
 * Returns the number of consecutive days with completions and no misses.
 */
const computeStreakFromHeatmap = (heatmapData, timeZone = 'America/Los_Angeles') => {
  if (!heatmapData) return 0
  let streak = 0
  const today = new Date()

  for (let i = 0; i <= 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDateStr(d, timeZone)

    const completed = heatmapData[dateStr] || 0
    const missed = heatmapData[`missed_${dateStr}`] || 0

    if (completed > 0 && missed === 0) {
      streak++
    } else if (i === 0 && completed === 0) {
      // Today has no activity yet — check from yesterday
      continue
    } else {
      break
    }
  }

  return streak
}

// Shop item definitions — single source of truth for prices, limits, and types
const SHOP_ITEMS = {
  // Consumables
  entropyShield: { name: 'Entropy Shield', price: 50, max: 2, type: 'consumable' },
  streakFreeze: { name: 'Streak Freeze', price: 40, max: 2, type: 'consumable' },
  xpBoost: { name: 'XP Boost', price: 30, max: 3, type: 'consumable' },
  doubleCoins: { name: 'Double Coins', price: 35, max: 3, type: 'consumable' },
  decayDampener: { name: 'Decay Dampener', price: 25, max: 1, type: 'consumable' },
  revivalElixir: { name: 'Revival Elixir', price: 75, max: 1, type: 'consumable' },
  momentumSurge: { name: 'Momentum Surge', price: 60, max: 2, type: 'consumable' },
  bossBane: { name: 'Boss Bane', price: 100, max: 3, type: 'consumable' },
  // Cosmetics (themes, heatmap, cards, xp bar)
  themeCrimson: { name: 'Crimson Forge', price: 150, type: 'cosmetic', category: 'theme' },
  themeAbyssal: { name: 'Abyssal', price: 150, type: 'cosmetic', category: 'theme' },
  themeNeon: { name: 'Neon Circuit', price: 200, type: 'cosmetic', category: 'theme' },
  themeAurora: { name: 'Aurora', price: 200, type: 'cosmetic', category: 'theme' },
  themeSolar: { name: 'Solar Flare', price: 150, type: 'cosmetic', category: 'theme' },
  heatmapOcean: { name: 'Ocean', price: 60, type: 'cosmetic', category: 'heatmap' },
  heatmapViolet: { name: 'Violet', price: 60, type: 'cosmetic', category: 'heatmap' },
  heatmapEmber: { name: 'Ember', price: 60, type: 'cosmetic', category: 'heatmap' },
  heatmapMono: { name: 'Monochrome', price: 60, type: 'cosmetic', category: 'heatmap' },
  cardGilded: { name: 'Gilded', price: 80, type: 'cosmetic', category: 'cardStyle' },
  cardPhantom: { name: 'Phantom', price: 80, type: 'cosmetic', category: 'cardStyle' },
  cardRunic: { name: 'Runic', price: 80, type: 'cosmetic', category: 'cardStyle' },
  xpGradient: { name: 'Gradient Pulse', price: 50, type: 'cosmetic', category: 'xpBar' },
  xpLightning: { name: 'Lightning', price: 50, type: 'cosmetic', category: 'xpBar' },
  xpPrismatic: { name: 'Prismatic', price: 50, type: 'cosmetic', category: 'xpBar' },
}

module.exports = {
  TIER_LIST,
  DECAY_RATES,
  STREAK_MULTIPLIERS,
  SHOP_ITEMS,
  xpToNextLevel,
  bossXPRequired,
  tierIndexForLevel,
  getStreakMultiplier,
  getDecayPenalty,
  applyDecayToStats,
  isDampenerActive,
  formatDateStr,
  computeStreakFromHeatmap,
  getPacificDateParts,
}
