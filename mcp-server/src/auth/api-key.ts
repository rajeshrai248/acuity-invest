// ============================================================
// Acuity Invest MCP Server — API Key Authentication
// ============================================================

import crypto from 'crypto';
import { getDatabase } from '../../../backend/src/db/database';
import { findUserById } from '../../../backend/src/models/user.model';
import { SubscriptionTier } from '../../../backend/src/types';

export interface McpUser {
  userId: string;
  email: string;
  tier: SubscriptionTier;
}

/**
 * Hash an API key using SHA-256 for secure storage comparison.
 */
export function hashApiKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validate an API key and return the associated user, or null if invalid.
 */
export function validateApiKey(rawKey: string): McpUser | null {
  const db = getDatabase();
  const keyHash = hashApiKey(rawKey);

  const row = db
    .prepare('SELECT user_id FROM mcp_api_keys WHERE key_hash = ?')
    .get(keyHash) as { user_id: string } | undefined;

  if (!row) return null;

  // Update last_used_at timestamp
  db.prepare(
    'UPDATE mcp_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE key_hash = ?'
  ).run(keyHash);

  const user = findUserById(row.user_id);
  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    tier: user.subscription_tier,
  };
}
