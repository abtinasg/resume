import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenOnEdge } from '@/lib/edge/token';
import { getToken } from 'next-auth/jwt';

const CSRF_COOKIE_NAME = '_csrf_token';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/dashboard'];

// Define admin routes that require admin role
const adminRoutes = ['/admin'];

// Define auth routes that authenticated users shouldn't access
const authRoutes = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Force HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}${request.nextUrl.search}`,
      301
    );
  }

  // Check for both JWT token (legacy) and NextAuth session
  const jwtToken = request.cookies.get('token')?.value;

  let nextAuthToken = null;
  try {
    nextAuthToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
    });
  } catch (error) {
    console.error('Error retrieving NextAuth token in middleware:', error);
    nextAuthToken = null;
  }

  // Verify legacy JWT token if it exists
  let legacyUser = null;
  if (jwtToken) {
    try {
      legacyUser = await verifyTokenOnEdge(jwtToken);
    } catch (error) {
      console.error('Error verifying legacy token in middleware:', error);
      legacyUser = null;
    }
  }

  const hasLegacySession = !!legacyUser;
  const hasNextAuthSession = !!nextAuthToken;

  // User is authenticated if either legacy JWT or NextAuth session exists
  const isAuthenticated = hasLegacySession || hasNextAuthSession;

  // Get user ID from either token
  const userId = legacyUser?.userId || nextAuthToken?.sub;

  // Check if the current route is an admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Admin route protection with RBAC
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Edge-compatible role check using ADMIN_EMAILS env var
    // API-level admin routes also check the database role field via verifyAdminAuth
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
    const userEmail = legacyUser?.email || nextAuthToken?.email;
    if (!userEmail || !adminEmails.includes(userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Allow authenticated users to access auth routes for reauth flow
  // The login/register pages will handle showing appropriate UI for already authenticated users
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Set CSRF cookie on page navigations so frontend can include it in API requests
  const response = NextResponse.next();
  const existingCsrf = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingCsrf) {
    // Generate a random CSRF token using Web Crypto API (edge-compatible)
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Must be readable by JS to include in headers
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
