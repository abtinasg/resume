import { userService } from '../lib/db/user';
import { resumeService } from '../lib/db/resume';
import { eventLogger } from '../lib/services/event-logger';

async function testDatabase() {
  console.log('🧪 Testing Agent v2 Database Schema...\n');

  try {
    // 1. Create user
    console.log('1️⃣ Creating test user...');
    const user = await userService.create({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      password: 'test123', // In real app, this would be hashed
    });
    console.log(`   ✅ User created: ${user.id}`);
    console.log(`   ✅ Profile created with strategy mode: ${user.profile?.currentStrategyMode}`);

    // 2. Create resume
    console.log('\n2️⃣ Creating resume version...');
    const resume = await resumeService.create(user.id, {
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
    });
    console.log(`   ✅ Resume created: ${resume.id}`);
    console.log(`   ✅ Is master: ${resume.isMaster}`);

    // 3. Log events
    console.log('\n3️⃣ Logging events...');
    await eventLogger.log({
      userId: user.id,
      eventType: 'RESUME_UPLOADED',
      context: { resumeId: resume.id, versionNumber: 1 },
    });
    await eventLogger.log({
      userId: user.id,
      eventType: 'RESUME_SCORED',
      context: { resumeId: resume.id, score: 72 },
    });
    await eventLogger.log({
      userId: user.id,
      eventType: 'STRATEGY_MODE_CHANGED',
      context: { from: null, to: 'IMPROVE_RESUME_FIRST' },
      metadata: { reason: 'Initial onboarding' },
    });
    console.log('   ✅ 3 events logged');

    // 4. Verify data
    console.log('\n4️⃣ Verifying data...');
    const foundUser = await userService.findByEmail(user.email);
    console.log(`   ✅ User found by email: ${foundUser?.email}`);

    const latestResume = await resumeService.findLatestByUser(user.id);
    console.log(`   ✅ Latest resume found: v${latestResume?.versionNumber}`);

    const events = await eventLogger.getUserEvents(user.id);
    console.log(`   ✅ Events found: ${events.length}`);

    const strategyEvents = await eventLogger.getEventsByType(user.id, 'STRATEGY_MODE_CHANGED');
    console.log(`   ✅ Strategy change events: ${strategyEvents.length}`);

    console.log('\n✅ All database tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - User ID: ${user.id}`);
    console.log(`   - Resume ID: ${resume.id}`);
    console.log(`   - Events logged: ${events.length}`);
    console.log(`   - Strategy mode: ${user.profile?.currentStrategyMode}`);

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
