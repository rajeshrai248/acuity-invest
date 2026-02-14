// ============================================================
// Acuity Invest — Market Data API Integration Tests
// Tests for market data endpoints
// ============================================================

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Response, NextFunction } from 'express';

// --------------- Mock Data ---------------

const userPayload = { userId: 'user-001', email: 'user@example.com', tier: 'FREE' as const };

const mockQuotes = {
  AAPL: { ticker: 'AAPL', price: 195.0, change: 1.5, changePercent: 0.77, volume: 52340000, previousClose: 193.5, name: 'Apple Inc.', timestamp: Date.now() },
  MSFT: { ticker: 'MSFT', price: 420.0, change: -0.8, changePercent: -0.19, volume: 23150000, previousClose: 420.8, name: 'Microsoft Corporation', timestamp: Date.now() },
  GOOGL: { ticker: 'GOOGL', price: 175.5, change: 2.3, changePercent: 1.33, volume: 18900000, previousClose: 173.2, name: 'Alphabet Inc.', timestamp: Date.now() },
};

// --------------- Mock Services ---------------

const mockGetQuote = vi.fn();
const mockGetBatchQuotes = vi.fn();
const mockVerifyToken = vi.fn();

// --------------- App Setup ---------------

function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  const auth = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    try {
      req.user = mockVerifyToken(authHeader.split(' ')[1]);
      next();
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  };

  // GET /api/v1/market/quote/:ticker
  app.get('/api/v1/market/quote/:ticker', auth, async (req: any, res: Response) => {
    const { ticker } = req.params;

    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      return res.status(400).json({ success: false, error: 'Invalid ticker symbol. Must be 1-5 uppercase letters.' });
    }

    try {
      const quote = await mockGetQuote(ticker);
      res.json({ success: true, data: quote });
    } catch (e: any) {
      if (e.message.includes('not found')) {
        return res.status(404).json({ success: false, error: `Ticker ${ticker} not found` });
      }
      return res.status(502).json({ success: false, error: 'Market data service unavailable' });
    }
  });

  // POST /api/v1/market/quotes
  app.post('/api/v1/market/quotes', auth, async (req: any, res: Response) => {
    const { tickers } = req.body;

    if (!Array.isArray(tickers) || tickers.length === 0) {
      return res.status(400).json({ success: false, error: 'Tickers array is required' });
    }

    if (tickers.length > 20) {
      return res.status(400).json({ success: false, error: 'Maximum 20 tickers per request' });
    }

    const invalidTickers = tickers.filter((t: string) => !/^[A-Z]{1,5}$/.test(t));
    if (invalidTickers.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid ticker symbols: ${invalidTickers.join(', ')}`,
      });
    }

    try {
      const quotes = await mockGetBatchQuotes(tickers);
      res.json({ success: true, data: quotes });
    } catch (e: any) {
      return res.status(502).json({ success: false, error: 'Market data service unavailable' });
    }
  });

  return app;
}

// --------------- Tests ---------------

describe('Market Data API', () => {
  let app: Express;
  const authHeader = 'Bearer valid-token';

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue(userPayload);
  });

  // --- GET /api/v1/market/quote/:ticker ---

  describe('GET /api/v1/market/quote/:ticker', () => {
    it('should return quote for valid ticker', async () => {
      mockGetQuote.mockResolvedValue(mockQuotes.AAPL);

      const res = await request(app)
        .get('/api/v1/market/quote/AAPL')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticker).toBe('AAPL');
      expect(res.body.data.price).toBe(195.0);
      expect(res.body.data.change).toBe(1.5);
      expect(res.body.data.changePercent).toBe(0.77);
    });

    it('should return 400 for invalid ticker format (lowercase)', async () => {
      const res = await request(app)
        .get('/api/v1/market/quote/aapl')
        .set('Authorization', authHeader);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid ticker');
    });

    it('should return 400 for ticker with numbers', async () => {
      const res = await request(app)
        .get('/api/v1/market/quote/AAP1')
        .set('Authorization', authHeader);

      expect(res.status).toBe(400);
    });

    it('should return 400 for ticker longer than 5 chars', async () => {
      const res = await request(app)
        .get('/api/v1/market/quote/ABCDEF')
        .set('Authorization', authHeader);

      expect(res.status).toBe(400);
    });

    it('should return 404 for unknown ticker', async () => {
      mockGetQuote.mockRejectedValue(new Error('Ticker not found: ZZZZZ'));

      const res = await request(app)
        .get('/api/v1/market/quote/ZZZZZ')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return 502 when market data service is down', async () => {
      mockGetQuote.mockRejectedValue(new Error('Service unavailable'));

      const res = await request(app)
        .get('/api/v1/market/quote/AAPL')
        .set('Authorization', authHeader);

      expect(res.status).toBe(502);
      expect(res.body.error).toContain('unavailable');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/v1/market/quote/AAPL');

      expect(res.status).toBe(401);
    });
  });

  // --- POST /api/v1/market/quotes (batch) ---

  describe('POST /api/v1/market/quotes', () => {
    it('should return quotes for multiple valid tickers', async () => {
      mockGetBatchQuotes.mockResolvedValue([mockQuotes.AAPL, mockQuotes.MSFT, mockQuotes.GOOGL]);

      const res = await request(app)
        .post('/api/v1/market/quotes')
        .set('Authorization', authHeader)
        .send({ tickers: ['AAPL', 'MSFT', 'GOOGL'] });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });

    it('should return 400 for empty tickers array', async () => {
      const res = await request(app)
        .post('/api/v1/market/quotes')
        .set('Authorization', authHeader)
        .send({ tickers: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should return 400 for missing tickers field', async () => {
      const res = await request(app)
        .post('/api/v1/market/quotes')
        .set('Authorization', authHeader)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 when exceeding 20 ticker limit', async () => {
      const tickers = Array.from({ length: 21 }, (_, i) => `T${String(i).padStart(2, '0')}`.substring(0, 4).toUpperCase());

      const res = await request(app)
        .post('/api/v1/market/quotes')
        .set('Authorization', authHeader)
        .send({ tickers });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Maximum 20');
    });

    it('should return 400 if any ticker is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/market/quotes')
        .set('Authorization', authHeader)
        .send({ tickers: ['AAPL', 'invalid', 'MSFT'] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('invalid');
    });

    it('should return 502 when market data service fails', async () => {
      mockGetBatchQuotes.mockRejectedValue(new Error('Connection timeout'));

      const res = await request(app)
        .post('/api/v1/market/quotes')
        .set('Authorization', authHeader)
        .send({ tickers: ['AAPL'] });

      expect(res.status).toBe(502);
    });
  });
});
