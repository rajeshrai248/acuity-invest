// ============================================================
// Acuity Invest — Market Data Routes
// ============================================================

import { Router } from 'express';
import { getQuoteHandler, getBatchQuotesHandler, getMarketMoversHandler } from '../controllers/market.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, batchQuotesSchema } from '../middleware/validation.middleware';

const router = Router();

// All market routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/market/movers
 * Get top gainers, losers, and most active stocks.
 */
router.get('/movers', getMarketMoversHandler);

/**
 * GET /api/v1/market/quote/:ticker
 * Get a real-time quote for a single ticker.
 */
router.get('/quote/:ticker', getQuoteHandler);

/**
 * POST /api/v1/market/quotes
 * Get real-time quotes for multiple tickers (batch).
 */
router.post('/quotes', validate(batchQuotesSchema), getBatchQuotesHandler);

export default router;
