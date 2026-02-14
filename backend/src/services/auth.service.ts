// ============================================================
// Acuity Invest — Authentication Service
// ============================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { AuthTokenPayload, AuthResponse, User, UserPublic } from '../types';
import { findUserByEmail, createUser, toPublicUser } from '../models/user.model';
import { AppError } from '../middleware/errorHandler.middleware';

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  // Check if email is already registered
  const existingUser = findUserByEmail(email);
  if (existingUser) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Hash the password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create the user
  const userId = uuidv4();
  const user = createUser(userId, name, email, passwordHash, 'FREE');

  // Generate JWT
  const token = generateToken(user);
  const publicUser = toPublicUser(user);

  return { token, user: publicUser };
}

/**
 * Authenticate a user with email and password.
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  // Find the user
  const user = findUserByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT
  const token = generateToken(user);
  const publicUser = toPublicUser(user);

  return { token, user: publicUser };
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(user: User): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    tier: user.subscription_tier,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): AuthTokenPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}
