import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { stateService } from '@/lib/services/state-service';

export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user state
    const userState = await stateService.getUserState(session.user.id);

    return NextResponse.json({
      success: true,
      data: userState,
    });
  } catch (error) {
    console.error('State fetch error:', error);

    const errorMessage = (error as Error).message;

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
