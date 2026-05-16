const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // We might not have this locally, but we can use default credentials if it's emulated, or maybe not.
