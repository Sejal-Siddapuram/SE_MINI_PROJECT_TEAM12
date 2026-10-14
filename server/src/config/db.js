const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

let localServer = null;

/**
 * Connects to MongoDB.
 * - If MONGO_URI is set (e.g. MongoDB Atlas), that database is used.
 * - Otherwise a local MongoDB instance is started automatically and its data
 *   is kept in server/.data, so nobody on the team has to install MongoDB.
 */
async function connectDB() {
  let uri = MONGO_URI;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbPath = path.join(__dirname, '../../.data');
    fs.mkdirSync(dbPath, { recursive: true });

    localServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: 'wiredTiger' },
    });
    uri = localServer.getUri('campusready');
    console.log('[db] No MONGO_URI set - started local MongoDB (data saved in server/.data)');
  }

  await mongoose.connect(uri);
  console.log('[db] Connected to MongoDB');
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (localServer) await localServer.stop({ doCleanup: false });
}

module.exports = { connectDB, disconnectDB };
