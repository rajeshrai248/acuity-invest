// ============================================================
// Acuity Invest — Environment Configuration
// ============================================================

import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // Google Gemini AI
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: 'gemini-2.0-flash',
  maxTokens: 4096,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h',

  // CORS
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
 * Called at startup.
 */
export function validateConfig(): void {
  const warnings: string[] = [];

  if (!process.env.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY is not set. AI insights will fail.');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-change-in-production') {
    warnings.push('JWT_SECRET is using default value. Set a strong secret in production.');
  }

  if (!process.env.LANGFUSE_SECRET_KEY || !process.env.LANGFUSE_PUBLIC_KEY) {
    warnings.push('LANGFUSE keys are not set. LLM observability and scoring will be disabled.');
  }

  if (warnings.length > 0) {
    console.warn('=== Configuration Warnings ===');
    warnings.forEach((w) => console.warn(`  - ${w}`));
    console.warn('==============================');
  }
}
