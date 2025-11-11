/**
 * PRO Resume Scoring System - Usage Examples
 *
 * This file demonstrates how to use the PRO scoring system
 * in different scenarios and configurations.
 */

import { calculatePROScore } from './index';
import { getAvailableRoles, getKeywordsForRole } from './keywords';

// ==================== Example 1: Basic Usage ====================

export async function basicExample() {
  const resumeText = `
    John Doe
    john@email.com | (555) 123-4567

    EXPERIENCE
    Senior Product Manager | TechCorp | 2020 - Present
    - Led roadmap planning for enterprise SaaS platform serving 10K+ customers
    - Increased user retention by 35% through data-driven A/B testing
    - Drove $2M ARR through strategic product launches

    SKILLS
    Product Management, Agile, Scrum, SQL, Analytics
  `;

  try {
    const result = await calculatePROScore(resumeText, 'Product Manager');

    console.log('=== BASIC EXAMPLE ===');
    console.log(`Overall Score: ${result.overallScore}/100`);
    console.log(`Grade: ${result.grade}`);
    console.log(`ATS Pass Probability: ${result.atsPassProbability}%`);
    console.log(`Processing Time: ${result.metadata?.processingTime}ms`);

    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// ==================== Example 2: Detailed Component Analysis ====================

export async function detailedAnalysisExample(resumeText: string) {
  const result = await calculatePROScore(resumeText, 'Software Engineer');

  console.log('\n=== DETAILED ANALYSIS ===');

  // Content Quality
  const contentQuality = result.componentScores.contentQuality.breakdown as import('./types').ContentQualityBreakdown;
  console.log('\n1. Content Quality:', result.componentScores.contentQuality.score);
  console.log('   - Achievement Quantification:', contentQuality.achievementQuantification.score);
  console.log('     Details:', contentQuality.achievementQuantification.details);
  console.log('   - Action Verb Strength:', contentQuality.actionVerbStrength.score);
  console.log('     Strong verbs:', contentQuality.actionVerbStrength.strongVerbsFound.slice(0, 3).join(', '));
  console.log('     Weak verbs:', contentQuality.actionVerbStrength.weakVerbsFound.slice(0, 3).join(', '));

  // ATS Compatibility
  const atsCompatibility = result.componentScores.atsCompatibility.breakdown as import('./types').ATSCompatibilityBreakdown;
  console.log('\n2. ATS Compatibility:', result.componentScores.atsCompatibility.score);
  console.log('   - Keyword Density:', atsCompatibility.keywordDensity.score);
  console.log('   - Missing Critical Keywords:', result.atsDetailedReport.keywordGapAnalysis.mustHave.missing.slice(0, 5).join(', '));
  console.log('   - Format Issues:', result.atsDetailedReport.formatIssues.length);

  // Format & Structure
  const formatStructure = result.componentScores.formatStructure.breakdown as import('./types').FormatStructureBreakdown;
  console.log('\n3. Format & Structure:', result.componentScores.formatStructure.score);
  console.log('   - Page Count:', formatStructure.lengthOptimization.pageCount);
  console.log('   - Verdict:', formatStructure.lengthOptimization.verdict);

  // Impact & Metrics
  const impactMetrics = result.componentScores.impactMetrics.breakdown as import('./types').ImpactMetricsBreakdown;
  console.log('\n4. Impact & Metrics:', result.componentScores.impactMetrics.score);
  console.log('   - Quantified Results:', impactMetrics.quantifiedResults.percentage + '%');

  return result;
}

// ==================== Example 3: Keyword Gap Analysis ====================

export async function keywordGapExample(resumeText: string, targetRole: string) {
  const result = await calculatePROScore(resumeText, targetRole);

  console.log('\n=== KEYWORD GAP ANALYSIS ===');
  console.log(`Target Role: ${targetRole}`);

  const gap = result.atsDetailedReport.keywordGapAnalysis;

  console.log('\nMust-Have Keywords:');
  console.log(`  Found: ${gap.mustHave.found}/${gap.mustHave.total}`);
  console.log(`  Missing: ${gap.mustHave.missing.slice(0, 5).join(', ')}`);

  console.log('\nImportant Keywords:');
  console.log(`  Found: ${gap.important.found}/${gap.important.total}`);
  console.log(`  Missing: ${gap.important.missing.slice(0, 5).join(', ')}`);

  console.log('\nTop Keywords by Frequency:');
  const topKeywords = Object.entries(gap.keywordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  topKeywords.forEach(([keyword, count]) => {
    console.log(`  ${keyword}: ${count}x`);
  });

  return result;
}

// ==================== Example 4: Improvement Roadmap ====================

export async function improvementRoadmapExample(resumeText: string) {
  const result = await calculatePROScore(resumeText, 'Product Manager');

  console.log('\n=== IMPROVEMENT ROADMAP ===');
  console.log(`Current Score: ${result.overallScore}/100`);

  if (result.overallScore < 80) {
    console.log('\nTo Reach 80:');
    result.improvementRoadmap.toReach80.forEach((action, index) => {
      console.log(`${index + 1}. ${action.action}`);
      console.log(`   Impact: +${action.pointsGain} points | Time: ${action.time} | Priority: ${action.priority}`);
    });
  }

  if (result.overallScore < 90) {
    console.log('\nTo Reach 90:');
    result.improvementRoadmap.toReach90.slice(0, 5).forEach((action, index) => {
      console.log(`${index + 1}. ${action.action}`);
      console.log(`   Impact: +${action.pointsGain} points | Time: ${action.time}`);
    });
  }

  if (result.improvementRoadmap.quickWins && result.improvementRoadmap.quickWins.length > 0) {
    console.log('\nQuick Wins (High Impact, Low Effort):');
    result.improvementRoadmap.quickWins.forEach((action, index) => {
      console.log(`${index + 1}. ${action.action} (+${action.pointsGain} points, ${action.time})`);
    });
  }

  return result;
}

// ==================== Example 5: Comparing Multiple Roles ====================

export async function multiRoleComparisonExample(resumeText: string) {
  const roles = ['Product Manager', 'Software Engineer', 'Data Analyst'];

  console.log('\n=== MULTI-ROLE COMPARISON ===');

  const results = await Promise.all(
    roles.map(async (role) => {
      const result = await calculatePROScore(resumeText, role);
      return { role, score: result.overallScore, atsPass: result.atsPassProbability };
    })
  );

  results.sort((a, b) => b.score - a.score);

  console.log('\nBest Fit Roles (by score):');
  results.forEach((r, index) => {
    console.log(`${index + 1}. ${r.role}: ${r.score}/100 (${r.atsPass}% ATS pass rate)`);
  });

  return results;
}

// ==================== Example 6: Available Roles ====================

export function listAvailableRoles() {
  console.log('\n=== AVAILABLE ROLES ===');

  const roles = getAvailableRoles();
  roles.forEach((role, index) => {
    console.log(`${index + 1}. ${role}`);
  });

  return roles;
}

// ==================== Example 7: Role Keywords ====================

export function inspectRoleKeywords(role: string) {
  console.log(`\n=== KEYWORDS FOR ${role.toUpperCase()} ===`);

  const keywords = getKeywordsForRole(role);

  console.log('\nMust-Have Keywords:');
  console.log(keywords.mustHave.join(', '));

  console.log('\nImportant Keywords:');
  console.log(keywords.important.join(', '));

  console.log('\nNice-to-Have Keywords:');
  console.log(keywords.niceToHave.join(', '));

  return keywords;
}

// ==================== Example 8: JSON Export ====================

export async function jsonExportExample(resumeText: string) {
  const result = await calculatePROScore(resumeText, 'Product Manager');

  console.log('\n=== JSON EXPORT ===');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

// ==================== Example 9: Performance Test ====================

export async function performanceTestExample(resumeText: string) {
  console.log('\n=== PERFORMANCE TEST ===');

  const startTime = Date.now();
  const result = await calculatePROScore(resumeText, 'Software Engineer');
  const endTime = Date.now();

  const duration = endTime - startTime;

  console.log(`Processing Time: ${duration}ms`);
  console.log(`Status: ${duration < 2000 ? '✓ PASS' : '✗ FAIL'} (target: <2000ms)`);
  console.log(`Score: ${result.overallScore}/100`);

  return { duration, result };
}

// ==================== Example 10: Error Handling ====================

export async function errorHandlingExample() {
  console.log('\n=== ERROR HANDLING ===');

  // Test 1: Empty resume
  try {
    await calculatePROScore('', 'Product Manager');
  } catch (error) {
    console.log('Empty resume error:', (error as Error).message);
  }

  // Test 2: Too short resume
  try {
    await calculatePROScore('John Doe', 'Product Manager');
  } catch (error) {
    console.log('Short resume error:', (error as Error).message);
  }

  // Test 3: Valid but poor resume
  try {
    const result = await calculatePROScore(
      'John Doe. I worked at companies and did things. I have skills.',
      'Product Manager'
    );
    console.log('Poor resume score:', result.overallScore);
  } catch (error) {
    console.log('Unexpected error:', (error as Error).message);
  }
}

// ==================== Main Demo Function ====================

export async function runAllExamples() {
  const sampleResume = `
    Alex Johnson
    alex@email.com | (555) 123-4567

    SUMMARY
    Product Manager with 5 years of experience driving product strategy and execution.

    EXPERIENCE

    Senior Product Manager | TechCorp | 2020 - Present
    - Led product roadmap for B2B SaaS platform serving 10K+ customers
    - Increased user retention by 35% through A/B testing and data analysis
    - Launched 15+ features using agile methodology and sprint planning
    - Drove $2M in ARR through strategic product initiatives

    Product Manager | StartupCo | 2018 - 2020
    - Managed product backlog and prioritization for engineering team
    - Conducted 30+ user interviews to inform product decisions
    - Reduced churn by 25% through targeted improvements

    SKILLS
    Product Management: Roadmap, Backlog, Agile, Scrum, OKRs, KPIs
    Analytics: SQL, Google Analytics, A/B Testing, Data Analysis
    Tools: JIRA, Confluence, Figma, Mixpanel

    EDUCATION
    BS Computer Science | Stanford University | 2018
  `;

  console.log('='.repeat(60));
  console.log('PRO RESUME SCORING SYSTEM - EXAMPLES');
  console.log('='.repeat(60));

  await basicExample();
  await detailedAnalysisExample(sampleResume);
  await keywordGapExample(sampleResume, 'Product Manager');
  await improvementRoadmapExample(sampleResume);
  await multiRoleComparisonExample(sampleResume);
  listAvailableRoles();
  inspectRoleKeywords('Product Manager');
  await performanceTestExample(sampleResume);
  await errorHandlingExample();

  console.log('\n' + '='.repeat(60));
  console.log('ALL EXAMPLES COMPLETED');
  console.log('='.repeat(60));
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
