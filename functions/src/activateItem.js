/**
 * activateItem — Callable Cloud Function
 *
 * Server-validated item activation using Firestore transaction:
 * 1. Validates item is activatable
 * 2. Checks inventory has the item
 * 3. Decrements inventory count
 * 4. Sets the appropriate active effect
 * 5. Writes atomically
 *
 * Returns: { success, item, effect }
 */

const admin = require('firebase-admin')

// Which items are activatable and what effect they apply
const ACTIVATABLE_ITEMS = {
  xpBoost: {
    effectKey: 'xpBoost',
    addCount: 3,  // +3 remaining completions
    mode: 'counter',
  },
  doubleCoins: {
    effectKey: 'doubleCoins',
    addCount: 5,  // +5 remaining completions
    mode: 'counter',
  },
  decayDampener: {
    effectKey: 'dampenerExpires',
    durationMs: 24 * 60 * 60 * 1000,  // 24 hours
    mode: 'timer',
  },
  momentumSurge: {
    effectKey: 'momentumSurgeExpires',
    durationMs: 24 * 60 * 60 * 1000,  // 24 hours
    mode: 'timer',
  },
}

async function handleActivateItem(db, userId, itemId) {
  const activatable = ACTIVATABLE_ITEMS[itemId]
  if (!activatable) {
    throw new Error(`Item "${itemId}" cannot be activated.`)
  }

  const statsRef = db.doc(`users/${userId}/stats/main`)

  const result = await db.runTransaction(async (t) => {
    const statsSnap = await t.get(statsRef)

    if (!statsSnap.exists) {
      throw new Error('Player stats not found.')
    }

    const stats = statsSnap.data()
    const inventory = { ...(stats.inventory || {}) }
    const activeEffects = { ...(stats.activeEffects || {}) }

    // Check inventory
    if (!inventory[itemId] || inventory[itemId] <= 0) {
      throw new Error(`No ${itemId} in inventory.`)
    }

    // Decrement inventory
    inventory[itemId]--

    // Apply effect
    let effectDescription = ''
    if (activatable.mode === 'counter') {
      activeEffects[activatable.effectKey] = (activeEffects[activatable.effectKey] || 0) + activatable.addCount
      effectDescription = `+${activatable.addCount} uses`
    } else if (activatable.mode === 'timer') {
      activeEffects[activatable.effectKey] = new Date(Date.now() + activatable.durationMs).toISOString()
      effectDescription = '24h timer started'
    }

    t.update(statsRef, {
      inventory,
      activeEffects,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    })

    return {
      success: true,
      item: itemId,
      effect: effectDescription,
    }
  })

  return result
}

module.exports = { handleActivateItem }
