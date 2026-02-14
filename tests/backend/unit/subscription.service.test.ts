// ============================================================
// Acuity Invest — Subscription Service Unit Tests
// Tests for tier logic, feature gating, and subscription management
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------- Types ---------------

type SubscriptionTier = 'FREE' | 'PREMIUM';

interface SubscriptionFeatures {
  maxPortfolios: number;
  maxHoldingsPerPortfolio: number;
  insightQueriesPerDay: number;
  mermaidCharts: boolean;
  advancedAnalytics: boolean;
  exportReports: boolean;
  prioritySupport: boolean;
}

// --------------- Mock Database ---------------

const mockDbRun = vi.fn().mockReturnValue({ changes: 1 });
const mockDbGet = vi.fn();
const mockDbAll = vi.fn();

const mockDb = {
  prepare: vi.fn().mockReturnValue({
    run: mockDbRun,
    get: mockDbGet,
    all: mockDbAll,
  }),
};

// --------------- Subscription Service ---------------

class SubscriptionService {
  private db: any;

  private static TIER_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
    FREE: {
      maxPortfolios: 1,
      maxHoldingsPerPortfolio: 15,
      insightQueriesPerDay: 5,
      mermaidCharts: false,
      advancedAnalytics: false,
      exportReports: false,
      prioritySupport: false,
    },
    PREMIUM: {
      maxPortfolios: 10,
      maxHoldingsPerPortfolio: 100,
      insightQueriesPerDay: 100,
      mermaidCharts: true,
      advancedAnalytics: true,
      exportReports: true,
      prioritySupport: true,
    },
  };

  constructor(db: any) {
    this.db = db;
  }

  getFeatures(tier: SubscriptionTier): SubscriptionFeatures {
    return SubscriptionService.TIER_FEATURES[tier];
  }

  canCreatePortfolio(userId: string, tier: SubscriptionTier): boolean {
    const currentCount = this.db
      .prepare('SELECT COUNT(*) as count FROM portfolios WHERE user_id = ?')
      .get(userId);
    const limit = this.getFeatures(tier).maxPortfolios;
    return (currentCount?.count ?? 0) < limit;
  }

  canAddHolding(portfolioId: string, tier: SubscriptionTier): boolean {
    const currentCount = this.db
      .prepare('SELECT COUNT(*) as count FROM holdings WHERE portfolio_id = ?')
      .get(portfolioId);
    const limit = this.getFeatures(tier).maxHoldingsPerPortfolio;
    return (currentCount?.count ?? 0) < limit;
  }

  canQueryInsights(userId: string, tier: SubscriptionTier): boolean {
    const today = new Date().toISOString().split('T')[0];
    const queryCount = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM insight_logs WHERE user_id = ? AND date(created_at) = ?"
      )
      .get(userId, today);
    const limit = this.getFeatures(tier).insightQueriesPerDay;
    return (queryCount?.count ?? 0) < limit;
  }

  canAccessMermaidCharts(tier: SubscriptionTier): boolean {
    return this.getFeatures(tier).mermaidCharts;
  }

  canAccessAdvancedAnalytics(tier: SubscriptionTier): boolean {
    return this.getFeatures(tier).advancedAnalytics;
  }

  upgradeTier(userId: string): boolean {
    const result = this.db
      .prepare("UPDATE users SET subscription_tier = 'PREMIUM' WHERE id = ?")
      .run(userId);
    return result.changes > 0;
  }

  downgradeTier(userId: string): boolean {
    const result = this.db
      .prepare("UPDATE users SET subscription_tier = 'FREE' WHERE id = ?")
      .run(userId);
    return result.changes > 0;
  }

  getUserTier(userId: string): SubscriptionTier | null {
    const user = this.db
      .prepare('SELECT subscription_tier FROM users WHERE id = ?')
      .get(userId);
    return user?.subscription_tier ?? null;
  }

  getRemainingQueries(userId: string, tier: SubscriptionTier): number {
    const today = new Date().toISOString().split('T')[0];
    const queryCount = this.db
      .prepare(
        "SELECT COUNT(*) as count FROM insight_logs WHERE user_id = ? AND date(created_at) = ?"
      )
      .get(userId, today);
    const limit = this.getFeatures(tier).insightQueriesPerDay;
    const used = queryCount?.count ?? 0;
    return Math.max(0, limit - used);
  }
}

// --------------- Tests ---------------

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    vi.clearAllMocks();
    subscriptionService = new SubscriptionService(mockDb);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Tier Features ---

  describe('getFeatures', () => {
    it('should return correct FREE tier features', () => {
      const features = subscriptionService.getFeatures('FREE');

      expect(features.maxPortfolios).toBe(1);
      expect(features.maxHoldingsPerPortfolio).toBe(15);
      expect(features.insightQueriesPerDay).toBe(5);
      expect(features.mermaidCharts).toBe(false);
      expect(features.advancedAnalytics).toBe(false);
      expect(features.exportReports).toBe(false);
      expect(features.prioritySupport).toBe(false);
    });

    it('should return correct PREMIUM tier features', () => {
      const features = subscriptionService.getFeatures('PREMIUM');

      expect(features.maxPortfolios).toBe(10);
      expect(features.maxHoldingsPerPortfolio).toBe(100);
      expect(features.insightQueriesPerDay).toBe(100);
      expect(features.mermaidCharts).toBe(true);
      expect(features.advancedAnalytics).toBe(true);
      expect(features.exportReports).toBe(true);
      expect(features.prioritySupport).toBe(true);
    });

    it('should return different limits for FREE vs PREMIUM', () => {
      const freeFeatures = subscriptionService.getFeatures('FREE');
      const premiumFeatures = subscriptionService.getFeatures('PREMIUM');

      expect(premiumFeatures.maxPortfolios).toBeGreaterThan(
        freeFeatures.maxPortfolios
      );
      expect(premiumFeatures.maxHoldingsPerPortfolio).toBeGreaterThan(
        freeFeatures.maxHoldingsPerPortfolio
      );
      expect(premiumFeatures.insightQueriesPerDay).toBeGreaterThan(
        freeFeatures.insightQueriesPerDay
      );
    });
  });

  // --- Portfolio Limits ---

  describe('canCreatePortfolio', () => {
    it('should allow FREE user to create first portfolio', () => {
      mockDbGet.mockReturnValue({ count: 0 });

      const result = subscriptionService.canCreatePortfolio('user-001', 'FREE');
      expect(result).toBe(true);
    });

    it('should deny FREE user from creating second portfolio', () => {
      mockDbGet.mockReturnValue({ count: 1 });

      const result = subscriptionService.canCreatePortfolio('user-001', 'FREE');
      expect(result).toBe(false);
    });

    it('should allow PREMIUM user to create multiple portfolios', () => {
      mockDbGet.mockReturnValue({ count: 5 });

      const result = subscriptionService.canCreatePortfolio(
        'user-002',
        'PREMIUM'
      );
      expect(result).toBe(true);
    });

    it('should deny PREMIUM user at 10 portfolio limit', () => {
      mockDbGet.mockReturnValue({ count: 10 });

      const result = subscriptionService.canCreatePortfolio(
        'user-002',
        'PREMIUM'
      );
      expect(result).toBe(false);
    });
  });

  // --- Holding Limits ---

  describe('canAddHolding', () => {
    it('should allow adding holding under FREE tier limit', () => {
      mockDbGet.mockReturnValue({ count: 10 });

      const result = subscriptionService.canAddHolding(
        'portfolio-001',
        'FREE'
      );
      expect(result).toBe(true);
    });

    it('should deny adding holding at FREE tier limit (15)', () => {
      mockDbGet.mockReturnValue({ count: 15 });

      const result = subscriptionService.canAddHolding(
        'portfolio-001',
        'FREE'
      );
      expect(result).toBe(false);
    });

    it('should allow adding holding under PREMIUM tier limit', () => {
      mockDbGet.mockReturnValue({ count: 50 });

      const result = subscriptionService.canAddHolding(
        'portfolio-001',
        'PREMIUM'
      );
      expect(result).toBe(true);
    });

    it('should deny adding holding at PREMIUM tier limit (100)', () => {
      mockDbGet.mockReturnValue({ count: 100 });

      const result = subscriptionService.canAddHolding(
        'portfolio-001',
        'PREMIUM'
      );
      expect(result).toBe(false);
    });
  });

  // --- Insight Query Limits ---

  describe('canQueryInsights', () => {
    it('should allow FREE user within daily query limit', () => {
      mockDbGet.mockReturnValue({ count: 3 });

      const result = subscriptionService.canQueryInsights('user-001', 'FREE');
      expect(result).toBe(true);
    });

    it('should deny FREE user exceeding daily query limit (5)', () => {
      mockDbGet.mockReturnValue({ count: 5 });

      const result = subscriptionService.canQueryInsights('user-001', 'FREE');
      expect(result).toBe(false);
    });

    it('should allow PREMIUM user with many queries', () => {
      mockDbGet.mockReturnValue({ count: 50 });

      const result = subscriptionService.canQueryInsights(
        'user-002',
        'PREMIUM'
      );
      expect(result).toBe(true);
    });

    it('should deny PREMIUM user exceeding daily query limit (100)', () => {
      mockDbGet.mockReturnValue({ count: 100 });

      const result = subscriptionService.canQueryInsights(
        'user-002',
        'PREMIUM'
      );
      expect(result).toBe(false);
    });
  });

  // --- Feature Access ---

  describe('Feature Access Controls', () => {
    it('should deny FREE tier access to Mermaid charts', () => {
      expect(subscriptionService.canAccessMermaidCharts('FREE')).toBe(false);
    });

    it('should grant PREMIUM tier access to Mermaid charts', () => {
      expect(subscriptionService.canAccessMermaidCharts('PREMIUM')).toBe(true);
    });

    it('should deny FREE tier access to advanced analytics', () => {
      expect(subscriptionService.canAccessAdvancedAnalytics('FREE')).toBe(
        false
      );
    });

    it('should grant PREMIUM tier access to advanced analytics', () => {
      expect(subscriptionService.canAccessAdvancedAnalytics('PREMIUM')).toBe(
        true
      );
    });
  });

  // --- Tier Management ---

  describe('upgradeTier', () => {
    it('should upgrade user to PREMIUM', () => {
      mockDbRun.mockReturnValue({ changes: 1 });

      const result = subscriptionService.upgradeTier('user-001');
      expect(result).toBe(true);
    });

    it('should return false for non-existent user', () => {
      mockDbRun.mockReturnValue({ changes: 0 });

      const result = subscriptionService.upgradeTier('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('downgradeTier', () => {
    it('should downgrade user to FREE', () => {
      mockDbRun.mockReturnValue({ changes: 1 });

      const result = subscriptionService.downgradeTier('user-002');
      expect(result).toBe(true);
    });

    it('should return false for non-existent user', () => {
      mockDbRun.mockReturnValue({ changes: 0 });

      const result = subscriptionService.downgradeTier('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getUserTier', () => {
    it('should return FREE tier for free user', () => {
      mockDbGet.mockReturnValue({ subscription_tier: 'FREE' });

      const tier = subscriptionService.getUserTier('user-001');
      expect(tier).toBe('FREE');
    });

    it('should return PREMIUM tier for premium user', () => {
      mockDbGet.mockReturnValue({ subscription_tier: 'PREMIUM' });

      const tier = subscriptionService.getUserTier('user-002');
      expect(tier).toBe('PREMIUM');
    });

    it('should return null for non-existent user', () => {
      mockDbGet.mockReturnValue(undefined);

      const tier = subscriptionService.getUserTier('non-existent');
      expect(tier).toBeNull();
    });
  });

  describe('getRemainingQueries', () => {
    it('should return 5 for FREE user with no queries today', () => {
      mockDbGet.mockReturnValue({ count: 0 });

      const remaining = subscriptionService.getRemainingQueries(
        'user-001',
        'FREE'
      );
      expect(remaining).toBe(5);
    });

    it('should return 2 for FREE user with 3 queries today', () => {
      mockDbGet.mockReturnValue({ count: 3 });

      const remaining = subscriptionService.getRemainingQueries(
        'user-001',
        'FREE'
      );
      expect(remaining).toBe(2);
    });

    it('should return 0 for FREE user at limit', () => {
      mockDbGet.mockReturnValue({ count: 5 });

      const remaining = subscriptionService.getRemainingQueries(
        'user-001',
        'FREE'
      );
      expect(remaining).toBe(0);
    });

    it('should never return negative remaining', () => {
      mockDbGet.mockReturnValue({ count: 10 }); // Somehow exceeded limit

      const remaining = subscriptionService.getRemainingQueries(
        'user-001',
        'FREE'
      );
      expect(remaining).toBe(0);
    });

    it('should return high remaining for PREMIUM user', () => {
      mockDbGet.mockReturnValue({ count: 5 });

      const remaining = subscriptionService.getRemainingQueries(
        'user-002',
        'PREMIUM'
      );
      expect(remaining).toBe(95);
    });
  });
});
