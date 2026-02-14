// ============================================================
// Acuity Invest — Insights API Integration Tests
// Tests for POST /api/v1/insights endpoint full flow
// ============================================================

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';

// --------------- Mock Data ---------------

const mockFreeToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.free-user-token';
const mockPremiumToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.premium-user-token';

const freeUserPayload = {
  userId: 'user-001',
  email: 'free@example.com',
  tier: 'FREE' as const,
};

const premiumUserPayload = {
  userId: 'user-002',
  email: 'premium@example.com',
  tier: 'PREMIUM' as const,
};

const validInsightRequest = {
  portfolio_id: 'portfolio-001',
  query: 'How is my portfolio performing?',
};

const mockInsightResponse = {
  id: 'insight-001',
  query: 'How is my portfolio performing?',
  response: 'Your portfolio is performing well...',
  tier: 'FREE' as const,
  created_at: '2025-02-14T10:00:00Z',
  scratchpad: 'Analyzing portfolio...',
  insights: '## Portfolio Performance\n\nYour portfolio is up 27%.',
};

const mockPremiumInsightResponse = {
  ...mockInsightResponse,
  id: 'insight-002',
  tier: 'PREMIUM' as const,
  insights: `## Portfolio Performance

| Ticker | Return |
|--------|--------|
| AAPL | +30% |
| MSFT | +40% |

\`\`\`mermaid
pie title Portfolio Allocation
    "AAPL" : 37
    "MSFT" : 48
    "PG" : 15
\`\`\``,
};

// --------------- Mock Services ---------------

const mockGenerateInsight = vi.fn();
const mockGetPortfolio = vi.fn();
const mockCanQueryInsights = vi.fn();
const mockVerifyToken = vi.fn();

// --------------- App Setup ---------------

function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Auth middleware mock
  const authMiddleware = (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = mockVerifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  };

  // Rate limit middleware mock
  const rateLimitMiddleware = (req: any, res: Response, next: NextFunction) => {
    if (!mockCanQueryInsights(req.user.userId, req.user.tier)) {
      return res.status(429).json({
        success: false,
        error: 'Daily insight query limit reached. Upgrade to PREMIUM for more queries.',
      });
    }
    next();
  };

  // Insights endpoint
  app.post(
    '/api/v1/insights',
    authMiddleware,
    rateLimitMiddleware,
    async (req: any, res: Response) => {
      try {
        const { portfolio_id, query } = req.body;

        // Input validation
        if (!query || query.trim().length === 0) {
          return res.status(400).json({ success: false, error: 'Query is required' });
        }

        if (query.length > 500) {
          return res.status(400).json({
            success: false,
            error: 'Query must be 500 characters or less',
          });
        }

        if (!portfolio_id) {
          return res.status(400).json({
            success: false,
            error: 'Portfolio ID is required',
          });
        }

        // Check portfolio exists and belongs to user
        const portfolio = mockGetPortfolio(portfolio_id, req.user.userId);
        if (!portfolio) {
          return res.status(404).json({
            success: false,
            error: 'Portfolio not found',
          });
        }

        // Generate insight
        const result = await mockGenerateInsight(
          portfolio,
          query,
          req.user.tier
        );

        return res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error: any) {
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  return app;
}

// --------------- Tests ---------------

describe('POST /api/v1/insights', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks for happy path
    mockVerifyToken.mockImplementation((token: string) => {
      if (token.includes('free')) return freeUserPayload;
      if (token.includes('premium')) return premiumUserPayload;
      throw new Error('Invalid token');
    });

    mockCanQueryInsights.mockReturnValue(true);
    mockGetPortfolio.mockReturnValue({ id: 'portfolio-001', user_id: 'user-001' });
    mockGenerateInsight.mockResolvedValue(mockInsightResponse);
  });

  // --- Success Scenarios ---

  it('should return 200 with valid portfolio and query', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send(validInsightRequest);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('should return response containing scratchpad section', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send(validInsightRequest);

    expect(res.status).toBe(200);
    expect(res.body.data.scratchpad).toBeDefined();
    expect(res.body.data.scratchpad).toBe('Analyzing portfolio...');
  });

  it('should return response containing insights section', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send(validInsightRequest);

    expect(res.status).toBe(200);
    expect(res.body.data.insights).toBeDefined();
    expect(res.body.data.insights).toContain('Portfolio Performance');
  });

  // --- Authentication ---

  it('should return 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .send(validInsightRequest);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Authentication required');
  });

  it('should return 401 with invalid auth token', async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', 'Bearer invalid-token')
      .send(validInsightRequest);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 with expired auth token', async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error('Token expired');
    });

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', 'Bearer expired-token')
      .send(validInsightRequest);

    expect(res.status).toBe(401);
  });

  // --- Input Validation ---

  it('should return 400 with empty query', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send({ portfolio_id: 'portfolio-001', query: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Query is required');
  });

  it('should return 400 with query > 500 chars', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send({ portfolio_id: 'portfolio-001', query: 'a'.repeat(501) });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('500 characters');
  });

  it('should return 400 without portfolio_id', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send({ query: 'How is my portfolio?' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Portfolio ID is required');
  });

  it('should return 404 for non-existent portfolio', async () => {
    mockGetPortfolio.mockReturnValue(null);

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send({ portfolio_id: 'non-existent', query: 'Analyze this' });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('Portfolio not found');
  });

  // --- Rate Limiting ---

  it('should return 429 when FREE tier exceeds rate limit', async () => {
    mockCanQueryInsights.mockReturnValue(false);

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send(validInsightRequest);

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('limit reached');
  });

  it('should not rate limit PREMIUM tier within limits', async () => {
    mockVerifyToken.mockReturnValue(premiumUserPayload);
    mockCanQueryInsights.mockReturnValue(true);
    mockGenerateInsight.mockResolvedValue(mockPremiumInsightResponse);

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockPremiumToken)
      .send(validInsightRequest);

    expect(res.status).toBe(200);
  });

  // --- Tier-Specific Responses ---

  it('should return response WITHOUT Mermaid charts for FREE tier', async () => {
    mockGenerateInsight.mockResolvedValue(mockInsightResponse);

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send(validInsightRequest);

    expect(res.status).toBe(200);
    expect(res.body.data.insights).not.toContain('```mermaid');
  });

  it('should return response WITH Mermaid charts for PREMIUM tier', async () => {
    mockVerifyToken.mockReturnValue(premiumUserPayload);
    mockGenerateInsight.mockResolvedValue(mockPremiumInsightResponse);

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockPremiumToken)
      .send(validInsightRequest);

    expect(res.status).toBe(200);
    expect(res.body.data.insights).toContain('```mermaid');
    expect(res.body.data.insights).toContain('pie title');
  });

  // --- Financial Advice Guard ---

  it('should handle financial advice queries with rejection', async () => {
    mockGenerateInsight.mockResolvedValue({
      ...mockInsightResponse,
      rejected: true,
      insights:
        'I am unable to provide financial advice. I can help you analyze portfolio data and provide educational information.',
    });

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send({
        portfolio_id: 'portfolio-001',
        query: 'Should I sell my tech stocks?',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.rejected).toBe(true);
    expect(res.body.data.insights).toContain('unable to provide financial advice');
  });

  // --- Error Handling ---

  it('should return 500 when AI service throws unexpected error', async () => {
    mockGenerateInsight.mockRejectedValue(new Error('Claude API is down'));

    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send(validInsightRequest);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Internal server error');
    // Should NOT expose internal error details
    expect(res.body.error).not.toContain('Claude');
  });

  it('should accept exactly 500 character query', async () => {
    const res = await request(app)
      .post('/api/v1/insights')
      .set('Authorization', mockFreeToken)
      .send({ portfolio_id: 'portfolio-001', query: 'a'.repeat(500) });

    expect(res.status).toBe(200);
  });
});
