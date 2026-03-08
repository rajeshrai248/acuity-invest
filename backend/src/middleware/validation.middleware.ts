// ============================================================
// Acuity Invest — Zod Schema Validation Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { z } from 'zod';
import { AppError } from './errorHandler.middleware';

/**
 * Factory function that creates validation middleware from a Zod schema.
 * Validates req.body by default, but can also validate req.params or req.query.
 */
export function validate(schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const parsed = schema.parse(data);

      // Replace the source with the parsed (and potentially transformed) data
      if (source === 'body') {
        req.body = parsed;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new AppError(`Validation error: ${messages}`, 400));
        return;
      }
      next(error);
    }
  };
}

// ============================================================
// Validation Schemas
// ============================================================

// --- Auth Schemas ---
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// --- Portfolio Schemas ---
export const createPortfolioSchema = z.object({
  name: z.string().min(1, 'Portfolio name is required').max(200),
  account_type: z.string().optional().default('Individual Brokerage'),
  base_currency: z.string().length(3).optional().default('USD'),
});

export const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  account_type: z.string().optional(),
  base_currency: z.string().length(3).optional(),
});

// --- Holding Schemas ---
export const addHoldingSchema = z.object({
  ticker: z
    .string()
    .min(1, 'Ticker is required')
    .max(10)
    .transform((val) => val.toUpperCase().trim()),
  name: z.string().min(1, 'Holding name is required').max(200),
  shares: z.number().positive('Shares must be positive'),
  avg_cost: z.number().positive('Average cost must be positive'),
  purchase_date: z.string().nullable().optional().default(null),
});

// --- Insight Schemas ---
export const insightRequestSchema = z.object({
  portfolio_id: z.string().uuid('Invalid portfolio ID'),
  query: z
    .string()
    .min(1, 'Query is required')
    .max(500, 'Query must be at most 500 characters')
    .transform((val) => val.trim()),
});

// --- Annotation Schemas ---
export const annotationSchema = z.object({
  trace_id: z.string().min(1, 'Trace ID is required'),
  scores: z.object({
    accuracy: z.number().int().min(1).max(5).optional(),
    groundedness: z.number().int().min(1).max(5).optional(),
    relevance: z.number().int().min(1).max(5).optional(),
    compliance: z.number().int().min(1).max(5).optional(),
    clarity: z.number().int().min(1).max(5).optional(),
    depth: z.number().int().min(1).max(5).optional(),
    overall: z.number().int().min(1).max(5).optional(),
    approved: z.boolean().optional(),
  }).refine(obj => Object.values(obj).some(v => v != null), {
    message: 'At least one score dimension is required',
  }),
  comment: z.string().max(2000).optional(),
});

// --- Market Schemas ---
export const batchQuotesSchema = z.object({
  tickers: z
    .array(z.string().transform((val) => val.toUpperCase().trim()))
    .min(1, 'At least one ticker is required')
    .max(50, 'Maximum 50 tickers per request'),
});

// --- Param Schemas ---
export const tickerParamSchema = z.object({
  ticker: z.string().min(1).max(10),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});
