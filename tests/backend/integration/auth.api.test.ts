// ============================================================
// Acuity Invest — Auth API Integration Tests
// Tests for registration and login endpoints
// ============================================================

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Response } from 'express';

// --------------- Mock Services ---------------

const mockRegister = vi.fn();
const mockLogin = vi.fn();

// --------------- App Setup ---------------

function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // POST /api/v1/auth/register
  app.post('/api/v1/auth/register', async (req: any, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    try {
      const result = await mockRegister(name, email, password);
      res.status(201).json({ success: true, data: result });
    } catch (e: any) {
      if (e.message.includes('already registered')) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
      }
      return res.status(500).json({ success: false, error: 'Registration failed' });
    }
  });

  // POST /api/v1/auth/login
  app.post('/api/v1/auth/login', async (req: any, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    try {
      const result = await mockLogin(email, password);
      res.json({ success: true, data: result });
    } catch (e: any) {
      if (e.message === 'Invalid credentials') {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  });

  return app;
}

// --------------- Tests ---------------

describe('Auth API', () => {
  let app: Express;

  const validRegistration = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'securePassword123',
  };

  const mockAuthResponse = {
    token: 'eyJhbGciOiJIUzI1NiJ9.mock-jwt-token',
    user: {
      id: 'user-001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      subscription_tier: 'FREE',
      created_at: '2025-02-14T10:00:00Z',
    },
  };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- POST /api/v1/auth/register ---

  describe('POST /api/v1/auth/register', () => {
    it('should register user with valid data and return 201', async () => {
      mockRegister.mockResolvedValue(mockAuthResponse);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistration);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.name).toBe('Alice Johnson');
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.subscription_tier).toBe('FREE');
    });

    it('should not return password in response', async () => {
      mockRegister.mockResolvedValue(mockAuthResponse);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistration);

      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alice', email: 'not-valid-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('email');
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('8 characters');
    });

    it('should return 400 for empty password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alice', email: 'alice@example.com', password: '' });

      expect(res.status).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      mockRegister.mockRejectedValue(new Error('Email already registered'));

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistration);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });

    it('should accept email with subdomains and plus signs', async () => {
      mockRegister.mockResolvedValue(mockAuthResponse);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Alice', email: 'alice+tag@mail.example.com', password: 'password123' });

      expect(res.status).toBe(201);
    });
  });

  // --- POST /api/v1/auth/login ---

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      mockLogin.mockResolvedValue(mockAuthResponse);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: 'securePassword123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@example.com');
    });

    it('should return 401 for wrong password', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid');
    });

    it('should return 401 for non-existent email', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      // Should not reveal whether email exists
      expect(res.body.error).not.toContain('not found');
      expect(res.body.error).not.toContain('does not exist');
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('required');
    });

    it('should not expose internal error details', async () => {
      mockLogin.mockRejectedValue(new Error('Database connection failed'));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'alice@example.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error).not.toContain('Database');
      expect(res.body.error).toBe('Login failed');
    });
  });
});
