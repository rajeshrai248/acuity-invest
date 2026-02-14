// ============================================================
// Acuity Invest — Server Entry Point
// ============================================================

import app from './app';
import { config, validateConfig } from './config';
import { initializeDatabase, closeDatabase } from './db/database';
import { getLangfuse, shutdownLangfuse } from './services/langfuse.service';

/**
 * Start the Acuity Invest backend server.
 */
async function startServer(): Promise<void> {
  try {
    // Step 1: Validate configuration
    console.log('Validating configuration...');
    validateConfig();

    // Step 2: Initialize the database
    console.log('Initializing database...');
    initializeDatabase();

    // Step 3: Start the Express server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('==============================================');
      console.log('  Acuity Invest Backend Server');
      console.log('==============================================');
      console.log(`  Environment : ${config.nodeEnv}`);
      console.log(`  Port        : ${config.port}`);
      console.log(`  Frontend URL: ${config.frontendUrl}`);
      console.log(`  Database    : ${config.databasePath}`);
      console.log(`  Langfuse    : ${config.langfuseEnabled ? 'Enabled' : 'Disabled (set LANGFUSE keys to enable)'}`);
      console.log(`  API Base    : http://localhost:${config.port}/api/v1`);
      console.log('==============================================');
      console.log('');
      console.log('Available endpoints:');
      console.log('  POST   /api/v1/auth/register');
      console.log('  POST   /api/v1/auth/login');
      console.log('  GET    /api/v1/portfolio');
      console.log('  GET    /api/v1/portfolio/:id');
      console.log('  POST   /api/v1/portfolio');
      console.log('  PUT    /api/v1/portfolio/:id');
      console.log('  DELETE /api/v1/portfolio/:id');
      console.log('  POST   /api/v1/portfolio/:id/holdings');
      console.log('  DELETE /api/v1/portfolio/:id/holdings/:ticker');
      console.log('  GET    /api/v1/market/movers');
      console.log('  GET    /api/v1/market/quote/:ticker');
      console.log('  POST   /api/v1/market/quotes');
      console.log('  GET    /api/v1/subscription');
      console.log('  POST   /api/v1/subscription/upgrade');
      console.log('  POST   /api/v1/insights');
      console.log('  GET    /api/v1/health');
      console.log('');
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        await shutdownLangfuse();
        closeDatabase();
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
