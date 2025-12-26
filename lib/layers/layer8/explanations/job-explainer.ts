/**
 * Layer 8 - AI Coach Interface
 * Job Explainer
 *
 * Generates explanations for job rankings and recommendations.
 */

import type {
  JobExplanationContext,
  Tone,
} from '../types';
import type { RankedJob, JobCategory, CareerCapital, ParsedJob } from '../../layer6/types';
import type { FitScore, GapAnalysis } from '../../layer1/types';
import { SeniorityLevel } from '../../shared/types';
import {
  explainJobRanking,
  explainFitScore,
  explainCareerCapital,
  generateJobListSummary,
} from '../templates';
import { joinParagraphs, bold, formatBulletList } from '../formatters';
import { adaptTone } from '../tone';

// ==================== Main Explainer Functions ====================

/**
 * Generate a comprehensive job explanation
 */
export function explainRankedJob(rankedJob: RankedJob, tone?: Tone): string {
  const context: JobExplanationContext = {
    rankedJob,
    category: rankedJob.category,
    fitScore: rankedJob.fit_score,
    careerCapital: rankedJob.career_capital,
    quickInsights: rankedJob.quick_insights,
    greenFlags: rankedJob.green_flags,
    redFlags: rankedJob.red_flags,
  };

  // Extract seniority info if available
  if (rankedJob.fit_analysis) {
    const gaps = (rankedJob.fit_analysis as FitScore).gaps;
    if (gaps?.seniority) {
      context.userLevel = gaps.seniority.user_level;
      context.jobLevel = gaps.seniority.role_expected;
    }
  }

  let explanation = explainJobRanking(context);

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Explain a fit score in detail
 */
export function explainJobFit(rankedJob: RankedJob, tone?: Tone): string {
  const context: JobExplanationContext = {
    rankedJob,
    category: rankedJob.category,
    fitScore: rankedJob.fit_score,
  };

  let explanation = explainFitScore(context);

  // Add gap details if available
  if (rankedJob.fit_analysis) {
    const gapExplanation = explainGaps(rankedJob.fit_analysis.gaps);
    if (gapExplanation) {
      explanation = joinParagraphs(explanation, gapExplanation);
    }
  }

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Explain career capital for a job
 */
export function explainJobCareerCapital(
  rankedJob: RankedJob,
  tone?: Tone
): string {
  if (!rankedJob.career_capital) {
    return 'Career capital analysis not available for this job.';
  }

  const context: JobExplanationContext = {
    rankedJob,
    category: rankedJob.category,
    fitScore: rankedJob.fit_score,
    careerCapital: rankedJob.career_capital,
  };

  let explanation = explainCareerCapital(context);

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

// ==================== List Explanations ====================

/**
 * Generate a summary of job recommendations
 */
export function explainJobList(
  jobs: RankedJob[],
  tone?: Tone
): string {
  // Count by category
  const categoryCounts: Record<JobCategory, number> = {
    reach: 0,
    target: 0,
    safety: 0,
    avoid: 0,
  };

  for (const job of jobs) {
    categoryCounts[job.category]++;
  }

  const categories = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      category: category as JobCategory,
      count,
    }));

  // Get top recommendation
  const topJob = jobs.find(j => j.should_apply && j.category !== 'avoid');
  const topRecommendation = topJob
    ? `${topJob.job.job_title} at ${topJob.job.company}`
    : undefined;

  let explanation = generateJobListSummary(categories, topRecommendation);

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Explain why certain jobs are recommended
 */
export function explainTopRecommendations(
  jobs: RankedJob[],
  count: number = 3,
  tone?: Tone
): string {
  const topJobs = jobs
    .filter(j => j.should_apply)
    .slice(0, count);

  if (topJobs.length === 0) {
    return "No jobs currently recommended for application. Let's focus on improving your profile or adding more job opportunities.";
  }

  let explanation = `${bold(`Top ${topJobs.length} Recommendations:`)}`;

  for (let i = 0; i < topJobs.length; i++) {
    const job = topJobs[i];
    const rank = i + 1;

    const jobExplanation = [
      `\n\n${bold(`${rank}. ${job.job.job_title} at ${job.job.company}`)}`,
      `   Fit: ${job.fit_score}/100 | Category: ${capitalizeFirst(job.category)}`,
    ];

    if (job.quick_insights && job.quick_insights.length > 0) {
      jobExplanation.push(`   Key insight: ${job.quick_insights[0]}`);
    }

    explanation += jobExplanation.join('\n');
  }

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

// ==================== Gap Explanations ====================

/**
 * Explain gaps between user and job requirements
 */
export function explainGaps(gaps?: GapAnalysis): string {
  if (!gaps) return '';

  const sections: string[] = [];

  // Skills gaps
  if (gaps.skills) {
    const skillSection = explainSkillsGap(gaps.skills);
    if (skillSection) sections.push(skillSection);
  }

  // Tools gaps
  if (gaps.tools) {
    const toolSection = explainToolsGap(gaps.tools);
    if (toolSection) sections.push(toolSection);
  }

  // Seniority gap
  if (gaps.seniority) {
    const senioritySection = explainSeniorityGap(gaps.seniority);
    if (senioritySection) sections.push(senioritySection);
  }

  return sections.join('\n\n');
}

/**
 * Explain skills gap
 */
function explainSkillsGap(
  skills: GapAnalysis['skills']
): string {
  if (!skills) return '';

  const parts: string[] = [];

  if (skills.matched && skills.matched.length > 0) {
    parts.push(`**Skills you have:** ${skills.matched.slice(0, 5).join(', ')}`);
  }

  if (skills.critical_missing && skills.critical_missing.length > 0) {
    parts.push(`**Skills to develop:** ${skills.critical_missing.join(', ')}`);
  }

  if (parts.length === 0) return '';

  return `**Skills Match (${skills.match_percentage}%)**\n${parts.join('\n')}`;
}

/**
 * Explain tools gap
 */
function explainToolsGap(
  tools: GapAnalysis['tools']
): string {
  if (!tools) return '';

  const parts: string[] = [];

  if (tools.matched && tools.matched.length > 0) {
    parts.push(`**Tools you know:** ${tools.matched.slice(0, 5).join(', ')}`);
  }

  if (tools.critical_missing && tools.critical_missing.length > 0) {
    parts.push(`**Tools to learn:** ${tools.critical_missing.join(', ')}`);
  }

  if (parts.length === 0) return '';

  return `**Tools Match (${tools.match_percentage}%)**\n${parts.join('\n')}`;
}

/**
 * Explain seniority gap
 */
function explainSeniorityGap(
  seniority: GapAnalysis['seniority']
): string {
  if (!seniority) return '';

  const { user_level, role_expected, alignment } = seniority;

  if (alignment === 'aligned') {
    return `**Seniority:** Your experience level (${user_level}) aligns well with this role.`;
  }

  if (alignment === 'underqualified') {
    return `**Seniority:** This role expects ${role_expected} level experience, while your profile shows ${user_level}. It's a stretch but could be achievable.`;
  }

  if (alignment === 'overqualified') {
    return `**Seniority:** You may be overqualified. The role is at ${role_expected} level while you're at ${user_level}. Consider if this aligns with your goals.`;
  }

  return '';
}

// ==================== Category Explanations ====================

/**
 * Explain what a job category means
 */
export function explainCategory(category: JobCategory): string {
  const explanations: Record<JobCategory, string> = {
    reach: `${bold('Reach')} jobs are ambitious opportunities where you meet most but not all requirements. Success rate is lower, but the growth potential is high.`,
    target: `${bold('Target')} jobs are your sweet spot — you meet the key requirements and have a strong chance of success.`,
    safety: `${bold('Safety')} jobs are where you exceed the requirements. Higher success rate, potentially less challenging.`,
    avoid: `${bold('Avoid')} jobs have significant mismatches that make them unlikely to be worth your application effort.`,
  };

  return explanations[category];
}

/**
 * Explain the recommended application strategy for a category
 */
export function explainApplicationStrategy(category: JobCategory): string {
  const strategies: Record<JobCategory, string> = {
    reach: 'For reach roles, emphasize transferable skills and growth potential. Tailor your resume carefully to address any gaps.',
    target: 'For target roles, highlight your direct experience match. These should be a priority in your application pipeline.',
    safety: 'For safety roles, consider whether the compensation and challenge level align with your goals before applying.',
    avoid: "It's generally better to focus your energy on better-matched opportunities rather than these roles.",
  };

  return strategies[category];
}

// ==================== Helper Functions ====================

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get color indicator for a fit score
 */
export function getFitScoreIndicator(fitScore: number): string {
  if (fitScore >= 80) return '🟢';
  if (fitScore >= 60) return '🟡';
  if (fitScore >= 40) return '🟠';
  return '🔴';
}

/**
 * Generate a one-line job summary
 */
export function generateJobOneLiner(rankedJob: RankedJob): string {
  const indicator = getFitScoreIndicator(rankedJob.fit_score);
  return `${indicator} ${rankedJob.job.job_title} at ${rankedJob.job.company} (${rankedJob.fit_score}/100 - ${capitalizeFirst(rankedJob.category)})`;
}
