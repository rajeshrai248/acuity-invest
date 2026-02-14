// ============================================================
// Acuity Invest — Rate Limiter Middleware Tests
// Tests for rate limiting based on subscription tier
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --------------- Rate Limiter Implementation ---------------

interface RateLimitConfig {
  FREE: { windowMs: number; maxRequests: number };
  PREMIUM: { windowMs: number; maxRequests: number };
}

const DEFAULT_CONFIG: RateLimitConfig = {
  FREE: { windowMs: 60 * 1000, maxRequests: 5 },     // 5 per minute
  PREMIUM: { windowMs: 60 * 1000, maxRequests: 60 },  // 60 per minute
};

class RateLimiter {
  private store: Map<string, { count: number; resetAt: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      const tier = req.user.tier as 'FREE' | 'PREMIUM';
      const userId = req.user.userId;
      const key = `${userId}:${tier}`;
      const now = Date.now();
      const limit = this.config[tier];

      const entry = this.store.get(key);

      if (!entry || now > entry.resetAt) {
        // New window
        this.store.set(key, { count: 1, resetAt: now + limit.windowMs });
        this.setHeaders(res, limit.maxRequests, limit.maxRequests - 1, now + limit.windowMs);
        return next();
      }

      if (entry.count >= limit.maxRequests) {
        this.setHeaders(res, limit.maxRequests, 0, entry.resetAt);
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        });
      }

      entry.count++;
      this.setHeaders(res, limit.maxRequests, limit.maxRequests - entry.count, entry.resetAt);
      return next();
    };
  }

  private setHeaders(res: any, limit: number, remaining: number, reset: number) {
    res.set = res.set || vi.fn();
    res.set('X-RateLimit-Limit', String(limit));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(reset / 1000)));
  }

  reset() {
    this.store.clear();
  }
}

// --------------- Test Helpers ---------------

function createMockReq(userId: string, tier: 'FREE' | 'PREMIUM'): any {
  return { user: { userId, tier, email: `${userId}@example.com` } };
}

function createMockRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.set = vi.fn().mockReturnValue(res);
  return res;
}

// --------------- Tests ---------------

describe('Rate Limiter Middleware', () => {
  let rateLimiter: RateLimiter;
  let middleware: ReturnType<RateLimiter['middleware']>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    rateLimiter = new RateLimiter();
    middleware = rateLimiter.middleware();
    mockNext = vi.fn();
  });

  // --- Basic Functionality ---

  describe('Basic Rate Limiting', () => {
    it('should allow requests within FREE tier limit (5/min)', () => {
      const req = createMockReq('user-001', 'FREE');
      const res = createMockRes();

      for (let i = 0; i < 5; i++) {
        middleware(req, res, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);
    });

    it('should block 6th request for FREE tier within window', () => {
      const req = createMockReq('user-001', 'FREE');

      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);

      // 6th request
      const res = createMockRes();
      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Rate limit exceeded') })
      );
      expect(mockNext).toHaveBeenCalledTimes(5); // Still only 5
    });

    it('should allow PREMIUM tier higher limits (60/min)', () => {
      const req = createMockReq('user-002', 'PREMIUM');

      for (let i = 0; i < 60; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(60);
    });

    it('should block 61st request for PREMIUM tier within window', () => {
      const req = createMockReq('user-002', 'PREMIUM');

      for (let i = 0; i < 60; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      const res = createMockRes();
      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(mockNext).toHaveBeenCalledTimes(60);
    });
  });

  // --- Window Reset ---

  describe('Window Reset', () => {
    it('should reset counter after window expires', () => {
      const req = createMockReq('user-001', 'FREE');

      // Use all 5 requests
      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);

      // Advance past window (1 minute)
      vi.advanceTimersByTime(61 * 1000);

      // Should allow new requests
      const res = createMockRes();
      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(6);
    });

    it('should not reset counter before window expires', () => {
      const req = createMockReq('user-001', 'FREE');

      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      // Advance 30 seconds (within window)
      vi.advanceTimersByTime(30 * 1000);

      const res = createMockRes();
      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  // --- User Isolation ---

  describe('User Isolation', () => {
    it('should track rate limits per user independently', () => {
      const req1 = createMockReq('user-001', 'FREE');
      const req2 = createMockReq('user-002', 'FREE');

      // User 1 exhausts limit
      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        middleware(req1, res, mockNext);
      }

      // User 2 should still be able to make requests
      const res = createMockRes();
      middleware(req2, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(6); // 5 for user1 + 1 for user2
    });
  });

  // --- Response Headers ---

  describe('Rate Limit Headers', () => {
    it('should set X-RateLimit-Limit header', () => {
      const req = createMockReq('user-001', 'FREE');
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
    });

    it('should set X-RateLimit-Remaining header', () => {
      const req = createMockReq('user-001', 'FREE');
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '4');
    });

    it('should decrement remaining count with each request', () => {
      const req = createMockReq('user-001', 'FREE');

      for (let i = 0; i < 3; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);

        if (i === 2) {
          expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '2');
        }
      }
    });

    it('should show 0 remaining when limit is reached', () => {
      const req = createMockReq('user-001', 'FREE');

      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      const res = createMockRes();
      middleware(req, res, mockNext);

      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', '0');
    });
  });

  // --- Retry-After ---

  describe('Retry-After Information', () => {
    it('should include retryAfter in 429 response', () => {
      const req = createMockReq('user-001', 'FREE');

      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      const res = createMockRes();
      middleware(req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          retryAfter: expect.any(Number),
        })
      );
    });
  });

  // --- Authentication Requirement ---

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', () => {
      const req = { user: undefined };
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- Reset ---

  describe('Manual Reset', () => {
    it('should clear all rate limit counters on reset', () => {
      const req = createMockReq('user-001', 'FREE');

      for (let i = 0; i < 5; i++) {
        const res = createMockRes();
        middleware(req, res, mockNext);
      }

      // Verify limit reached
      const blockRes = createMockRes();
      middleware(req, blockRes, mockNext);
      expect(blockRes.status).toHaveBeenCalledWith(429);

      // Reset
      rateLimiter.reset();

      // Should allow requests again
      const res = createMockRes();
      middleware(req, res, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(6);
    });
  });
});
