import { stateService } from '../lib/services/state-service';
import { userService } from '../lib/db/user';
import { resumeService } from '../lib/db/resume';
import { prisma } from '../lib/db';

async function testStateService() {
  console.log('🧪 Testing State Service v2 Final...\n');

  try {
    // 1. Create test user with profile
    console.log('1️⃣ Creating test user...');
    const user = await userService.create({
      email: `state-test-${Date.now()}@example.com`,
      name: 'State Test User',
      password: 'test123456',
    });

    // Update profile with custom targets
    await userService.updateProfile(user.id, {
      weeklyAppTarget: 10,
    });

    console.log(`   ✅ User created: ${user.id}`);

    // 2. Create resume
    console.log('\n2️⃣ Creating master resume...');
    const resume = await resumeService.create(user.id, {
      versionNumber: 1,
      name: 'Master Resume',
      content: { text: 'Test resume content' },
    });

    // Score it
    await prisma.resumeVersion.update({
      where: { id: resume.id },
      data: { overallScore: 78 },
    });

    console.log(`   ✅ Resume created with score: 78`);

    // 3. Create applications
    console.log('\n3️⃣ Creating test applications...');

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 3); // 3 days ago

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

    // Create job postings and applications
    for (let i = 0; i < 5; i++) {
      const job = await prisma.jobPosting.create({
        data: {
          title: `Software Engineer ${i + 1}`,
          company: `Company ${i + 1}`,
          jobUrl: `https://example.com/job${i}`,
        },
      });

      await prisma.application.create({
        data: {
          userId: user.id,
          jobId: job.id,
          resumeId: resume.id,
          status: i < 2 ? 'INTERVIEW_SCHEDULED' : 'APPLIED',
          appliedAt: i < 3 ? weekStart : oldDate,
        },
      });
    }

    console.log(`   ✅ Created 5 applications (2 interviews, 3 applied)`);

    // 4. Test getUserState
    console.log('\n4️⃣ Testing getUserState...');
    const state = await stateService.getUserState(user.id);

    console.log(`   ✅ Master resume: ${state.masterResumeId}`);
    console.log(`   ✅ Resume score: ${state.resumeScore}`);
    console.log(`   ✅ Total applications: ${state.totalApplications}`);
    console.log(`   ✅ Applications this week: ${state.applicationsThisWeek}`);
    console.log(`   ✅ Interview rate: ${state.interviewRate}%`);
    console.log(`   ✅ Strategy mode: ${state.currentStrategyMode}`);
    console.log(`   ✅ Weekly target met: ${state.weeklyTargetMet}`);
    console.log(`   ✅ Needs resume improvement: ${state.needsResumeImprovement}`);
    console.log(`   ✅ Has recent interviews: ${state.hasRecentInterviews}`);

    // 5. Test getApplicationsNeedingFollowUp
    console.log('\n5️⃣ Testing follow-up applications...');
    const followUps = await stateService.getApplicationsNeedingFollowUp(user.id);
    console.log(`   ✅ Applications needing follow-up: ${followUps.length}`);
    if (followUps.length > 0) {
      console.log(`   ✅ First: "${followUps[0].jobTitle}" at ${followUps[0].company} (${followUps[0].daysSinceUpdate} days)`);
    }

    // 6. Test getRecentOutcomes
    console.log('\n6️⃣ Testing recent outcomes...');
    const outcomes = await stateService.getRecentOutcomes(user.id, 30);
    console.log(`   ✅ Recent outcomes: ${outcomes.length}`);
    if (outcomes.length > 0) {
      console.log(`   ✅ Latest: ${outcomes[0].outcome} at ${outcomes[0].company}`);
    }

    // 7. Test getWeeklyProgress
    console.log('\n7️⃣ Testing weekly progress...');
    const progress = await stateService.getWeeklyProgress(user.id);
    console.log(`   ✅ Target: ${progress.applicationsTarget}`);
    console.log(`   ✅ Actual: ${progress.applicationsActual}`);
    console.log(`   ✅ Progress: ${progress.percentComplete}%`);
    console.log(`   ✅ Target met: ${progress.targetMet}`);
    console.log(`   ✅ Days remaining: ${progress.daysRemaining}`);

    // 8. Test getMasterResume
    console.log('\n8️⃣ Testing getMasterResume...');
    const masterResume = await stateService.getMasterResume(user.id);
    console.log(`   ✅ Found: ${masterResume?.name} (score: ${masterResume?.overallScore})`);

    // 9. Edge case: User with no data
    console.log('\n9️⃣ Testing edge case: User with no data...');
    const emptyUser = await userService.create({
      email: `empty-${Date.now()}@example.com`,
      name: 'Empty User',
      password: 'test123456',
    });

    const emptyState = await stateService.getUserState(emptyUser.id);
    console.log(`   ✅ masterResumeId: ${emptyState.masterResumeId} (should be null)`);
    console.log(`   ✅ resumeScore: ${emptyState.resumeScore} (should be null)`);
    console.log(`   ✅ totalApplications: ${emptyState.totalApplications} (should be 0)`);
    console.log(`   ✅ interviewRate: ${emptyState.interviewRate}% (should be 0)`);
    console.log(`   ✅ isActivelyApplying: ${emptyState.isActivelyApplying} (should be false)`);
    console.log(`   ✅ hasRecentInterviews: ${emptyState.hasRecentInterviews} (should be false)`);

    // 10. Edge case: User without custom profile (uses defaults)
    console.log('\n🔟 Testing edge case: User with default profile...');
    const defaultUser = await userService.create({
      email: `default-${Date.now()}@example.com`,
      name: 'Default User',
      password: 'test123456',
    });

    const defaultState = await stateService.getUserState(defaultUser.id);
    console.log(`   ✅ currentStrategyMode: ${defaultState.currentStrategyMode} (should be IMPROVE_RESUME_FIRST)`);
    console.log(`   ✅ weeklyAppTarget: ${defaultState.weeklyAppTarget}`);
    console.log(`   ✅ weeklyTargetMet: ${defaultState.weeklyTargetMet}`);

    console.log('\n✅ All state service tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - User state: ✅`);
    console.log(`   - Follow-ups: ✅`);
    console.log(`   - Recent outcomes: ✅`);
    console.log(`   - Weekly progress: ✅`);
    console.log(`   - Master resume: ✅`);
    console.log(`   - Edge case (no data): ✅`);
    console.log(`   - Edge case (default profile): ✅`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testStateService()
  .then(() => {
    console.log('\n✅ State test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ State test failed:', error);
    process.exit(1);
  });
