import { createApp } from './app';
import { loadEnv, connectDb, disconnectDb } from '@brandguard/data-security';

const startServer = async () => {
  try {
    loadEnv();
    await connectDb();

    const app = createApp();
    const port = process.env.PORT || 4000;

    const server = app.listen(port, () => {
      console.log(`=======================================================`);
      console.log(`🛡️  BrandGuard AI Backend Service is running!`);
      console.log(`📡 URL: http://localhost:${port}`);
      console.log(`🔒 Data Security & RBAC: Active (HMAC-SHA256 Hash Chain)`);
      console.log(`=======================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        await disconnectDb();
        console.log('[Server] Process terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[Server] Startup failed:', error);
    process.exit(1);
  }
};

startServer();
