// ============================================================
// Acuity Invest — Subscription API Integration Tests
// Tests for subscription management endpoints
// ============================================================

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Response, NextFunction } from 'express';

// --------------- Mock Data ---------------

const freeUserPayload = { userId: 'user-001', email: 'free@example.com', tier: 'FREE' as const };
const premiumUserPayload = { userId: 'user-002', email: 'premium@example.com', tier: 'PREMIUM' as const };

// --------------- Mock Services ---------------

const mockVerifyToken = vi.fn();
const mockGetUserTier = vi.fn();
const mockGetFeatures = vi.fn();
const mockUpgradeTier = vi.fn();
const mockDowngradeTier = vi.fn();
const mockGetRemainingQueries = vi.fn();

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

  // GET /api/v1/subscription
  app.get('/api/v1/subscription', auth, (req: any, res: Response) => {
    const tier = mockGetUserTier(req.user.userId);
    const features = mockGetFeatures(tier);
    const remainingQueries = mockGetRemainingQueries(req.user.userId, tier);

    res.json({
      success: true,
      data: {
        tier,
        features,
        usage: { remainingQueries },
      },
    });
  });

  // GET /api/v1/subscription/tiers
  app.get('/api/v1/subscription/tiers', (req: any, res: Response) => {
    const freeFeatures = mockGetFeatures('FREE');
    const premiumFeatures = mockGetFeatures('PREMIUM');

    res.json({
      success: true,
      data: {
        FREE: { ...freeFeatures, price: 0 },
        PREMIUM: { ...premiumFeatures, price: 29.99 },
      },
    });
  });

  // POST /api/v1/subscription/upgrade
  app.post('/api/v1/subscription/upgrade', auth, (req: any, res: Response) => {
    if (req.user.tier === 'PREMIUM') {
      return res.status(400).json({ success: false, error: 'Already on PREMIUM tier' });
    }

    const upgraded = mockUpgradeTier(req.user.userId);
    if (!upgraded) {
      return res.status(500).json({ success: false, error: 'Upgrade failed' });
    }

    res.json({
      success: true,
      data: { tier: 'PREMIUM', message: 'Successfully upgraded to PREMIUM' },
    });
  });

  // POST /api/v1/subscription/downgrade
  app.post('/api/v1/subscription/downgrade', auth, (req: any, res: Response) => {
    if (req.user.tier === 'FREE') {
      return res.status(400).json({ success: false, error: 'Already on FREE tier' });
    }

    const downgraded = mockDowngradeTier(req.user.userId);
    if (!downgraded) {
      return res.status(500).json({ success: false, error: 'Downgrade failed' });
    }

    res.json({
      success: true,
      data: { tier: 'FREE', message: 'Successfully downgraded to FREE' },
    });
  });

  return app;
}

// --------------- Tests ---------------

describe('Subscription API', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyToken.mockReturnValue(freeUserPayload);
    mockGetUserTier.mockReturnValue('FREE');
    mockGetFeatures.mockImplementation((tier: string) => {
      if (tier === 'FREE') {
        return {
          maxPortfolios: 1,
          maxHoldingsPerPortfolio: 15,
          insightQueriesPerDay: 5,
          mermaidCharts: false,
          advancedAnalytics: false,
        };
      }
      return {
        maxPortfolios: 10,
        maxHoldingsPerPortfolio: 100,
        insightQueriesPerDay: 100,
        mermaidCharts: true,
        advancedAnalytics: true,
      };
    });
    mockGetRemainingQueries.mockReturnValue(5);
  });

  // --- GET /api/v1/subscription ---

  describe('GET /api/v1/subscription', () => {
    it('should return current subscription details for FREE user', async () => {
      const res = await request(app)
        .get('/api/v1/subscription')
        .set('Authorization', 'Bearer free-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tier).toBe('FREE');
      expect(res.body.data.features.mermaidCharts).toBe(false);
      expect(res.body.data.usage.remainingQueries).toBe(5);
    });

    it('should return current subscription details for PREMIUM user', async () => {
      mockVerifyToken.mockReturnValue(premiumUserPayload);
      mockGetUserTier.mockReturnValue('PREMIUM');
      mockGetRemainingQueries.mockReturnValue(95);

      const res = await request(app)
        .get('/api/v1/subscription')
        .set('Authorization', 'Bearer premium-token');

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe('PREMIUM');
      expect(res.body.data.features.mermaidCharts).toBe(true);
      expect(res.body.data.usage.remainingQueries).toBe(95);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/subscription');
      expect(res.status).toBe(401);
    });
  });

  // --- GET /api/v1/subscription/tiers ---

  describe('GET /api/v1/subscription/tiers', () => {
    it('should return comparison of all tiers (no auth required)', async () => {
      const res = await request(app).get('/api/v1/subscription/tiers');

      expect(res.status).toBe(200);
      expect(res.body.data.FREE).toBeDefined();
      expect(res.body.data.PREMIUM).toBeDefined();
      expect(res.body.data.FREE.price).toBe(0);
      expect(res.body.data.PREMIUM.price).toBe(29.99);
    });

    it('should show that PREMIUM has more features than FREE', async () => {
      const res = await request(app).get('/api/v1/subscription/tiers');

      const free = res.body.data.FREE;
      const premium = res.body.data.PREMIUM;

      expect(premium.maxPortfolios).toBeGreaterThan(free.maxPortfolios);
      expect(premium.insightQueriesPerDay).toBeGreaterThan(free.insightQueriesPerDay);
      expect(premium.mermaidCharts).toBe(true);
      expect(free.mermaidCharts).toBe(false);
    });
  });

  // --- POST /api/v1/subscription/upgrade ---

  describe('POST /api/v1/subscription/upgrade', () => {
    it('should upgrade FREE user to PREMIUM', async () => {
      mockUpgradeTier.mockReturnValue(true);

      const res = await request(app)
        .post('/api/v1/subscription/upgrade')
        .set('Authorization', 'Bearer free-token');

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe('PREMIUM');
      expect(res.body.data.message).toContain('upgraded');
    });

    it('should return 400 if already PREMIUM', async () => {
      mockVerifyToken.mockReturnValue(premiumUserPayload);

      const res = await request(app)
        .post('/api/v1/subscription/upgrade')
        .set('Authorization', 'Bearer premium-token');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Already on PREMIUM');
    });

    it('should return 500 if upgrade fails', async () => {
      mockUpgradeTier.mockReturnValue(false);

      const res = await request(app)
        .post('/api/v1/subscription/upgrade')
        .set('Authorization', 'Bearer free-token');

      expect(res.status).toBe(500);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/v1/subscription/upgrade');
      expect(res.status).toBe(401);
    });
  });

  // --- POST /api/v1/subscription/downgrade ---

  describe('POST /api/v1/subscription/downgrade', () => {
    it('should downgrade PREMIUM user to FREE', async () => {
      mockVerifyToken.mockReturnValue(premiumUserPayload);
      mockDowngradeTier.mockReturnValue(true);

      const res = await request(app)
        .post('/api/v1/subscription/downgrade')
        .set('Authorization', 'Bearer premium-token');

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe('FREE');
    });

    it('should return 400 if already FREE', async () => {
      const res = await request(app)
        .post('/api/v1/subscription/downgrade')
        .set('Authorization', 'Bearer free-token');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Already on FREE');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/v1/subscription/downgrade');
      expect(res.status).toBe(401);
    });
  });
});
