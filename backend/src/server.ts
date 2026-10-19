import { createApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection } from './config/database';
import { runMigrations } from './migrations/runMigrations';

const startServer = async () => {
  console.log('🚀 [ChairCare Backend]: Booting server in', env.NODE_ENV, 'mode...');

  const app = createApp();

  // Validate Database Connectivity & apply migrations
  const isDbConnected = await checkDatabaseConnection();
  if (isDbConnected) {
    try {
      await runMigrations();
    } catch (err: any) {
      console.error('⚠️ [DB Migration Warning]:', err.message);
    }
  } else {
    console.warn('⚠️ [Database Notice]: Running in fallback mode. Ensure DATABASE_URL is configured for persistence.');
  }

  const HOST = '0.0.0.0';
  const server = app.listen(env.PORT, HOST, () => {
    console.log(`🌐 [ChairCare API Server]: Listening on http://${HOST}:${env.PORT}`);
    console.log(`📋 [Health Check]: http://localhost:${env.PORT}/api/health`);
    console.log(`📡 [API Endpoint]: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n🛑 [ChairCare Server]: Shutting down gracefully...');
    server.close(() => {
      console.log('🏁 [ChairCare Server]: HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer().catch((err) => {
  console.error('💥 [ChairCare Server]: Fatal startup error:', err);
  process.exit(1);
});
