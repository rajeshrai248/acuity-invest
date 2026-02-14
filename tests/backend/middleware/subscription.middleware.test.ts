// ============================================================
// Acuity Invest — Subscription Middleware Tests
// Tests for tier-gating middleware that restricts access based on subscription
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --------------- Middleware Implementation ---------------

type SubscriptionTier = 'FREE' | 'PREMIUM';

function requireTier(requiredTier: SubscriptionTier) {
  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userTier = req.user.tier;

    if (requiredTier === 'PREMIUM' && userTier !== 'PREMIUM') {
      return res.status(403).json({
        success: false,
        error: 'This feature requires a PREMIUM subscription',
        upgrade_url: '/subscription/upgrade',
      });
    }

    next();
  };
}

function requireFeature(feature: string) {
  const featureMap: Record<string, SubscriptionTier> = {
    mermaid_charts: 'PREMIUM',
    advanced_analytics: 'PREMIUM',
    export_reports: 'PREMIUM',
    priority_support: 'PREMIUM',
    basic_insights: 'FREE',
    portfolio_view: 'FREE',
  };

  return (req: any, res: any, next: any) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const requiredTier = featureMap[feature];
    if (!requiredTier) {
      return res.status(400).json({ success: false, error: `Unknown feature: ${feature}` });
    }

    const tierHierarchy: Record<SubscriptionTier, number> = { FREE: 0, PREMIUM: 1 };
    const userLevel = tierHierarchy[req.user.tier as SubscriptionTier] ?? -1;
    const requiredLevel = tierHierarchy[requiredTier];

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: `The "${feature}" feature requires a ${requiredTier} subscription`,
        required_tier: requiredTier,
        current_tier: req.user.tier,
      });
    }

    next();
  };
}

// --------------- Test Helpers ---------------

function createMockReq(tier?: SubscriptionTier): any {
  if (!tier) return { user: undefined };
  return { user: { userId: 'user-001', email: 'test@example.com', tier } };
}

function createMockRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// --------------- Tests ---------------

describe('Subscription Middleware', () => {
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNext = vi.fn();
  });

  // --- requireTier ---

  describe('requireTier', () => {
    describe('requireTier("PREMIUM")', () => {
      const premiumGate = requireTier('PREMIUM');

      it('should allow PREMIUM users to access premium features', () => {
        const req = createMockReq('PREMIUM');
        const res = createMockRes();

        premiumGate(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it('should deny FREE users access to premium features', () => {
        const req = createMockReq('FREE');
        const res = createMockRes();

        premiumGate(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('PREMIUM subscription'),
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should include upgrade URL in denial response', () => {
        const req = createMockReq('FREE');
        const res = createMockRes();

        premiumGate(req, res, mockNext);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            upgrade_url: '/subscription/upgrade',
          })
        );
      });

      it('should return 401 for unauthenticated users', () => {
        const req = createMockReq();
        const res = createMockRes();

        premiumGate(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('requireTier("FREE")', () => {
      const freeGate = requireTier('FREE');

      it('should allow FREE users access', () => {
        const req = createMockReq('FREE');
        const res = createMockRes();

        freeGate(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should allow PREMIUM users access to free-tier features', () => {
        const req = createMockReq('PREMIUM');
        const res = createMockRes();

        freeGate(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  // --- requireFeature ---

  describe('requireFeature', () => {
    describe('Premium Features', () => {
      it('should allow PREMIUM users to access mermaid_charts', () => {
        const middleware = requireFeature('mermaid_charts');
        const req = createMockReq('PREMIUM');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should deny FREE users access to mermaid_charts', () => {
        const middleware = requireFeature('mermaid_charts');
        const req = createMockReq('FREE');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            required_tier: 'PREMIUM',
            current_tier: 'FREE',
          })
        );
      });

      it('should deny FREE users access to advanced_analytics', () => {
        const middleware = requireFeature('advanced_analytics');
        const req = createMockReq('FREE');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('should deny FREE users access to export_reports', () => {
        const middleware = requireFeature('export_reports');
        const req = createMockReq('FREE');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
      });

      it('should allow PREMIUM users access to all premium features', () => {
        const premiumFeatures = ['mermaid_charts', 'advanced_analytics', 'export_reports', 'priority_support'];

        for (const feature of premiumFeatures) {
          const middleware = requireFeature(feature);
          const req = createMockReq('PREMIUM');
          const res = createMockRes();
          const next = vi.fn();

          middleware(req, res, next);
          expect(next).toHaveBeenCalled();
        }
      });
    });

    describe('Free Features', () => {
      it('should allow FREE users access to basic_insights', () => {
        const middleware = requireFeature('basic_insights');
        const req = createMockReq('FREE');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should allow FREE users access to portfolio_view', () => {
        const middleware = requireFeature('portfolio_view');
        const req = createMockReq('FREE');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should allow PREMIUM users access to free features', () => {
        const middleware = requireFeature('basic_insights');
        const req = createMockReq('PREMIUM');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('Unknown Features', () => {
      it('should return 400 for unknown feature name', () => {
        const middleware = requireFeature('nonexistent_feature');
        const req = createMockReq('PREMIUM');
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({ error: expect.stringContaining('Unknown feature') })
        );
      });
    });

    describe('Authentication', () => {
      it('should return 401 for unauthenticated requests', () => {
        const middleware = requireFeature('mermaid_charts');
        const req = createMockReq();
        const res = createMockRes();

        middleware(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });
});
