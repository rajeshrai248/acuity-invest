// ============================================================
// Acuity Invest — Market Data Controller
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse, MarketQuote } from '../types';
import { getQuote, getBatchQuotes, getMarketMovers, listExchanges, MarketMovers } from '../services/market.service';

/**
 * GET /api/v1/market/quote/:ticker
 * Get a real-time quote for a single ticker.
 */
export async function getQuoteHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ticker = (req.params.ticker as string).toUpperCase().trim();
    const quote = await getQuote(ticker);

    const response: ApiResponse<MarketQuote> = {
      success: true,
      data: quote,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/market/quotes
 * Get real-time quotes for multiple tickers.
 */
export async function getBatchQuotesHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { tickers } = req.body as { tickers: string[] };
    const quotesMap = await getBatchQuotes(tickers);

    // Convert Map to array for JSON response
    const quotes = Array.from(quotesMap.values());

    const response: ApiResponse<MarketQuote[]> = {
      success: true,
      data: quotes,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/market/movers?exchange=US|BRUSSELS|AMSTERDAM|BERLIN
 * Get top gainers, losers, and most active stocks for a given exchange.
 */
export async function getMarketMoversHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const exchange = ((req.query.exchange as string) || 'US').toUpperCase() as any;
    const validExchanges = ['US', 'BRUSSELS', 'AMSTERDAM', 'BERLIN'];
    const selectedExchange = validExchanges.includes(exchange) ? exchange : 'US';

    const movers = await getMarketMovers(selectedExchange);

    const response: ApiResponse<MarketMovers> = {
      success: true,
      data: movers,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
