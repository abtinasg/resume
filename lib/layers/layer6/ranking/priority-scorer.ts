/**
 * Layer 6 - Job Discovery & Matching Module
 * Priority Scorer
 *
 * Calculates priority scores for job ranking.
 */

import type { 
  ParsedJob, 
  JobCategory, 
  JobPriority, 
  JobFlags, 
  ScoreBreakdown, 
  ScorePenalty,
  UserPreferences 
} from '../types';
import { 
  getRankingConfig, 
  getUrgencyConfig, 
  getPriorityThresholds,
  getFreshnessConfig,
  getCategoryBonus,
} from '../config';
import { detectScamRisk } from '../analysis/scam-detector';

// ==================== Urgency Score ====================

/**
 * Calculate urgency score (0-100) based on deadline and recency
 */
export function calculateUrgencyScore(
  postedDate: string | undefined,
  applicationDeadline: string | undefined,
  createdAt: string
): number {
  const config = getUrgencyConfig();
  let urgency = 0;
  
  // Component 1: Deadline proximity (60% weight)
  let urgencyDeadline = config.deadline_scores.no_deadline; // Default if no deadline
  
  if (applicationDeadline) {
    const deadlineDate = new Date(applicationDeadline);
    const now = new Date();
    const daysUntilDeadline = Math.floor(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilDeadline < 0) {
      urgencyDeadline = config.deadline_scores.expired;
    } else if (daysUntilDeadline <= 3) {
      urgencyDeadline = config.deadline_scores.within_3_days;
    } else if (daysUntilDeadline <= 7) {
      urgencyDeadline = config.deadline_scores.within_7_days;
    } else if (daysUntilDeadline <= 14) {
      urgencyDeadline = config.deadline_scores.within_14_days;
    } else if (daysUntilDeadline <= 30) {
      urgencyDeadline = config.deadline_scores.within_30_days;
    } else {
      urgencyDeadline = config.deadline_scores.beyond_30_days;
    }
  }
  
  urgency += urgencyDeadline * config.weights.deadline;
  
  // Component 2: Posted recency (40% weight)
  let urgencyRecency = config.recency_scores.beyond_30_days; // Default
  
  if (postedDate) {
    const postedDateObj = new Date(postedDate);
    const now = new Date();
    const daysSincePosted = Math.floor(
      (now.getTime() - postedDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSincePosted <= 3) {
      urgencyRecency = config.recency_scores.within_3_days;
    } else if (daysSincePosted <= 7) {
      urgencyRecency = config.recency_scores.within_7_days;
    } else if (daysSincePosted <= 14) {
      urgencyRecency = config.recency_scores.within_14_days;
    } else if (daysSincePosted <= 30) {
      urgencyRecency = config.recency_scores.within_30_days;
    } else {
      urgencyRecency = config.recency_scores.beyond_30_days;
    }
  } else {
    // Fallback to created_at (when we saved it)
    const createdDateObj = new Date(createdAt);
    const now = new Date();
    const daysSinceSaved = Math.floor(
      (now.getTime() - createdDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceSaved <= 1) {
      urgencyRecency = config.recency_scores.within_1_day_saved;
    } else if (daysSinceSaved <= 7) {
      urgencyRecency = config.recency_scores.within_7_days_saved;
    } else {
      urgencyRecency = config.recency_scores.beyond_7_days_saved;
    }
  }
  
  urgency += urgencyRecency * config.weights.recency;
  
  return Math.round(urgency * 10) / 10;
}

// ==================== Freshness Score ====================

/**
 * Calculate freshness score (0-100) based on how recently job was posted/saved
 */
export function calculateFreshnessScore(
  postedDate: string | undefined,
  createdAt: string
): number {
  const dateToUse = postedDate || createdAt;
  const dateObj = new Date(dateToUse);
  const now = new Date();
  const daysOld = Math.floor(
    (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysOld <= 1) return 100;
  if (daysOld <= 3) return 90;
  if (daysOld <= 7) return 75;
  if (daysOld <= 14) return 60;
  if (daysOld <= 30) return 40;
  return 20;
}

// ==================== Preference Match ====================

/**
 * Calculate preference match score (0-100)
 */
export function calculatePreferenceMatch(
  job: ParsedJob,
  preferences: UserPreferences
): number {
  let matchScore = 100; // Start with full match
  let totalFactors = 0;
  let matchedFactors = 0;
  
  // Work arrangement preference
  if (preferences.work_arrangement && preferences.work_arrangement.length > 0) {
    totalFactors++;
    if (job.work_arrangement && preferences.work_arrangement.includes(job.work_arrangement)) {
      matchedFactors++;
    }
  }
  
  // Location preference (if not strict, still affects score)
  if (preferences.locations && preferences.locations.length > 0 && !preferences.strict_location) {
    totalFactors++;
    const jobLocationLower = job.location.toLowerCase();
    if (preferences.locations.some(loc => jobLocationLower.includes(loc.toLowerCase()))) {
      matchedFactors++;
    }
  }
  
  // Salary preference (soft check)
  if (preferences.salary_minimum && job.salary_range?.min) {
    totalFactors++;
    if (job.salary_range.min >= preferences.salary_minimum * 0.9) {
      matchedFactors++;
    }
  }
  
  // Calculate score
  if (totalFactors > 0) {
    matchScore = Math.round((matchedFactors / totalFactors) * 100);
  }
  
  return matchScore;
}

// ==================== Score Breakdown ====================

/**
 * Calculate complete score breakdown
 */
export function calculateScoreBreakdown(
  fitScore: number,
  category: JobCategory,
  preferenceMatch: number,
  freshness: number,
  urgency: number,
  job: ParsedJob,
  userPrefs: UserPreferences
): ScoreBreakdown {
  const config = getRankingConfig();
  
  // Base components
  const fit_component = fitScore * config.weights.fit_score;
  const preference_component = preferenceMatch * config.weights.preference_match;
  const freshness_component = freshness * config.weights.freshness;
  const urgency_component = urgency * config.weights.urgency;
  
  // Category bonus
  const category_component = getCategoryBonus(category);
  
  const raw_score = 
    fit_component +
    preference_component +
    freshness_component +
    category_component +
    urgency_component;
  
  // Calculate penalties
  const penalties: ScorePenalty[] = [];
  
  // Penalty 1: Location mismatch
  if (userPrefs.locations && userPrefs.locations.length > 0) {
    const jobLocationLower = job.location.toLowerCase();
    if (!userPrefs.locations.some(loc => jobLocationLower.includes(loc.toLowerCase()))) {
      penalties.push({
        code: 'location_mismatch',
        amount: -10,
        reason: `Location '${job.location}' not in preferences`,
      });
    }
  }
  
  // Penalty 2: Salary below minimum
  if (userPrefs.salary_minimum && job.salary_range?.max) {
    if (job.salary_range.max < userPrefs.salary_minimum) {
      penalties.push({
        code: 'salary_low',
        amount: -15,
        reason: `Salary $${job.salary_range.max} below minimum $${userPrefs.salary_minimum}`,
      });
    }
  }
  
  // Penalty 3: Scam risk
  const scamResult = detectScamRisk(job);
  if (scamResult.risk_level === 'high' || scamResult.risk_level === 'medium') {
    penalties.push({
      code: 'scam_risk',
      amount: scamResult.risk_level === 'high' ? -30 : -15,
      reason: `Job shows red flags (${scamResult.red_flag_count} detected)`,
    });
  }
  
  // Penalty 4: Expired
  if (job.metadata.application_deadline) {
    const deadline = new Date(job.metadata.application_deadline);
    if (new Date() > deadline) {
      penalties.push({
        code: 'expired',
        amount: -50,
        reason: 'Application deadline passed',
      });
    }
  }
  
  // Calculate final score
  const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
  const final_score = Math.max(0, raw_score + totalPenalties);
  
  return {
    fit_component: Math.round(fit_component * 10) / 10,
    preference_component: Math.round(preference_component * 10) / 10,
    freshness_component: Math.round(freshness_component * 10) / 10,
    category_component: Math.round(category_component * 10) / 10,
    urgency_component: Math.round(urgency_component * 10) / 10,
    penalties,
    raw_score: Math.round(raw_score * 10) / 10,
    final_score: Math.round(final_score * 10) / 10,
  };
}

// ==================== Priority Determination ====================

/**
 * Determine priority level from score breakdown
 */
export function determinePriority(
  fitScore: number,
  category: JobCategory,
  shouldApply: boolean,
  scoreBreakdown: ScoreBreakdown,
  flags: Partial<JobFlags>
): JobPriority {
  const config = getRankingConfig();
  const thresholds = getPriorityThresholds();
  
  // If shouldn't apply, priority is low
  if (!shouldApply) {
    return 'low';
  }
  
  // Calculate priority score
  let priorityScore = 0;
  
  // Component 1: Fit (40%)
  priorityScore += fitScore * 0.4;
  
  // Component 2: Category bonus (30%)
  const categoryBonus: Record<JobCategory, number> = {
    reach: 25,
    target: 30,
    safety: 20,
    avoid: 0,
  };
  priorityScore += categoryBonus[category] || 0;
  
  // Component 3: Freshness (15%)
  priorityScore += scoreBreakdown.freshness_component * 0.15;
  
  // Component 4: Urgency (15%)
  priorityScore += scoreBreakdown.urgency_component * 0.15;
  
  // Bonuses
  if (flags.dream_job) {
    priorityScore += config.priority_bonuses.dream_job;
  }
  if (flags.new) {
    priorityScore += config.priority_bonuses.new;
  }
  
  // Penalties
  if (flags.scam_risk) {
    priorityScore += config.priority_penalties.scam_risk;
  }
  
  // Map to priority level
  if (priorityScore >= thresholds.high) {
    return 'high';
  }
  if (priorityScore >= thresholds.medium) {
    return 'medium';
  }
  return 'low';
}

// ==================== Job Flags ====================

/**
 * Determine job flags
 */
export function determineJobFlags(
  job: ParsedJob,
  fitScore: number,
  appliedJobIds: string[] = [],
  rejectedJobIds: string[] = []
): JobFlags {
  const freshnessConfig = getFreshnessConfig();
  
  // Check if dream job (high fit + top tier company)
  const dream_job = 
    fitScore >= 85 && 
    (job.metadata.company_tier === 'top_tier' || job.metadata.company_tier === 'unicorn');
  
  // Check if new (posted/saved within new_job_days)
  let isNew = false;
  const dateToCheck = job.metadata.posted_date || job.created_at;
  if (dateToCheck) {
    const dateObj = new Date(dateToCheck);
    const now = new Date();
    const daysOld = Math.floor(
      (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    isNew = daysOld <= freshnessConfig.new_job_days;
  }
  
  // Check if applied
  const applied = appliedJobIds.includes(job.canonical_id) || appliedJobIds.includes(job.job_id);
  
  // Check if rejected
  const rejected = rejectedJobIds.includes(job.canonical_id) || rejectedJobIds.includes(job.job_id);
  
  // Check if expired
  let expired = false;
  if (job.metadata.application_deadline) {
    const deadline = new Date(job.metadata.application_deadline);
    expired = new Date() > deadline;
  }
  
  // Check scam risk
  const scamResult = detectScamRisk(job);
  const scam_risk = scamResult.risk_level === 'high' || scamResult.risk_level === 'medium';
  
  return {
    dream_job,
    applied,
    rejected,
    expired,
    new: isNew,
    scam_risk,
  };
}
