import { NextRequest } from 'next/server';
import { verifyToken } from './auth';
import { prisma } from './prisma';

export interface AdminAuthResult {
  isAuthorized: boolean;
  userId?: string;
  error?: string;
}

/**
 * Verify that the request is from an authenticated admin user.
 * Checks the user's role field in the database (RBAC).
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

  // Get user from database with role field
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, email: true, role: true },
  });

  if (!user) {
    return { isAuthorized: false, error: 'Unauthorized - User not found' };
  }

  // Check role-based access control
  if (user.role !== 'ADMIN') {
    return { isAuthorized: false, error: 'Forbidden - Admin access required' };
  }

  return { isAuthorized: true, userId: user.id };
}
