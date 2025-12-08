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
    const { bullets, sectionTitle, targetRole, context } = body;

    if (!bullets || !Array.isArray(bullets)) {
      return NextResponse.json(
        { success: false, error: 'bullets array is required' },
        { status: 400 }
      );
    }

    if (!sectionTitle) {
      return NextResponse.json(
        { success: false, error: 'sectionTitle is required' },
        { status: 400 }
      );
    }

    const result = await rewriteService.rewriteSection({
      bullets,
      sectionTitle,
      targetRole,
      context,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Section rewrite error:', error);

    const errorMessage = (error as Error).message;

    if (
      errorMessage.includes('Section') ||
      errorMessage.includes('Maximum') ||
      errorMessage.includes('at least one')
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
