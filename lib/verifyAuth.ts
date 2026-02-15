/**
 * Auth verification helper for API routes.
 * Checks JWT token from cookie and returns the authenticated user's ID.
 */

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export interface AuthResult {
  isValid: boolean;
  userId?: string;
  email?: string;
}

/**
 * Verify authentication from request.
 * Checks both legacy JWT cookies and NextAuth sessions.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  // Check legacy JWT token from cookie
  const token = request.cookies.get('token')?.value;
  if (token) {
    const decoded = verifyToken(token);
    if (decoded?.userId) {
      return { isValid: true, userId: decoded.userId, email: decoded.email };
    }
  }

  // Check NextAuth session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      return {
        isValid: true,
        userId: session.user.id,
        email: session.user.email || undefined,
      };
    }
  } catch {
    // NextAuth session check failed
  }

  return { isValid: false };
}
