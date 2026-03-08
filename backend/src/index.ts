// ============================================================
// Acuity Invest — Server Entry Point
// ============================================================

import app from './app';
import { config, validateConfig } from './config';
import { initializeDatabase, closeDatabase } from './db/database';
import { shutdownLangfuse, setupAnnotationScoreConfigs } from './services/langfuse.service';

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

    // Step 3: Setup Langfuse annotation score configs (non-blocking)
    setupAnnotationScoreConfigs().catch((err) => {
      console.warn('Failed to setup Langfuse annotation configs:', err.message);
    });

    // Step 4: Start the Express server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('==============================================');
      console.log('  Acuity Invest Backend Server');
      console.log('==============================================');
      console.log(`  Port        : ${config.port}`);
      console.log(`  Langfuse    : ${config.langfuseEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`  API Base    : http://localhost:${config.port}/api/v1`);
      console.log('==============================================');
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
