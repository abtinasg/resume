import { NextRequest, NextResponse } from 'next/server';

import { verifyToken } from '@/lib/auth';
import {
  checkAndAwardBadges,
  getAchievementsForUser,
} from '@/lib/badgeService';

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

    const newlyUnlocked = await checkAndAwardBadges(decoded.userId);
    const achievements = await getAchievementsForUser(decoded.userId);

    const earnedCount = achievements.filter((achievement) => achievement.earned).length;
    const completionRate = achievements.length
      ? parseFloat(((earnedCount / achievements.length) * 100).toFixed(2))
      : 0;

    return NextResponse.json({
      achievements,
      newlyUnlocked,
      summary: {
        total: achievements.length,
        earned: earnedCount,
        completionRate,
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
