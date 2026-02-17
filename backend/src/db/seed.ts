// ============================================================
// Acuity Invest — Database Seed Script
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, getDatabase, closeDatabase } from './database';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SEED_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SEED_PORTFOLIO_ID = '550e8400-e29b-41d4-a716-446655440002';

const SEED_EMAIL = process.env.SEED_USER_EMAIL || 'demo@acuityinvest.com';
const SEED_PASSWORD = process.env.SEED_USER_PASSWORD || 'Demo@12345';
const SEED_NAME = process.env.SEED_USER_NAME || 'Demo User';

interface SeedHolding {
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  purchase_date: string;
}

const seedHoldings: SeedHolding[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', shares: 150, avg_cost: 178.50, purchase_date: '2023-06-15' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', shares: 80, avg_cost: 342.10, purchase_date: '2023-04-20' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', shares: 45, avg_cost: 138.75, purchase_date: '2023-08-10' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', shares: 60, avg_cost: 145.30, purchase_date: '2023-07-05' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', shares: 100, avg_cost: 475.50, purchase_date: '2023-09-12' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', shares: 70, avg_cost: 152.80, purchase_date: '2023-03-22' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', shares: 90, avg_cost: 162.45, purchase_date: '2023-01-18' },
  { ticker: 'V', name: 'Visa Inc.', shares: 55, avg_cost: 245.60, purchase_date: '2023-05-30' },
  { ticker: 'PG', name: 'Procter & Gamble Co.', shares: 65, avg_cost: 155.20, purchase_date: '2023-02-14' },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', shares: 120, avg_cost: 108.75, purchase_date: '2023-04-08' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', shares: 200, avg_cost: 218.90, purchase_date: '2022-12-01' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', shares: 300, avg_cost: 73.50, purchase_date: '2022-11-15' },
];

async function seed(): Promise<void> {
  console.log('Initializing database...');
  initializeDatabase();

  const db = getDatabase();

  console.log('Clearing existing seed data...');
  db.exec(`
    DELETE FROM insight_logs WHERE user_id = '${SEED_USER_ID}';
    DELETE FROM holdings WHERE portfolio_id = '${SEED_PORTFOLIO_ID}';
    DELETE FROM portfolios WHERE id = '${SEED_PORTFOLIO_ID}';
    DELETE FROM users WHERE id = '${SEED_USER_ID}';
  `);

  console.log('Creating seed user...');
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, subscription_tier)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertUser.run(SEED_USER_ID, SEED_NAME, SEED_EMAIL, passwordHash, 'PREMIUM');

  console.log('Creating seed portfolio...');
  const insertPortfolio = db.prepare(`
    INSERT INTO portfolios (id, user_id, name, account_type, base_currency)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPortfolio.run(SEED_PORTFOLIO_ID, SEED_USER_ID, 'Growth & Income Portfolio', 'Individual Brokerage', 'USD');

  console.log('Adding holdings...');
  const insertHolding = db.prepare(`
    INSERT INTO holdings (id, portfolio_id, ticker, name, shares, avg_cost, purchase_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((holdings: SeedHolding[]) => {
    for (const h of holdings) {
      insertHolding.run(uuidv4(), SEED_PORTFOLIO_ID, h.ticker, h.name, h.shares, h.avg_cost, h.purchase_date);
    }
  });

  insertMany(seedHoldings);

  // Generate MCP API key for the demo user
  console.log('Creating MCP API key...');
  const rawApiKey = `acuity_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
  db.prepare(`DELETE FROM mcp_api_keys WHERE user_id = ?`).run(SEED_USER_ID);
  db.prepare(`
    INSERT INTO mcp_api_keys (id, user_id, key_hash, name)
    VALUES (?, ?, ?, ?)
  `).run(uuidv4(), SEED_USER_ID, keyHash, 'demo-key');

  console.log('Seed data created successfully!');
  console.log(`  User: ${SEED_NAME} (${SEED_USER_ID})`);
  console.log(`  Email: ${SEED_EMAIL}`);
  console.log(`  Tier: PREMIUM`);
  console.log(`  Portfolio: Growth & Income Portfolio (${SEED_PORTFOLIO_ID})`);
  console.log(`  Holdings: ${seedHoldings.length} positions`);
  console.log('  (Password is configured via SEED_USER_PASSWORD env var)');
  console.log('');
  console.log(`  MCP API Key: ${rawApiKey}`);
  console.log('  (Save this key — it cannot be retrieved again)');

  closeDatabase();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
