/**
 * Layer 2 - Strategy Engine
 * Tools Gap Analysis
 *
 * Analyzes the gap between resume tools and required/preferred tools.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 4.2
 */

import type {
  ToolsGap,
  ConfidenceLevel,
  Layer1Evaluation,
  JobRequirements,
} from '../types';
import {
  canonicalizeAll,
  findMatches,
  calculateMatchPercentage,
  isTool,
} from '../normalization';

// ==================== Types ====================

interface ToolsGapInput {
  /** Tools from resume (Layer 1 extracted) */
  resumeTools: string[];
  /** Required tools from job requirements */
  requiredTools?: string[];
  /** Preferred tools from job requirements */
  preferredTools?: string[];
  /** Keyword importance mapping (if available) */
  keywordImportance?: Record<string, 'critical' | 'important' | 'nice'>;
}

// ==================== Main Analysis Function ====================

/**
 * Analyze tools gap between resume and requirements
 *
 * @param input - Tools gap input data
 * @returns Tools gap analysis result
 */
export function analyzeToolsGap(input: ToolsGapInput): ToolsGap {
  const {
    resumeTools,
    requiredTools = [],
    preferredTools = [],
    keywordImportance,
  } = input;

  // Canonicalize all lists
  const canonicalResumeTools = canonicalizeAll(resumeTools);
  const canonicalRequired = canonicalizeAll(requiredTools);
  const canonicalPreferred = canonicalizeAll(preferredTools);

  // Find matches with required tools
  const { matched, unmatchedFromList2: missingRequired } = findMatches(
    canonicalResumeTools,
    canonicalRequired
  );

  // Find matches with preferred tools
  const { matched: matchedPreferred, unmatchedFromList2: missingPreferred } = findMatches(
    canonicalResumeTools,
    canonicalPreferred
  );

  // Combine matched tools
  const allMatched = [...new Set([...matched, ...matchedPreferred])];

  // Classify missing tools by importance
  const criticalMissing: string[] = [];
  const niceToHaveMissing: string[] = [];

  // First, use keyword importance if available
  if (keywordImportance && Object.keys(keywordImportance).length > 0) {
    for (const tool of missingRequired) {
      const importance = keywordImportance[tool];
      if (importance === 'critical' || importance === 'important') {
        criticalMissing.push(tool);
      } else {
        niceToHaveMissing.push(tool);
      }
    }
  } else {
    // Default: all required tools are critical
    criticalMissing.push(...missingRequired);
  }

  // Preferred tools are nice-to-have
  niceToHaveMissing.push(...missingPreferred);

  // Calculate match percentage based on required tools
  const matchPercentage = calculateMatchPercentage(canonicalResumeTools, canonicalRequired);

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
 * Analyze tools gap using Layer 1 evaluation and job context
 *
 * @param evaluation - Layer 1 evaluation results
 * @param jobRequirements - Optional job requirements
 * @returns Tools gap analysis result
 */
export function analyzeToolsGapFromLayers(
  evaluation: Layer1Evaluation,
  jobRequirements?: JobRequirements
): ToolsGap {
  // Extract resume tools
  const resumeTools = evaluation.extracted.tools;

  // Extract job requirements if available
  const requiredTools = jobRequirements?.required_tools ?? [];
  const preferredTools = jobRequirements?.preferred_tools ?? [];
  const keywordImportance = jobRequirements?.keyword_importance;

  return analyzeToolsGap({
    resumeTools,
    requiredTools,
    preferredTools,
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
 * Filter a list to only include recognized tools
 *
 * @param terms - List of terms to filter
 * @returns Filtered list of recognized tools
 */
export function filterToTools(terms: string[]): string[] {
  return terms.filter(isTool);
}

/**
 * Get tools gap summary for display
 *
 * @param gap - Tools gap analysis result
 * @returns Human-readable summary
 */
export function getToolsGapSummary(gap: ToolsGap): string {
  const parts: string[] = [];

  if (gap.matched.length > 0) {
    parts.push(`${gap.matched.length} tools matched`);
  }

  if (gap.critical_missing.length > 0) {
    parts.push(`${gap.critical_missing.length} critical tools missing`);
  }

  if (gap.nice_to_have_missing && gap.nice_to_have_missing.length > 0) {
    parts.push(`${gap.nice_to_have_missing.length} nice-to-have tools missing`);
  }

  parts.push(`${gap.match_percentage}% match`);

  return parts.join(', ');
}

/**
 * Check if tools gap indicates a good fit
 *
 * @param gap - Tools gap analysis result
 * @param threshold - Match percentage threshold (default 60%)
 * @returns True if tools match meets threshold
 */
export function isGoodToolsFit(gap: ToolsGap, threshold: number = 60): boolean {
  return gap.match_percentage >= threshold && gap.critical_missing.length <= 2;
}
