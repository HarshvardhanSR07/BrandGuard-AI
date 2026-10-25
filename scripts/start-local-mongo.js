/**
 * Starts a persistent local MongoDB instance using mongodb-memory-server
 * bound to 127.0.0.1:27017 with persistent storage in ./.mongo-data
 */
const path = require('path');
const fs = require('fs');

const { MongoMemoryServer } = require(path.resolve('packages/data-security/node_modules/mongodb-memory-server'));

const dbPath = path.resolve('.mongo-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

async function start() {
  console.log('[Mongo] Initializing local MongoDB instance on port 27017...');
  console.log('[Mongo] Data directory:', dbPath);

  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'brandguard_dev',
        dbPath: dbPath,
        storageEngine: 'wiredTiger',
      },
    });

    const uri = mongod.getUri('brandguard_dev');
    console.log('=======================================================');
    console.log('🍃 Local MongoDB Server is active and listening!');
    console.log('📡 URI:', uri);
    console.log('💾 Persistent Storage:', dbPath);
    console.log('=======================================================');

    const cleanup = async () => {
      console.log('\n[Mongo] Stopping MongoDB server...');
      await mongod.stop();
      console.log('[Mongo] Server stopped.');
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (err) {
    console.error('[Mongo] Failed to start MongoDB server:', err);
    process.exit(1);
  }
}

start();
