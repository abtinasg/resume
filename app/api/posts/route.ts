import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/verifyAuth';

export const runtime = 'nodejs';

/**
 * Posts API - Feature not yet implemented
 */
export async function GET(req: NextRequest) {
  // Auth check
  const auth = await verifyAuth(req);
  if (!auth.isValid || !auth.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Posts feature is not yet implemented',
      },
    },
    { status: 501 }
  );
}

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await verifyAuth(req);
  if (!auth.isValid || !auth.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Posts feature is not yet implemented',
      },
    },
    { status: 501 }
  );
}

export async function PUT(req: NextRequest) {
  // Auth check
  const auth = await verifyAuth(req);
  if (!auth.isValid || !auth.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: 'Posts feature is not yet implemented',
      },
    },
    { status: 501 }
  );
}
