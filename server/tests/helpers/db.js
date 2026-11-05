const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Connects to a throwaway test database.
 * Uses an in-memory MongoDB (mongodb-memory-server) unless MONGO_URI_TEST is set.
 */
async function connect() {
  let uri = process.env.MONGO_URI_TEST;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  const dbName = `campusready_test_${process.env.JEST_WORKER_ID || 1}_${Date.now()}`;
  await mongoose.connect(uri, { dbName });
}

/** Deletes every document so each test starts from an empty database */
async function clear() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function close() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connect, clear, close };
