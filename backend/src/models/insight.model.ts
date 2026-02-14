// ============================================================
// Acuity Invest — Insight Log Model (Data Access Layer)
// ============================================================

import { getDatabase } from '../db/database';
import { InsightLog, SubscriptionTier } from '../types';

/**
 * Create an insight log entry.
 */
export function createInsightLog(
  id: string,
  userId: string,
  portfolioId: string,
  query: string,
  response: string | null,
  tier: SubscriptionTier
): InsightLog {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO insight_logs (id, user_id, portfolio_id, query, response, tier)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, portfolioId, query, response, tier);
  return findInsightLogById(id) as InsightLog;
}

/**
 * Find an insight log by ID.
 */
export function findInsightLogById(id: string): InsightLog | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM insight_logs WHERE id = ?');
  return stmt.get(id) as InsightLog | undefined;
}

/**
 * Find all insight logs for a user, ordered by most recent first.
 */
export function findInsightLogsByUserId(userId: string, limit: number = 50): InsightLog[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM insight_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  );
  return stmt.all(userId, limit) as InsightLog[];
}

/**
 * Count the number of insight queries made by a user today.
 * Used for rate limiting FREE tier users.
 */
export function countTodayInsightsByUserId(userId: string): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM insight_logs
    WHERE user_id = ? AND date(created_at) = date('now')
  `);
  const result = stmt.get(userId) as { count: number };
  return result.count;
}

/**
 * Update the response of an insight log (set after AI responds).
 */
export function updateInsightLogResponse(id: string, response: string): void {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE insight_logs SET response = ? WHERE id = ?');
  stmt.run(response, id);
}
