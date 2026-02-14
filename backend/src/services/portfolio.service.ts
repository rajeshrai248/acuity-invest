// ============================================================
// Acuity Invest — Portfolio Service
// ============================================================

import { v4 as uuidv4 } from 'uuid';
import {
  Portfolio,
  PortfolioWithHoldings,
  Holding,
  HoldingWithMarketData,
  EnrichedPortfolio,
} from '../types';
import * as PortfolioModel from '../models/portfolio.model';
import { getQuote, getBatchQuotes } from './market.service';
import { AppError } from '../middleware/errorHandler.middleware';

// --- Portfolio CRUD ---

/**
 * List all portfolios for a user.
 */
export function listPortfolios(userId: string): Portfolio[] {
  return PortfolioModel.findPortfoliosByUserId(userId);
}

/**
 * Get a single portfolio with holdings for a user.
 */
export function getPortfolio(portfolioId: string, userId: string): PortfolioWithHoldings {
  const portfolio = PortfolioModel.findPortfolioWithHoldings(portfolioId, userId);
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }
  return portfolio;
}

/**
 * Create a new portfolio for a user.
 */
export function createNewPortfolio(
  userId: string,
  name: string,
  accountType?: string,
  baseCurrency?: string
): Portfolio {
  const id = uuidv4();
  return PortfolioModel.createPortfolio(id, userId, name, accountType, baseCurrency);
}

/**
 * Update an existing portfolio.
 */
export function updatePortfolio(
  portfolioId: string,
  userId: string,
  updates: { name?: string; account_type?: string; base_currency?: string }
): Portfolio {
  const updated = PortfolioModel.updatePortfolio(portfolioId, userId, updates);
  if (!updated) {
    throw new AppError('Portfolio not found', 404);
  }
  return updated;
}

/**
 * Delete a portfolio.
 */
export function deletePortfolio(portfolioId: string, userId: string): void {
  const deleted = PortfolioModel.deletePortfolio(portfolioId, userId);
  if (!deleted) {
    throw new AppError('Portfolio not found', 404);
  }
}

// --- Holding Operations ---

/**
 * Add a holding to a portfolio.
 */
export function addHolding(
  portfolioId: string,
  userId: string,
  ticker: string,
  name: string,
  shares: number,
  avgCost: number,
  purchaseDate: string | null
): Holding {
  // Verify portfolio belongs to user
  const portfolio = PortfolioModel.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  // Check if ticker already exists in portfolio
  const existing = PortfolioModel.findHoldingByTicker(portfolioId, ticker);
  if (existing) {
    throw new AppError(`Holding ${ticker} already exists in this portfolio. Use PUT to update.`, 409);
  }

  const id = uuidv4();
  return PortfolioModel.addHolding(id, portfolioId, ticker, name, shares, avgCost, purchaseDate);
}

/**
 * Remove a holding from a portfolio.
 */
export function removeHolding(portfolioId: string, userId: string, ticker: string): void {
  // Verify portfolio belongs to user
  const portfolio = PortfolioModel.findPortfolioByIdAndUser(portfolioId, userId);
  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  const removed = PortfolioModel.removeHolding(portfolioId, ticker.toUpperCase());
  if (!removed) {
    throw new AppError(`Holding ${ticker} not found in portfolio`, 404);
  }
}

// --- Portfolio Enrichment for AI ---

/**
 * Enrich a portfolio with live market data.
 * This is the key function used by the AI service to build prompt context.
 */
export async function enrichPortfolio(
  portfolioId: string,
  userId: string
): Promise<EnrichedPortfolio> {
  const portfolioWithHoldings = getPortfolio(portfolioId, userId);

  if (portfolioWithHoldings.holdings.length === 0) {
    return {
      portfolio: portfolioWithHoldings,
      holdings: [],
      total_value: 0,
      total_cost: 0,
      total_gain_loss: 0,
      total_gain_loss_percent: 0,
      day_change: 0,
      day_change_percent: 0,
    };
  }

  // Fetch market data for all tickers
  const tickers = portfolioWithHoldings.holdings.map((h) => h.ticker);
  const quotes = await getBatchQuotes(tickers);

  // Enrich each holding
  const enrichedHoldings: HoldingWithMarketData[] = portfolioWithHoldings.holdings.map((holding) => {
    const quote = quotes.get(holding.ticker);
    const currentPrice = quote?.price ?? holding.avg_cost; // Fallback to avg_cost if no quote
    const marketValue = currentPrice * holding.shares;
    const totalCost = holding.avg_cost * holding.shares;
    const gainLoss = marketValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const dayChange = (quote?.change ?? 0) * holding.shares;
    const dayChangePercent = quote?.changePercent ?? 0;

    return {
      ...holding,
      current_price: currentPrice,
      market_value: marketValue,
      total_cost: totalCost,
      gain_loss: gainLoss,
      gain_loss_percent: gainLossPercent,
      day_change: dayChange,
      day_change_percent: dayChangePercent,
    };
  });

  // Calculate portfolio totals
  const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.market_value, 0);
  const totalCost = enrichedHoldings.reduce((sum, h) => sum + h.total_cost, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const dayChange = enrichedHoldings.reduce((sum, h) => sum + h.day_change, 0);
  const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

  return {
    portfolio: portfolioWithHoldings,
    holdings: enrichedHoldings,
    total_value: totalValue,
    total_cost: totalCost,
    total_gain_loss: totalGainLoss,
    total_gain_loss_percent: totalGainLossPercent,
    day_change: dayChange,
    day_change_percent: dayChangePercent,
  };
}
