/**
 * CSRF Protection Utility
 *
 * Provides CSRF token generation and validation for API routes.
 * Uses double-submit cookie pattern for stateless CSRF protection.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = '_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate CSRF token from request header against cookie
 * Uses double-submit cookie pattern.
 *
 * @param request - The incoming request
 * @returns true if valid, false if invalid
 */
export function validateCsrfToken(request: NextRequest): boolean {
  // Only validate for state-changing methods
  const method = request.method.toUpperCase();
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return true;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cookieToken),
      Buffer.from(headerToken)
    );
  } catch {
    return false;
  }
}

/**
 * Middleware helper: set CSRF cookie on response if not already set
 */
export function setCsrfCookie(response: NextResponse, request: NextRequest): NextResponse {
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!existingToken) {
    const token = generateCsrfToken();
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JS to include in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }

  return response;
}

/**
 * Wrap an API route handler with CSRF validation.
 * Returns 403 if CSRF token is missing or invalid for state-changing methods.
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'CSRF token invalid or missing' },
        { status: 403 }
      );
    }
    return handler(request);
  };
}
