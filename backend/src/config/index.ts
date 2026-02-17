// ============================================================
// Acuity Invest — Environment Configuration
// ============================================================

import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const WEAK_SECRETS = [
  'dev-secret-change-in-production',
  'CHANGE_ME_USE_A_STRONG_RANDOM_SECRET_AT_LEAST_64_CHARS',
  'your-jwt-secret-here',
  'secret',
  'password',
];

function resolveJwtSecret(): string {
  const envSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!envSecret || WEAK_SECRETS.includes(envSecret) || envSecret.length < 32) {
    if (isProduction) {
      throw new Error(
        'FATAL: JWT_SECRET must be set to a strong random value (>= 32 chars) in production. ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
      );
    }
    // In development, generate a random per-run secret and warn
    const devSecret = crypto.randomBytes(64).toString('hex');
    console.warn('WARNING: Using auto-generated JWT_SECRET. Set a strong JWT_SECRET in .env for stable sessions.');
    return devSecret;
  }
  return envSecret;
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Google Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: 'gemini-2.0-flash',
  maxTokens: 4096,

  // JWT
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: '24h',

  // CORS — in production, FRONTEND_URL must be explicitly set
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../../data/acuity.db'),

  // Rate Limiting
  rateLimits: {
    free: {
      insightsPerDay: 5,
    },
    premium: {
      insightsPerDay: Infinity,
    },
  },

  // Market Data Cache TTL (5 minutes in milliseconds)
  marketCacheTtlMs: 5 * 60 * 1000,

  // Langfuse Observability
  langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY || '',
  langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
  langfuseBaseUrl: process.env.LANGFUSE_BASEURL || 'http://localhost:3000',
  langfuseEnabled: !!process.env.LANGFUSE_SECRET_KEY && !!process.env.LANGFUSE_PUBLIC_KEY,
} as const;

/**
 * Validate that critical environment variables are set.
 * Called at startup — throws in production for missing critical vars.
 */
export function validateConfig(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
    if (config.isProduction) {
      errors.push('GEMINI_API_KEY must be set in production.');
    } else {
      warnings.push('GEMINI_API_KEY is not set. AI insights will fail.');
    }
  }

  if (config.isProduction && (!process.env.FRONTEND_URL || process.env.FRONTEND_URL === 'http://localhost:5173')) {
    errors.push('FRONTEND_URL must be explicitly set in production (used for CORS).');
  }

  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
    warnings.push('LANGFUSE keys are not set. LLM observability and scoring will be disabled.');
  }

  if (errors.length > 0) {
    console.error('=== Configuration ERRORS (fatal) ===');
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error('====================================');
    throw new Error('Missing required configuration. See errors above.');
  }

  if (warnings.length > 0) {
    console.warn('=== Configuration Warnings ===');
    warnings.forEach((w) => console.warn(`  - ${w}`));
    console.warn('==============================');
  }
}
