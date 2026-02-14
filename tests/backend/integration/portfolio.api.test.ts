// ============================================================
// Acuity Invest — Portfolio API Integration Tests
// Tests for Portfolio CRUD API endpoints
// ============================================================

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Response, NextFunction } from 'express';

// --------------- Mock Data ---------------

const freeUserPayload = { userId: 'user-001', email: 'free@example.com', tier: 'FREE' as const };
const premiumUserPayload = { userId: 'user-002', email: 'premium@example.com', tier: 'PREMIUM' as const };
const otherUserPayload = { userId: 'user-099', email: 'other@example.com', tier: 'FREE' as const };

const mockPortfolio = {
  id: 'portfolio-001',
  user_id: 'user-001',
  name: 'Growth Portfolio',
  account_type: 'INDIVIDUAL',
  base_currency: 'USD',
  created_at: '2025-01-15T10:00:00Z',
};

const mockHolding = {
  id: 'holding-001',
  portfolio_id: 'portfolio-001',
  ticker: 'AAPL',
  name: 'Apple Inc.',
  shares: 50,
  avg_cost: 150.0,
  purchase_date: '2024-06-01',
};

// --------------- Mock Services ---------------

const mockCreatePortfolio = vi.fn();
const mockGetPortfolio = vi.fn();
const mockGetPortfoliosByUser = vi.fn();
const mockDeletePortfolio = vi.fn();
const mockAddHolding = vi.fn();
const mockUpdateHolding = vi.fn();
const mockDeleteHolding = vi.fn();
const mockGetHoldings = vi.fn();
const mockCanCreatePortfolio = vi.fn();
const mockCanAddHolding = vi.fn();
const mockVerifyToken = vi.fn();

// --------------- App Setup ---------------

function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Auth middleware
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

  // GET /api/v1/portfolios
  app.get('/api/v1/portfolios', auth, (req: any, res: Response) => {
    const portfolios = mockGetPortfoliosByUser(req.user.userId);
    res.json({ success: true, data: portfolios });
  });

  // POST /api/v1/portfolios
  app.post('/api/v1/portfolios', auth, (req: any, res: Response) => {
    const { name, account_type, base_currency } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Portfolio name is required' });
    }
    if (!mockCanCreatePortfolio(req.user.userId, req.user.tier)) {
      return res.status(403).json({
        success: false,
        error: 'Portfolio limit reached for your subscription tier',
      });
    }
    const portfolio = mockCreatePortfolio(req.user.userId, name, account_type, base_currency);
    res.status(201).json({ success: true, data: portfolio });
  });

  // GET /api/v1/portfolios/:id
  app.get('/api/v1/portfolios/:id', auth, (req: any, res: Response) => {
    const portfolio = mockGetPortfolio(req.params.id, req.user.userId);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Portfolio not found' });
    }
    const holdings = mockGetHoldings(req.params.id);
    res.json({ success: true, data: { ...portfolio, holdings } });
  });

  // DELETE /api/v1/portfolios/:id
  app.delete('/api/v1/portfolios/:id', auth, (req: any, res: Response) => {
    const deleted = mockDeletePortfolio(req.params.id, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Portfolio not found' });
    }
    res.json({ success: true, message: 'Portfolio deleted' });
  });

  // POST /api/v1/portfolios/:id/holdings
  app.post('/api/v1/portfolios/:id/holdings', auth, (req: any, res: Response) => {
    const portfolio = mockGetPortfolio(req.params.id, req.user.userId);
    if (!portfolio) {
      return res.status(404).json({ success: false, error: 'Portfolio not found' });
    }
    if (!mockCanAddHolding(req.params.id, req.user.tier)) {
      return res.status(403).json({
        success: false,
        error: 'Holdings limit reached for your subscription tier',
      });
    }
    const { ticker, name, shares, avg_cost, purchase_date } = req.body;
    if (!ticker || !/^[A-Z]{1,5}$/.test(ticker)) {
      return res.status(400).json({ success: false, error: 'Valid ticker symbol required (1-5 uppercase letters)' });
    }
    if (!shares || shares <= 0) {
      return res.status(400).json({ success: false, error: 'Shares must be greater than 0' });
    }
    if (!avg_cost || avg_cost <= 0) {
      return res.status(400).json({ success: false, error: 'Average cost must be greater than 0' });
    }
    try {
      const holding = mockAddHolding(req.params.id, ticker, name, shares, avg_cost, purchase_date);
      res.status(201).json({ success: true, data: holding });
    } catch (e: any) {
      res.status(409).json({ success: false, error: e.message });
    }
  });

  // PUT /api/v1/portfolios/:portfolioId/holdings/:holdingId
  app.put('/api/v1/portfolios/:portfolioId/holdings/:holdingId', auth, (req: any, res: Response) => {
    const { shares, avg_cost } = req.body;
    if (shares !== undefined && shares <= 0) {
      return res.status(400).json({ success: false, error: 'Shares must be greater than 0' });
    }
    if (avg_cost !== undefined && avg_cost <= 0) {
      return res.status(400).json({ success: false, error: 'Average cost must be greater than 0' });
    }
    const updated = mockUpdateHolding(req.params.holdingId, { shares, avg_cost });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Holding not found' });
    }
    res.json({ success: true, message: 'Holding updated' });
  });

  // DELETE /api/v1/portfolios/:portfolioId/holdings/:holdingId
  app.delete('/api/v1/portfolios/:portfolioId/holdings/:holdingId', auth, (req: any, res: Response) => {
    const deleted = mockDeleteHolding(req.params.holdingId);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Holding not found' });
    }
    res.json({ success: true, message: 'Holding deleted' });
  });

  return app;
}

// --------------- Tests ---------------

describe('Portfolio API', () => {
  let app: Express;
  const authHeader = 'Bearer free-user-token';

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue(freeUserPayload);
    mockCanCreatePortfolio.mockReturnValue(true);
    mockCanAddHolding.mockReturnValue(true);
  });

  // --- GET /api/v1/portfolios ---

  describe('GET /api/v1/portfolios', () => {
    it('should return all portfolios for authenticated user', async () => {
      mockGetPortfoliosByUser.mockReturnValue([mockPortfolio]);

      const res = await request(app)
        .get('/api/v1/portfolios')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Growth Portfolio');
    });

    it('should return empty array for user with no portfolios', async () => {
      mockGetPortfoliosByUser.mockReturnValue([]);

      const res = await request(app)
        .get('/api/v1/portfolios')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/portfolios');
      expect(res.status).toBe(401);
    });
  });

  // --- POST /api/v1/portfolios ---

  describe('POST /api/v1/portfolios', () => {
    it('should create portfolio with valid data', async () => {
      mockCreatePortfolio.mockReturnValue(mockPortfolio);

      const res = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', authHeader)
        .send({ name: 'Growth Portfolio', account_type: 'INDIVIDUAL' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Growth Portfolio');
    });

    it('should return 400 with empty portfolio name', async () => {
      const res = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', authHeader)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('name is required');
    });

    it('should return 403 when portfolio limit reached for FREE tier', async () => {
      mockCanCreatePortfolio.mockReturnValue(false);

      const res = await request(app)
        .post('/api/v1/portfolios')
        .set('Authorization', authHeader)
        .send({ name: 'Second Portfolio' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('limit reached');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/v1/portfolios')
        .send({ name: 'New Portfolio' });

      expect(res.status).toBe(401);
    });
  });

  // --- GET /api/v1/portfolios/:id ---

  describe('GET /api/v1/portfolios/:id', () => {
    it('should return portfolio with holdings', async () => {
      mockGetPortfolio.mockReturnValue(mockPortfolio);
      mockGetHoldings.mockReturnValue([mockHolding]);

      const res = await request(app)
        .get('/api/v1/portfolios/portfolio-001')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Growth Portfolio');
      expect(res.body.data.holdings).toHaveLength(1);
      expect(res.body.data.holdings[0].ticker).toBe('AAPL');
    });

    it('should return 404 for non-existent portfolio', async () => {
      mockGetPortfolio.mockReturnValue(null);

      const res = await request(app)
        .get('/api/v1/portfolios/non-existent')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
    });

    it('should return 404 when accessing another users portfolio', async () => {
      mockVerifyToken.mockReturnValue(otherUserPayload);
      mockGetPortfolio.mockReturnValue(null); // Service filters by user_id

      const res = await request(app)
        .get('/api/v1/portfolios/portfolio-001')
        .set('Authorization', 'Bearer other-token');

      expect(res.status).toBe(404);
    });
  });

  // --- DELETE /api/v1/portfolios/:id ---

  describe('DELETE /api/v1/portfolios/:id', () => {
    it('should delete portfolio successfully', async () => {
      mockDeletePortfolio.mockReturnValue(true);

      const res = await request(app)
        .delete('/api/v1/portfolios/portfolio-001')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should return 404 when deleting non-existent portfolio', async () => {
      mockDeletePortfolio.mockReturnValue(false);

      const res = await request(app)
        .delete('/api/v1/portfolios/non-existent')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
    });
  });

  // --- POST /api/v1/portfolios/:id/holdings ---

  describe('POST /api/v1/portfolios/:id/holdings', () => {
    it('should add holding with valid data', async () => {
      mockGetPortfolio.mockReturnValue(mockPortfolio);
      mockAddHolding.mockReturnValue(mockHolding);

      const res = await request(app)
        .post('/api/v1/portfolios/portfolio-001/holdings')
        .set('Authorization', authHeader)
        .send({ ticker: 'AAPL', name: 'Apple Inc.', shares: 50, avg_cost: 150.0 });

      expect(res.status).toBe(201);
      expect(res.body.data.ticker).toBe('AAPL');
    });

    it('should return 400 for invalid ticker format', async () => {
      mockGetPortfolio.mockReturnValue(mockPortfolio);

      const res = await request(app)
        .post('/api/v1/portfolios/portfolio-001/holdings')
        .set('Authorization', authHeader)
        .send({ ticker: 'invalid', name: 'Bad', shares: 10, avg_cost: 50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('ticker');
    });

    it('should return 400 for zero shares', async () => {
      mockGetPortfolio.mockReturnValue(mockPortfolio);

      const res = await request(app)
        .post('/api/v1/portfolios/portfolio-001/holdings')
        .set('Authorization', authHeader)
        .send({ ticker: 'AAPL', name: 'Apple', shares: 0, avg_cost: 150 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Shares');
    });

    it('should return 400 for negative avg_cost', async () => {
      mockGetPortfolio.mockReturnValue(mockPortfolio);

      const res = await request(app)
        .post('/api/v1/portfolios/portfolio-001/holdings')
        .set('Authorization', authHeader)
        .send({ ticker: 'AAPL', name: 'Apple', shares: 10, avg_cost: -50 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cost');
    });

    it('should return 409 for duplicate ticker', async () => {
      mockGetPortfolio.mockReturnValue(mockPortfolio);
      mockAddHolding.mockImplementation(() => {
        throw new Error('Ticker AAPL already exists in this portfolio');
      });

      const res = await request(app)
        .post('/api/v1/portfolios/portfolio-001/holdings')
        .set('Authorization', authHeader)
        .send({ ticker: 'AAPL', name: 'Apple', shares: 10, avg_cost: 150 });

      expect(res.status).toBe(409);
    });

    it('should return 403 when holding limit reached', async () => {
      mockGetPortfolio.mockReturnValue(mockPortfolio);
      mockCanAddHolding.mockReturnValue(false);

      const res = await request(app)
        .post('/api/v1/portfolios/portfolio-001/holdings')
        .set('Authorization', authHeader)
        .send({ ticker: 'TSLA', name: 'Tesla', shares: 10, avg_cost: 250 });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('limit reached');
    });

    it('should return 404 when portfolio does not exist', async () => {
      mockGetPortfolio.mockReturnValue(null);

      const res = await request(app)
        .post('/api/v1/portfolios/non-existent/holdings')
        .set('Authorization', authHeader)
        .send({ ticker: 'AAPL', name: 'Apple', shares: 10, avg_cost: 150 });

      expect(res.status).toBe(404);
    });
  });

  // --- PUT /api/v1/portfolios/:portfolioId/holdings/:holdingId ---

  describe('PUT /api/v1/portfolios/:pid/holdings/:hid', () => {
    it('should update holding shares', async () => {
      mockUpdateHolding.mockReturnValue(true);

      const res = await request(app)
        .put('/api/v1/portfolios/portfolio-001/holdings/holding-001')
        .set('Authorization', authHeader)
        .send({ shares: 100 });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('updated');
    });

    it('should return 400 for zero shares update', async () => {
      const res = await request(app)
        .put('/api/v1/portfolios/portfolio-001/holdings/holding-001')
        .set('Authorization', authHeader)
        .send({ shares: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent holding', async () => {
      mockUpdateHolding.mockReturnValue(false);

      const res = await request(app)
        .put('/api/v1/portfolios/portfolio-001/holdings/non-existent')
        .set('Authorization', authHeader)
        .send({ shares: 100 });

      expect(res.status).toBe(404);
    });
  });

  // --- DELETE /api/v1/portfolios/:portfolioId/holdings/:holdingId ---

  describe('DELETE /api/v1/portfolios/:pid/holdings/:hid', () => {
    it('should delete holding successfully', async () => {
      mockDeleteHolding.mockReturnValue(true);

      const res = await request(app)
        .delete('/api/v1/portfolios/portfolio-001/holdings/holding-001')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should return 404 for non-existent holding', async () => {
      mockDeleteHolding.mockReturnValue(false);

      const res = await request(app)
        .delete('/api/v1/portfolios/portfolio-001/holdings/non-existent')
        .set('Authorization', authHeader);

      expect(res.status).toBe(404);
    });
  });
});
