// ============================================================
// Acuity Invest — Portfolio Routes
// ============================================================

import { Router } from 'express';
import {
  listPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  addHolding,
  removeHolding,
} from '../controllers/portfolio.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  validate,
  createPortfolioSchema,
  updatePortfolioSchema,
  addHoldingSchema,
} from '../middleware/validation.middleware';

const router = Router();

// All portfolio routes require authentication
router.use(authMiddleware);

/**
 * GET /api/v1/portfolio
 * List all portfolios for the authenticated user.
 */
router.get('/', listPortfolios);

/**
 * GET /api/v1/portfolio/:id
 * Get a specific portfolio with all holdings.
 */
router.get('/:id', getPortfolio);

/**
 * POST /api/v1/portfolio
 * Create a new portfolio.
 */
router.post('/', validate(createPortfolioSchema), createPortfolio);

/**
 * PUT /api/v1/portfolio/:id
 * Update an existing portfolio.
 */
router.put('/:id', validate(updatePortfolioSchema), updatePortfolio);

/**
 * DELETE /api/v1/portfolio/:id
 * Delete a portfolio and all its holdings.
 */
router.delete('/:id', deletePortfolio);

/**
 * POST /api/v1/portfolio/:id/holdings
 * Add a holding to a portfolio.
 */
router.post('/:id/holdings', validate(addHoldingSchema), addHolding);

/**
 * DELETE /api/v1/portfolio/:id/holdings/:ticker
 * Remove a holding from a portfolio.
 */
router.delete('/:id/holdings/:ticker', removeHolding);

export default router;
