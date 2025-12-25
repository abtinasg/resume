/**
 * Layer 1 - Evaluation Engine
 * Recommendation Module
 *
 * Provides APPLY/OPTIMIZE_FIRST/NOT_READY recommendations
 * based on fit score, resume quality, and gaps.
 */

import type {
  GapAnalysis,
  FitFlags,
  RecommendationType,
} from '../types';
import { summarizeGaps } from './gap-detection';
import { RECOMMENDATION_THRESHOLDS } from '../config/weights';

// ==================== Main Recommendation Function ====================

/**
 * Get recommendation for a job application
 */
export function getRecommendation(
  fitScore: number,
  resumeScore: number,
  gaps: GapAnalysis,
  fitFlags: FitFlags
): {
  recommendation: RecommendationType;
  reasoning: string;
} {
  const recommendation = determineRecommendation(
    fitScore,
    resumeScore,
    gaps,
    fitFlags
  );

  const reasoning = generateRecommendationReasoning(
    recommendation,
    fitScore,
    resumeScore,
    gaps,
    fitFlags
  );

  return { recommendation, reasoning };
}

// ==================== Recommendation Logic ====================

/**
 * Determine the recommendation based on all factors
 */
function determineRecommendation(
  fitScore: number,
  resumeScore: number,
  gaps: GapAnalysis,
  fitFlags: FitFlags
): RecommendationType {
  const gapSummary = summarizeGaps(gaps);

  // Check for NOT_READY conditions
  if (shouldRecommendNotReady(fitScore, resumeScore, gapSummary, fitFlags)) {
    return 'NOT_READY';
  }

  // Check for APPLY conditions
  if (shouldRecommendApply(fitScore, resumeScore, gapSummary, fitFlags)) {
    return 'APPLY';
  }

  // Default to OPTIMIZE_FIRST
  return 'OPTIMIZE_FIRST';
}

/**
 * Check if NOT_READY recommendation is appropriate
 */
function shouldRecommendNotReady(
  fitScore: number,
  resumeScore: number,
  gapSummary: { totalCriticalGaps: number; overallMatchPercentage: number },
  fitFlags: FitFlags
): boolean {
  // Too many critical gaps
  if (gapSummary.totalCriticalGaps > RECOMMENDATION_THRESHOLDS.max_critical_gaps_for_not_ready) {
    return true;
  }

  // Very low fit score
  if (fitScore < RECOMMENDATION_THRESHOLDS.optimize_threshold - 10) {
    return true;
  }

  // Significantly underqualified
  if (fitFlags.underqualified && fitFlags.career_switch) {
    return true;
  }

  // Very low resume quality
  if (resumeScore < RECOMMENDATION_THRESHOLDS.min_resume_quality - 20) {
    return true;
  }

  // Very low overall match
  if (gapSummary.overallMatchPercentage < 30) {
    return true;
  }

  return false;
}

/**
 * Check if APPLY recommendation is appropriate
 */
function shouldRecommendApply(
  fitScore: number,
  resumeScore: number,
  gapSummary: { totalCriticalGaps: number; overallMatchPercentage: number },
  fitFlags: FitFlags
): boolean {
  // High fit score with good resume quality
  if (
    fitScore >= RECOMMENDATION_THRESHOLDS.apply_threshold &&
    resumeScore >= RECOMMENDATION_THRESHOLDS.min_resume_quality
  ) {
    // Check for disqualifying factors
    if (gapSummary.totalCriticalGaps <= RECOMMENDATION_THRESHOLDS.max_critical_gaps_for_apply) {
      return true;
    }
  }

  // Good fit with excellent resume (compensates for minor gaps)
  if (
    fitScore >= RECOMMENDATION_THRESHOLDS.optimize_threshold + 5 &&
    resumeScore >= 75
  ) {
    return true;
  }

  // Strong technical match and aligned seniority (even if fit is moderate)
  if (
    gapSummary.overallMatchPercentage >= 80 &&
    !fitFlags.underqualified &&
    resumeScore >= RECOMMENDATION_THRESHOLDS.min_resume_quality
  ) {
    return true;
  }

  return false;
}

// ==================== Reasoning Generation ====================

/**
 * Generate human-readable reasoning for the recommendation
 */
export function generateRecommendationReasoning(
  recommendation: RecommendationType,
  fitScore: number,
  resumeScore: number,
  gaps: GapAnalysis,
  fitFlags: FitFlags
): string {
  const gapSummary = summarizeGaps(gaps);
  let reasoning = '';

  switch (recommendation) {
    case 'APPLY':
      reasoning = generateApplyReasoning(fitScore, resumeScore, gapSummary, fitFlags);
      break;
    case 'OPTIMIZE_FIRST':
      reasoning = generateOptimizeReasoning(fitScore, resumeScore, gapSummary, fitFlags, gaps);
      break;
    case 'NOT_READY':
      reasoning = generateNotReadyReasoning(fitScore, resumeScore, gapSummary, fitFlags, gaps);
      break;
  }

  return reasoning;
}

/**
 * Generate reasoning for APPLY recommendation
 */
function generateApplyReasoning(
  fitScore: number,
  resumeScore: number,
  gapSummary: { totalCriticalGaps: number; overallMatchPercentage: number },
  fitFlags: FitFlags
): string {
  const reasons: string[] = [];

  reasons.push(`Strong fit score of ${fitScore}/100 indicates good alignment with this role.`);

  if (resumeScore >= 75) {
    reasons.push(`Your resume quality score of ${resumeScore}/100 is excellent.`);
  } else if (resumeScore >= 60) {
    reasons.push(`Your resume quality score of ${resumeScore}/100 is solid.`);
  }

  if (gapSummary.overallMatchPercentage >= 80) {
    reasons.push(`${Math.round(gapSummary.overallMatchPercentage)}% technical match with requirements.`);
  }

  if (fitFlags.stretch_role) {
    reasons.push(`While slightly junior for this role, your experience shows growth potential.`);
  }

  if (gapSummary.totalCriticalGaps > 0) {
    reasons.push(`Minor gaps in ${gapSummary.totalCriticalGaps} areas can be addressed in your cover letter.`);
  }

  return reasons.join(' ');
}

/**
 * Generate reasoning for OPTIMIZE_FIRST recommendation
 */
function generateOptimizeReasoning(
  fitScore: number,
  resumeScore: number,
  gapSummary: { totalCriticalGaps: number; overallMatchPercentage: number },
  fitFlags: FitFlags,
  gaps: GapAnalysis
): string {
  const reasons: string[] = [];
  const improvements: string[] = [];

  if (fitScore < RECOMMENDATION_THRESHOLDS.apply_threshold) {
    reasons.push(`Fit score of ${fitScore}/100 is moderate - tailoring your resume could significantly improve your chances.`);
  }

  if (resumeScore < RECOMMENDATION_THRESHOLDS.min_resume_quality) {
    reasons.push(`Your resume quality score of ${resumeScore}/100 needs improvement.`);
    improvements.push('improving resume quality (metrics, action verbs)');
  }

  if (gaps.skills.critical_missing.length > 0) {
    const missingSkills = gaps.skills.critical_missing.slice(0, 3).join(', ');
    improvements.push(`adding missing skills (${missingSkills})`);
  }

  if (gaps.tools.critical_missing.length > 0) {
    const missingTools = gaps.tools.critical_missing.slice(0, 2).join(', ');
    improvements.push(`mentioning experience with ${missingTools}`);
  }

  if (fitFlags.underqualified && !fitFlags.stretch_role) {
    reasons.push(`The role may require more experience than demonstrated in your resume.`);
    improvements.push('highlighting leadership and scope of impact');
  }

  if (improvements.length > 0) {
    reasons.push(`Consider ${improvements.join(', ')} before applying.`);
  }

  reasons.push('These changes could boost your fit score by 10-20 points.');

  return reasons.join(' ');
}

/**
 * Generate reasoning for NOT_READY recommendation
 */
function generateNotReadyReasoning(
  fitScore: number,
  resumeScore: number,
  gapSummary: { totalCriticalGaps: number; overallMatchPercentage: number },
  fitFlags: FitFlags,
  gaps: GapAnalysis
): string {
  const reasons: string[] = [];
  const blockers: string[] = [];

  reasons.push(`With a fit score of ${fitScore}/100, there are significant gaps to address before applying.`);

  if (gapSummary.overallMatchPercentage < 40) {
    blockers.push(`only ${Math.round(gapSummary.overallMatchPercentage)}% technical match with requirements`);
  }

  if (fitFlags.underqualified && fitFlags.career_switch) {
    blockers.push('this role requires different experience than your background');
  } else if (fitFlags.underqualified) {
    const yearsGap = gaps.seniority.gap_years || 0;
    blockers.push(`${yearsGap}+ years more experience typically expected`);
  }

  if (resumeScore < 40) {
    blockers.push('resume needs significant quality improvements');
  }

  if (gaps.skills.critical_missing.length > 5) {
    blockers.push(`${gaps.skills.critical_missing.length} critical skills are missing`);
  }

  if (blockers.length > 0) {
    reasons.push(`Key issues: ${blockers.join('; ')}.`);
  }

  reasons.push('Consider targeting roles that better match your current experience, or gain the missing skills first.');

  return reasons.join(' ');
}

// ==================== Alternative Role Suggestions ====================

/**
 * Suggest alternative approaches based on gaps
 */
export function suggestAlternatives(
  fitFlags: FitFlags,
  gaps: GapAnalysis
): string[] {
  const suggestions: string[] = [];

  if (fitFlags.overqualified) {
    suggestions.push('Consider applying for senior/lead versions of this role');
    suggestions.push('Look for roles with management responsibilities');
  }

  if (fitFlags.underqualified) {
    suggestions.push('Look for junior/associate versions of this role');
    suggestions.push('Consider internships or entry-level positions in this field');
    suggestions.push('Build missing skills through courses or side projects');
  }

  if (fitFlags.career_switch) {
    suggestions.push('Target transitional roles that bridge your experience');
    suggestions.push('Highlight transferable skills in your cover letter');
    suggestions.push('Network with people who have made similar transitions');
  }

  if (gaps.skills.critical_missing.length > 3) {
    suggestions.push('Take courses in the missing skill areas');
    suggestions.push('Work on projects that demonstrate these skills');
  }

  return suggestions.slice(0, 4);
}

// ==================== Score Impact Estimation ====================

/**
 * Estimate potential score improvement if gaps are addressed
 */
export function estimatePotentialImprovement(
  currentFitScore: number,
  gaps: GapAnalysis
): {
  potentialScore: number;
  actions: string[];
} {
  let potentialGain = 0;
  const actions: string[] = [];

  // Adding missing skills
  if (gaps.skills.critical_missing.length > 0) {
    const skillGain = Math.min(15, gaps.skills.critical_missing.length * 3);
    potentialGain += skillGain;
    actions.push(`Add ${Math.min(5, gaps.skills.critical_missing.length)} missing skills (+${skillGain} pts)`);
  }

  // Adding missing tools
  if (gaps.tools.critical_missing.length > 0) {
    const toolGain = Math.min(8, gaps.tools.critical_missing.length * 2);
    potentialGain += toolGain;
    actions.push(`Mention ${Math.min(4, gaps.tools.critical_missing.length)} missing tools (+${toolGain} pts)`);
  }

  // Demonstrating experience types
  if (gaps.experience.missing_types.length > 0) {
    const expGain = Math.min(10, gaps.experience.missing_types.length * 3);
    potentialGain += expGain;
    actions.push(`Highlight ${gaps.experience.missing_types.slice(0, 2).join(', ')} experience (+${expGain} pts)`);
  }

  // Industry keywords
  if (gaps.industry.keywords_missing.length > 2) {
    potentialGain += 5;
    actions.push('Add industry-relevant keywords (+5 pts)');
  }

  const potentialScore = Math.min(100, currentFitScore + potentialGain);

  return { potentialScore, actions };
}

// ==================== Export ====================

export {
  determineRecommendation,
  shouldRecommendApply,
  shouldRecommendNotReady,
};
