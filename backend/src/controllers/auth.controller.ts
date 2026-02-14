// ============================================================
// Acuity Invest — Auth Controller
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { register, login } from '../services/auth.service';
import { ApiResponse, AuthResponse } from '../types';

/**
 * POST /api/v1/auth/register
 * Create a new user account.
 */
export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const result: AuthResponse = await register(name, email, password);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Account created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Authenticate and receive a JWT token.
 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const result: AuthResponse = await login(email, password);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Login successful',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}
