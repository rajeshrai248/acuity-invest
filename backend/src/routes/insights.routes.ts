// ============================================================
// Acuity Invest — Insights Routes
// ============================================================

import { Router } from 'express';
import { generateInsightsHandler, annotateInsightHandler } from '../controllers/insights.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { insightRateLimiter } from '../middleware/rateLimiter.middleware';
import { validate, insightRequestSchema, annotationSchema } from '../middleware/validation.middleware';

const router = Router();

// All insight routes require authentication
router.use(authMiddleware);

/**
 * POST /api/v1/insights
 * Generate AI-powered portfolio insights.
 *
 * Middleware chain:
 * 1. authMiddleware — verify JWT, attach user
 * 2. insightRateLimiter — enforce daily limits by tier
 * 3. validate — Zod schema validation on request body
 * 4. generateInsightsHandler — the actual handler
 */
router.post(
  '/',
  insightRateLimiter,
  validate(insightRequestSchema),
  generateInsightsHandler
);

/**
 * POST /api/v1/insights/annotate
 * Submit a human annotation (scores + comment) for an insight trace.
 */
router.post(
  '/annotate',
  validate(annotationSchema),
  annotateInsightHandler
);

export default router;
