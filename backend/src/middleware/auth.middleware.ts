// ============================================================
// Acuity Invest — JWT Authentication Middleware
// ============================================================

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedRequest, AuthTokenPayload } from '../types';
import { AppError } from './errorHandler.middleware';
import { findUserById } from '../models/user.model';

/**
 * Middleware that verifies JWT tokens and attaches the user payload to the request.
 * All protected routes should use this middleware.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AppError('Authorization header is required', 401);
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization header must use Bearer scheme', 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      throw new AppError('Token is required', 401);
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;

    // Verify the user still exists in the database
    const user = findUserById(decoded.userId);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    // Attach the decoded payload with fresh tier info from DB
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      tier: user.subscription_tier,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid or expired token', 401));
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token has expired', 401));
      return;
    }
    next(new AppError('Authentication failed', 401));
  }
}
