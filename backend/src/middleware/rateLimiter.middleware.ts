// ============================================================
// Acuity Invest — Rate Limiting Middleware
// ============================================================

import rateLimit from 'express-rate-limit';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler.middleware';
import { countTodayInsightsByUserId } from '../models/insight.model';
import { config } from '../config';

/**
 * General API rate limiter — applies to all routes.
 * 100 requests per 15 minutes per IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});

/**
 * Auth rate limiter — applies to login/register routes.
 * 30 attempts per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

/**
 * Insight rate limiter — tier-based daily limit.
 * FREE = 5 queries/day, PREMIUM = unlimited.
 * This is a custom middleware (not express-rate-limit) because we track by user ID in the DB.
 */
export function insightRateLimiter(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new AppError('Authentication required', 401));
    return;
  }

  // PREMIUM users are unlimited
  if (req.user.tier === 'PREMIUM') {
    next();
    return;
  }

  // FREE users: check daily count
  const todayCount = countTodayInsightsByUserId(req.user.userId);
  const limit = config.rateLimits.free.insightsPerDay;

  if (todayCount >= limit) {
    next(
      new AppError(
        `Daily insight limit reached (${limit} per day for FREE tier). Upgrade to PREMIUM for unlimited insights.`,
        429
      )
    );
    return;
  }

  next();
}
