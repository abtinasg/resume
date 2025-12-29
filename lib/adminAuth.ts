import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export interface AdminAuthResult {
  isAuthorized: boolean;
  userId?: string;
  error?: string;
}

// Admin email whitelist - in production, this should come from environment or database
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];

/**
 * Verify that the request is from an authenticated admin user
 * Note: User model doesn't have a role field, so we check against admin email whitelist
 */
export async function verifyAdminAuth(
  request: NextRequest
): Promise<AdminAuthResult> {
  // Get token from cookies
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return { isAuthorized: false, error: 'Unauthorized - No token provided' };
  }

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded?.userId) {
    return { isAuthorized: false, error: 'Unauthorized - Invalid token' };
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true },
  });

  if (!user) {
    return { isAuthorized: false, error: 'Unauthorized - User not found' };
  }

  // Check if user email is in admin whitelist
  const isAdmin = ADMIN_EMAILS.includes(user.email);
  if (!isAdmin) {
    return { isAuthorized: false, error: 'Forbidden - Admin access required' };
  }

  return { isAuthorized: true, userId: user.id };
}
