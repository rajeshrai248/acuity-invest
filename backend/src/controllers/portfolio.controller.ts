// ============================================================
// Acuity Invest — Portfolio Controller
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse, Portfolio, PortfolioWithHoldings, Holding } from '../types';
import * as PortfolioService from '../services/portfolio.service';
import { AppError } from '../middleware/errorHandler.middleware';

/**
 * GET /api/v1/portfolio
 * List all portfolios for the authenticated user.
 */
export function listPortfolios(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const portfolios = PortfolioService.listPortfolios(userId);

    const response: ApiResponse<Portfolio[]> = {
      success: true,
      data: portfolios,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/portfolio/:id
 * Get a specific portfolio with all its holdings.
 */
export function getPortfolio(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id as string;

    const portfolio = PortfolioService.getPortfolio(portfolioId, userId);

    const response: ApiResponse<PortfolioWithHoldings> = {
      success: true,
      data: portfolio,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/portfolio
 * Create a new portfolio.
 */
export function createPortfolio(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const { name, account_type, base_currency } = req.body;

    const portfolio = PortfolioService.createNewPortfolio(userId, name, account_type, base_currency);

    const response: ApiResponse<Portfolio> = {
      success: true,
      data: portfolio,
      message: 'Portfolio created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/portfolio/:id
 * Update an existing portfolio.
 */
export function updatePortfolio(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id as string;
    const updates = req.body;

    const portfolio = PortfolioService.updatePortfolio(portfolioId, userId, updates);

    const response: ApiResponse<Portfolio> = {
      success: true,
      data: portfolio,
      message: 'Portfolio updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/portfolio/:id
 * Delete a portfolio and all its holdings.
 */
export function deletePortfolio(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id as string;

    PortfolioService.deletePortfolio(portfolioId, userId);

    const response: ApiResponse = {
      success: true,
      message: 'Portfolio deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/portfolio/:id/holdings
 * Add a holding to a portfolio.
 */
export function addHolding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id as string;
    const { ticker, name, shares, avg_cost, purchase_date } = req.body;

    const holding = PortfolioService.addHolding(
      portfolioId,
      userId,
      ticker,
      name,
      shares,
      avg_cost,
      purchase_date || null
    );

    const response: ApiResponse<Holding> = {
      success: true,
      data: holding,
      message: `${ticker} added to portfolio`,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/portfolio/:id/holdings/:ticker
 * Remove a holding from a portfolio.
 */
export function removeHolding(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const userId = req.user!.userId;
    const portfolioId = req.params.id as string;
    const ticker = (req.params.ticker as string).toUpperCase();

    PortfolioService.removeHolding(portfolioId, userId, ticker);

    const response: ApiResponse = {
      success: true,
      message: `${ticker} removed from portfolio`,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
