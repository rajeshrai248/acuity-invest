// ============================================================
// Acuity Invest — SQLite Database Connection & Initialization
// ============================================================

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

let db: Database.Database;

/**
 * Get the singleton database instance.
 */
export function getDatabase(): Database.Database {
  if (!db) {
    // Ensure the data directory exists
    const dbDir = path.dirname(config.databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new Database(config.databasePath);

    // Enable WAL mode for better concurrent performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

/**
 * Initialize the database schema.
 * Creates all tables if they don't exist.
 */
export function initializeDatabase(): void {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      subscription_tier TEXT DEFAULT 'FREE' CHECK(subscription_tier IN ('FREE', 'PREMIUM')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portfolios (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      account_type TEXT DEFAULT 'Individual Brokerage',
      base_currency TEXT DEFAULT 'USD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holdings (
      id TEXT PRIMARY KEY,
      portfolio_id TEXT NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
      ticker TEXT NOT NULL,
      name TEXT NOT NULL,
      shares REAL NOT NULL,
      avg_cost REAL NOT NULL,
      purchase_date TEXT,
      UNIQUE(portfolio_id, ticker)
    );

    CREATE TABLE IF NOT EXISTS insight_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      portfolio_id TEXT NOT NULL,
      query TEXT NOT NULL,
      response TEXT,
      tier TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mcp_api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key_hash TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_used_at DATETIME
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
    CREATE INDEX IF NOT EXISTS idx_holdings_portfolio_id ON holdings(portfolio_id);
    CREATE INDEX IF NOT EXISTS idx_insight_logs_user_id ON insight_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_insight_logs_created_at ON insight_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_key_hash ON mcp_api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_user_id ON mcp_api_keys(user_id);
  `);

  console.log('Database initialized successfully.');
}

/**
 * Close the database connection gracefully.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    console.log('Database connection closed.');
  }
}
