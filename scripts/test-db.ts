import { userService } from '../lib/db/user';
import { resumeService } from '../lib/db/resume';
import { eventLogger, EventType } from '../lib/services/event-logger';

async function testDatabase() {
  console.log('🧪 Testing Agent v2 Database Schema...\n');

  try {
    // 1. Create user with password
    console.log('1️⃣ Creating test user...');
    const user = await userService.create({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'test123456',
    });
    console.log(`   ✅ User created: ${user.id}`);
    console.log(`   ✅ Profile created with strategy mode: ${user.profile?.currentStrategyMode}`);

    // 2. Create resume with Json fields
    console.log('\n2️⃣ Creating resume version...');
    const resume = await resumeService.create(user.id, {
      versionNumber: 1,
      name: 'My Resume v1',
      content: {
        text: 'Sample resume content',
        sections: {
          summary: 'Experienced software engineer with 5 years of experience',
          experience: [
            {
              company: 'Tech Corp',
              role: 'Software Engineer',
              duration: '2020-2023',
              bullets: [
                'Built scalable microservices',
                'Improved performance by 40%'
              ]
            }
          ],
          skills: ['JavaScript', 'TypeScript', 'React', 'Node.js']
        }
      },
      overallScore: 72,
      sectionScores: {
        summary: 80,
        experience: 75,
        skills: 70,
        education: 65,
        formatting: 80,
      },
      improvementAreas: [
        'Add more quantified metrics',
        'Strengthen leadership examples',
        'Expand technical depth'
      ],
      targetRoles: ['Software Engineer', 'Full Stack Developer'],
    });
    console.log(`   ✅ Resume created: ${resume.id}`);
    console.log(`   ✅ Is master: ${resume.isMaster}`);
    console.log(`   ✅ Improvement areas: ${(resume.improvementAreas as string[]).length} items`);

    // 3. Log events with Prisma EventType enum
    console.log('\n3️⃣ Logging events...');
    await eventLogger.log({
      userId: user.id,
      eventType: EventType.RESUME_UPLOADED,
      context: {
        resumeId: resume.id,
        versionNumber: 1,
        fileName: 'resume.pdf'
      },
    });
    await eventLogger.log({
      userId: user.id,
      eventType: EventType.RESUME_SCORED,
      context: {
        resumeId: resume.id,
        score: 72,
        sectionScores: resume.sectionScores
      },
    });
    await eventLogger.log({
      userId: user.id,
      eventType: EventType.STRATEGY_MODE_CHANGED,
      context: {
        from: null,
        to: 'IMPROVE_RESUME_FIRST',
        reason: 'Initial onboarding - score below 75'
      },
      metadata: {
        triggeredBy: 'system',
        resumeScore: 72
      },
    });
    console.log('   ✅ 3 events logged');

    // 4. Verify data retrieval
    console.log('\n4️⃣ Verifying data...');
    const foundUser = await userService.findByEmail(user.email);
    console.log(`   ✅ User found by email: ${foundUser?.email}`);

    const latestResume = await resumeService.findLatestByUser(user.id);
    console.log(`   ✅ Latest resume found: v${latestResume?.versionNumber}`);

    const events = await eventLogger.getUserEvents(user.id);
    console.log(`   ✅ Events found: ${events.length}`);

    const strategyEvents = await eventLogger.getEventsByType(
      user.id,
      EventType.STRATEGY_MODE_CHANGED
    );
    console.log(`   ✅ Strategy change events: ${strategyEvents.length}`);

    // 5. Test NEW getEventStats method
    console.log('\n5️⃣ Testing event stats...');
    const stats = await eventLogger.getEventStats(user.id);
    console.log(`   ✅ Event stats:`, stats);

    // 6. Test password verification
    console.log('\n6️⃣ Testing password verification...');
    const validPassword = await userService.verifyPassword(user.email, 'test123456');
    const invalidPassword = await userService.verifyPassword(user.email, 'wrongpassword');
    console.log(`   ✅ Valid password: ${validPassword}`);
    console.log(`   ✅ Invalid password rejected: ${!invalidPassword}`);

    console.log('\n✅ All database tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Resume ID: ${resume.id}`);
    console.log(`   - Events logged: ${events.length}`);
    console.log(`   - Strategy mode: ${user.profile?.currentStrategyMode}`);
    console.log(`   - Improvement areas: ${(resume.improvementAreas as string[]).length}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testDatabase()
  .then(() => {
    console.log('\n✅ Test script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
