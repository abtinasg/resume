// Simple test without path aliases
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing Agent v2 Database Schema...\n');

  try {
    // 1. Create user
    console.log('1️⃣ Creating test user...');

    const hashedPassword = await bcrypt.hash('test123456', 10);

    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: hashedPassword,
        profile: {
          create: {
            currentStrategyMode: 'IMPROVE_RESUME_FIRST',
            weeklyAppTarget: 5,
          },
        },
      },
      include: { profile: true },
    });

    console.log(`   ✅ User created: ${user.id}`);
    console.log(`   ✅ Profile created: ${user.profile?.currentStrategyMode}`);

    // 2. Create resume
    console.log('\n2️⃣ Creating resume version...');

    const resume = await prisma.resumeVersion.create({
      data: {
        userId: user.id,
        versionNumber: 1,
        name: 'My Resume v1',
        content: {
          text: 'Sample resume content',
          sections: {
            summary: 'Experienced developer',
            experience: [],
            skills: ['JavaScript', 'TypeScript', 'React']
          }
        },
        overallScore: 72,
        targetRoles: ['Software Engineer', 'Full Stack Developer'],
        improvementAreas: ['Add metrics', 'More leadership'],
        isMaster: true,
      },
    });

    console.log(`   ✅ Resume created: ${resume.id}`);
    console.log(`   ✅ Is master: ${resume.isMaster}`);

    // 3. Log events
    console.log('\n3️⃣ Logging events...');

    await prisma.interactionEvent.create({
      data: {
        userId: user.id,
        eventType: 'RESUME_UPLOADED',
        context: { resumeId: resume.id, versionNumber: 1 },
      },
    });

    await prisma.interactionEvent.create({
      data: {
        userId: user.id,
        eventType: 'RESUME_SCORED',
        context: { resumeId: resume.id, score: 72 },
      },
    });

    await prisma.interactionEvent.create({
      data: {
        userId: user.id,
        eventType: 'STRATEGY_MODE_CHANGED',
        context: { from: null, to: 'IMPROVE_RESUME_FIRST' },
        metadata: { reason: 'Initial onboarding' },
      },
    });

    console.log('   ✅ 3 events logged');

    // 4. Verify data
    console.log('\n4️⃣ Verifying data...');

    const foundUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: { profile: true },
    });
    console.log(`   ✅ User found: ${foundUser?.email}`);

    const latestResume = await prisma.resumeVersion.findFirst({
      where: { userId: user.id },
      orderBy: { versionNumber: 'desc' },
    });
    console.log(`   ✅ Latest resume: v${latestResume?.versionNumber}`);

    const events = await prisma.interactionEvent.findMany({
      where: { userId: user.id },
    });
    console.log(`   ✅ Events found: ${events.length}`);

    // 5. Test password verification
    console.log('\n5️⃣ Testing password verification...');

    const isValid = await bcrypt.compare('test123456', user.password!);
    console.log(`   ✅ Password verification: ${isValid}`);

    console.log('\n✅ All database tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Resume ID: ${resume.id}`);
    console.log(`   - Events logged: ${events.length}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
