/**
 * Entropy Tower — Cloud Functions Entry Point
 *
 * Phase 1:
 * - scheduledProcessDecay: daily scheduled function for all users
 * - processMyDecay: callable function triggered when a user opens the app
 *
 * Phase 2:
 * - completeQuest: server-side quest completion (XP, coins, streak, boss gate)
 * - deleteQuest: server-side quest abandonment with penalty
 * - reviveQuest: server-side revival elixir usage
 *
 * Phase 3:
 * - purchaseItem: server-validated shop purchases
 * - activateItem: server-validated item activation
 */

const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall, HttpsError } = require('firebase-functions/v2/https')

admin.initializeApp()

const { processDecay, processUserDecay } = require('./src/processDecay')
const { handleCompleteQuest } = require('./src/completeQuest')
const { handleDeleteQuest } = require('./src/deleteQuest')
const { handleReviveQuest } = require('./src/reviveQuest')
const { handlePurchaseItem } = require('./src/purchaseItem')
const { handleActivateItem } = require('./src/activateItem')
const { formatDateStr } = require('./src/gameConfig')

/**
 * Scheduled function: runs daily at midnight Pacific.
 * Processes decay for all users with overdue quests.
 */
exports.scheduledProcessDecay = onSchedule(
  {
    schedule: 'every day 00:00',
    timeZone: 'America/Los_Angeles',
    retryCount: 2,
    memory: '256MiB',
  },
  async (event) => {
    console.log('Running scheduled decay processing...')
    const result = await processDecay()
    console.log('Decay processing result:', result)
  }
)

/**
 * Callable function: triggered when the user opens the app.
 * Processes decay only for the calling user — gives instant feedback.
 */
exports.processMyDecay = onCall(
  {
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const userId = request.auth.uid
    const timezone = request.data?.timezone
    const now = new Date()
    const db = admin.firestore()

    try {
      await processUserDecay(db, userId, now, timezone)
      return { success: true }
    } catch (err) {
      console.error(`processMyDecay failed for user ${userId}:`, err)
      throw new HttpsError('internal', 'Failed to process decay.')
    }
  }
)

/**
 * Callable function: complete a quest.
 * Server-authoritative XP/coin rewards, streak, boss gate, heatmap.
 */
exports.completeQuest = onCall(
  {
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const { questId, timezone } = request.data || {}
    if (!questId || typeof questId !== 'string') {
      throw new HttpsError('invalid-argument', 'questId is required.')
    }

    const db = admin.firestore()
    try {
      return await handleCompleteQuest(db, request.auth.uid, questId, timezone)
    } catch (err) {
      console.error(`completeQuest failed for user ${request.auth.uid}:`, err)
      throw new HttpsError('internal', err.message || 'Failed to complete quest.')
    }
  }
)

/**
 * Callable function: delete (abandon) a quest.
 * Server-authoritative abandonment penalty.
 */
exports.deleteQuest = onCall(
  {
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const { questId, timezone } = request.data || {}
    if (!questId || typeof questId !== 'string') {
      throw new HttpsError('invalid-argument', 'questId is required.')
    }

    const db = admin.firestore()
    try {
      return await handleDeleteQuest(db, request.auth.uid, questId, timezone)
    } catch (err) {
      console.error(`deleteQuest failed for user ${request.auth.uid}:`, err)
      throw new HttpsError('internal', err.message || 'Failed to delete quest.')
    }
  }
)

/**
 * Callable function: revive a corrupted quest using Revival Elixir.
 */
exports.reviveQuest = onCall(
  {
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const { questId } = request.data || {}
    if (!questId || typeof questId !== 'string') {
      throw new HttpsError('invalid-argument', 'questId is required.')
    }

    const db = admin.firestore()
    try {
      return await handleReviveQuest(db, request.auth.uid, questId)
    } catch (err) {
      console.error(`reviveQuest failed for user ${request.auth.uid}:`, err)
      throw new HttpsError('internal', err.message || 'Failed to revive quest.')
    }
  }
)

/**
 * Callable function: purchase an item from the shop.
 * Server-validated coin balance, inventory limits, and ownership.
 */
exports.purchaseItem = onCall(
  {
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const { itemId } = request.data || {}
    if (!itemId || typeof itemId !== 'string') {
      throw new HttpsError('invalid-argument', 'itemId is required.')
    }

    const db = admin.firestore()
    try {
      return await handlePurchaseItem(db, request.auth.uid, itemId)
    } catch (err) {
      console.error(`purchaseItem failed for user ${request.auth.uid}:`, err)
      throw new HttpsError('internal', err.message || 'Failed to purchase item.')
    }
  }
)

/**
 * Callable function: activate a consumable item.
 * Server-validated inventory count and effect application.
 */
exports.activateItem = onCall(
  {
    memory: '256MiB',
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const { itemId } = request.data || {}
    if (!itemId || typeof itemId !== 'string') {
      throw new HttpsError('invalid-argument', 'itemId is required.')
    }

    const db = admin.firestore()
    try {
      return await handleActivateItem(db, request.auth.uid, itemId)
    } catch (err) {
      console.error(`activateItem failed for user ${request.auth.uid}:`, err)
      throw new HttpsError('internal', err.message || 'Failed to activate item.')
    }
  }
)
