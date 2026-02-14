// ============================================================
// Acuity Invest — Subscription Controller
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { getSubscription, upgradeToPremium, SubscriptionInfo } from '../services/subscription.service';

/**
 * GET /api/v1/subscription
 * Get the current user's subscription details.
 */
export function getSubscriptionHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const subscription = getSubscription(userId);

    const response: ApiResponse<SubscriptionInfo> = {
      success: true,
      data: subscription,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/subscription/upgrade
 * Upgrade the current user to PREMIUM tier (mock payment).
 */
export function upgradeHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const result = upgradeToPremium(userId);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Successfully upgraded to PREMIUM! Enjoy unlimited insights and advanced analytics.',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
