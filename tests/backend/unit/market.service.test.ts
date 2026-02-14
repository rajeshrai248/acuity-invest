// ============================================================
// Acuity Invest — Market Data Service Unit Tests
// Tests for market quote fetching, caching, and error handling
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------- Mock Data ---------------

const mockAAPLQuote = {
  ticker: 'AAPL',
  price: 195.0,
  change: 1.5,
  changePercent: 0.77,
  volume: 52_340_000,
  previousClose: 193.5,
  marketCap: 3_010_000_000_000,
  name: 'Apple Inc.',
  timestamp: Date.now(),
};

const mockMSFTQuote = {
  ticker: 'MSFT',
  price: 420.0,
  change: -0.8,
  changePercent: -0.19,
  volume: 23_150_000,
  previousClose: 420.8,
  marketCap: 3_120_000_000_000,
  name: 'Microsoft Corporation',
  timestamp: Date.now(),
};

const mockGOOGLQuote = {
  ticker: 'GOOGL',
  price: 175.5,
  change: 2.3,
  changePercent: 1.33,
  volume: 18_900_000,
  previousClose: 173.2,
  marketCap: 2_150_000_000_000,
  name: 'Alphabet Inc.',
  timestamp: Date.now(),
};

const mockPGQuote = {
  ticker: 'PG',
  price: 160.0,
  change: -0.3,
  changePercent: -0.19,
  volume: 6_500_000,
  previousClose: 160.3,
  marketCap: 380_000_000_000,
  name: 'Procter & Gamble Co.',
  timestamp: Date.now(),
};

// --------------- Mock External API ---------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

// --------------- Market Service Simulated Implementation ---------------

interface MarketQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousClose: number;
  marketCap?: number;
  name?: string;
  timestamp: number;
}

interface CachedQuote {
  quote: MarketQuote;
  cachedAt: number;
}

class MarketService {
  private cache: Map<string, CachedQuote> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

  private isValidTicker(ticker: string): boolean {
    return /^[A-Z]{1,5}$/.test(ticker);
  }

  async getQuote(ticker: string): Promise<MarketQuote> {
    if (!this.isValidTicker(ticker)) {
      throw new Error(`Invalid ticker symbol: ${ticker}`);
    }

    // Check cache
    const cached = this.cache.get(ticker);
    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL) {
      return cached.quote;
    }

    // Fetch from external API
    const response = await fetch(
      `https://api.marketdata.example.com/v1/quote/${ticker}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Ticker not found: ${ticker}`);
      }
      throw new Error(`Market data API error: ${response.status}`);
    }

    const data = await response.json();
    const quote: MarketQuote = {
      ticker: data.ticker,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      previousClose: data.previousClose,
      marketCap: data.marketCap,
      name: data.name,
      timestamp: Date.now(),
    };

    // Store in cache
    this.cache.set(ticker, { quote, cachedAt: Date.now() });

    return quote;
  }

  async getBatchQuotes(tickers: string[]): Promise<MarketQuote[]> {
    const results = await Promise.allSettled(
      tickers.map((t) => this.getQuote(t))
    );

    return results
      .filter(
        (r): r is PromiseFulfilledResult<MarketQuote> =>
          r.status === 'fulfilled'
      )
      .map((r) => r.value);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// --------------- Tests ---------------

describe('MarketService', () => {
  let marketService: MarketService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    marketService = new MarketService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // --- Fetching Quotes ---

  describe('getQuote', () => {
    it('should fetch quote for valid ticker (AAPL)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAAPLQuote),
      });

      const quote = await marketService.getQuote('AAPL');

      expect(quote).toBeDefined();
      expect(quote.ticker).toBe('AAPL');
      expect(quote.price).toBe(195.0);
      expect(quote.change).toBe(1.5);
      expect(quote.changePercent).toBe(0.77);
      expect(quote.volume).toBe(52_340_000);
      expect(quote.previousClose).toBe(193.5);
    });

    it('should return proper MarketQuote shape', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMSFTQuote),
      });

      const quote = await marketService.getQuote('MSFT');

      expect(quote).toHaveProperty('ticker');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('change');
      expect(quote).toHaveProperty('changePercent');
      expect(quote).toHaveProperty('volume');
      expect(quote).toHaveProperty('previousClose');
      expect(quote).toHaveProperty('timestamp');
      expect(typeof quote.price).toBe('number');
      expect(typeof quote.change).toBe('number');
      expect(typeof quote.changePercent).toBe('number');
    });

    it('should include marketCap and name when available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAAPLQuote),
      });

      const quote = await marketService.getQuote('AAPL');

      expect(quote.marketCap).toBe(3_010_000_000_000);
      expect(quote.name).toBe('Apple Inc.');
    });

    it('should call the correct API endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockGOOGLQuote),
      });

      await marketService.getQuote('GOOGL');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.marketdata.example.com/v1/quote/GOOGL',
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });
  });

  // --- Caching ---

  describe('Cache Behavior', () => {
    it('should return cached quote within TTL (5 min)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAAPLQuote),
      });

      // First call - fetches from API
      await marketService.getQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time by 3 minutes (within TTL)
      vi.advanceTimersByTime(3 * 60 * 1000);

      // Second call - should use cache
      const cachedQuote = await marketService.getQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional fetch
      expect(cachedQuote.ticker).toBe('AAPL');
    });

    it('should refresh cache after TTL expires', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAAPLQuote),
      });

      // First call
      await marketService.getQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time by 6 minutes (past TTL)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Update mock to return a different price
      const updatedQuote = { ...mockAAPLQuote, price: 197.0 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(updatedQuote),
      });

      // Second call - should fetch again
      const result = await marketService.getQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.price).toBe(197.0);
    });

    it('should cache different tickers independently', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAAPLQuote),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockMSFTQuote),
        });

      await marketService.getQuote('AAPL');
      await marketService.getQuote('MSFT');

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Both should be cached now
      await marketService.getQuote('AAPL');
      await marketService.getQuote('MSFT');

      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional fetches
    });

    it('should clear all cached quotes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAAPLQuote),
      });

      await marketService.getQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      marketService.clearCache();

      await marketService.getQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  // --- Error Handling ---

  describe('Error Handling', () => {
    it('should handle invalid ticker gracefully', async () => {
      await expect(marketService.getQuote('INVALID123')).rejects.toThrow(
        'Invalid ticker symbol: INVALID123'
      );
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should reject lowercase tickers', async () => {
      await expect(marketService.getQuote('aapl')).rejects.toThrow(
        'Invalid ticker symbol: aapl'
      );
    });

    it('should reject empty ticker', async () => {
      await expect(marketService.getQuote('')).rejects.toThrow(
        'Invalid ticker symbol: '
      );
    });

    it('should reject tickers with special characters', async () => {
      await expect(marketService.getQuote('AA$L')).rejects.toThrow(
        'Invalid ticker symbol: AA$L'
      );
    });

    it('should reject tickers longer than 5 characters', async () => {
      await expect(marketService.getQuote('ABCDEF')).rejects.toThrow(
        'Invalid ticker symbol: ABCDEF'
      );
    });

    it('should handle 404 (ticker not found)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(marketService.getQuote('ZZZZZ')).rejects.toThrow(
        'Ticker not found: ZZZZZ'
      );
    });

    it('should handle API server error (500)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(marketService.getQuote('AAPL')).rejects.toThrow(
        'Market data API error: 500'
      );
    });

    it('should handle API timeout', async () => {
      mockFetch.mockRejectedValue(new Error('The operation was aborted'));

      await expect(marketService.getQuote('AAPL')).rejects.toThrow(
        'The operation was aborted'
      );
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      await expect(marketService.getQuote('AAPL')).rejects.toThrow(
        'Failed to fetch'
      );
    });
  });

  // --- Batch Fetching ---

  describe('getBatchQuotes', () => {
    it('should batch fetch multiple quotes', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAAPLQuote),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockMSFTQuote),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockPGQuote),
        });

      const quotes = await marketService.getBatchQuotes([
        'AAPL',
        'MSFT',
        'PG',
      ]);

      expect(quotes).toHaveLength(3);
      expect(quotes.map((q) => q.ticker)).toEqual(['AAPL', 'MSFT', 'PG']);
    });

    it('should return partial results when some tickers fail', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAAPLQuote),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockPGQuote),
        });

      const quotes = await marketService.getBatchQuotes([
        'AAPL',
        'ZZZZZ',
        'PG',
      ]);

      expect(quotes).toHaveLength(2);
      expect(quotes.map((q) => q.ticker)).toEqual(['AAPL', 'PG']);
    });

    it('should return empty array when all tickers fail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const quotes = await marketService.getBatchQuotes([
        'AAPL',
        'MSFT',
        'PG',
      ]);

      expect(quotes).toHaveLength(0);
    });

    it('should handle empty tickers array', async () => {
      const quotes = await marketService.getBatchQuotes([]);
      expect(quotes).toHaveLength(0);
    });

    it('should use cache for batch requests', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockAAPLQuote),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockMSFTQuote),
        });

      // Pre-cache AAPL
      await marketService.getQuote('AAPL');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Batch fetch: AAPL should come from cache, MSFT should be fetched
      const quotes = await marketService.getBatchQuotes(['AAPL', 'MSFT']);
      expect(mockFetch).toHaveBeenCalledTimes(2); // Only 1 additional call for MSFT
      expect(quotes).toHaveLength(2);
    });
  });
});
