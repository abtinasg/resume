import { Badge } from '@prisma/client';
import { prisma } from '@/lib/prisma';

interface BadgeCriteria {
  type: string;
  value: number | boolean;
  threshold?: number;
}

function parseBadgeCriteria(badge: Badge): BadgeCriteria {
  try {
    return JSON.parse(badge.criteria) as BadgeCriteria;
  } catch (error) {
    console.warn(`Failed to parse criteria for badge ${badge.name}:`, error);
    return { type: 'unknown', value: false };
  }
}

export async function checkAndAwardBadges(userId: number): Promise<string[]> {
  const newBadges: string[] = [];

  // Get all badges
  const allBadges = await prisma.badge.findMany();

  // Get user's existing badges
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
  });

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  // Get user's resumes for scoring
  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  for (const badge of allBadges) {
    // Skip if user already has this badge
    if (earnedBadgeIds.has(badge.id)) continue;

    const criteria = parseBadgeCriteria(badge);
    let earned = false;

    switch (criteria.type) {
      case 'resume_count':
        earned = resumes.length >= (criteria.value as number);
        break;

      case 'score_threshold':
        earned = resumes.some((r) => r.score >= (criteria.value as number));
        break;

      case 'high_scores':
        const highScores = resumes.filter(
          (r) => r.score >= (criteria.threshold || 95)
        );
        earned = highScores.length >= (criteria.value as number);
        break;

      case 'user_id':
        earned = userId <= (criteria.value as number);
        break;

      case 'profile_complete':
        const user = await prisma.user.findUnique({ where: { id: userId } });
        earned = !!(user?.name && user?.email);
        break;

      // consecutive_days would require tracking login dates
      // Placeholder for now
      case 'consecutive_days':
        // Would need a separate table or field to track daily logins
        earned = false;
        break;
    }

    if (earned) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
        },
      });
      newBadges.push(badge.name);
    }
  }

  return newBadges;
}

export async function getUserBadges(userId: number) {
  const userBadges = await prisma.userBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: 'desc' },
  });

  return userBadges.map((ub) => ({
    id: ub.badge.id,
    name: ub.badge.name,
    description: ub.badge.description,
    icon: ub.badge.icon,
    rarity: ub.badge.rarity,
    earnedAt: ub.earnedAt,
  }));
}

export async function getAllBadges() {
  const badges = await prisma.badge.findMany({
    orderBy: { rarity: 'asc' },
  });

  return badges.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    rarity: b.rarity,
  }));
}

export async function getAchievementsForUser(userId: number) {
  const [badges, userBadges] = await Promise.all([
    prisma.badge.findMany({
      orderBy: { rarity: 'asc' },
    }),
    prisma.userBadge.findMany({
      where: { userId },
    }),
  ]);

  const earnedBadgeMap = new Map(
    userBadges.map((badge) => [badge.badgeId, badge])
  );

  return badges.map((badge) => {
    const earned = earnedBadgeMap.get(badge.id);
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity,
      criteria: parseBadgeCriteria(badge),
      earned: Boolean(earned),
      earnedAt: earned?.earnedAt ?? null,
    };
  });
}
