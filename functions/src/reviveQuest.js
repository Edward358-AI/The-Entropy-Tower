/**
 * reviveQuest — Callable Cloud Function
 *
 * Server-authoritative Revival Elixir usage:
 * 1. Validates quest exists, is corrupted, and user has elixir
 * 2. Resets quest status to active, daysOverdue to 0
 * 3. Extends deadline by 48h from now
 * 4. Decrements revivalElixir from inventory
 * 5. Writes all changes atomically
 *
 * Returns: { success, newDeadline }
 */

const admin = require('firebase-admin')

async function handleReviveQuest(db, userId, questId) {
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
  if (quest.status !== 'corrupted') {
    throw new Error('Quest is not corrupted.')
  }

  if (!statsSnap.exists) {
    throw new Error('Player stats not found.')
  }

  const stats = statsSnap.data()
  const inventory = { ...(stats.inventory || {}) }

  if (!inventory.revivalElixir || inventory.revivalElixir <= 0) {
    throw new Error('No Revival Elixir in inventory.')
  }

  // Decrement elixir
  inventory.revivalElixir--

  // New deadline: 48h from now
  const newDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000)
  const newDeadlineTimestamp = admin.firestore.Timestamp.fromDate(newDeadline)

  // Batch write
  const batch = db.batch()

  batch.update(questRef, {
    status: 'active',
    daysOverdue: 0,
    deadline: newDeadlineTimestamp,
  })

  batch.update(statsRef, {
    inventory,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  })

  await batch.commit()

  return { success: true, newDeadline: newDeadline.toISOString() }
}

module.exports = { handleReviveQuest }
