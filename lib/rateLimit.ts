import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store, per server instance. On multi-instance or serverless hosting
// each instance counts separately; a shared store (e.g. Redis) needs a hosting
// decision (D-005) before it can replace this.
const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
const cleanup = setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);
// Don't keep the process (or a test runner) alive just for cleanup.
cleanup.unref?.();

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the window
   */
  limit: number;
  /**
   * Time window in milliseconds or string like '15m', '1h'
   */
  window: number | string;
  /**
   * Limiter name. Each limiter keeps its own budget, so e.g. login attempts
   * and contact-form posts from one IP don't count against each other.
   */
  name?: string;
  /**
   * Custom identifier such as a user id or email (defaults to client IP)
   */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Parse time string like '15m', '1h', '1d' to milliseconds
 */
function parseTimeWindow(window: number | string): number {
  if (typeof window === 'number') return window;

  const match = window.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid time window format: ${window}`);

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

/**
 * Get client IP address from request.
 *
 * Prefers the platform-provided address (`request.ip`, `x-real-ip`) over
 * `x-forwarded-for`, whose first entry a client can set to anything when no
 * trusted proxy overwrites it.
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.ip ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

/**
 * Count one request against `key` and report whether it is within `limit`.
 * Use directly when there is no NextRequest (e.g. inside NextAuth callbacks).
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  window: number | string
): RateLimitResult {
  const windowMs = parseTimeWindow(window);
  const now = Date.now();

  // Get or create rate limit entry
  let entry = store[key];

  // Reset if window has passed
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    store[key] = entry;
  }

  // Increment count
  entry.count++;

  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.resetTime,
  };
}

/**
 * Rate limit a request
 *
 * @example
 * ```typescript
 * const result = await rateLimit(request, { name: 'login', limit: 5, window: '15m' });
 * if (!result.success) return rateLimitExceededResponse(result);
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, window, name = 'default', identifier } = options;
  const key = `ratelimit:${name}:${identifier || getClientIp(request)}`;
  return consumeRateLimit(key, limit, window);
}

/**
 * Create a named rate limiter for a specific endpoint
 *
 * @example
 * ```typescript
 * const loginLimiter = createRateLimiter('login', { limit: 5, window: '15m' });
 *
 * export async function POST(request: NextRequest) {
 *   const result = await loginLimiter(request);
 *   if (!result.success) return rateLimitExceededResponse(result);
 *   // ... rest of endpoint
 * }
 * ```
 */
export function createRateLimiter(
  name: string,
  options: Omit<RateLimitOptions, 'identifier' | 'name'>
) {
  return (request: NextRequest, identifier?: string) =>
    rateLimit(request, { ...options, name, identifier });
}

/**
 * Standard 429 response with rate-limit headers.
 * Pass `body` for routes whose clients expect a different error shape.
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
  message = 'Too many requests. Please try again later.',
  body?: Record<string, unknown>
) {
  return NextResponse.json(
    body ?? { success: false, error: message },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString(),
        'Retry-After': Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)).toString(),
      },
    }
  );
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /**
   * Strict rate limiter for login (5 requests per 15 minutes per IP)
   */
  auth: createRateLimiter('auth', { limit: 5, window: '15m' }),

  /**
   * Account creation (5 per hour per IP)
   */
  register: createRateLimiter('register', { limit: 5, window: '1h' }),

  /**
   * Standard rate limiter for API endpoints (100 requests per 15 minutes)
   */
  api: createRateLimiter('api', { limit: 100, window: '15m' }),

  /**
   * Generous rate limiter for public endpoints (300 requests per 15 minutes)
   */
  public: createRateLimiter('public', { limit: 300, window: '15m' }),

  /**
   * Strict rate limiter for contact/email endpoints (3 requests per hour)
   */
  contact: createRateLimiter('contact', { limit: 3, window: '1h' }),

  /**
   * Resume analysis without an account (parsing + OCR are CPU-heavy): 10 per hour per IP
   */
  analyzeAnonymous: createRateLimiter('analyze-anon', { limit: 10, window: '1h' }),

  /**
   * Resume analysis for signed-in users: 30 per hour per user
   */
  analyzeUser: createRateLimiter('analyze-user', { limit: 30, window: '1h' }),

  /**
   * Routes that call a paid AI model: 30 per hour per user, shared across those routes
   */
  ai: createRateLimiter('ai', { limit: 30, window: '1h' }),
};

/**
 * Credentials sign-in attempts per email (NextAuth path, no NextRequest available)
 */
export function consumeCredentialsAttempt(email: string): RateLimitResult {
  return consumeRateLimit(`ratelimit:credentials:${email.trim().toLowerCase()}`, 5, '15m');
}
