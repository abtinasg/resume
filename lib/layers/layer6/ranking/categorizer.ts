/**
 * Layer 6 - Job Discovery & Matching Module
 * Job Categorizer
 *
 * Categorizes jobs as reach, target, safety, or avoid based on fit analysis.
 */

import type { FitScore, GapAnalysis, SeniorityGap } from '../../layer1/types';
import type { JobCategory, ParsedJob } from '../types';
import { getCategorizationConfig, getApplyDecisionConfig } from '../config';

// ==================== Category Determination ====================

/**
 * Get critical missing count from gaps
 */
function getCriticalMissingCount(gaps: GapAnalysis): number {
  return (
    (gaps.skills?.critical_missing?.length || 0) +
    (gaps.tools?.critical_missing?.length || 0)
  );
}

/**
 * Get seniority gap years
 */
function getSeniorityGapYears(seniority: SeniorityGap): number {
  return seniority.gap_years || 0;
}

/**
 * Categorize job based on fit score and gap analysis
 */
export function categorizeJob(
  fitScore: number,
  gaps: GapAnalysis | null,
  seniorityAlignment?: 'aligned' | 'underqualified' | 'overqualified'
): { category: JobCategory; reasoning: string } {
  const config = getCategorizationConfig();
  const { thresholds } = config;
  
  // Get gap information
  const criticalMissingCount = gaps ? getCriticalMissingCount(gaps) : 0;
  const alignment = seniorityAlignment || gaps?.seniority?.alignment || 'aligned';
  const gapYears = gaps ? getSeniorityGapYears(gaps.seniority) : 0;
  
  // Rule 1: Avoid if fit is very low
  if (fitScore < thresholds.avoid.max_fit) {
    return {
      category: 'avoid',
      reasoning: `Fit score (${fitScore}) is below threshold (${thresholds.avoid.max_fit}) - significant mismatches`,
    };
  }
  
  // Rule 2: Avoid if too many critical gaps
  if (criticalMissingCount > thresholds.avoid.max_critical_missing) {
    return {
      category: 'avoid',
      reasoning: `Too many critical skill gaps (${criticalMissingCount} missing) - would require significant upskilling`,
    };
  }
  
  // Rule 3: Safety - overqualified or perfectly aligned with high fit
  if (
    fitScore >= thresholds.safety.min_fit &&
    fitScore <= thresholds.safety.max_fit &&
    (alignment === 'overqualified' || alignment === 'aligned') &&
    criticalMissingCount <= thresholds.safety.max_critical_missing
  ) {
    return {
      category: 'safety',
      reasoning: alignment === 'overqualified'
        ? `High fit (${fitScore}) and overqualified - high acceptance probability`
        : `Strong alignment with no critical gaps - solid safety option`,
    };
  }
  
  // Rule 4: Target - good fit with manageable gaps
  if (
    fitScore >= thresholds.target.min_fit &&
    fitScore <= thresholds.target.max_fit &&
    criticalMissingCount <= thresholds.target.max_critical_missing
  ) {
    if (alignment === 'underqualified' && gapYears > thresholds.target.max_gap_years) {
      // Too much of a stretch for target
      if (fitScore >= thresholds.reach.min_fit) {
        return {
          category: 'reach',
          reasoning: `Good fit (${fitScore}) but ${gapYears}+ years seniority gap - ambitious but possible`,
        };
      }
    } else {
      return {
        category: 'target',
        reasoning: `Good fit (${fitScore}) with ${criticalMissingCount} minor gaps - ideal target role`,
      };
    }
  }
  
  // Rule 5: Reach - ambitious but viable
  if (
    fitScore >= thresholds.reach.min_fit &&
    fitScore < thresholds.reach.max_fit &&
    alignment === 'underqualified'
  ) {
    if (gapYears <= thresholds.reach.max_gap_years && criticalMissingCount <= thresholds.reach.max_critical_missing) {
      return {
        category: 'reach',
        reasoning: `Moderate fit (${fitScore}) with ${gapYears}yr gap - stretch opportunity worth pursuing`,
      };
    } else {
      return {
        category: 'avoid',
        reasoning: `Fit (${fitScore}) viable but gap too large (${gapYears}yrs, ${criticalMissingCount} critical skills) - too much of a stretch`,
      };
    }
  }
  
  // Rule 6: High fit but underqualified = reach
  if (fitScore >= 70 && alignment === 'underqualified') {
    return {
      category: 'reach',
      reasoning: `Strong technical fit (${fitScore}) despite seniority gap - ambitious but achievable`,
    };
  }
  
  // Rule 7: Moderate fit aligned = target
  if (fitScore >= 60 && fitScore < 70 && alignment === 'aligned') {
    return {
      category: 'target',
      reasoning: `Moderate fit (${fitScore}) with good seniority alignment - reasonable target`,
    };
  }
  
  // Default: categorize based on fit score alone
  if (fitScore >= 75) {
    return {
      category: 'target',
      reasoning: `High fit score (${fitScore}) - strong match`,
    };
  }
  if (fitScore >= 60) {
    return {
      category: 'target',
      reasoning: `Decent fit score (${fitScore}) - worth considering`,
    };
  }
  if (fitScore >= 50) {
    return {
      category: 'reach',
      reasoning: `Borderline fit (${fitScore}) - only if particularly interested`,
    };
  }
  
  return {
    category: 'avoid',
    reasoning: `Low fit score (${fitScore}) - not recommended`,
  };
}

/**
 * Simple categorization based on fit score only
 */
export function categorizeByFitScore(fitScore: number): JobCategory {
  if (fitScore >= 80) return 'safety';
  if (fitScore >= 60) return 'target';
  if (fitScore >= 50) return 'reach';
  return 'avoid';
}

// ==================== Should Apply Decision ====================

/**
 * Determine if user should apply to this job
 */
export function shouldUserApply(
  fitScore: number,
  category: JobCategory,
  hardConstraintsPassed: boolean = true
): { shouldApply: boolean; reasoning: string } {
  const config = getApplyDecisionConfig();
  
  // Rule 1: Very low fit = NO
  if (fitScore < config.min_fit_any) {
    return {
      shouldApply: false,
      reasoning: `Fit too low (${fitScore}/100) - would waste time`,
    };
  }
  
  // Rule 2: Category avoid = NO
  if (category === 'avoid') {
    return {
      shouldApply: false,
      reasoning: "Job categorized as 'avoid' due to major mismatches",
    };
  }
  
  // Rule 3: Hard constraints failed = NO
  if (!hardConstraintsPassed) {
    return {
      shouldApply: false,
      reasoning: 'Job fails hard constraints (location, salary, etc.)',
    };
  }
  
  // Rule 4: Reach jobs need higher bar
  if (category === 'reach') {
    if (fitScore < config.min_fit_reach) {
      return {
        shouldApply: false,
        reasoning: `Reach position requires fit >= ${config.min_fit_reach} (current: ${fitScore})`,
      };
    }
    return {
      shouldApply: true,
      reasoning: `Strong reach opportunity (${fitScore}/100 fit)`,
    };
  }
  
  // Rule 5: Target jobs - default YES if fit >= threshold
  if (category === 'target') {
    if (fitScore >= config.min_fit_target) {
      return {
        shouldApply: true,
        reasoning: `Good fit (${fitScore}/100) for target role`,
      };
    }
    return {
      shouldApply: false,
      reasoning: `Fit (${fitScore}/100) below threshold for target`,
    };
  }
  
  // Rule 6: Safety jobs - YES if fit >= threshold
  if (category === 'safety') {
    if (fitScore >= config.min_fit_safety) {
      return {
        shouldApply: true,
        reasoning: `Solid safety option (${fitScore}/100 fit)`,
      };
    }
    return {
      shouldApply: false,
      reasoning: `Even for safety, fit too low (${fitScore}/100)`,
    };
  }
  
  // Default fallback
  return {
    shouldApply: fitScore >= 60,
    reasoning: `Based on fit score: ${fitScore}/100`,
  };
}

/**
 * Check hard constraints against user preferences
 */
export function checkHardConstraints(
  job: ParsedJob,
  preferences: {
    work_arrangement?: string[];
    salary_minimum?: number;
    excluded_industries?: string[];
    locations?: string[];
    strict_location?: boolean;
  }
): { passed: boolean; reason?: string } {
  // Constraint 1: Work arrangement
  if (preferences.work_arrangement && preferences.work_arrangement.length > 0) {
    const jobArrangement = job.work_arrangement || 'onsite';
    if (!preferences.work_arrangement.includes(jobArrangement)) {
      return {
        passed: false,
        reason: `Work arrangement '${jobArrangement}' not in preferences`,
      };
    }
  }
  
  // Constraint 2: Salary minimum
  if (preferences.salary_minimum && job.salary_range?.max) {
    if (job.salary_range.max < preferences.salary_minimum) {
      return {
        passed: false,
        reason: `Salary $${job.salary_range.max} below minimum $${preferences.salary_minimum}`,
      };
    }
  }
  
  // Constraint 3: Excluded industries
  if (preferences.excluded_industries && preferences.excluded_industries.length > 0) {
    const jobIndustry = job.metadata.industry?.toLowerCase() || '';
    if (jobIndustry && preferences.excluded_industries.some(
      excl => jobIndustry.includes(excl.toLowerCase())
    )) {
      return {
        passed: false,
        reason: `Industry '${jobIndustry}' in exclusion list`,
      };
    }
  }
  
  // Constraint 4: Location (if strict)
  if (preferences.locations && preferences.strict_location) {
    const jobLocation = job.location.toLowerCase();
    if (!preferences.locations.some(loc => jobLocation.includes(loc.toLowerCase()))) {
      return {
        passed: false,
        reason: `Location '${job.location}' not in preferences`,
      };
    }
  }
  
  return { passed: true };
}
