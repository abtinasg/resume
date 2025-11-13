import { NextRequest } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis or similar)
const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

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
   * Custom identifier (defaults to IP address)
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
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

/**
 * Rate limit a request
 *
 * @example
 * ```typescript
 * const result = await rateLimit(request, { limit: 5, window: '15m' });
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429, headers: {
 *       'X-RateLimit-Limit': result.limit.toString(),
 *       'X-RateLimit-Remaining': result.remaining.toString(),
 *       'X-RateLimit-Reset': new Date(result.reset).toISOString(),
 *     }}
 *   );
 * }
 * ```
 */
export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { limit, window, identifier } = options;
  const windowMs = parseTimeWindow(window);
  const key = identifier || `ratelimit:${getClientIp(request)}`;
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

  const remaining = Math.max(0, limit - entry.count);
  const success = entry.count <= limit;

  return {
    success,
    limit,
    remaining,
    reset: entry.resetTime,
  };
}

/**
 * Create a rate limiter for a specific endpoint
 *
 * @example
 * ```typescript
 * const loginLimiter = createRateLimiter({ limit: 5, window: '15m' });
 *
 * export async function POST(request: NextRequest) {
 *   const result = await loginLimiter(request);
 *   if (!result.success) {
 *     return NextResponse.json({ error: 'Too many login attempts' }, { status: 429 });
 *   }
 *   // ... rest of endpoint
 * }
 * ```
 */
export function createRateLimiter(options: Omit<RateLimitOptions, 'identifier'>) {
  return (request: NextRequest, identifier?: string) =>
    rateLimit(request, { ...options, identifier });
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  /**
   * Strict rate limiter for authentication endpoints (5 requests per 15 minutes)
   */
  auth: createRateLimiter({ limit: 5, window: '15m' }),

  /**
   * Standard rate limiter for API endpoints (100 requests per 15 minutes)
   */
  api: createRateLimiter({ limit: 100, window: '15m' }),

  /**
   * Generous rate limiter for public endpoints (300 requests per 15 minutes)
   */
  public: createRateLimiter({ limit: 300, window: '15m' }),

  /**
   * Strict rate limiter for contact/email endpoints (3 requests per hour)
   */
  contact: createRateLimiter({ limit: 3, window: '1h' }),
};
