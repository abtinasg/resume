/**
 * Layer 2 - Strategy Engine
 * Skills Gap Analysis
 *
 * Analyzes the gap between resume skills and required/preferred skills.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 4.1
 */

import type {
  SkillsGap,
  ConfidenceLevel,
  Layer1Evaluation,
  JobRequirements,
} from '../types';
import {
  canonicalizeAll,
  findMatches,
  calculateMatchPercentage,
  isSkill,
} from '../normalization';

// ==================== Types ====================

interface SkillsGapInput {
  /** Skills from resume (Layer 1 extracted) */
  resumeSkills: string[];
  /** Required skills from job requirements */
  requiredSkills?: string[];
  /** Preferred skills from job requirements */
  preferredSkills?: string[];
  /** Keyword importance mapping (if available) */
  keywordImportance?: Record<string, 'critical' | 'important' | 'nice'>;
}

// ==================== Main Analysis Function ====================

/**
 * Analyze skills gap between resume and requirements
 *
 * @param input - Skills gap input data
 * @returns Skills gap analysis result
 */
export function analyzeSkillsGap(input: SkillsGapInput): SkillsGap {
  const {
    resumeSkills,
    requiredSkills = [],
    preferredSkills = [],
    keywordImportance,
  } = input;

  // Canonicalize all lists
  const canonicalResumeSkills = canonicalizeAll(resumeSkills);
  const canonicalRequired = canonicalizeAll(requiredSkills);
  const canonicalPreferred = canonicalizeAll(preferredSkills);

  // Find matches with required skills
  const { matched, unmatchedFromList2: missingRequired } = findMatches(
    canonicalResumeSkills,
    canonicalRequired
  );

  // Find matches with preferred skills
  const { matched: matchedPreferred, unmatchedFromList2: missingPreferred } = findMatches(
    canonicalResumeSkills,
    canonicalPreferred
  );

  // Combine matched skills
  const allMatched = [...new Set([...matched, ...matchedPreferred])];

  // Classify missing skills by importance
  const criticalMissing: string[] = [];
  const niceToHaveMissing: string[] = [];

  // First, use keyword importance if available
  if (keywordImportance && Object.keys(keywordImportance).length > 0) {
    for (const skill of missingRequired) {
      const importance = keywordImportance[skill];
      if (importance === 'critical' || importance === 'important') {
        criticalMissing.push(skill);
      } else {
        niceToHaveMissing.push(skill);
      }
    }
  } else {
    // Default: all required skills are critical
    criticalMissing.push(...missingRequired);
  }

  // Preferred skills are nice-to-have
  niceToHaveMissing.push(...missingPreferred);

  // Calculate match percentage based on required skills
  const matchPercentage = calculateMatchPercentage(canonicalResumeSkills, canonicalRequired);

  // Determine confidence level
  const confidence = determineConfidence(
    canonicalRequired.length,
    canonicalPreferred.length,
    !!keywordImportance
  );

  return {
    matched: allMatched,
    critical_missing: criticalMissing,
    nice_to_have_missing: niceToHaveMissing,
    match_percentage: matchPercentage,
    confidence,
  };
}

/**
 * Analyze skills gap using Layer 1 evaluation and job context
 *
 * @param evaluation - Layer 1 evaluation results
 * @param jobRequirements - Optional job requirements
 * @returns Skills gap analysis result
 */
export function analyzeSkillsGapFromLayers(
  evaluation: Layer1Evaluation,
  jobRequirements?: JobRequirements
): SkillsGap {
  // Extract resume skills
  const resumeSkills = evaluation.extracted.skills;

  // Extract job requirements if available
  const requiredSkills = jobRequirements?.required_skills ?? [];
  const preferredSkills = jobRequirements?.preferred_skills ?? [];
  const keywordImportance = jobRequirements?.keyword_importance;

  return analyzeSkillsGap({
    resumeSkills,
    requiredSkills,
    preferredSkills,
    keywordImportance,
  });
}

// ==================== Helper Functions ====================

/**
 * Determine confidence level based on input completeness
 */
function determineConfidence(
  requiredCount: number,
  preferredCount: number,
  hasImportance: boolean
): ConfidenceLevel {
  // High confidence: have requirements and importance mapping
  if (requiredCount > 0 && hasImportance) {
    return 'high';
  }

  // Medium confidence: have requirements but no importance
  if (requiredCount > 0) {
    return 'medium';
  }

  // Low confidence: no requirements provided
  return 'low';
}

/**
 * Filter a list to only include recognized skills
 *
 * @param terms - List of terms to filter
 * @returns Filtered list of recognized skills
 */
export function filterToSkills(terms: string[]): string[] {
  return terms.filter(isSkill);
}

/**
 * Get skills gap summary for display
 *
 * @param gap - Skills gap analysis result
 * @returns Human-readable summary
 */
export function getSkillsGapSummary(gap: SkillsGap): string {
  const parts: string[] = [];

  if (gap.matched.length > 0) {
    parts.push(`${gap.matched.length} skills matched`);
  }

  if (gap.critical_missing.length > 0) {
    parts.push(`${gap.critical_missing.length} critical skills missing`);
  }

  if (gap.nice_to_have_missing && gap.nice_to_have_missing.length > 0) {
    parts.push(`${gap.nice_to_have_missing.length} nice-to-have skills missing`);
  }

  parts.push(`${gap.match_percentage}% match`);

  return parts.join(', ');
}

/**
 * Check if skills gap indicates a good fit
 *
 * @param gap - Skills gap analysis result
 * @param threshold - Match percentage threshold (default 70%)
 * @returns True if skills match meets threshold
 */
export function isGoodSkillsFit(gap: SkillsGap, threshold: number = 70): boolean {
  return gap.match_percentage >= threshold && gap.critical_missing.length <= 2;
}
