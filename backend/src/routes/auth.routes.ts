// ============================================================
// Acuity Invest — Auth Routes
// ============================================================

import { Router } from 'express';
import { registerHandler, loginHandler } from '../controllers/auth.controller';
import { validate, registerSchema, loginSchema } from '../middleware/validation.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Create a new user account.
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  registerHandler
);

/**
 * POST /api/v1/auth/login
 * Authenticate and receive a JWT token.
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  loginHandler
);

export default router;
