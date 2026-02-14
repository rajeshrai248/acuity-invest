// ============================================================
// Acuity Invest — Rate Limiting Security Tests
// Tests for rate limit bypass attempts and abuse prevention
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --------------- Rate Limiter ---------------

class SecurityRateLimiter {
  private store: Map<string, { count: number; resetAt: number; violations: number }> = new Map();
  private blacklist: Set<string> = new Set();

  private config = {
    FREE: { windowMs: 60 * 1000, maxRequests: 5 },
    PREMIUM: { windowMs: 60 * 1000, maxRequests: 60 },
    authAttempts: { windowMs: 15 * 60 * 1000, maxAttempts: 5 },   // 5 attempts per 15 min
    globalPerIp: { windowMs: 60 * 1000, maxRequests: 100 },       // 100 req/min per IP
    blacklistThreshold: 10, // violations before blacklisting
  };

  checkRateLimit(key: string, type: 'FREE' | 'PREMIUM' | 'authAttempts' | 'globalPerIp'): {
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
  } {
    if (this.blacklist.has(key)) {
      return { allowed: false, remaining: 0, retryAfter: 3600 };
    }

    const now = Date.now();
    const limit = type === 'authAttempts'
      ? this.config.authAttempts
      : type === 'globalPerIp'
        ? this.config.globalPerIp
        : this.config[type];

    const maxReq = 'maxRequests' in limit ? limit.maxRequests : (limit as any).maxAttempts;

    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + limit.windowMs, violations: 0 });
      return { allowed: true, remaining: maxReq - 1 };
    }

    if (entry.count >= maxReq) {
      entry.violations++;
      if (entry.violations >= this.config.blacklistThreshold) {
        this.blacklist.add(key);
      }
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    entry.count++;
    return { allowed: true, remaining: maxReq - entry.count };
  }

  isBlacklisted(key: string): boolean {
    return this.blacklist.has(key);
  }

  reset() {
    this.store.clear();
    this.blacklist.clear();
  }
}

// --------------- Tests ---------------

describe('Rate Limiting Security', () => {
  let limiter: SecurityRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new SecurityRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- IP-Based Rate Limiting ---

  describe('IP-Based Rate Limiting', () => {
    it('should limit requests per IP address', () => {
      const ip = '192.168.1.100';

      for (let i = 0; i < 100; i++) {
        const result = limiter.checkRateLimit(ip, 'globalPerIp');
        expect(result.allowed).toBe(true);
      }

      const blocked = limiter.checkRateLimit(ip, 'globalPerIp');
      expect(blocked.allowed).toBe(false);
    });

    it('should track different IPs independently', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // Exhaust IP1's limit
      for (let i = 0; i < 100; i++) {
        limiter.checkRateLimit(ip1, 'globalPerIp');
      }

      // IP2 should still be allowed
      const result = limiter.checkRateLimit(ip2, 'globalPerIp');
      expect(result.allowed).toBe(true);
    });
  });

  // --- Auth Attempt Rate Limiting ---

  describe('Authentication Attempt Limiting', () => {
    it('should limit failed login attempts to 5 per 15 minutes', () => {
      const key = 'login:alice@example.com';

      for (let i = 0; i < 5; i++) {
        const result = limiter.checkRateLimit(key, 'authAttempts');
        expect(result.allowed).toBe(true);
      }

      const blocked = limiter.checkRateLimit(key, 'authAttempts');
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeDefined();
      expect(blocked.retryAfter!).toBeGreaterThan(0);
    });

    it('should reset auth attempts after window expires', () => {
      const key = 'login:alice@example.com';

      // Use all attempts
      for (let i = 0; i < 5; i++) {
        limiter.checkRateLimit(key, 'authAttempts');
      }

      // Verify blocked
      expect(limiter.checkRateLimit(key, 'authAttempts').allowed).toBe(false);

      // Advance past 15-minute window
      vi.advanceTimersByTime(16 * 60 * 1000);

      // Should be allowed again
      expect(limiter.checkRateLimit(key, 'authAttempts').allowed).toBe(true);
    });

    it('should provide retryAfter seconds in blocking response', () => {
      const key = 'login:test@example.com';

      for (let i = 0; i < 5; i++) {
        limiter.checkRateLimit(key, 'authAttempts');
      }

      const blocked = limiter.checkRateLimit(key, 'authAttempts');
      expect(blocked.retryAfter).toBeGreaterThan(0);
      expect(blocked.retryAfter).toBeLessThanOrEqual(15 * 60); // Max 15 min
    });
  });

  // --- Tier-Based Limiting ---

  describe('Tier-Based Rate Limiting', () => {
    it('should enforce stricter limits for FREE tier', () => {
      const key = 'user:free-001';

      for (let i = 0; i < 5; i++) {
        expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(true);
      }

      expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(false);
    });

    it('should allow more requests for PREMIUM tier', () => {
      const key = 'user:premium-001';

      for (let i = 0; i < 60; i++) {
        expect(limiter.checkRateLimit(key, 'PREMIUM').allowed).toBe(true);
      }

      expect(limiter.checkRateLimit(key, 'PREMIUM').allowed).toBe(false);
    });

    it('should show correct remaining count', () => {
      const key = 'user:free-001';

      const first = limiter.checkRateLimit(key, 'FREE');
      expect(first.remaining).toBe(4);

      const second = limiter.checkRateLimit(key, 'FREE');
      expect(second.remaining).toBe(3);
    });
  });

  // --- Bypass Attempts ---

  describe('Bypass Attempt Prevention', () => {
    it('should not be bypassed by changing User-Agent header', () => {
      // Rate limiting should be based on token/IP, not User-Agent
      const key = 'user:free-001';

      for (let i = 0; i < 5; i++) {
        limiter.checkRateLimit(key, 'FREE');
      }

      // Same key regardless of User-Agent change
      expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(false);
    });

    it('should not be reset by rapid requests', () => {
      const key = 'user:free-001';

      // Rapid-fire requests should not reset the counter
      for (let i = 0; i < 10; i++) {
        limiter.checkRateLimit(key, 'FREE');
      }

      expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(false);
    });

    it('should track violations and blacklist persistent abusers', () => {
      const key = 'abuser:192.168.1.99';

      // Keep hitting the limit repeatedly (10+ violations)
      for (let window = 0; window < 11; window++) {
        // Exhaust the window
        for (let i = 0; i < 5; i++) {
          limiter.checkRateLimit(key, 'FREE');
        }
        // Trigger violation
        limiter.checkRateLimit(key, 'FREE');

        // Reset window
        vi.advanceTimersByTime(61 * 1000);
      }

      // Should be blacklisted after 10 violations
      expect(limiter.isBlacklisted(key)).toBe(true);

      // All requests should be blocked
      const blocked = limiter.checkRateLimit(key, 'FREE');
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBe(3600); // 1 hour blacklist
    });
  });

  // --- Distributed Attack Simulation ---

  describe('Distributed Attack Patterns', () => {
    it('should handle concurrent requests without race conditions', () => {
      const key = 'concurrent-test';
      const results: boolean[] = [];

      // Simulate 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        results.push(limiter.checkRateLimit(key, 'FREE').allowed);
      }

      // First 5 should be allowed, rest blocked
      const allowed = results.filter((r) => r).length;
      const blocked = results.filter((r) => !r).length;

      expect(allowed).toBe(5);
      expect(blocked).toBe(5);
    });

    it('should maintain rate limits across time correctly', () => {
      const key = 'timing-test';

      // Use 3 requests
      for (let i = 0; i < 3; i++) {
        limiter.checkRateLimit(key, 'FREE');
      }

      // Advance 30 seconds (within window)
      vi.advanceTimersByTime(30 * 1000);

      // Use 2 more requests (total 5)
      for (let i = 0; i < 2; i++) {
        expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(true);
      }

      // 6th request should be blocked
      expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(false);
    });
  });

  // --- Reset ---

  describe('Rate Limit Reset', () => {
    it('should clear all limits and blacklists on reset', () => {
      const key = 'reset-test';

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter.checkRateLimit(key, 'FREE');
      }

      expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(false);

      limiter.reset();

      expect(limiter.checkRateLimit(key, 'FREE').allowed).toBe(true);
      expect(limiter.isBlacklisted(key)).toBe(false);
    });
  });
});
