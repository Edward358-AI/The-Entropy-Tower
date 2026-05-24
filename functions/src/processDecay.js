/**
 * processDecay — Scheduled Cloud Function
 * Runs daily to apply decay penalties for overdue quests across all users.
 *
 * For each user:
 * 1. Loads all active quests with deadlines
 * 2. Calculates daysOverdue per quest (server time)
 * 3. Computes decay penalty using level-scaled formula
 * 4. Applies Decay Dampener / Streak Freeze / Entropy Shield
 * 5. Marks quests corrupted at 5+ days overdue
 * 6. Writes missed dates to heatmap
 * 7. Recomputes streak from heatmap data
 * 8. Updates stats/main atomically
 */

const admin = require('firebase-admin')
const {
  getDecayPenalty,
  applyDecayToStats,
  isDampenerActive,
  formatDateStr,
  computeStreakFromHeatmap,
  getPacificDateParts,
} = require('./gameConfig')

/**
 * Clean up any time-based effects that have expired.
 * Returns an object of fields to merge into the stats update.
 */
function cleanExpiredEffects(stats) {
  const now = new Date()
  const activeEffects = { ...(stats.activeEffects || {}) }
  let changed = false

  // Clear expired Decay Dampener (24h timer)
  if (activeEffects.dampenerExpires && now >= new Date(activeEffects.dampenerExpires)) {
    activeEffects.dampenerExpires = null
    changed = true
  }

  // Clear expired Momentum Surge (24h timer)
  if (activeEffects.momentumSurgeExpires && now >= new Date(activeEffects.momentumSurgeExpires)) {
    activeEffects.momentumSurgeExpires = null
    changed = true
  }

  return changed ? { activeEffects } : {}
}

/**
 * Process decay for all users. Called by the scheduled function in index.js.
 */
async function processDecay() {
  const db = admin.firestore()
  const now = new Date()

  // Get all user documents
  const usersSnap = await db.collection('users').listDocuments()

  let processedCount = 0
  let errorCount = 0

  for (const userDocRef of usersSnap) {
    try {
      await processUserDecay(db, userDocRef.id, now)
      processedCount++
    } catch (err) {
      console.error(`Failed to process decay for user ${userDocRef.id}:`, err)
      errorCount++
    }
  }

  console.log(`processDecay complete: ${processedCount} users processed, ${errorCount} errors`)
  return { processedCount, errorCount }
}

/**
 * Process decay for a single user.
 */
async function processUserDecay(db, userId, now, clientTimezone) {
  // Load stats
  const statsRef = db.doc(`users/${userId}/stats/main`)
  const statsSnap = await statsRef.get()
  if (!statsSnap.exists) return // No stats = new user, skip

  const stats = statsSnap.data()
  const timezone = clientTimezone || stats.timezone || 'America/Los_Angeles'
  const todayStr = formatDateStr(now, timezone)

  // NOTE: We intentionally do NOT skip based on lastDecayDate here.
  // The quest-level daysOverdue tracking prevents double-counting penalties,
  // and skipping based on lastDecayDate caused quests that went overdue
  // AFTER the daily check to be silently missed until the next day.

  // Load active quests with deadlines
  const questsSnap = await db.collection(`users/${userId}/quests`)
    .where('status', 'in', ['active', 'corrupted'])
    .get()

  if (questsSnap.empty) {
    // No quests — still clean up expired effects and update lastDecayDate
    const effectsUpdate = cleanExpiredEffects(stats)
    if (stats.lastDecayDate !== todayStr || Object.keys(effectsUpdate).length > 0) {
      await statsRef.update({ lastDecayDate: todayStr, ...effectsUpdate })
    }
    return
  }

  let totalPenalty = 0
  const missedDates = {}
  const questUpdates = [] // batch quest updates

  for (const questDoc of questsSnap.docs) {
    const quest = questDoc.data()
    if (!quest.deadline) continue

    const deadline = quest.deadline.toDate()
    if (now <= deadline) continue // Not overdue

    const oldDays = quest.daysOverdue || 0

    // Calendar-day based calculation:
    // As soon as the deadline time passes → Rot Level 1 (same day).
    // Each additional calendar day boundary crossed adds another level.
    const deadlineParts = getPacificDateParts(deadline, timezone)
    const nowParts = getPacificDateParts(now, timezone)

    const deadlineDate = new Date(Date.UTC(deadlineParts.year, deadlineParts.month - 1, deadlineParts.day))
    const nowDate = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day))
    const calendarDaysDiff = Math.round((nowDate - deadlineDate) / (1000 * 60 * 60 * 24))
    const currentDaysOverdue = Math.max(1, calendarDaysDiff)

    // Only process if there are new days of overdue since last check
    if (currentDaysOverdue > oldDays) {
      // Calculate penalty for each NEW day of decay since last check
      for (let day = oldDays + 1; day <= currentDaysOverdue; day++) {
        let rawPenalty = getDecayPenalty(day, stats.level)

        // Check if dampener was active for this decay boundary
        const boundaryDate = new Date(Date.UTC(deadlineParts.year, deadlineParts.month - 1, deadlineParts.day + (day - 1), 12, 0, 0))
        if (isDampenerActive(stats.activeEffects?.dampenerExpires, boundaryDate)) {
          rawPenalty = Math.round(rawPenalty / 2)
        }

        totalPenalty += rawPenalty

        // Track missed dates for heatmap
        const dateStr = formatDateStr(boundaryDate, timezone)
        const key = `missed_${dateStr}`
        missedDates[key] = (missedDates[key] || 0) + 1
      }

      // Update quest document
      const newStatus = currentDaysOverdue >= 5 ? 'corrupted' : quest.status
      questUpdates.push({
        ref: questDoc.ref,
        data: {
          daysOverdue: currentDaysOverdue,
          status: newStatus,
        }
      })
    }
  }

  // Always clean up expired time-based effects (even if no penalty)
  const effectsUpdate = cleanExpiredEffects(stats)

  // If nothing changed, skip the write entirely
  const hasChanges = totalPenalty > 0 || questUpdates.length > 0 || Object.keys(effectsUpdate).length > 0 || stats.lastDecayDate !== todayStr || stats.timezone !== timezone
  if (!hasChanges) return

  // Build stats update
  const statsUpdate = { lastDecayDate: todayStr, timezone }

  if (totalPenalty > 0) {
    // Handle streak freeze
    let inventory = { ...(stats.inventory || {}) }
    if (inventory.streakFreeze > 0) {
      inventory.streakFreeze--
      statsUpdate.inventory = inventory
    } else {
      statsUpdate.streak = 0
    }

    // Apply de-leveling with entropy shield
    const shieldCount = inventory.entropyShield || 0
    const result = applyDecayToStats(
      stats.currentXP,
      stats.level,
      totalPenalty,
      shieldCount
    )

    statsUpdate.level = result.level
    statsUpdate.currentXP = result.currentXP
    statsUpdate.totalXPLost = (stats.totalXPLost || 0) + totalPenalty

    if (result.shieldsUsed > 0) {
      inventory.entropyShield = shieldCount - result.shieldsUsed
      statsUpdate.inventory = inventory
    }
  }

  Object.assign(statsUpdate, effectsUpdate)

  // Write all updates in a batch for atomicity
  const batch = db.batch()

  // Update stats
  batch.update(statsRef, statsUpdate)

  // Update quests
  for (const { ref, data } of questUpdates) {
    batch.update(ref, data)
  }

  // Write missed dates to heatmap
  if (Object.keys(missedDates).length > 0) {
    const heatmapRef = db.doc(`users/${userId}/history/heatmap`)
    // Convert counts to FieldValue.increment
    const heatmapUpdate = {}
    for (const [key, count] of Object.entries(missedDates)) {
      heatmapUpdate[key] = admin.firestore.FieldValue.increment(count)
    }
    batch.set(heatmapRef, heatmapUpdate, { merge: true })
  }

  await batch.commit()

  // Recompute streak from heatmap (after batch commit so missed dates are written)
  if (totalPenalty > 0) {
    await recomputeStreak(db, userId, statsRef, timezone)
  }
}

/**
 * Recompute streak from heatmap data and update stats.
 */
async function recomputeStreak(db, userId, statsRef, timezone) {
  try {
    const heatmapSnap = await db.doc(`users/${userId}/history/heatmap`).get()
    if (!heatmapSnap.exists) return

    const streak = computeStreakFromHeatmap(heatmapSnap.data(), timezone)
    await statsRef.update({ streak })
  } catch (err) {
    console.error(`Failed to recompute streak for user ${userId}:`, err)
  }
}

module.exports = { processDecay, processUserDecay }
