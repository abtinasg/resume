import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllBadges } from '@/lib/badgeService';

export async function GET(request: Request) {
  try {
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
