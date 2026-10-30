const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log(`[DB] Attempting connection to MongoDB at: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[DB] Successfully connected to MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[DB] Could not connect to configured MONGODB_URI: ${err.message}`);
      console.log('[DB] Falling back to automated MongoMemoryServer for standalone zero-config execution...');
    }
  }

  // Standalone in-memory fallback
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    console.log(`[DB] Started MongoMemoryServer at ${memUri}`);
    const conn = await mongoose.connect(memUri);
    console.log('[DB] Connected to in-memory MongoDB instance successfully.');
    return conn;
  } catch (err) {
    console.error(`[DB] Critical Error starting database: ${err.message}`);
    throw err;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
