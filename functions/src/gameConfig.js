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
 * Format a Date as YYYY-MM-DD string.
 */
const formatDateStr = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Compute streak from heatmap data object.
 * Returns the number of consecutive days with completions and no misses.
 */
const computeStreakFromHeatmap = (heatmapData) => {
  if (!heatmapData) return 0
  let streak = 0
  const today = new Date()

  for (let i = 0; i <= 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDateStr(d)

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

module.exports = {
  TIER_LIST,
  DECAY_RATES,
  STREAK_MULTIPLIERS,
  xpToNextLevel,
  bossXPRequired,
  tierIndexForLevel,
  getStreakMultiplier,
  getDecayPenalty,
  applyDecayToStats,
  isDampenerActive,
  formatDateStr,
  computeStreakFromHeatmap,
}
