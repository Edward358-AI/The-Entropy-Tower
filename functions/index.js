/**
 * Entropy Tower — Cloud Functions Entry Point
 *
 * Phase 1:
 * - scheduledProcessDecay: daily scheduled function for all users
 * - processMyDecay: callable function triggered when a user opens the app
 */

const admin = require('firebase-admin')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { onCall, HttpsError } = require('firebase-functions/v2/https')

admin.initializeApp()

const { processDecay, processUserDecay } = require('./src/processDecay')
const { formatDateStr } = require('./src/gameConfig')

/**
 * Scheduled function: runs daily at 4:00 AM Pacific.
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
    // Must be authenticated
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.')
    }

    const userId = request.auth.uid
    const now = new Date()
    const todayStr = formatDateStr(now)
    const db = admin.firestore()

    try {
      await processUserDecay(db, userId, now, todayStr)
      return { success: true }
    } catch (err) {
      console.error(`processMyDecay failed for user ${userId}:`, err)
      throw new HttpsError('internal', 'Failed to process decay.')
    }
  }
)
