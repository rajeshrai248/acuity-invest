// ============================================================
// Acuity Invest — Portfolio Model (Data Access Layer)
// ============================================================

import { getDatabase } from '../db/database';
import { Portfolio, Holding, PortfolioWithHoldings } from '../types';

// --- Portfolio Operations ---

/**
 * Find all portfolios for a given user.
 */
export function findPortfoliosByUserId(userId: string): Portfolio[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM portfolios WHERE user_id = ? ORDER BY created_at DESC');
  return stmt.all(userId) as Portfolio[];
}

/**
 * Find a single portfolio by ID.
 */
export function findPortfolioById(portfolioId: string): Portfolio | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM portfolios WHERE id = ?');
  return stmt.get(portfolioId) as Portfolio | undefined;
}

/**
 * Find a portfolio by ID, ensuring it belongs to the specified user.
 */
export function findPortfolioByIdAndUser(portfolioId: string, userId: string): Portfolio | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM portfolios WHERE id = ? AND user_id = ?');
  return stmt.get(portfolioId, userId) as Portfolio | undefined;
}

/**
 * Find a portfolio with all its holdings.
 */
export function findPortfolioWithHoldings(portfolioId: string, userId: string): PortfolioWithHoldings | undefined {
  const portfolio = findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) return undefined;

  const holdings = findHoldingsByPortfolioId(portfolioId);
  return { ...portfolio, holdings };
}

/**
 * Create a new portfolio.
 */
export function createPortfolio(
  id: string,
  userId: string,
  name: string,
  accountType: string = 'Individual Brokerage',
  baseCurrency: string = 'USD'
): Portfolio {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO portfolios (id, user_id, name, account_type, base_currency)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, name, accountType, baseCurrency);
  return findPortfolioById(id) as Portfolio;
}

/**
 * Update a portfolio's details.
 */
export function updatePortfolio(
  portfolioId: string,
  userId: string,
  updates: { name?: string; account_type?: string; base_currency?: string }
): Portfolio | undefined {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.account_type !== undefined) {
    fields.push('account_type = ?');
    values.push(updates.account_type);
  }
  if (updates.base_currency !== undefined) {
    fields.push('base_currency = ?');
    values.push(updates.base_currency);
  }

  if (fields.length === 0) return findPortfolioByIdAndUser(portfolioId, userId);

  values.push(portfolioId, userId);
  const stmt = db.prepare(`UPDATE portfolios SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`);
  const result = stmt.run(...values);

  if (result.changes === 0) return undefined;
  return findPortfolioById(portfolioId);
}

/**
 * Delete a portfolio and all its holdings (CASCADE).
 */
export function deletePortfolio(portfolioId: string, userId: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM portfolios WHERE id = ? AND user_id = ?');
  const result = stmt.run(portfolioId, userId);
  return result.changes > 0;
}

// --- Holding Operations ---

/**
 * Find all holdings for a portfolio.
 */
export function findHoldingsByPortfolioId(portfolioId: string): Holding[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM holdings WHERE portfolio_id = ? ORDER BY ticker ASC');
  return stmt.all(portfolioId) as Holding[];
}

/**
 * Find a specific holding by portfolio and ticker.
 */
export function findHoldingByTicker(portfolioId: string, ticker: string): Holding | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM holdings WHERE portfolio_id = ? AND ticker = ?');
  return stmt.get(portfolioId, ticker) as Holding | undefined;
}

/**
 * Add a holding to a portfolio.
 */
export function addHolding(
  id: string,
  portfolioId: string,
  ticker: string,
  name: string,
  shares: number,
  avgCost: number,
  purchaseDate: string | null = null
): Holding {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO holdings (id, portfolio_id, ticker, name, shares, avg_cost, purchase_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, portfolioId, ticker, name, shares, avgCost, purchaseDate);

  return findHoldingByTicker(portfolioId, ticker) as Holding;
}

/**
 * Update an existing holding.
 */
export function updateHolding(
  portfolioId: string,
  ticker: string,
  updates: { shares?: number; avg_cost?: number; name?: string; purchase_date?: string }
): Holding | undefined {
  const db = getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.shares !== undefined) {
    fields.push('shares = ?');
    values.push(updates.shares);
  }
  if (updates.avg_cost !== undefined) {
    fields.push('avg_cost = ?');
    values.push(updates.avg_cost);
  }
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.purchase_date !== undefined) {
    fields.push('purchase_date = ?');
    values.push(updates.purchase_date);
  }

  if (fields.length === 0) return findHoldingByTicker(portfolioId, ticker);

  values.push(portfolioId, ticker);
  const stmt = db.prepare(`UPDATE holdings SET ${fields.join(', ')} WHERE portfolio_id = ? AND ticker = ?`);
  const result = stmt.run(...values);

  if (result.changes === 0) return undefined;
  return findHoldingByTicker(portfolioId, ticker);
}

/**
 * Remove a holding from a portfolio.
 */
export function removeHolding(portfolioId: string, ticker: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM holdings WHERE portfolio_id = ? AND ticker = ?');
  const result = stmt.run(portfolioId, ticker);
  return result.changes > 0;
}
