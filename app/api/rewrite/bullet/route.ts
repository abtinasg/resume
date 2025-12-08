import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { rewriteService } from '@/lib/services/rewrite-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bullet, targetRole, context } = body;

    if (!bullet) {
      return NextResponse.json(
        { success: false, error: 'bullet is required' },
        { status: 400 }
      );
    }

    const result = await rewriteService.rewriteBullet({
      bullet,
      targetRole,
      context,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Bullet rewrite error:', error);

    const errorMessage = (error as Error).message;

    if (
      errorMessage.includes('empty') ||
      errorMessage.includes('too long') ||
      errorMessage.includes('Bullet')
    ) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
