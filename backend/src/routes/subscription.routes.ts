// ============================================================
// Acuity Invest — Subscription Routes
// ============================================================

import { Router } from 'express';
import { getSubscriptionHandler, upgradeHandler } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { subscriptionRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All subscription routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/subscription
 * Get the current user's subscription details.
 */
router.get('/', getSubscriptionHandler);

/**
 * POST /api/v1/subscription/upgrade
 * Upgrade to PREMIUM tier (mock payment — in production, integrate Stripe).
 */
router.post('/upgrade', subscriptionRateLimiter, upgradeHandler);

export default router;
