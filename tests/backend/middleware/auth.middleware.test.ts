// ============================================================
// Acuity Invest — Auth Middleware Tests
// Tests for JWT verification middleware
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --------------- Mock JWT ---------------

const mockVerify = vi.fn();
vi.mock('jsonwebtoken', () => ({
  default: { verify: (...args: any[]) => mockVerify(...args) },
  verify: (...args: any[]) => mockVerify(...args),
}));

// --------------- Types ---------------

interface AuthTokenPayload {
  userId: string;
  email: string;
  tier: 'FREE' | 'PREMIUM';
}

// --------------- Middleware Implementation ---------------

function authMiddleware(jwtSecret: string) {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers?.authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No authorization header provided' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Invalid authorization format. Use: Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim().length === 0) {
      return res.status(401).json({ success: false, error: 'Token is required' });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;

      if (!decoded.userId || !decoded.email || !decoded.tier) {
        return res.status(401).json({ success: false, error: 'Invalid token payload' });
      }

      req.user = decoded;
      next();
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token has expired' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
      return res.status(401).json({ success: false, error: 'Authentication failed' });
    }
  };
}

// --------------- Test Helpers ---------------

function createMockReq(headers: Record<string, string> = {}): any {
  return { headers, user: undefined };
}

function createMockRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const mockNext = vi.fn();

// --------------- Tests ---------------

describe('Auth Middleware', () => {
  const JWT_SECRET = 'test-secret';
  let middleware: ReturnType<typeof authMiddleware>;

  beforeEach(() => {
    vi.clearAllMocks();
    middleware = authMiddleware(JWT_SECRET);
  });

  // --- Missing / Invalid Header ---

  describe('Authorization Header Validation', () => {
    it('should return 401 when no Authorization header is present', () => {
      const req = createMockReq();
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('No authorization header') })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header does not start with Bearer', () => {
      const req = createMockReq({ authorization: 'Basic abc123' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Invalid authorization format') })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is empty', () => {
      const req = createMockReq({ authorization: 'Bearer ' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  // --- Valid Token ---

  describe('Valid Token Handling', () => {
    it('should call next() and set req.user for valid token', () => {
      const validPayload: AuthTokenPayload = {
        userId: 'user-001',
        email: 'alice@example.com',
        tier: 'FREE',
      };
      mockVerify.mockReturnValue(validPayload);

      const req = createMockReq({ authorization: 'Bearer valid-token-123' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req.user).toEqual(validPayload);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should set correct tier for PREMIUM user', () => {
      const premiumPayload: AuthTokenPayload = {
        userId: 'user-002',
        email: 'bob@example.com',
        tier: 'PREMIUM',
      };
      mockVerify.mockReturnValue(premiumPayload);

      const req = createMockReq({ authorization: 'Bearer premium-token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(req.user.tier).toBe('PREMIUM');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should pass the correct token and secret to jwt.verify', () => {
      const payload: AuthTokenPayload = {
        userId: 'user-001',
        email: 'test@example.com',
        tier: 'FREE',
      };
      mockVerify.mockReturnValue(payload);

      const req = createMockReq({ authorization: 'Bearer my-token-xyz' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(mockVerify).toHaveBeenCalledWith('my-token-xyz', JWT_SECRET);
    });
  });

  // --- Invalid Tokens ---

  describe('Invalid Token Handling', () => {
    it('should return 401 for expired token', () => {
      mockVerify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const req = createMockReq({ authorization: 'Bearer expired-token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Token has expired' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed token', () => {
      mockVerify.mockImplementation(() => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const req = createMockReq({ authorization: 'Bearer malformed.token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      );
    });

    it('should return 401 for token with invalid signature', () => {
      mockVerify.mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      const req = createMockReq({ authorization: 'Bearer tampered-token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' })
      );
    });

    it('should return 401 for token with missing required payload fields', () => {
      mockVerify.mockReturnValue({ userId: 'user-001' }); // Missing email and tier

      const req = createMockReq({ authorization: 'Bearer incomplete-token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token payload' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const req = createMockReq({ authorization: 'Bearer some-token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authentication failed' })
      );
    });
  });

  // --- Security ---

  describe('Security Considerations', () => {
    it('should not leak internal error details in response', () => {
      mockVerify.mockImplementation(() => {
        throw new Error('ECONNREFUSED database connection');
      });

      const req = createMockReq({ authorization: 'Bearer some-token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.error).not.toContain('ECONNREFUSED');
      expect(responseBody.error).not.toContain('database');
    });

    it('should reject token with null payload fields', () => {
      mockVerify.mockReturnValue({ userId: null, email: null, tier: null });

      const req = createMockReq({ authorization: 'Bearer null-payload-token' });
      const res = createMockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
