/**
 * deleteQuest — Callable Cloud Function
 *
 * Server-authoritative quest deletion (abandonment):
 * 1. Validates quest exists and belongs to user
 * 2. If quest is overdue, applies abandonment penalty (current day's decay)
 * 3. Resets streak (unless Streak Freeze is active)
 * 4. Applies de-leveling with Entropy Shield
 * 5. Deletes the quest document
 * 6. Writes all changes atomically
 *
 * Returns: { success, penaltyApplied }
 */

const admin = require('firebase-admin')
const {
  getDecayPenalty,
  applyDecayToStats,
  isDampenerActive,
} = require('./gameConfig')

async function handleDeleteQuest(db, userId, questId) {
  const questRef = db.doc(`users/${userId}/quests/${questId}`)
  const statsRef = db.doc(`users/${userId}/stats/main`)

  // Load quest and stats in parallel
  const [questSnap, statsSnap] = await Promise.all([
    questRef.get(),
    statsRef.get(),
  ])

  if (!questSnap.exists) {
    throw new Error('Quest not found.')
  }

  const quest = questSnap.data()

  if (!statsSnap.exists) {
    throw new Error('Player stats not found.')
  }

  const stats = statsSnap.data()
  const batch = db.batch()
  let penaltyApplied = 0

  // Abandonment penalty: if quest is overdue, apply current day's decay
  if (quest.daysOverdue > 0) {
    const rawPenalty = getDecayPenalty(quest.daysOverdue, stats.level)

    // Apply dampener if active
    let penalty = rawPenalty
    if (isDampenerActive(stats.activeEffects?.dampenerExpires)) {
      penalty = Math.round(penalty / 2)
    }

    penaltyApplied = penalty

    // Handle streak
    const inventory = { ...(stats.inventory || {}) }
    const statsUpdate = {}

    if (inventory.streakFreeze > 0) {
      inventory.streakFreeze--
      statsUpdate.inventory = inventory
    } else {
      statsUpdate.streak = 0
    }

    // Apply de-leveling with Entropy Shield
    const shieldCount = inventory.entropyShield || 0
    const result = applyDecayToStats(
      stats.currentXP,
      stats.level,
      penalty,
      shieldCount
    )

    statsUpdate.level = result.level
    statsUpdate.currentXP = result.currentXP
    statsUpdate.totalXPLost = (stats.totalXPLost || 0) + penalty

    if (result.shieldsUsed > 0) {
      inventory.entropyShield = shieldCount - result.shieldsUsed
      statsUpdate.inventory = inventory
    }

    statsUpdate.lastUpdated = admin.firestore.FieldValue.serverTimestamp()
    batch.update(statsRef, statsUpdate)
  }

  // Delete the quest
  batch.delete(questRef)

  await batch.commit()

  return { success: true, penaltyApplied }
}

module.exports = { handleDeleteQuest }
