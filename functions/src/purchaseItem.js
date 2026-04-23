/**
 * purchaseItem — Callable Cloud Function
 *
 * Server-validated shop purchases using Firestore transaction:
 * 1. Validates item exists in SHOP_ITEMS
 * 2. Checks player has enough coins
 * 3. For consumables: checks inventory isn't maxed
 * 4. For cosmetics: checks not already owned
 * 5. Deducts coins and updates inventory/ownedCosmetics atomically
 *
 * Returns: { success, item, coinsRemaining }
 */

const admin = require('firebase-admin')
const { SHOP_ITEMS } = require('./gameConfig')

async function handlePurchaseItem(db, userId, itemId) {
  const item = SHOP_ITEMS[itemId]
  if (!item) {
    throw new Error(`Unknown item: ${itemId}`)
  }

  const statsRef = db.doc(`users/${userId}/stats/main`)

  const result = await db.runTransaction(async (t) => {
    const statsSnap = await t.get(statsRef)

    if (!statsSnap.exists) {
      throw new Error('Player stats not found.')
    }

    const stats = statsSnap.data()
    const coins = stats.coins || 0

    // Check sufficient coins
    if (coins < item.price) {
      throw new Error('Not enough coins.')
    }

    const statsUpdate = {
      coins: coins - item.price,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    }

    if (item.type === 'consumable') {
      const inventory = { ...(stats.inventory || {}) }
      const currentCount = inventory[itemId] || 0

      if (currentCount >= item.max) {
        throw new Error(`Already at max capacity for ${item.name}.`)
      }

      inventory[itemId] = currentCount + 1
      statsUpdate.inventory = inventory
    } else if (item.type === 'cosmetic') {
      const ownedCosmetics = [...(stats.ownedCosmetics || [])]

      if (ownedCosmetics.includes(itemId)) {
        throw new Error(`Already owned: ${item.name}.`)
      }

      ownedCosmetics.push(itemId)
      statsUpdate.ownedCosmetics = ownedCosmetics
    } else {
      throw new Error(`Invalid item type: ${item.type}`)
    }

    t.update(statsRef, statsUpdate)

    return {
      success: true,
      item: item.name,
      coinsRemaining: coins - item.price,
    }
  })

  return result
}

module.exports = { handlePurchaseItem }
