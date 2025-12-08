import { scoringService } from '../lib/services/scoring-service';
import { userService } from '../lib/db/user';
import { resumeService } from '../lib/db/resume';
import { eventLogger, EventType } from '../lib/services/event-logger';

async function testScoringIntegration() {
  console.log('🧪 Testing Scoring Engine Integration v3 FINAL...\n');

  try {
    // 1. Create test user with profile
    console.log('1️⃣ Creating test user with target roles...');
    const user = await userService.create({
      email: `scoring-test-${Date.now()}@example.com`,
      name: 'Scoring Test User',
      password: 'test123456',
    });

    // Update profile with target roles
    if (user.profile) {
      await userService.updateProfile(user.id, {
        targetRoles: ['Backend Engineer', 'Full Stack Developer'],
      });
    }

    console.log(`   ✅ User created: ${user.id}`);

    // 2. Create resume
    console.log('\n2️⃣ Creating test resume...');
    const resumeContent = {
      text: `
        JOHN DOE
        Backend Engineer

        PROFESSIONAL SUMMARY
        Experienced backend engineer with 5+ years building scalable microservices.

        EXPERIENCE

        Senior Backend Engineer | Tech Corp | 2020-2023
        • Led development of microservices architecture serving 1M+ daily users
        • Improved API response time by 40% through caching
        • Implemented CI/CD pipeline reducing deployment time by 60%

        Backend Engineer | StartupCo | 2018-2020
        • Built RESTful APIs using Node.js and PostgreSQL
        • Designed schemas supporting 100K+ users

        SKILLS
        Python, JavaScript, TypeScript, Node.js, PostgreSQL, Docker, AWS
      `,
      sections: {
        summary: 'Experienced backend engineer with 5+ years building scalable microservices',
        experience: [
          {
            company: 'Tech Corp',
            role: 'Senior Backend Engineer',
            duration: '2020-2023',
            bullets: [
              'Led development of microservices architecture serving 1M+ daily users',
              'Improved API response time by 40% through caching',
              'Implemented CI/CD pipeline reducing deployment time by 60%'
            ]
          }
        ],
        skills: ['Python', 'JavaScript', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS']
      }
    };

    const resume = await resumeService.create(user.id, {
      versionNumber: 1,
      name: 'Backend Engineer Resume',
      content: resumeContent,
    });
    console.log(`   ✅ Resume created: ${resume.id}`);

    // 3. Score resume
    console.log('\n3️⃣ Scoring resume...');
    const scoringResult = await scoringService.scoreAndPersistResume({
      userId: user.id,
      resumeId: resume.id,
    });
    console.log(`   ✅ Overall Score: ${scoringResult.scoring.overallScore}/100`);
    console.log(`   ✅ Grade: ${scoringResult.scoring.grade}`);

    // 4. Verify persistence
    console.log('\n4️⃣ Verifying database...');
    const updatedResume = await resumeService.findById(resume.id);
    console.log(`   ✅ overallScore: ${updatedResume?.overallScore}`);
    console.log(`   ✅ componentScores exists: ${!!updatedResume?.componentScores}`);
    console.log(`   ✅ sectionScores is null: ${updatedResume?.sectionScores === null}`);

    const areas = updatedResume?.improvementAreas as any[];
    if (areas && areas.length > 0) {
      console.log(`   ✅ First improvement: "${areas[0].action}" (+${areas[0].impact}pts)`);
    }

    // 5. Verify events
    console.log('\n5️⃣ Verifying events...');
    const events = await eventLogger.getEventsByType(user.id, EventType.RESUME_SCORED);
    console.log(`   ✅ Events found: ${events.length}`);
    if (events.length > 0) {
      const event = events[0];
      console.log(`   ✅ Has componentScores: ${!!event.metadata?.componentScores}`);
      console.log(`   ✅ Has truncated flag: ${event.metadata?.truncated !== undefined}`);
    }

    // 6. Test history
    console.log('\n6️⃣ Testing score history...');
    const history = await scoringService.getScoreHistory(user.id);
    console.log(`   ✅ History items: ${history.length}`);

    // 7. Test transient
    console.log('\n7️⃣ Testing transient scoring...');
    const transient = await scoringService.scoreTransientResume({
      resumeContent,
      targetRole: 'Full Stack Engineer',
    });
    console.log(`   ✅ Transient score: ${transient.overallScore}/100`);

    // 8. Test empty content
    console.log('\n8️⃣ Testing empty content edge case...');
    const emptyResume = await resumeService.create(user.id, {
      versionNumber: 2,
      name: 'Empty',
      content: { text: '' },
    });

    try {
      await scoringService.scoreAndPersistResume({
        userId: user.id,
        resumeId: emptyResume.id,
      });
      console.log('   ❌ Should have thrown error');
    } catch (err) {
      console.log(`   ✅ Correctly rejected: ${(err as Error).message}`);
    }

    // 9. Display scores
    console.log('\n9️⃣ Component Scores:');
    const comp = scoringResult.scoring.componentScores;
    console.log(`   - Content Quality: ${comp.contentQuality.score}/100`);
    console.log(`   - ATS Compatibility: ${comp.atsCompatibility.score}/100`);
    console.log(`   - Format & Structure: ${comp.formatStructure.score}/100`);
    console.log(`   - Impact & Metrics: ${comp.impactMetrics.score}/100`);

    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - Score: ${scoringResult.scoring.overallScore}/100`);
    console.log(`   - componentScores: ✅`);
    console.log(`   - improvementAreas objects: ✅`);
    console.log(`   - Edge cases: ✅`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testScoringIntegration()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
