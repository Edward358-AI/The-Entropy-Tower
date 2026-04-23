/**
 * completeQuest — Callable Cloud Function
 *
 * Server-authoritative quest completion:
 * 1. Validates quest exists and belongs to user
 * 2. Calculates XP reward (streak multiplier, momentum surge, early bird, XP boost)
 * 3. Handles boss gate logic
 * 4. Awards coins (streak bonus, double coins effect)
 * 5. Logs completion to heatmap
 * 6. Recomputes streak
 * 7. Writes all changes atomically via batch
 *
 * Returns: { success, xpAwarded, coinsAwarded, leveledUp, bossSlain }
 */

const admin = require('firebase-admin')
const {
  xpToNextLevel,
  bossXPRequired,
  getStreakMultiplier,
  formatDateStr,
  computeStreakFromHeatmap,
} = require('./gameConfig')

async function handleCompleteQuest(db, userId, questId) {
  const questRef = db.doc(`users/${userId}/quests/${questId}`)
  const statsRef = db.doc(`users/${userId}/stats/main`)
  const heatmapRef = db.doc(`users/${userId}/history/heatmap`)

  // Load quest and stats in parallel
  const [questSnap, statsSnap] = await Promise.all([
    questRef.get(),
    statsRef.get(),
  ])

  if (!questSnap.exists) {
    throw new Error('Quest not found.')
  }

  const quest = questSnap.data()
  if (quest.status === 'completed') {
    throw new Error('Quest already completed.')
  }

  if (quest.subtasks && Array.isArray(quest.subtasks)) {
    const incomplete = quest.subtasks.find(st => !st.completed)
    if (incomplete) {
      throw new Error('Cannot complete quest: not all subtasks are finished.')
    }
  }

  if (!statsSnap.exists) {
    throw new Error('Player stats not found.')
  }

  const stats = statsSnap.data()
  const now = new Date()
  const todayStr = formatDateStr(now)

  // --- Calculate reward ---
  let reward = quest.xpReward || 0
  let coinsAwarded = 0
  let leveledUp = false
  let bossSlain = false

  // Only award XP/coins for non-corrupted quests
  if (quest.status !== 'corrupted') {
    // Streak multiplier
    let effectiveStreak = stats.streak || 0

    // Momentum Surge: boost effective streak
    if (stats.activeEffects?.momentumSurgeExpires &&
        new Date(stats.activeEffects.momentumSurgeExpires) > now) {
      if (effectiveStreak < 3) effectiveStreak = 3
      else if (effectiveStreak < 5) effectiveStreak = 5
      else if (effectiveStreak < 7) effectiveStreak = 7
      else if (effectiveStreak < 14) effectiveStreak = 14
    }

    const multiplier = getStreakMultiplier(effectiveStreak)
    reward = Math.round(reward * multiplier)

    // Early Bird Bonus
    if (quest.deadline) {
      const deadline = quest.deadline.toDate()
      const daysEarly = Math.floor((deadline - now) / (1000 * 60 * 60 * 24))
      if (daysEarly > 0) {
        const bonus = Math.round(quest.xpReward * (0.1 * daysEarly))
        reward += bonus
      }
    }

    // XP Boost (×1.5 on next N completions)
    const activeEffects = { ...(stats.activeEffects || {}) }
    if (activeEffects.xpBoost > 0) {
      reward = Math.round(reward * 1.5)
      activeEffects.xpBoost--
    }

    // Coin reward: base = ceil(xpReward / 40), min 1
    coinsAwarded = Math.max(1, Math.ceil(quest.xpReward / 40))
    if ((stats.streak || 0) >= 7) coinsAwarded += 1 // streak bonus
    if (activeEffects.doubleCoins > 0) {
      coinsAwarded *= 2
      activeEffects.doubleCoins--
    }

    // --- Apply XP / Boss Gate ---
    let level = stats.level || 5
    let currentXP = stats.currentXP || 0
    let isLevelCapped = stats.isLevelCapped || false
    let bossXPEarned = stats.bossXPEarned || 0
    let highestLevel = stats.highestLevel || level
    let coins = (stats.coins || 0) + coinsAwarded

    // Update streak: today's activity
    const lastActiveDate = stats.lastActiveDate
    let streak = stats.streak || 0
    const yesterdayDate = new Date(now)
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = formatDateStr(yesterdayDate)

    if (lastActiveDate === todayStr) {
      // Already active today, no change
    } else if (lastActiveDate === yesterdayStr) {
      streak++ // consecutive day
    } else {
      streak = 1 // streak broken, reset to 1
    }

    if (isLevelCapped) {
      // Boss gate: XP goes toward slaying the boss
      let bossReward = reward
      const inventory = { ...(stats.inventory || {}) }
      if (inventory.bossBane > 0) {
        bossReward = Math.round(bossReward * 1.25)
        inventory.bossBane--
      }
      bossXPEarned += bossReward

      const bossHP = bossXPRequired(level)
      if (bossXPEarned >= bossHP) {
        isLevelCapped = false
        bossXPEarned = 0
        currentXP = 0
        level++
        if (level > highestLevel) highestLevel = level
        coins += 20 // 5 level-up + 15 boss clear
        bossSlain = true
        leveledUp = true
      }

      // Build stats update
      const statsUpdate = {
        level, currentXP, isLevelCapped, bossXPEarned,
        highestLevel, coins, streak,
        lastActiveDate: todayStr,
        activeEffects,
        inventory,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }

      // Batch write
      const batch = db.batch()
      batch.update(statsRef, statsUpdate)
      batch.update(questRef, {
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      // Heatmap
      batch.set(heatmapRef, {
        [todayStr]: admin.firestore.FieldValue.increment(1),
      }, { merge: true })

      await batch.commit()

      // Recompute streak after heatmap write
      await recomputeStreak(db, userId, statsRef)

      return { success: true, xpAwarded: bossReward, coinsAwarded, leveledUp, bossSlain }
    }

    // Normal XP path
    currentXP += reward

    // Level up loop
    while (currentXP >= xpToNextLevel(level)) {
      // Boss gate check at x9 levels (9, 19, 29...)
      if ((level + 1) % 10 === 0) {
        currentXP = xpToNextLevel(level) // cap at max
        isLevelCapped = true
        bossXPEarned = 0
        break
      }
      currentXP -= xpToNextLevel(level)
      level++
      if (level > highestLevel) highestLevel = level
      coins += 5 // level-up bonus
      leveledUp = true
    }

    // Build stats update
    const statsUpdate = {
      level, currentXP, isLevelCapped, bossXPEarned,
      highestLevel, coins, streak,
      lastActiveDate: todayStr,
      activeEffects,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }

    // Batch write
    const batch = db.batch()
    batch.update(statsRef, statsUpdate)
    batch.update(questRef, {
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    // Heatmap
    batch.set(heatmapRef, {
      [todayStr]: admin.firestore.FieldValue.increment(1),
    }, { merge: true })

    await batch.commit()

    // Recompute streak after heatmap write
    await recomputeStreak(db, userId, statsRef)

    return { success: true, xpAwarded: reward, coinsAwarded, leveledUp, bossSlain }
  }

  // Corrupted quest: just mark completed, no rewards
  const batch = db.batch()
  batch.update(questRef, {
    status: 'completed',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  await batch.commit()

  return { success: true, xpAwarded: 0, coinsAwarded: 0, leveledUp: false, bossSlain: false }
}

/**
 * Recompute streak from heatmap data and update stats.
 */
async function recomputeStreak(db, userId, statsRef) {
  try {
    const heatmapSnap = await db.doc(`users/${userId}/history/heatmap`).get()
    if (!heatmapSnap.exists) return

    const streak = computeStreakFromHeatmap(heatmapSnap.data())
    await statsRef.update({ streak })
  } catch (err) {
    console.error(`Failed to recompute streak for user ${userId}:`, err)
  }
}

module.exports = { handleCompleteQuest }
