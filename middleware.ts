import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenOnEdge } from '@/lib/edge/token';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

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

  // Admin route protection
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin role
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId as string) },
          select: { role: true },
        });

        if (user?.role !== 'admin') {
          // Redirect non-admin users to homepage with error message
          return NextResponse.redirect(new URL('/?error=access_denied', request.url));
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        // Redirect to homepage on error
        return NextResponse.redirect(new URL('/?error=server_error', request.url));
      }
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

  return NextResponse.next();
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
