// ============================================================
// Acuity Invest — Auth Service Unit Tests
// Tests for registration, login, JWT token management, and password hashing
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --------------- Mock Dependencies ---------------

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
    genSalt: vi.fn().mockResolvedValue('$2a$10$mocksalt'),
  },
  hash: vi.fn(),
  compare: vi.fn(),
  genSalt: vi.fn().mockResolvedValue('$2a$10$mocksalt'),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
  sign: vi.fn(),
  verify: vi.fn(),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid-001'),
}));

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// --------------- Mock Data ---------------

const JWT_SECRET = 'test-jwt-secret-key-123';
const SALT_ROUNDS = 10;

const mockUser = {
  id: 'user-001',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  password_hash: '$2a$10$hashedpassword123',
  subscription_tier: 'FREE' as const,
  created_at: '2025-01-15T10:00:00Z',
};

const mockPremiumUser = {
  id: 'user-002',
  name: 'Bob Premium',
  email: 'bob@example.com',
  password_hash: '$2a$10$hashedpassword456',
  subscription_tier: 'PREMIUM' as const,
  created_at: '2025-01-10T08:00:00Z',
};

// --------------- Mock Database ---------------

const mockDbRun = vi.fn().mockReturnValue({ changes: 1 });
const mockDbGet = vi.fn();

const mockDb = {
  prepare: vi.fn().mockReturnValue({
    run: mockDbRun,
    get: mockDbGet,
    all: vi.fn(),
  }),
};

// --------------- Auth Service ---------------

interface AuthTokenPayload {
  userId: string;
  email: string;
  tier: 'FREE' | 'PREMIUM';
}

class AuthService {
  private db: any;
  private jwtSecret: string;

  constructor(db: any, jwtSecret: string) {
    this.db = db;
    this.jwtSecret = jwtSecret;
  }

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<{ token: string; user: any }> {
    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Valid email is required');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existing = this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);

    if (existing) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = require('uuid').v4();
    const now = new Date().toISOString();

    this.db
      .prepare(
        'INSERT INTO users (id, name, email, password_hash, subscription_tier, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(userId, name, email, passwordHash, 'FREE', now);

    // Generate token
    const token = this.generateToken({
      userId,
      email,
      tier: 'FREE',
    });

    return {
      token,
      user: {
        id: userId,
        name,
        email,
        subscription_tier: 'FREE',
        created_at: now,
      },
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: any }> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      tier: user.subscription_tier,
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscription_tier: user.subscription_tier,
        created_at: user.created_at,
      },
    };
  }

  generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
  }

  verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as AuthTokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// --------------- Tests ---------------

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(mockDb, JWT_SECRET);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Registration ---

  describe('register', () => {
    it('should register a new user with valid data', async () => {
      mockDbGet.mockReturnValue(null); // No existing user
      vi.mocked(bcrypt.hash).mockResolvedValue(
        '$2a$10$newhashedpassword' as never
      );
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as never);

      const result = await authService.register(
        'Alice Johnson',
        'alice@example.com',
        'securePassword123'
      );

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.name).toBe('Alice Johnson');
      expect(result.user.email).toBe('alice@example.com');
      expect(result.user.subscription_tier).toBe('FREE');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should hash password with bcrypt and proper salt rounds', async () => {
      mockDbGet.mockReturnValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      await authService.register('Test', 'test@example.com', 'password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', SALT_ROUNDS);
    });

    it('should reject registration with existing email', async () => {
      mockDbGet.mockReturnValue({ id: 'existing-user' });

      await expect(
        authService.register('Alice', 'alice@example.com', 'password123')
      ).rejects.toThrow('Email already registered');
    });

    it('should reject registration with empty name', async () => {
      await expect(
        authService.register('', 'alice@example.com', 'password123')
      ).rejects.toThrow('Name is required');
    });

    it('should reject registration with invalid email', async () => {
      await expect(
        authService.register('Alice', 'not-an-email', 'password123')
      ).rejects.toThrow('Valid email is required');
    });

    it('should reject registration with short password (< 8 chars)', async () => {
      await expect(
        authService.register('Alice', 'alice@example.com', 'short')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should reject registration with empty password', async () => {
      await expect(
        authService.register('Alice', 'alice@example.com', '')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should default new users to FREE tier', async () => {
      mockDbGet.mockReturnValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      const result = await authService.register(
        'New User',
        'new@example.com',
        'password123'
      );

      expect(result.user.subscription_tier).toBe('FREE');
    });

    it('should not return password_hash in user response', async () => {
      mockDbGet.mockReturnValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      const result = await authService.register(
        'Alice',
        'alice@example.com',
        'password123'
      );

      expect(result.user).not.toHaveProperty('password_hash');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  // --- Login ---

  describe('login', () => {
    it('should login with valid credentials', async () => {
      mockDbGet.mockReturnValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as never);

      const result = await authService.login(
        'alice@example.com',
        'correctPassword'
      );

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('alice@example.com');
      expect(result.user.name).toBe('Alice Johnson');
    });

    it('should reject login with non-existent email', async () => {
      mockDbGet.mockReturnValue(null);

      await expect(
        authService.login('nobody@example.com', 'password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject login with wrong password', async () => {
      mockDbGet.mockReturnValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        authService.login('alice@example.com', 'wrongPassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should reject login with empty email', async () => {
      await expect(authService.login('', 'password')).rejects.toThrow(
        'Email and password are required'
      );
    });

    it('should reject login with empty password', async () => {
      await expect(
        authService.login('alice@example.com', '')
      ).rejects.toThrow('Email and password are required');
    });

    it('should not return password_hash in login response', async () => {
      mockDbGet.mockReturnValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      const result = await authService.login(
        'alice@example.com',
        'correctPassword'
      );

      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should include correct tier in token for PREMIUM user', async () => {
      mockDbGet.mockReturnValue(mockPremiumUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('premium-token' as never);

      await authService.login('bob@example.com', 'correctPassword');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-002',
          email: 'bob@example.com',
          tier: 'PREMIUM',
        }),
        JWT_SECRET,
        { expiresIn: '24h' }
      );
    });

    it('should use generic error message for security (not revealing if email exists)', async () => {
      mockDbGet.mockReturnValue(null);

      try {
        await authService.login('unknown@example.com', 'password');
      } catch (e: any) {
        // Error should say "Invalid credentials", not "User not found"
        expect(e.message).toBe('Invalid credentials');
        expect(e.message).not.toContain('not found');
        expect(e.message).not.toContain('does not exist');
      }
    });
  });

  // --- JWT Token Management ---

  describe('generateToken', () => {
    it('should generate JWT token with correct payload', () => {
      vi.mocked(jwt.sign).mockReturnValue('generated-token' as never);

      const token = authService.generateToken({
        userId: 'user-001',
        email: 'alice@example.com',
        tier: 'FREE',
      });

      expect(token).toBe('generated-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-001', email: 'alice@example.com', tier: 'FREE' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
    });

    it('should set token expiry to 24 hours', () => {
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      authService.generateToken({
        userId: 'user-001',
        email: 'test@example.com',
        tier: 'FREE',
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        JWT_SECRET,
        expect.objectContaining({ expiresIn: '24h' })
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token and return payload', () => {
      const expectedPayload = {
        userId: 'user-001',
        email: 'alice@example.com',
        tier: 'FREE' as const,
      };
      vi.mocked(jwt.verify).mockReturnValue(expectedPayload as any);

      const result = authService.verifyToken('valid-token');

      expect(result).toEqual(expectedPayload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', JWT_SECRET);
    });

    it('should throw error for expired token', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      expect(() => authService.verifyToken('expired-token')).toThrow(
        'Token has expired'
      );
    });

    it('should throw error for malformed token', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      expect(() => authService.verifyToken('malformed-token')).toThrow(
        'Invalid token'
      );
    });

    it('should throw error for token with invalid signature', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      expect(() =>
        authService.verifyToken('tampered-token')
      ).toThrow('Invalid token');
    });

    it('should throw error for empty token', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        const error = new Error('jwt must be provided');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      expect(() => authService.verifyToken('')).toThrow('Invalid token');
    });
  });

  // --- Email Validation ---

  describe('Email Validation', () => {
    it('should accept valid email formats', async () => {
      mockDbGet.mockReturnValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      const validEmails = [
        'test@example.com',
        'user.name@domain.co',
        'user+tag@example.org',
        'firstname.lastname@company.com',
      ];

      for (const email of validEmails) {
        mockDbGet.mockReturnValue(null);
        const result = await authService.register('Test', email, 'password123');
        expect(result.token).toBeDefined();
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'not-an-email',
        '@no-local.com',
        'missing-at.com',
        'spaces in@email.com',
        '',
      ];

      for (const email of invalidEmails) {
        await expect(
          authService.register('Test', email, 'password123')
        ).rejects.toThrow();
      }
    });
  });
});
