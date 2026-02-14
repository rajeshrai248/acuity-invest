// ============================================================
// Acuity Invest — Custom Validation Helpers
// ============================================================

/**
 * Validate a stock ticker symbol format.
 */
export function isValidTicker(ticker: string): boolean {
  // 1-5 uppercase letters, optionally followed by a dot and 1-2 letters (e.g., BRK.B)
  return /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/.test(ticker);
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate a password meets minimum requirements.
 * - At least 8 characters
 * - At least one letter and one number
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

/**
 * Sanitize a string to prevent injection attacks.
 * Removes potentially dangerous characters while preserving normal text.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validate that a string is a valid UUID v4.
 */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Normalize a ticker symbol to uppercase.
 */
export function normalizeTicker(ticker: string): string {
  return ticker.toUpperCase().trim();
}
