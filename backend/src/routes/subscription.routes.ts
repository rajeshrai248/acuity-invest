// ============================================================
// Acuity Invest — Subscription Routes
// ============================================================

import { Router } from 'express';
import { getSubscriptionHandler, upgradeHandler } from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';

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
 * Upgrade to PREMIUM tier (mock payment).
 */
router.post('/upgrade', upgradeHandler);

export default router;
