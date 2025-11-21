import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

/**
 * SECURITY: Rate limiting configuration for authentication endpoints
 *
 * This implements protection against brute force attacks by:
 * 1. Limiting login attempts to 5 per 15 minutes per IP
 * 2. Limiting registration attempts to 3 per hour per IP
 * 3. Providing clear error messages about retry times
 */

/**
 * Rate limiter for login endpoint
 * 5 attempts per 15 minutes per IP address
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many login attempts from this IP address',
    retryAfter: 'Please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    console.warn(`[security] Rate limit exceeded for login from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many login attempts from this IP address',
      retryAfter: 'Please try again after 15 minutes',
      details: 'For security, we limit login attempts to 5 per 15 minutes per IP address'
    });
  },
  // Skip rate limiting for successful requests (only count failed attempts)
  skipSuccessfulRequests: true
});

/**
 * Rate limiter for registration endpoint
 * 3 attempts per hour per IP address
 * More restrictive than login to prevent spam account creation
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registration attempts per hour
  message: {
    error: 'Too many registration attempts from this IP address',
    retryAfter: 'Please try again after 1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.warn(`[security] Rate limit exceeded for registration from IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many registration attempts from this IP address',
      retryAfter: 'Please try again after 1 hour',
      details: 'For security, we limit registration attempts to 3 per hour per IP address'
    });
  },
  skipSuccessfulRequests: true
});

/**
 * In-memory store for tracking failed login attempts by email
 * In production, this should be replaced with a Redis or database-backed store
 * for persistence across server restarts
 */
interface LoginAttempt {
  attempts: number;
  firstAttemptAt: Date;
  lockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Clean up old entries every hour
setInterval(() => {
  const now = new Date();
  const entries = Array.from(loginAttempts.entries());
  for (const [email, attempt] of entries) {
    // Remove entries older than 24 hours
    if (now.getTime() - attempt.firstAttemptAt.getTime() > 24 * 60 * 60 * 1000) {
      loginAttempts.delete(email);
    }
  }
}, 60 * 60 * 1000);

/**
 * Record a failed login attempt for an email address
 * Implements progressive lockout:
 * - 5+ failed attempts: 15 minute lockout
 * - 10+ failed attempts: 1 hour lockout
 * - 20+ failed attempts: 24 hour lockout
 */
export function recordFailedLogin(email: string): void {
  const normalizedEmail = email.toLowerCase();
  const now = new Date();

  const attempt = loginAttempts.get(normalizedEmail);

  if (!attempt) {
    loginAttempts.set(normalizedEmail, {
      attempts: 1,
      firstAttemptAt: now
    });
    console.log(`[security] Failed login attempt #1 for ${normalizedEmail}`);
    return;
  }

  attempt.attempts++;

  // Progressive lockout based on attempt count
  if (attempt.attempts >= 20) {
    // 20+ attempts: 24 hour lockout
    attempt.lockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    console.warn(`[security] Account ${normalizedEmail} locked for 24 hours after ${attempt.attempts} failed attempts`);
  } else if (attempt.attempts >= 10) {
    // 10+ attempts: 1 hour lockout
    attempt.lockedUntil = new Date(now.getTime() + 60 * 60 * 1000);
    console.warn(`[security] Account ${normalizedEmail} locked for 1 hour after ${attempt.attempts} failed attempts`);
  } else if (attempt.attempts >= 5) {
    // 5+ attempts: 15 minute lockout
    attempt.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
    console.warn(`[security] Account ${normalizedEmail} locked for 15 minutes after ${attempt.attempts} failed attempts`);
  } else {
    console.log(`[security] Failed login attempt #${attempt.attempts} for ${normalizedEmail}`);
  }

  loginAttempts.set(normalizedEmail, attempt);
}

/**
 * Reset failed login attempts for an email address (on successful login)
 */
export function resetFailedLogins(email: string): void {
  const normalizedEmail = email.toLowerCase();
  loginAttempts.delete(normalizedEmail);
  console.log(`[security] Reset failed login attempts for ${normalizedEmail}`);
}

/**
 * Check if an account is currently locked
 * Returns null if not locked, or the lock expiry time if locked
 */
export function checkAccountLock(email: string): Date | null {
  const normalizedEmail = email.toLowerCase();
  const attempt = loginAttempts.get(normalizedEmail);

  if (!attempt || !attempt.lockedUntil) {
    return null;
  }

  const now = new Date();

  // Check if lock has expired
  if (now >= attempt.lockedUntil) {
    // Lock expired, reset the lockout but keep attempt count
    attempt.lockedUntil = undefined;
    loginAttempts.set(normalizedEmail, attempt);
    return null;
  }

  return attempt.lockedUntil;
}

/**
 * Get the number of failed login attempts for an email
 */
export function getFailedAttempts(email: string): number {
  const normalizedEmail = email.toLowerCase();
  const attempt = loginAttempts.get(normalizedEmail);
  return attempt ? attempt.attempts : 0;
}
