// ============================================================
// Acuity Invest — Portfolio Service Unit Tests
// Tests for Portfolio CRUD operations, holdings management, and calculations
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------- Mock Data ---------------

const mockUserId = 'user-001';

const mockPortfolio = {
  id: 'portfolio-001',
  user_id: mockUserId,
  name: 'Growth Portfolio',
  account_type: 'INDIVIDUAL',
  base_currency: 'USD',
  created_at: '2025-01-15T10:00:00Z',
};

const mockHoldings = [
  {
    id: 'holding-001',
    portfolio_id: 'portfolio-001',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    shares: 50,
    avg_cost: 150.0,
    purchase_date: '2024-06-01',
  },
  {
    id: 'holding-002',
    portfolio_id: 'portfolio-001',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    shares: 30,
    avg_cost: 300.0,
    purchase_date: '2024-07-15',
  },
  {
    id: 'holding-003',
    portfolio_id: 'portfolio-001',
    ticker: 'PG',
    name: 'Procter & Gamble Co.',
    shares: 25,
    avg_cost: 170.0,
    purchase_date: '2024-03-10',
  },
];

const mockMarketPrices: Record<string, number> = {
  AAPL: 195.0,
  MSFT: 420.0,
  PG: 160.0,
};

// --------------- Mock Database ---------------

const mockDbRun = vi.fn();
const mockDbGet = vi.fn();
const mockDbAll = vi.fn();
const mockDbPrepare = vi.fn().mockReturnValue({
  run: mockDbRun,
  get: mockDbGet,
  all: mockDbAll,
});

vi.mock('better-sqlite3', () => ({
  default: vi.fn().mockImplementation(() => ({
    prepare: mockDbPrepare,
    exec: vi.fn(),
    pragma: vi.fn(),
  })),
}));

// --------------- Portfolio Service Implementation ---------------

interface Portfolio {
  id: string;
  user_id: string;
  name: string;
  account_type: string;
  base_currency: string;
  created_at: string;
}

interface Holding {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  shares: number;
  avg_cost: number;
  purchase_date: string | null;
}

class PortfolioService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  createPortfolio(
    userId: string,
    name: string,
    accountType: string = 'INDIVIDUAL',
    baseCurrency: string = 'USD'
  ): Portfolio {
    if (!name || name.trim().length === 0) {
      throw new Error('Portfolio name is required');
    }

    const id = `portfolio-${Date.now()}`;
    const now = new Date().toISOString();

    this.db
      .prepare(
        'INSERT INTO portfolios (id, user_id, name, account_type, base_currency, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(id, userId, name, accountType, baseCurrency, now);

    return { id, user_id: userId, name, account_type: accountType, base_currency: baseCurrency, created_at: now };
  }

  getPortfolio(portfolioId: string, userId: string): Portfolio | null {
    return this.db
      .prepare('SELECT * FROM portfolios WHERE id = ? AND user_id = ?')
      .get(portfolioId, userId) as Portfolio | null;
  }

  getPortfoliosByUser(userId: string): Portfolio[] {
    return this.db
      .prepare('SELECT * FROM portfolios WHERE user_id = ?')
      .all(userId) as Portfolio[];
  }

  deletePortfolio(portfolioId: string, userId: string): boolean {
    // First delete all holdings
    this.db
      .prepare('DELETE FROM holdings WHERE portfolio_id = ?')
      .run(portfolioId);

    const result = this.db
      .prepare('DELETE FROM portfolios WHERE id = ? AND user_id = ?')
      .run(portfolioId, userId);

    return result.changes > 0;
  }

  addHolding(
    portfolioId: string,
    ticker: string,
    name: string,
    shares: number,
    avgCost: number,
    purchaseDate: string | null = null
  ): Holding {
    if (shares <= 0) {
      throw new Error('Shares must be greater than 0');
    }
    if (avgCost <= 0) {
      throw new Error('Average cost must be greater than 0');
    }
    if (!/^[A-Z]{1,5}$/.test(ticker)) {
      throw new Error('Invalid ticker symbol');
    }

    // Check for duplicate ticker
    const existing = this.db
      .prepare('SELECT id FROM holdings WHERE portfolio_id = ? AND ticker = ?')
      .get(portfolioId, ticker);

    if (existing) {
      throw new Error(`Ticker ${ticker} already exists in this portfolio`);
    }

    const id = `holding-${Date.now()}`;

    this.db
      .prepare(
        'INSERT INTO holdings (id, portfolio_id, ticker, name, shares, avg_cost, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(id, portfolioId, ticker, name, shares, avgCost, purchaseDate);

    return {
      id,
      portfolio_id: portfolioId,
      ticker,
      name,
      shares,
      avg_cost: avgCost,
      purchase_date: purchaseDate,
    };
  }

  updateHolding(
    holdingId: string,
    updates: { shares?: number; avg_cost?: number }
  ): boolean {
    if (updates.shares !== undefined && updates.shares <= 0) {
      throw new Error('Shares must be greater than 0');
    }
    if (updates.avg_cost !== undefined && updates.avg_cost <= 0) {
      throw new Error('Average cost must be greater than 0');
    }

    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.shares !== undefined) {
      setClauses.push('shares = ?');
      values.push(updates.shares);
    }
    if (updates.avg_cost !== undefined) {
      setClauses.push('avg_cost = ?');
      values.push(updates.avg_cost);
    }

    if (setClauses.length === 0) {
      throw new Error('No updates provided');
    }

    values.push(holdingId);

    const result = this.db
      .prepare(`UPDATE holdings SET ${setClauses.join(', ')} WHERE id = ?`)
      .run(...values);

    return result.changes > 0;
  }

  deleteHolding(holdingId: string): boolean {
    const result = this.db
      .prepare('DELETE FROM holdings WHERE id = ?')
      .run(holdingId);

    return result.changes > 0;
  }

  getHoldings(portfolioId: string): Holding[] {
    return this.db
      .prepare('SELECT * FROM holdings WHERE portfolio_id = ?')
      .all(portfolioId) as Holding[];
  }

  calculatePortfolioValue(
    holdings: Holding[],
    marketPrices: Record<string, number>
  ): number {
    return holdings.reduce((total, holding) => {
      const price = marketPrices[holding.ticker] || 0;
      return total + holding.shares * price;
    }, 0);
  }

  calculateHoldingGainLoss(
    holding: Holding,
    currentPrice: number
  ): { gain_loss: number; gain_loss_percent: number } {
    const totalCost = holding.shares * holding.avg_cost;
    const marketValue = holding.shares * currentPrice;
    const gain_loss = marketValue - totalCost;
    const gain_loss_percent =
      totalCost > 0 ? ((marketValue - totalCost) / totalCost) * 100 : 0;

    return { gain_loss, gain_loss_percent };
  }
}

// --------------- Tests ---------------

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockDb = {
      prepare: vi.fn().mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
        get: vi.fn(),
        all: vi.fn().mockReturnValue([]),
      }),
    };

    portfolioService = new PortfolioService(mockDb);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Portfolio CRUD ---

  describe('createPortfolio', () => {
    it('should create portfolio with valid data', () => {
      const result = portfolioService.createPortfolio(
        mockUserId,
        'My Portfolio',
        'INDIVIDUAL',
        'USD'
      );

      expect(result).toBeDefined();
      expect(result.user_id).toBe(mockUserId);
      expect(result.name).toBe('My Portfolio');
      expect(result.account_type).toBe('INDIVIDUAL');
      expect(result.base_currency).toBe('USD');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('should create portfolio with default account type and currency', () => {
      const result = portfolioService.createPortfolio(
        mockUserId,
        'Default Portfolio'
      );

      expect(result.account_type).toBe('INDIVIDUAL');
      expect(result.base_currency).toBe('USD');
    });

    it('should throw error for empty portfolio name', () => {
      expect(() =>
        portfolioService.createPortfolio(mockUserId, '')
      ).toThrow('Portfolio name is required');
    });

    it('should throw error for whitespace-only portfolio name', () => {
      expect(() =>
        portfolioService.createPortfolio(mockUserId, '   ')
      ).toThrow('Portfolio name is required');
    });
  });

  describe('getPortfolio', () => {
    it('should return portfolio for valid id and user', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockPortfolio),
        run: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.getPortfolio('portfolio-001', mockUserId);

      expect(result).toEqual(mockPortfolio);
    });

    it('should return null for non-existent portfolio', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(null),
        run: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.getPortfolio('non-existent', mockUserId);

      expect(result).toBeNull();
    });

    it('should return null when portfolio belongs to different user', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(null),
        run: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.getPortfolio(
        'portfolio-001',
        'other-user'
      );

      expect(result).toBeNull();
    });
  });

  describe('getPortfoliosByUser', () => {
    it('should return all portfolios for user', () => {
      const userPortfolios = [
        mockPortfolio,
        { ...mockPortfolio, id: 'portfolio-002', name: 'Retirement' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(userPortfolios),
        get: vi.fn(),
        run: vi.fn(),
      });

      const result = portfolioService.getPortfoliosByUser(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Growth Portfolio');
      expect(result[1].name).toBe('Retirement');
    });

    it('should return empty array for user with no portfolios', () => {
      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
        get: vi.fn(),
        run: vi.fn(),
      });

      const result = portfolioService.getPortfoliosByUser('new-user');

      expect(result).toHaveLength(0);
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio and cascade delete holdings', () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 1 });
      mockDb.prepare.mockReturnValue({
        run: mockRun,
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.deletePortfolio(
        'portfolio-001',
        mockUserId
      );

      expect(result).toBe(true);
      // Verify both DELETE calls were made (holdings + portfolio)
      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
    });

    it('should return false when portfolio not found', () => {
      const mockRun = vi.fn().mockReturnValue({ changes: 0 });
      mockDb.prepare.mockReturnValue({
        run: mockRun,
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.deletePortfolio(
        'non-existent',
        mockUserId
      );

      expect(result).toBe(false);
    });
  });

  // --- Holdings CRUD ---

  describe('addHolding', () => {
    it('should add holding to portfolio with valid data', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(null), // No duplicate
        run: vi.fn().mockReturnValue({ changes: 1 }),
        all: vi.fn(),
      });

      const result = portfolioService.addHolding(
        'portfolio-001',
        'AAPL',
        'Apple Inc.',
        50,
        150.0,
        '2024-06-01'
      );

      expect(result).toBeDefined();
      expect(result.ticker).toBe('AAPL');
      expect(result.name).toBe('Apple Inc.');
      expect(result.shares).toBe(50);
      expect(result.avg_cost).toBe(150.0);
    });

    it('should prevent duplicate ticker in same portfolio', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ id: 'existing-holding' }), // Duplicate found
        run: vi.fn(),
        all: vi.fn(),
      });

      expect(() =>
        portfolioService.addHolding(
          'portfolio-001',
          'AAPL',
          'Apple Inc.',
          50,
          150.0
        )
      ).toThrow('Ticker AAPL already exists in this portfolio');
    });

    it('should throw error for shares <= 0', () => {
      expect(() =>
        portfolioService.addHolding(
          'portfolio-001',
          'AAPL',
          'Apple Inc.',
          0,
          150.0
        )
      ).toThrow('Shares must be greater than 0');
    });

    it('should throw error for negative shares', () => {
      expect(() =>
        portfolioService.addHolding(
          'portfolio-001',
          'AAPL',
          'Apple Inc.',
          -10,
          150.0
        )
      ).toThrow('Shares must be greater than 0');
    });

    it('should throw error for avg_cost <= 0', () => {
      expect(() =>
        portfolioService.addHolding(
          'portfolio-001',
          'AAPL',
          'Apple Inc.',
          50,
          0
        )
      ).toThrow('Average cost must be greater than 0');
    });

    it('should throw error for negative avg_cost', () => {
      expect(() =>
        portfolioService.addHolding(
          'portfolio-001',
          'AAPL',
          'Apple Inc.',
          50,
          -100
        )
      ).toThrow('Average cost must be greater than 0');
    });

    it('should throw error for invalid ticker symbol', () => {
      expect(() =>
        portfolioService.addHolding(
          'portfolio-001',
          'invalid',
          'Bad Ticker',
          10,
          50
        )
      ).toThrow('Invalid ticker symbol');
    });

    it('should allow holding without purchase date', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(null),
        run: vi.fn().mockReturnValue({ changes: 1 }),
        all: vi.fn(),
      });

      const result = portfolioService.addHolding(
        'portfolio-001',
        'TSLA',
        'Tesla Inc.',
        10,
        250.0
      );

      expect(result.purchase_date).toBeNull();
    });
  });

  describe('updateHolding', () => {
    it('should update holding shares', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.updateHolding('holding-001', {
        shares: 100,
      });

      expect(result).toBe(true);
    });

    it('should update holding avg_cost', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.updateHolding('holding-001', {
        avg_cost: 175.0,
      });

      expect(result).toBe(true);
    });

    it('should update both shares and avg_cost', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.updateHolding('holding-001', {
        shares: 100,
        avg_cost: 175.0,
      });

      expect(result).toBe(true);
    });

    it('should throw error when shares is 0', () => {
      expect(() =>
        portfolioService.updateHolding('holding-001', { shares: 0 })
      ).toThrow('Shares must be greater than 0');
    });

    it('should throw error when avg_cost is negative', () => {
      expect(() =>
        portfolioService.updateHolding('holding-001', { avg_cost: -50 })
      ).toThrow('Average cost must be greater than 0');
    });

    it('should throw error when no updates provided', () => {
      expect(() =>
        portfolioService.updateHolding('holding-001', {})
      ).toThrow('No updates provided');
    });

    it('should return false when holding not found', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 0 }),
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.updateHolding('non-existent', {
        shares: 100,
      });

      expect(result).toBe(false);
    });
  });

  describe('deleteHolding', () => {
    it('should delete holding successfully', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 1 }),
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.deleteHolding('holding-001');
      expect(result).toBe(true);
    });

    it('should return false when holding not found', () => {
      mockDb.prepare.mockReturnValue({
        run: vi.fn().mockReturnValue({ changes: 0 }),
        get: vi.fn(),
        all: vi.fn(),
      });

      const result = portfolioService.deleteHolding('non-existent');
      expect(result).toBe(false);
    });
  });

  // --- Portfolio Calculations ---

  describe('calculatePortfolioValue', () => {
    it('should calculate total portfolio value correctly', () => {
      const value = portfolioService.calculatePortfolioValue(
        mockHoldings,
        mockMarketPrices
      );

      // AAPL: 50 * 195 = 9750
      // MSFT: 30 * 420 = 12600
      // PG: 25 * 160 = 4000
      // Total: 26350
      expect(value).toBe(26350.0);
    });

    it('should handle empty holdings', () => {
      const value = portfolioService.calculatePortfolioValue([], mockMarketPrices);
      expect(value).toBe(0);
    });

    it('should handle missing market price (treat as 0)', () => {
      const holdingsWithUnknown = [
        ...mockHoldings,
        {
          id: 'holding-004',
          portfolio_id: 'portfolio-001',
          ticker: 'UNKNOWN',
          name: 'Unknown Corp.',
          shares: 100,
          avg_cost: 50.0,
          purchase_date: null,
        },
      ];

      const value = portfolioService.calculatePortfolioValue(
        holdingsWithUnknown,
        mockMarketPrices
      );

      // Same as before since UNKNOWN has no market price
      expect(value).toBe(26350.0);
    });
  });

  describe('calculateHoldingGainLoss', () => {
    it('should calculate positive gain/loss for AAPL', () => {
      const result = portfolioService.calculateHoldingGainLoss(
        mockHoldings[0], // AAPL: 50 shares @ $150
        195.0
      );

      // Total Cost: 50 * 150 = 7500
      // Market Value: 50 * 195 = 9750
      // Gain/Loss: 2250
      // Gain/Loss %: 30%
      expect(result.gain_loss).toBe(2250.0);
      expect(result.gain_loss_percent).toBeCloseTo(30.0, 1);
    });

    it('should calculate negative gain/loss for PG', () => {
      const result = portfolioService.calculateHoldingGainLoss(
        mockHoldings[2], // PG: 25 shares @ $170
        160.0
      );

      // Total Cost: 25 * 170 = 4250
      // Market Value: 25 * 160 = 4000
      // Gain/Loss: -250
      // Gain/Loss %: -5.88%
      expect(result.gain_loss).toBe(-250.0);
      expect(result.gain_loss_percent).toBeCloseTo(-5.88, 1);
    });

    it('should handle zero cost basis', () => {
      const holding = { ...mockHoldings[0], avg_cost: 0 };
      // Override validation for this test scenario
      const result = portfolioService.calculateHoldingGainLoss(holding, 195.0);

      expect(result.gain_loss_percent).toBe(0);
    });

    it('should handle zero current price', () => {
      const result = portfolioService.calculateHoldingGainLoss(
        mockHoldings[0],
        0
      );

      expect(result.gain_loss).toBe(-7500.0); // Lost entire investment
      expect(result.gain_loss_percent).toBe(-100.0);
    });

    it('should handle breakeven scenario', () => {
      const result = portfolioService.calculateHoldingGainLoss(
        mockHoldings[0], // AAPL: 50 shares @ $150
        150.0
      );

      expect(result.gain_loss).toBe(0);
      expect(result.gain_loss_percent).toBe(0);
    });
  });
});
