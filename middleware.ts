import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenOnEdge } from '@/lib/edge/token';
import { getToken } from 'next-auth/jwt';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/dashboard'];

// Define auth routes that authenticated users shouldn't access
const authRoutes = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for both JWT token (legacy) and NextAuth session
  const jwtToken = request.cookies.get('token')?.value;
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
  });

  // Verify legacy JWT token if it exists
  const legacyUser = jwtToken ? await verifyTokenOnEdge(jwtToken) : null;

  // User is authenticated if either legacy JWT or NextAuth session exists
  const isAuthenticated = !!(legacyUser || nextAuthToken);

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
