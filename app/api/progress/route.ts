import { NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '@/lib/auth';
import { getResumeProgress } from '@/lib/progress';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const progress = await getResumeProgress(decoded.userId);

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching resume progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resume progress' },
      { status: 500 }
    );
  }
}
