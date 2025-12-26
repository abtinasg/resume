/**
 * Layer 6 - Job Discovery & Matching Module
 * Job Ranker
 *
 * Main ranking logic - ranks and scores jobs for the user.
 */

import type { FitScore, GapAnalysis } from '../../layer1/types';
import type { 
  ParsedJob, 
  RankedJob, 
  JobCategory,
  JobPriority,
  UserPreferences,
  JobListResult,
  JobListSummary,
} from '../types';
import { getFitAnalysis, calculateCareerCapital } from '../analysis';
import { detectScamRisk } from '../analysis/scam-detector';
import { categorizeJob, shouldUserApply, checkHardConstraints } from './categorizer';
import {
  calculateUrgencyScore,
  calculateFreshnessScore,
  calculatePreferenceMatch,
  calculateScoreBreakdown,
  determinePriority,
  determineJobFlags,
} from './priority-scorer';
import { generateJobInsights } from './insights-generator';

// ==================== Job Ranking ====================

/**
 * Rank a single job
 */
export async function rankJob(
  job: ParsedJob,
  resumeText: string,
  userPreferences: UserPreferences = {},
  appliedJobIds: string[] = [],
  rejectedJobIds: string[] = []
): Promise<RankedJob> {
  // Get fit analysis
  const fitAnalysis = await getFitAnalysis(resumeText, job);
  const fitScore = fitAnalysis?.fit_score ?? 50;
  const gaps = fitAnalysis?.gaps ?? null;
  
  // Categorize job
  const { category, reasoning: categoryReasoning } = categorizeJob(
    fitScore,
    gaps,
    fitAnalysis?.fit_flags?.overqualified ? 'overqualified' :
    fitAnalysis?.fit_flags?.underqualified ? 'underqualified' : 'aligned'
  );
  
  // Calculate scores
  const urgency = calculateUrgencyScore(
    job.metadata.posted_date,
    job.metadata.application_deadline,
    job.created_at
  );
  const freshness = calculateFreshnessScore(job.metadata.posted_date, job.created_at);
  const preferenceMatch = calculatePreferenceMatch(job, userPreferences);
  
  // Check hard constraints
  const constraints = checkHardConstraints(job, userPreferences);
  
  // Should apply decision
  const { shouldApply, reasoning: applyReasoning } = shouldUserApply(
    fitScore,
    category,
    constraints.passed
  );
  
  // Calculate score breakdown
  const scoreBreakdown = calculateScoreBreakdown(
    fitScore,
    category,
    preferenceMatch,
    freshness,
    urgency,
    job,
    userPreferences
  );
  
  // Determine flags
  const flags = determineJobFlags(job, fitScore, appliedJobIds, rejectedJobIds);
  
  // Determine priority
  const priority = determinePriority(fitScore, category, shouldApply, scoreBreakdown, flags);
  
  // Calculate career capital
  const careerCapital = calculateCareerCapital(job);
  
  // Detect scam
  const scamDetection = detectScamRisk(job);
  
  // Generate insights
  const { quickInsights, redFlags, greenFlags } = generateJobInsights(
    job,
    fitAnalysis,
    category,
    careerCapital
  );
  
  return {
    job,
    fit_score: fitScore,
    fit_analysis: fitAnalysis,
    category,
    category_reasoning: categoryReasoning,
    rank: 0, // Will be set after sorting
    priority_score: scoreBreakdown.final_score,
    score_breakdown: scoreBreakdown,
    flags,
    should_apply: shouldApply,
    application_priority: priority,
    quick_insights: quickInsights,
    red_flags: redFlags.length > 0 ? redFlags : undefined,
    green_flags: greenFlags.length > 0 ? greenFlags : undefined,
    career_capital: careerCapital,
    scam_detection: scamDetection,
  };
}

/**
 * Rank multiple jobs
 */
export async function rankJobs(
  jobs: ParsedJob[],
  resumeText: string,
  userPreferences: UserPreferences = {},
  appliedJobIds: string[] = [],
  rejectedJobIds: string[] = []
): Promise<RankedJob[]> {
  // Rank all jobs in parallel for performance
  const rankedJobs = await Promise.all(
    jobs.map(job => rankJob(job, resumeText, userPreferences, appliedJobIds, rejectedJobIds))
  );
  
  // Sort by priority score (descending)
  rankedJobs.sort((a, b) => b.priority_score - a.priority_score);
  
  // Assign ranks
  rankedJobs.forEach((job, index) => {
    job.rank = index + 1;
  });
  
  return rankedJobs;
}

// ==================== Job List Generation ====================

/**
 * Group ranked jobs by category
 */
export function groupJobsByCategory(rankedJobs: RankedJob[]): {
  reach: RankedJob[];
  target: RankedJob[];
  safety: RankedJob[];
  avoid: RankedJob[];
} {
  return {
    reach: rankedJobs.filter(j => j.category === 'reach'),
    target: rankedJobs.filter(j => j.category === 'target'),
    safety: rankedJobs.filter(j => j.category === 'safety'),
    avoid: rankedJobs.filter(j => j.category === 'avoid'),
  };
}

/**
 * Calculate summary statistics
 */
export function calculateSummary(
  rankedJobs: RankedJob[],
  grouped: ReturnType<typeof groupJobsByCategory>
): JobListSummary {
  const fitScores = rankedJobs.map(j => j.fit_score);
  const averageFitScore = fitScores.length > 0
    ? Math.round(fitScores.reduce((sum, s) => sum + s, 0) / fitScores.length)
    : 0;
  
  return {
    total_jobs: rankedJobs.length,
    reach_count: grouped.reach.length,
    target_count: grouped.target.length,
    safety_count: grouped.safety.length,
    avoid_count: grouped.avoid.length,
    average_fit_score: averageFitScore,
    applied_count: rankedJobs.filter(j => j.flags.applied).length,
    new_count: rankedJobs.filter(j => j.flags.new).length,
  };
}

/**
 * Get top recommendations
 */
export function getTopRecommendations(
  rankedJobs: RankedJob[],
  maxCount: number = 5
): RankedJob[] {
  return rankedJobs
    .filter(j => j.should_apply && !j.flags.applied && !j.flags.expired)
    .slice(0, maxCount);
}

/**
 * Generate portfolio-level insights
 */
export function generatePortfolioInsights(
  rankedJobs: RankedJob[],
  summary: JobListSummary
): string[] {
  const insights: string[] = [];
  
  // Insight 1: Overall portfolio quality
  if (summary.average_fit_score >= 70) {
    insights.push(`Strong portfolio with ${summary.average_fit_score}/100 average fit score`);
  } else if (summary.average_fit_score >= 50) {
    insights.push(`Moderate portfolio quality (${summary.average_fit_score}/100 avg fit) - consider better-matched roles`);
  } else {
    insights.push(`Low average fit (${summary.average_fit_score}/100) - reconsider job search criteria`);
  }
  
  // Insight 2: Category distribution
  if (summary.target_count >= 3) {
    insights.push(`${summary.target_count} target jobs provide solid interview opportunities`);
  }
  if (summary.safety_count >= 2) {
    insights.push(`${summary.safety_count} safety options available as backups`);
  }
  if (summary.reach_count >= 2 && summary.reach_count <= 4) {
    insights.push(`${summary.reach_count} reach positions for growth - good balance`);
  } else if (summary.reach_count > 4) {
    insights.push(`Many reach positions (${summary.reach_count}) - add more realistic targets`);
  }
  
  // Insight 3: New jobs
  if (summary.new_count > 0) {
    insights.push(`${summary.new_count} new job${summary.new_count > 1 ? 's' : ''} added recently - prioritize fresh listings`);
  }
  
  // Insight 4: Applied vs pending
  const pendingCount = summary.total_jobs - summary.applied_count;
  if (pendingCount > 0 && summary.target_count > 0) {
    const pendingTargets = rankedJobs.filter(
      j => j.category === 'target' && !j.flags.applied
    ).length;
    if (pendingTargets > 0) {
      insights.push(`${pendingTargets} target jobs still waiting for applications`);
    }
  }
  
  // Insight 5: Scam warnings
  const scamJobs = rankedJobs.filter(j => j.scam_detection.risk_level === 'high');
  if (scamJobs.length > 0) {
    insights.push(`⚠️ ${scamJobs.length} job${scamJobs.length > 1 ? 's show' : ' shows'} high scam risk - review carefully`);
  }
  
  return insights.slice(0, 6); // Max 6 insights
}

/**
 * Generate complete job list result
 */
export async function generateJobListResult(
  jobs: ParsedJob[],
  resumeText: string,
  userPreferences: UserPreferences = {},
  appliedJobIds: string[] = [],
  rejectedJobIds: string[] = []
): Promise<JobListResult> {
  // Rank all jobs
  const rankedJobs = await rankJobs(
    jobs,
    resumeText,
    userPreferences,
    appliedJobIds,
    rejectedJobIds
  );
  
  // Group by category
  const grouped = groupJobsByCategory(rankedJobs);
  
  // Calculate summary
  const summary = calculateSummary(rankedJobs, grouped);
  
  // Get top recommendations
  const topRecommendations = getTopRecommendations(rankedJobs);
  
  // Generate portfolio insights
  const insights = generatePortfolioInsights(rankedJobs, summary);
  
  return {
    jobs: grouped,
    summary,
    top_recommendations: topRecommendations,
    insights,
  };
}
