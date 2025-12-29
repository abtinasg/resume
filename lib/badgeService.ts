/**
 * Badge Service - Feature not yet available (Badge/UserBadge models not in schema)
 * Returns empty arrays and placeholder data
 */

export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  criteria: { type: string; value: number | boolean };
  earned: boolean;
  earnedAt: Date | null;
}

export async function checkAndAwardBadges(_userId: string | number): Promise<string[]> {
  // Badge models not in current schema - returning empty array
  return [];
}

export async function getUserBadges(_userId: string | number) {
  // Badge models not in current schema - returning empty array
  return [];
}

export async function getAllBadges() {
  // Badge models not in current schema - returning empty array
  return [];
}

export async function getAchievementsForUser(_userId: string | number): Promise<Achievement[]> {
  // Badge models not in current schema - returning empty array
  return [];
}
