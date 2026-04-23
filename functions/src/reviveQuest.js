/**
 * reviveQuest — Callable Cloud Function
 *
 * Server-authoritative Revival Elixir usage using Firestore transaction:
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

  const result = await db.runTransaction(async (t) => {
    const [questSnap, statsSnap] = await Promise.all([
      t.get(questRef),
      t.get(statsRef),
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

    t.update(questRef, {
      status: 'active',
      daysOverdue: 0,
      deadline: newDeadlineTimestamp,
    })

    t.update(statsRef, {
      inventory,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    })

    return { success: true, newDeadline: newDeadline.toISOString() }
  })

  return result
}

module.exports = { handleReviveQuest }
