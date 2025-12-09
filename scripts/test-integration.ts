import { userService } from '../lib/db/user';
import { resumeService } from '../lib/db/resume';
import { scoringService } from '../lib/services/scoring-service';
import { rewriteService } from '../lib/services/rewrite-service';
import { stateService } from '../lib/services/state-service';
import { eventLogger } from '../lib/services/event-logger';
import { prisma } from '../lib/db';

async function testIntegration() {
  console.log('🧪 Integration Testing: All Services...\n');

  try {
    // Workflow 1: Resume Improvement
    console.log('📝 Workflow 1: Resume Improvement Flow');
    await testResumeImprovementFlow();

    console.log('\n📊 Workflow 2: Application Management Flow');
    await testApplicationManagementFlow();

    console.log('\n🎯 Workflow 3: Job Matching & Scoring');
    await testJobMatchingFlow();

    console.log('\n✅ All integration tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   - Workflow 1: Resume improvement ✅');
    console.log('   - Workflow 2: Application management ✅');
    console.log('   - Workflow 3: Job matching ✅');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
    throw error;
  }
}

async function testResumeImprovementFlow() {
  console.log('   Step 1: Creating test user...');
  const user = await userService.create({
    email: `integration-test-${Date.now()}@example.com`,
    name: 'Integration Test User',
    password: 'test123456',
  });
  console.log(`   ✅ User created: ${user.id}`);

  console.log('   Step 2: Creating resume...');
  const resume = await resumeService.create(user.id, {
    versionNumber: 1,
    name: 'Test Resume',
    content: {
      summary: 'Experienced software engineer with 3+ years building scalable backend systems using modern technologies and cloud infrastructure.',
      sections: {
        experience: [
          {
            role: 'Software Engineer',
            company: 'TechCorp',
            duration: '2021-2024',
            bullets: [
              'Worked on backend systems processing over 10,000 requests per day using Node.js and PostgreSQL',
              'Fixed critical production bugs reducing system downtime by 30% through improved error handling',
              'Helped with deployments automating CI/CD pipeline reducing deployment time from 2 hours to 15 minutes',
              'Collaborated with cross-functional teams to deliver 5 major features on time and under budget',
              'Mentored 2 junior developers improving team code quality and development practices',
            ],
          },
        ],
        skills: ['JavaScript', 'Python', 'AWS', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'REST APIs'],
        education: [
          {
            degree: 'Bachelor of Science in Computer Science',
            school: 'University of Technology',
            year: '2021',
          },
        ],
      },
    },
  });
  console.log(`   ✅ Resume created: ${resume.id}`);

  console.log('   Step 3: Scoring resume (initial)...');
  const scoreResult1 = await scoringService.scoreAndPersistResume({
    userId: user.id,
    resumeId: resume.id,
    targetRole: 'Software Engineer',
  });
  console.log(`   ✅ Initial score: ${scoreResult1.scoring.overallScore}/100`);

  console.log('   Step 4: Rewriting weak bullets...');
  const bulletResult = await rewriteService.rewriteBullet({
    bullet: 'Worked on backend systems',
    targetRole: 'Backend Engineer',
  });
  console.log(`   ✅ Bullet improved: "${bulletResult.improved}"`);
  console.log(`   ✅ Score improvement: +${bulletResult.scoreImprovement}`);

  console.log('   Step 5: Updating resume with improved bullet...');
  const updatedContent = { ...resume.content };
  updatedContent.sections.experience[0].bullets[0] = bulletResult.improved;

  const updatedResume = await resumeService.create(user.id, {
    versionNumber: 2,
    name: 'Improved Resume',
    content: updatedContent,
  });

  console.log('   Step 6: Scoring improved resume...');
  const scoreResult2 = await scoringService.scoreAndPersistResume({
    userId: user.id,
    resumeId: updatedResume.id,
    targetRole: 'Software Engineer',
  });
  console.log(`   ✅ New score: ${scoreResult2.scoring.overallScore}/100`);

  const improvement = scoreResult2.scoring.overallScore - scoreResult1.scoring.overallScore;
  console.log(`   ✅ Total improvement: +${improvement} points`);

  if (improvement < 0) {
    throw new Error('Score should improve after rewrite!');
  }

  console.log('   Step 7: Verifying state reflects changes...');
  const state = await stateService.getUserState(user.id);
  console.log(`   ✅ State resume score: ${state.resumeScore}`);

  if (state.resumeScore !== scoreResult2.scoring.overallScore) {
    throw new Error('State score mismatch!');
  }

  console.log('   ✅ Workflow 1 complete!');
}

async function testApplicationManagementFlow() {
  console.log('   Step 1: Creating test user with profile...');
  const user = await userService.create({
    email: `app-test-${Date.now()}@example.com`,
    name: 'App Test User',
    password: 'test123456',
  });

  await userService.updateProfile(user.id, {
    weeklyAppTarget: 10,
    currentStrategyMode: 'APPLY_MODE',
  });
  console.log(`   ✅ User created with profile: ${user.id}`);

  console.log('   Step 2: Creating master resume...');
  const resume = await resumeService.create(user.id, {
    versionNumber: 1,
    name: 'Master Resume',
    isMaster: true,
    content: {
      summary: 'Senior backend engineer with 5 years of experience building high-performance distributed systems. Expert in Node.js, PostgreSQL, and cloud infrastructure with proven track record of improving system reliability and team productivity.',
      sections: {
        experience: [
          {
            role: 'Senior Backend Engineer',
            company: 'TechCorp',
            duration: '2019-2024',
            bullets: [
              'Led team of 5 engineers delivering microservices architecture serving 1M+ daily active users',
              'Increased system performance by 40% through database optimization and caching strategies reducing response time from 500ms to 300ms',
              'Designed and implemented microservices architecture using Kubernetes reducing deployment complexity by 50%',
              'Established coding standards and review processes improving code quality scores from 65% to 90%',
              'Mentored junior engineers through pair programming and code reviews accelerating their growth by 6 months',
            ],
          },
        ],
        skills: ['Node.js', 'PostgreSQL', 'Kubernetes', 'Docker', 'Redis', 'AWS', 'Microservices', 'System Design'],
        education: [
          {
            degree: 'Master of Science in Computer Science',
            school: 'Tech University',
            year: '2019',
          },
        ],
      },
    },
  });

  await scoringService.scoreAndPersistResume({
    userId: user.id,
    resumeId: resume.id,
    targetRole: 'Software Engineer',
  });
  console.log(`   ✅ Master resume created and scored`);

  console.log('   Step 3: Creating test applications...');
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

  // Create jobs
  const job1 = await prisma.jobPosting.create({
    data: {
      title: 'Senior Backend Engineer',
      company: 'Company A',
      jobUrl: 'https://example.com/job1',
    },
  });

  const job2 = await prisma.jobPosting.create({
    data: {
      title: 'Backend Engineer',
      company: 'Company B',
      jobUrl: 'https://example.com/job2',
    },
  });

  // Old applications (need follow-up)
  await prisma.application.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      jobId: job1.id,
      status: 'INTERVIEW_SCHEDULED',
      appliedAt: tenDaysAgo,
    },
  });

  await prisma.application.create({
    data: {
      userId: user.id,
      resumeId: resume.id,
      jobId: job2.id,
      status: 'INTERVIEW_SCHEDULED',
      appliedAt: weekAgo,
    },
  });

  // Recent applications (this week)
  for (let i = 0; i < 3; i++) {
    const job = await prisma.jobPosting.create({
      data: {
        title: `Backend Engineer ${i}`,
        company: `Company ${i}`,
        jobUrl: `https://example.com/job${i}`,
      },
    });

    await prisma.application.create({
      data: {
        userId: user.id,
        resumeId: resume.id,
        jobId: job.id,
        status: 'INTERVIEW_SCHEDULED',
        appliedAt: now,
      },
    });
  }

  console.log(`   ✅ Created 5 applications (2 old, 3 recent)`);

  console.log('   Step 4: Testing getUserState...');
  const state = await stateService.getUserState(user.id);
  console.log(`   ✅ Total applications: ${state.totalApplications}`);
  console.log(`   ✅ Applications this week: ${state.applicationsThisWeek}`);
  console.log(`   ✅ Strategy mode: ${state.currentStrategyMode}`);
  console.log(`   ✅ Weekly target: ${state.weeklyAppTarget}`);

  if (state.totalApplications !== 5) {
    throw new Error(`Expected 5 applications, got ${state.totalApplications}`);
  }

  if (state.applicationsThisWeek !== 3) {
    throw new Error(`Expected 3 this week, got ${state.applicationsThisWeek}`);
  }

  console.log('   Step 5: Testing follow-up detection...');
  const followUps = await stateService.getApplicationsNeedingFollowUp(user.id);
  console.log(`   ✅ Applications needing follow-up: ${followUps.length}`);

  if (followUps.length !== 2) {
    throw new Error(`Expected 2 follow-ups, got ${followUps.length}`);
  }

  console.log('   Step 6: Testing weekly progress...');
  const progress = await stateService.getWeeklyProgress(user.id);
  console.log(`   ✅ Target: ${progress.target}`);
  console.log(`   ✅ Actual: ${progress.actual}`);
  console.log(`   ✅ Progress: ${progress.progressPercentage}%`);

  console.log('   ✅ Workflow 2 complete!');
}

async function testJobMatchingFlow() {
  console.log('   Step 1: Creating test user...');
  const user = await userService.create({
    email: `job-test-${Date.now()}@example.com`,
    name: 'Job Test User',
    password: 'test123456',
  });

  console.log('   Step 2: Creating resume...');
  const resume = await resumeService.create(user.id, {
    versionNumber: 1,
    name: 'Test Resume',
    content: {
      summary: 'Backend engineer with 4 years of experience specializing in Python, AWS, and PostgreSQL. Proven track record of building scalable REST APIs and optimizing database performance for high-traffic applications.',
      sections: {
        experience: [
          {
            role: 'Backend Engineer',
            company: 'StartupCo',
            duration: '2020-2024',
            bullets: [
              'Built REST APIs using Python and Flask handling 50,000+ requests per day with 99.9% uptime',
              'Deployed serverless services on AWS Lambda reducing infrastructure costs by 35% while improving scalability',
              'Optimized database queries in PostgreSQL reducing query time from 2 seconds to 200ms improving user experience',
              'Implemented automated testing with 90% code coverage reducing production bugs by 40%',
              'Collaborated with frontend team to design efficient API contracts improving development velocity',
            ],
          },
        ],
        skills: ['Python', 'AWS', 'PostgreSQL', 'Docker', 'Flask', 'Lambda', 'REST APIs', 'Redis'],
        education: [
          {
            degree: 'Bachelor of Science in Software Engineering',
            school: 'State University',
            year: '2020',
          },
        ],
      },
    },
  });

  console.log('   Step 3: Scoring resume (generic)...');
  const genericScore = await scoringService.scoreAndPersistResume({
    userId: user.id,
    resumeId: resume.id,
    targetRole: 'Software Engineer',
  });
  console.log(`   ✅ Generic score: ${genericScore.scoring.overallScore}/100`);

  console.log('   Step 4: Scoring for specific job...');
  const jobScore = await scoringService.scoreForJob({
    userId: user.id,
    resumeId: resume.id,
    jobTitle: 'Backend Engineer',
    jobDescription: `
      We're looking for a Backend Engineer with strong Python experience.
      Required: Python, AWS, PostgreSQL, REST APIs
      Nice to have: Docker, Kubernetes, Redis
    `,
  });
  console.log(`   ✅ Job match score: ${jobScore.score}/100`);
  console.log(`   ✅ Recommendation: ${jobScore.recommendation}`);

  if (jobScore.strengths.length === 0) {
    throw new Error('Should identify strengths for matching job!');
  }

  console.log(`   ✅ Strengths: ${jobScore.strengths.join(', ')}`);

  if (jobScore.gaps.length > 0) {
    console.log(`   ℹ️  Gaps: ${jobScore.gaps.join(', ')}`);
  }

  console.log('   ✅ Workflow 3 complete!');
}

testIntegration()
  .then(() => {
    console.log('\n✅ Integration testing completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Integration testing failed:', error);
    process.exit(1);
  });
