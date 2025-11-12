import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './db';

export interface AdminAuthResult {
  isAuthorized: boolean;
  userId?: number;
  error?: string;
}

/**
 * Verify that the request is from an authenticated admin user
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

  // Get user from database and check role
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return { isAuthorized: false, error: 'Unauthorized - User not found' };
  }

  if (user.role !== 'admin') {
    return { isAuthorized: false, error: 'Forbidden - Admin access required' };
  }

  return { isAuthorized: true, userId: user.id };
}
