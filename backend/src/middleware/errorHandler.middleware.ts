// ============================================================
// Acuity Invest — Global Error Handler Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';
import { config } from '../config';

/**
 * Custom application error class with HTTP status codes.
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 404 Not Found handler — catches unmatched routes.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

/**
 * Global error handling middleware.
 * Must be the last middleware in the chain.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 internal server error
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Authentication required';
  }

  // Log the error
  if (statusCode >= 500) {
    console.error(`[ERROR] ${statusCode} - ${message}`, config.isDev ? err.stack : '');
  } else {
    console.warn(`[WARN] ${statusCode} - ${message}`);
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    ...(config.isDev && statusCode >= 500 ? { message: err.stack } : {}),
  };

  res.status(statusCode).json(response);
}
