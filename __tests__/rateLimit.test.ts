/**
 * Rate limiter tests (Stage 0 cost/abuse protection)
 */

import { NextRequest } from 'next/server';
import {
  consumeRateLimit,
  consumeCredentialsAttempt,
  createRateLimiter,
  getClientIp,
  rateLimitExceededResponse,
} from '@/lib/rateLimit';

let counter = 0;
// Unique IP per test so the shared in-memory store doesn't leak between tests.
function requestFrom(ip: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/test', {
    headers: { 'x-real-ip': ip, ...headers },
  });
}
const uniqueIp = () => `10.0.0.${++counter}`;

describe('rate limiter', () => {
  test('allows up to the limit, then blocks', async () => {
    const limiter = createRateLimiter('test-basic', { limit: 3, window: '1m' });
    const req = requestFrom(uniqueIp());

    const results = [];
    for (let i = 0; i < 4; i++) results.push(await limiter(req));

    expect(results.map((r) => r.success)).toEqual([true, true, true, false]);
    expect(results[3].remaining).toBe(0);
  });

  test('named limiters keep separate budgets for the same IP', async () => {
    const login = createRateLimiter('test-login', { limit: 1, window: '1m' });
    const contact = createRateLimiter('test-contact', { limit: 1, window: '1m' });
    const req = requestFrom(uniqueIp());

    expect((await login(req)).success).toBe(true);
    expect((await login(req)).success).toBe(false);
    // Exhausting login must not consume the contact budget
    expect((await contact(req)).success).toBe(true);
  });

  test('an explicit identifier (user id) is counted separately from the IP', async () => {
    const ai = createRateLimiter('test-ai', { limit: 1, window: '1m' });
    const req = requestFrom(uniqueIp());

    expect((await ai(req, 'user-a')).success).toBe(true);
    expect((await ai(req, 'user-a')).success).toBe(false);
    expect((await ai(req, 'user-b')).success).toBe(true);
  });

  test('window resets after it expires', () => {
    jest.useFakeTimers();
    try {
      const key = `test-window-${uniqueIp()}`;
      expect(consumeRateLimit(key, 1, '1s').success).toBe(true);
      expect(consumeRateLimit(key, 1, '1s').success).toBe(false);
      jest.advanceTimersByTime(1001);
      expect(consumeRateLimit(key, 1, '1s').success).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  test('credentials attempts are limited per email, case-insensitively', () => {
    const email = `Someone${++counter}@Example.com`;
    for (let i = 0; i < 5; i++) {
      expect(consumeCredentialsAttempt(email).success).toBe(true);
    }
    expect(consumeCredentialsAttempt(email.toLowerCase()).success).toBe(false);
  });
});

describe('getClientIp', () => {
  test('prefers x-real-ip over a client-supplied x-forwarded-for', () => {
    const req = requestFrom('203.0.113.7', { 'x-forwarded-for': '1.2.3.4' });
    expect(getClientIp(req)).toBe('203.0.113.7');
  });

  test('falls back to the first x-forwarded-for entry', () => {
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '198.51.100.1, 10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('198.51.100.1');
  });
});

describe('rateLimitExceededResponse', () => {
  test('returns 429 with rate-limit and Retry-After headers', async () => {
    const res = rateLimitExceededResponse(
      { success: false, limit: 5, remaining: 0, reset: Date.now() + 30_000 },
      'slow down'
    );
    expect(res.status).toBe(429);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    expect(Number(res.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await res.json()).toEqual({ success: false, error: 'slow down' });
  });

  test('uses a route-specific body when given', async () => {
    const res = rateLimitExceededResponse(
      { success: false, limit: 5, remaining: 0, reset: Date.now() + 30_000 },
      'slow down',
      { success: false, error: { code: 'RATE_LIMITED', message: 'slow down' } }
    );
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ success: false, error: { code: 'RATE_LIMITED', message: 'slow down' } });
  });
});
