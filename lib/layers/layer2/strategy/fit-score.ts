/**
 * Layer 2 - Strategy Engine
 * Fit Score Calculation
 *
 * Calculates the overall fit score combining all gap dimensions.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 5
 */

import type {
  GapAnalysis,
  FitScoreBreakdown,
  ConfidenceLevel,
} from '../types';
import {
  getFitWeights,
  getSenioritySubscores,
  getPenaltyConfig,
} from '../config';

// ==================== Types ====================

interface FitScoreResult {
  /** Overall fit score (0-100) */
  overall_fit_score: number;
  /** Score breakdown by dimension */
  breakdown: FitScoreBreakdown;
  /** Confidence level */
  confidence: ConfidenceLevel;
  /** Penalties applied (for debugging) */
  penalties_applied: string[];
}

// ==================== Main Calculation Function ====================

/**
 * Calculate overall fit score from gap analysis
 *
 * Formula (from spec Section 5):
 * fit = Σ(weight_i * score_i) - penalties
 * overall_fit_score = clamp(round(fit), 0, 100)
 *
 * @param gaps - Complete gap analysis
 * @returns Fit score result with breakdown
 */
export function calculateFitScore(gaps: GapAnalysis): FitScoreResult {
  const weights = getFitWeights();
  const senioritySubscores = getSenioritySubscores();
  const penaltyConfig = getPenaltyConfig();

  // Calculate dimension scores
  const skillsScore = gaps.skills.match_percentage;
  const toolsScore = gaps.tools.match_percentage;
  const experienceScore = gaps.experience.coverage_score;
  const industryScore = gaps.industry.match_percentage;

  // Calculate seniority score based on alignment
  let seniorityScore: number;
  switch (gaps.seniority.alignment) {
    case 'aligned':
      seniorityScore = senioritySubscores.aligned;
      break;
    case 'underqualified':
      seniorityScore = senioritySubscores.underqualified;
      break;
    case 'overqualified':
      seniorityScore = senioritySubscores.overqualified;
      break;
    default:
      seniorityScore = senioritySubscores.aligned;
  }

  // Calculate weighted score
  const weightedScore =
    weights.skills * skillsScore +
    weights.tools * toolsScore +
    weights.experience * experienceScore +
    weights.industry * industryScore +
    weights.seniority * seniorityScore;

  // Calculate penalties
  const { totalPenalty, penaltiesApplied } = calculatePenalties(
    gaps,
    penaltyConfig
  );

  // Calculate final score
  const rawScore = weightedScore - totalPenalty;
  const finalScore = clamp(Math.round(rawScore), 0, 100);

  // Determine confidence based on gap confidences
  const confidence = determineOverallConfidence(gaps);

  return {
    overall_fit_score: finalScore,
    breakdown: {
      skills_score: skillsScore,
      tools_score: toolsScore,
      experience_score: experienceScore,
      industry_score: industryScore,
      seniority_score: seniorityScore,
      penalties: totalPenalty,
      weighted_score: Math.round(weightedScore),
    },
    confidence,
    penalties_applied: penaltiesApplied,
  };
}

// ==================== Helper Functions ====================

/**
 * Calculate penalties for critical missing items
 */
function calculatePenalties(
  gaps: GapAnalysis,
  config: {
    critical_missing_skills_penalty_per_item: number;
    critical_missing_skills_max_penalty: number;
    critical_missing_tools_penalty_per_item: number;
    critical_missing_tools_max_penalty: number;
  }
): { totalPenalty: number; penaltiesApplied: string[] } {
  const penaltiesApplied: string[] = [];
  let totalPenalty = 0;

  // Skills penalty
  const criticalSkillsCount = gaps.skills.critical_missing.length;
  if (criticalSkillsCount > 0) {
    const skillsPenalty = Math.min(
      criticalSkillsCount * config.critical_missing_skills_penalty_per_item,
      config.critical_missing_skills_max_penalty
    );
    totalPenalty += skillsPenalty;
    penaltiesApplied.push(
      `Critical skills penalty: -${skillsPenalty} (${criticalSkillsCount} missing)`
    );
  }

  // Tools penalty
  const criticalToolsCount = gaps.tools.critical_missing.length;
  if (criticalToolsCount > 0) {
    const toolsPenalty = Math.min(
      criticalToolsCount * config.critical_missing_tools_penalty_per_item,
      config.critical_missing_tools_max_penalty
    );
    totalPenalty += toolsPenalty;
    penaltiesApplied.push(
      `Critical tools penalty: -${toolsPenalty} (${criticalToolsCount} missing)`
    );
  }

  return { totalPenalty, penaltiesApplied };
}

/**
 * Determine overall confidence from individual gap confidences
 */
function determineOverallConfidence(gaps: GapAnalysis): ConfidenceLevel {
  const confidences = [
    gaps.skills.confidence,
    gaps.tools.confidence,
    gaps.experience.confidence,
    gaps.seniority.confidence,
    gaps.industry.confidence,
  ];

  // Count confidence levels
  const highCount = confidences.filter((c) => c === 'high').length;
  const lowCount = confidences.filter((c) => c === 'low').length;

  // High overall confidence requires majority high
  if (highCount >= 3) {
    return 'high';
  }

  // Low overall confidence if too many lows
  if (lowCount >= 3) {
    return 'low';
  }

  return 'medium';
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get fit score level description
 *
 * @param score - Fit score (0-100)
 * @returns Level description
 */
export function getFitLevel(score: number): string {
  if (score >= 90) return 'Excellent Fit';
  if (score >= 75) return 'Strong Fit';
  if (score >= 60) return 'Good Fit';
  if (score >= 45) return 'Moderate Fit';
  if (score >= 30) return 'Weak Fit';
  return 'Poor Fit';
}

/**
 * Get recommendations based on fit score
 *
 * @param score - Fit score
 * @returns Array of recommendations
 */
export function getFitRecommendations(score: number): string[] {
  const recommendations: string[] = [];

  if (score >= 80) {
    recommendations.push('Strong candidate for this role');
    recommendations.push('Focus on highlighting relevant achievements');
  } else if (score >= 60) {
    recommendations.push('Good potential match with some gaps');
    recommendations.push('Address missing skills before applying');
    recommendations.push('Tailor resume to emphasize transferable skills');
  } else if (score >= 40) {
    recommendations.push('Consider acquiring missing skills first');
    recommendations.push('May need to target adjacent roles');
    recommendations.push('Highlight transferable experience');
  } else {
    recommendations.push('Significant gaps exist for this role');
    recommendations.push('Consider building required skills');
    recommendations.push('May want to target different role level');
  }

  return recommendations;
}

/**
 * Check if fit score meets minimum threshold
 *
 * @param score - Fit score
 * @param threshold - Minimum threshold (default 60)
 * @returns True if score meets threshold
 */
export function meetsMinimumFit(score: number, threshold: number = 60): boolean {
  return score >= threshold;
}

/**
 * Calculate fit score delta from a target
 *
 * @param currentScore - Current fit score
 * @param targetScore - Target fit score (default 80)
 * @returns Points needed to reach target
 */
export function calculateScoreGap(
  currentScore: number,
  targetScore: number = 80
): number {
  return Math.max(0, targetScore - currentScore);
}
