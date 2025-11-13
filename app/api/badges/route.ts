import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllBadges } from '@/lib/badgeService';

export async function GET(request: Request) {
  try {
    // Get token from cookies for authentication
    const token = request.headers.get('cookie')?.match(/token=([^;]+)/)?.[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const badges = await getAllBadges();
    return NextResponse.json({ badges });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}
