// ============================================================
// Acuity Invest — User Model (Data Access Layer)
// ============================================================

import { getDatabase } from '../db/database';
import { User, UserPublic, SubscriptionTier } from '../types';

/**
 * Find a user by their ID.
 */
export function findUserById(id: string): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) as User | undefined;
}

/**
 * Find a user by their email address.
 */
export function findUserByEmail(email: string): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email) as User | undefined;
}

/**
 * Create a new user.
 */
export function createUser(
  id: string,
  name: string,
  email: string,
  passwordHash: string,
  tier: SubscriptionTier = 'FREE'
): User {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, subscription_tier)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, name, email, passwordHash, tier);
  return findUserById(id) as User;
}

/**
 * Update a user's subscription tier.
 */
export function updateUserTier(userId: string, tier: SubscriptionTier): User | undefined {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE users SET subscription_tier = ? WHERE id = ?');
  stmt.run(tier, userId);
  return findUserById(userId);
}

/**
 * Convert a User to a UserPublic (strip password hash).
 */
export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    subscription_tier: user.subscription_tier,
    created_at: user.created_at,
  };
}
