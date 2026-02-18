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
const SEED_NAME = process.env.SEED_USER_NAME || 'Marc De Smedt';

interface SeedHolding {
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  purchase_date: string;
}

const seedHoldings: SeedHolding[] = [
  // US Equities
  { ticker: 'AAPL', name: 'Apple Inc.', shares: 120, avg_cost: 178.50, purchase_date: '2024-03-15' },
  { ticker: 'MSFT', name: 'Microsoft Corp', shares: 55, avg_cost: 380.25, purchase_date: '2024-01-22' },
  { ticker: 'NVDA', name: 'NVIDIA Corp', shares: 60, avg_cost: 120.50, purchase_date: '2024-06-10' },
  { ticker: 'JPM', name: 'JPMorgan Chase', shares: 85, avg_cost: 195.40, purchase_date: '2024-02-18' },
  // European Equities
  { ticker: 'ABI.BR', name: 'AB InBev SA/NV', shares: 200, avg_cost: 52.30, purchase_date: '2024-04-08' },
  { ticker: 'KBC.BR', name: 'KBC Group NV', shares: 130, avg_cost: 62.80, purchase_date: '2024-05-14' },
  { ticker: 'UCB.BR', name: 'UCB SA', shares: 55, avg_cost: 85.60, purchase_date: '2024-01-10' },
  { ticker: 'ASML.AS', name: 'ASML Holding NV', shares: 18, avg_cost: 620.00, purchase_date: '2024-03-28' },
  { ticker: 'AGS.BR', name: 'Ageas SA/NV', shares: 220, avg_cost: 41.50, purchase_date: '2024-07-02' },
  // Global ETFs
  { ticker: 'IWDA.AS', name: 'iShares Core MSCI World UCITS ETF', shares: 400, avg_cost: 76.50, purchase_date: '2024-02-05' },
  { ticker: 'VWCE.DE', name: 'Vanguard FTSE All-World UCITS ETF', shares: 200, avg_cost: 98.20, purchase_date: '2024-04-20' },
  { ticker: 'IMAE.AS', name: 'iShares MSCI Europe UCITS ETF', shares: 250, avg_cost: 42.80, purchase_date: '2024-06-15' },
  // Fixed Income
  { ticker: 'IEGA.AS', name: 'iShares Core EUR Govt Bond UCITS ETF', shares: 350, avg_cost: 124.20, purchase_date: '2024-01-30' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', shares: 200, avg_cost: 75.80, purchase_date: '2024-03-12' },
  // Alternatives
  { ticker: 'GLD', name: 'SPDR Gold Shares', shares: 45, avg_cost: 185.30, purchase_date: '2024-05-08' },
  { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', shares: 80, avg_cost: 82.60, purchase_date: '2024-08-20' },
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
  insertPortfolio.run(SEED_PORTFOLIO_ID, SEED_USER_ID, 'Private Banking Portfolio', 'Private Banking', 'EUR');

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
  console.log(`  Portfolio: Private Banking Portfolio (${SEED_PORTFOLIO_ID})`);
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
