import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';

/**
 * GET /api/admin/badges
 * Get all badges with stats - Feature not yet available (Badge model not in schema)
 */
export async function GET(request: NextRequest) {
  // Verify admin auth
  const authResult = await verifyAdminAuth(request);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  // Return empty badges list since Badge model is not in current schema
  return NextResponse.json({
    badges: [],
    total: 0,
    message: 'Badge management feature is not yet available',
  });
}

/**
 * POST /api/admin/badges
 * Create a new badge - Feature not yet available (Badge model not in schema)
 */
export async function POST(request: NextRequest) {
  // Verify admin auth
  const authResult = await verifyAdminAuth(request);
  if (!authResult.isAuthorized) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.error?.includes('Forbidden') ? 403 : 401 }
    );
  }

  return NextResponse.json({
    message: 'Badge management feature is not yet available',
    error: 'Feature not implemented',
  }, { status: 501 });
}
