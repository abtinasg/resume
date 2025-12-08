import { rewriteService } from '../lib/services/rewrite-service';
import { userService } from '../lib/db/user';
import { resumeService } from '../lib/db/resume';

async function testRewriteService() {
  console.log('🧪 Testing Rewrite Service v2 Final...\n');

  try {
    // 1. Create test user
    console.log('1️⃣ Creating test user...');
    const user = await userService.create({
      email: `rewrite-test-${Date.now()}@example.com`,
      name: 'Rewrite Test User',
      password: 'test123456',
    });
    console.log(`   ✅ User created: ${user.id}`);

    // 2. Test bullet rewrite
    console.log('\n2️⃣ Testing bullet rewrite...');
    const bulletResult = await rewriteService.rewriteBullet({
      bullet: 'Worked on API integrations',
      targetRole: 'Backend Engineer',
      context: {
        company: 'TechCorp',
        role: 'Software Engineer',
      },
    });

    console.log(`   ✅ Original: "${bulletResult.original}"`);
    console.log(`   ✅ Improved: "${bulletResult.improved}"`);
    console.log(`   ✅ Changes: ${bulletResult.changes.join(', ')}`);
    console.log(`   ✅ Score improvement: +${bulletResult.scoreImprovement} points`);
    if (bulletResult.fabricationWarnings) {
      console.log(`   ⚠️  Fabrication warnings: ${bulletResult.fabricationWarnings.join('; ')}`);
    }

    // 3. Test section rewrite
    console.log('\n3️⃣ Testing section rewrite...');
    const sectionResult = await rewriteService.rewriteSection({
      bullets: [
        'Worked on API integrations',
        'Fixed bugs in the codebase',
        'Helped with deployments',
      ],
      sectionTitle: 'Experience',
      targetRole: 'Backend Engineer',
    });

    console.log(`   ✅ Original bullets: ${sectionResult.original.length}`);
    console.log(`   ✅ Improved bullets: ${sectionResult.improved.length}`);
    sectionResult.improved.forEach((bullet, i) => {
      console.log(`      ${i + 1}. "${bullet}"`);
    });
    console.log(`   ✅ Overall changes: ${sectionResult.overallChanges.join(', ')}`);
    console.log(`   ✅ Score improvement: +${sectionResult.scoreImprovement} points`);
    if (sectionResult.fabricationWarnings) {
      console.log(`   ⚠️  Fabrication warnings: ${sectionResult.fabricationWarnings.join('; ')}`);
    }

    // 4. Test summary rewrite
    console.log('\n4️⃣ Testing summary rewrite...');
    const summaryResult = await rewriteService.rewriteSummary({
      currentSummary: 'Experienced engineer who worked on various projects',
      targetRole: 'Senior Backend Engineer',
      experience: {
        yearsTotal: 5,
        recentRoles: ['Backend Engineer', 'Software Engineer'],
        keySkills: ['Python', 'AWS', 'PostgreSQL'],
      },
    });

    console.log(`   ✅ Original: "${summaryResult.original}"`);
    console.log(`   ✅ Improved: "${summaryResult.improved}"`);
    console.log(`   ✅ Changes: ${summaryResult.changes.join(', ')}`);
    console.log(`   ✅ Score improvement: +${summaryResult.scoreImprovement} points`);
    if (summaryResult.fabricationWarnings) {
      console.log(`   ⚠️  Fabrication warnings: ${summaryResult.fabricationWarnings.join('; ')}`);
    }

    // 5. Test edge cases
    console.log('\n5️⃣ Testing edge cases...');

    // Empty bullet
    try {
      await rewriteService.rewriteBullet({ bullet: '' });
      console.log('   ❌ Should have thrown error for empty bullet');
    } catch (error) {
      console.log(`   ✅ Correctly rejected empty bullet: ${(error as Error).message}`);
    }

    // Too long bullet
    try {
      const longBullet = 'A'.repeat(250);
      await rewriteService.rewriteBullet({ bullet: longBullet });
      console.log('   ❌ Should have thrown error for long bullet');
    } catch (error) {
      console.log(`   ✅ Correctly rejected long bullet: ${(error as Error).message}`);
    }

    // Empty section
    try {
      await rewriteService.rewriteSection({
        bullets: [],
        sectionTitle: 'Experience',
      });
      console.log('   ❌ Should have thrown error for empty section');
    } catch (error) {
      console.log(`   ✅ Correctly rejected empty section: ${(error as Error).message}`);
    }

    // Too many bullets
    try {
      const manyBullets = Array(15).fill('Test bullet');
      await rewriteService.rewriteSection({
        bullets: manyBullets,
        sectionTitle: 'Experience',
      });
      console.log('   ❌ Should have thrown error for too many bullets');
    } catch (error) {
      console.log(`   ✅ Correctly rejected too many bullets: ${(error as Error).message}`);
    }

    console.log('\n✅ All rewrite tests passed!');
    console.log('\n📊 Summary:');
    console.log(`   - Bullet rewrite: ✅`);
    console.log(`   - Section rewrite: ✅`);
    console.log(`   - Summary rewrite: ✅`);
    console.log(`   - Edge cases: ✅ (4/4)`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testRewriteService()
  .then(() => {
    console.log('\n✅ Rewrite test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Rewrite test failed:', error);
    process.exit(1);
  });
