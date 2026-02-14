// ============================================================
// Acuity Invest — Subscription Tier Gating Middleware
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, SubscriptionTier } from '../types';
import { AppError } from './errorHandler.middleware';

/**
 * Factory function that creates middleware to require a specific subscription tier.
 * Usage: requireTier('PREMIUM') — blocks FREE users from accessing the route.
 */
export function requireTier(requiredTier: SubscriptionTier) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    const tierHierarchy: Record<SubscriptionTier, number> = {
      FREE: 0,
      PREMIUM: 1,
    };

    const userTierLevel = tierHierarchy[req.user.tier];
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      next(
        new AppError(
          `This feature requires a ${requiredTier} subscription. Please upgrade your plan.`,
          403
        )
      );
      return;
    }

    next();
  };
}

/**
 * Middleware that attaches the subscription tier to the request for downstream use.
 * Does not block any tier — just makes tier info easily available.
 */
export function attachTier(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  // Tier is already available via req.user.tier from auth middleware
  // This is a pass-through for clarity in route definitions
  next();
}
