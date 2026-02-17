// ============================================================
// Acuity Invest — Security Middleware
// ============================================================

import { Request, Response, NextFunction } from 'express';

/**
 * Strip HTML tags from a string to prevent XSS via stored payloads.
 */
function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

/**
 * Recursively sanitize all string values in an object.
 */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return stripHtml(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Middleware that sanitizes request body and query strings.
 * Strips HTML tags to prevent stored XSS attacks.
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      const val = req.query[key];
      if (typeof val === 'string') {
        req.query[key] = stripHtml(val);
      }
    }
  }
  next();
}

/**
 * Middleware that adds security-related response headers
 * beyond what Helmet provides.
 */
export function additionalSecurityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent caching of API responses containing sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent the page from being embedded in iframes
  res.setHeader('X-Frame-Options', 'DENY');

  next();
}
