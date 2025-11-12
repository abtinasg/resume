import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const badges = [
  {
    name: 'First Steps',
    description: 'Analyzed your first resume',
    icon: '🎯',
    criteria: JSON.stringify({ type: 'resume_count', value: 1 }),
    rarity: 'common',
  },
  {
    name: 'Getting Started',
    description: 'Analyzed 3 different resumes',
    icon: '📝',
    criteria: JSON.stringify({ type: 'resume_count', value: 3 }),
    rarity: 'common',
  },
  {
    name: 'Resume Pro',
    description: 'Analyzed 10 different resumes',
    icon: '🏆',
    criteria: JSON.stringify({ type: 'resume_count', value: 10 }),
    rarity: 'rare',
  },
  {
    name: 'Excellence',
    description: 'Achieved a resume score of 90+',
    icon: '⭐',
    criteria: JSON.stringify({ type: 'score_threshold', value: 90 }),
    rarity: 'epic',
  },
  {
    name: 'Perfectionist',
    description: 'Achieved a perfect score of 100',
    icon: '💎',
    criteria: JSON.stringify({ type: 'score_threshold', value: 100 }),
    rarity: 'legendary',
  },
  {
    name: 'Consistent',
    description: 'Logged in for 3 consecutive days',
    icon: '🔥',
    criteria: JSON.stringify({ type: 'consecutive_days', value: 3 }),
    rarity: 'rare',
  },
  {
    name: 'Dedicated',
    description: 'Logged in for 7 consecutive days',
    icon: '💪',
    criteria: JSON.stringify({ type: 'consecutive_days', value: 7 }),
    rarity: 'epic',
  },
  {
    name: 'Profile Complete',
    description: 'Completed your user profile',
    icon: '✅',
    criteria: JSON.stringify({ type: 'profile_complete', value: true }),
    rarity: 'common',
  },
  {
    name: 'Early Adopter',
    description: 'One of the first 100 users',
    icon: '🚀',
    criteria: JSON.stringify({ type: 'user_id', value: 100 }),
    rarity: 'legendary',
  },
  {
    name: 'Overachiever',
    description: 'Scored 95+ on 3 different resumes',
    icon: '🌟',
    criteria: JSON.stringify({ type: 'high_scores', value: 3, threshold: 95 }),
    rarity: 'epic',
  },
];

async function main() {
  console.log('Starting badge seeding...');

  for (const badge of badges) {
    const existing = await prisma.badge.findUnique({
      where: { name: badge.name },
    });

    if (!existing) {
      await prisma.badge.create({
        data: badge,
      });
      console.log(`✓ Created badge: ${badge.name}`);
    } else {
      console.log(`- Badge already exists: ${badge.name}`);
    }
  }

  console.log('Badge seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding badges:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
