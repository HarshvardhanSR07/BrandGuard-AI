/**
 * Local Development MongoDB Server
 * Uses the bundled mongodb-memory-server binary to run a full MongoDB 7.0.14 instance on port 27017.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  console.log('[BrandGuard AI] Starting local MongoDB (v7.0.14) instance on port 27017...');
  try {
    const mongod = await MongoMemoryServer.create({
      binary: {
        version: '7.0.14',
      },
      instance: {
        port: 27017,
        dbName: 'brandguard_dev',
      },
    });

    console.log(`✅ MongoDB 7.0.14 successfully running at: ${mongod.getUri()}`);
    console.log('Database name: brandguard_dev');
    console.log('Ready for API connections from apps/api (port 4000). Press Ctrl+C to terminate.');

    process.on('SIGINT', async () => {
      console.log('\n[BrandGuard AI] Stopping MongoDB...');
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Failed to start local MongoDB:', err);
    process.exit(1);
  }
}

main();
