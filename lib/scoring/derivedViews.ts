/**
 * Derived Views - Backward-Compatible Score Mapping
 *
 * This module derives 3D scoring views FROM PRO (4D) scores.
 * It is NOT a separate scoring engine - it is a pure transformation
 * that maps PRO dimensions to the legacy 3D format for backward compatibility.
 *
 * PRO (4D) → 3D Mapping:
 *   - Format & Structure → Structure
 *   - Content Quality → Content
 *   - ATS Compatibility → Tailoring (when no job fit data)
 *   - Job Fit (Layer 6) → Tailoring (when available)
 *
 * This function is deterministic: same input always produces same output.
 */

import type { ScoringResult, ComponentScore } from './types';

// ==================== Types ====================

/**
 * Represents the legacy 3D scoring view derived from PRO scores.
 * All scores are on 0-100 scale for consistency.
 */
export interface ThreeDView {
  /** Structure score (0-100): Derived from PRO Format & Structure */
  structure: number;

  /** Content score (0-100): Derived from PRO Content Quality */
  content: number;

  /** Tailoring score (0-100): Derived from Job Fit OR PRO ATS Compatibility */
  tailoring: number;

  /** Overall score (0-100): Same as PRO overall */
  overall: number;
}

/**
 * Represents the legacy 3D scoring view with raw scale scores.
 * Structure: 0-40, Content: 0-60, Tailoring: 0-40
 */
export interface ThreeDViewRaw {
  /** Structure score (0-40): Scaled from PRO Format & Structure */
  structure: number;

  /** Content score (0-60): Scaled from PRO Content Quality */
  content: number;

  /** Tailoring score (0-40): Scaled from PRO ATS or Job Fit */
  tailoring: number;

  /** Overall score (0-100): Same as PRO overall */
  overall: number;
}

/**
 * Minimal PRO score shape required by derive3DFromPRO.
 * Accepts both full ScoringResult and partial objects for flexibility.
 */
export interface PROScoreInput {
  overall: number;
  dimensions: {
    format?: { score: number };
    content?: { score: number };
    ats?: { score: number };
    impact?: { score: number };
  };
}

/**
 * Optional job fit result from Layer 6.
 * When provided, its overall score replaces ATS for the tailoring dimension.
 */
export interface JobFitInput {
  overall: number;
}

// ==================== Core Functions ====================

/**
 * Derives a 3D view (0-100 scale) from PRO scoring for backward compatibility.
 *
 * This is NOT a separate scoring engine - it's computed FROM PRO.
 * The mapping is:
 *   - structure = PRO format score (0-100)
 *   - content   = PRO content score (0-100)
 *   - tailoring = Job Fit overall (if available) OR PRO ATS score (0-100)
 *   - overall   = PRO overall score (unchanged)
 *
 * @param proScore - PRO scoring result (full or partial)
 * @param jobFit - Optional job fit result from Layer 6
 * @returns ThreeDView with all scores on 0-100 scale
 */
export function derive3DFromPRO(
  proScore: PROScoreInput,
  jobFit?: JobFitInput
): ThreeDView {
  const format = proScore.dimensions.format?.score ?? 0;
  const content = proScore.dimensions.content?.score ?? 0;
  const ats = proScore.dimensions.ats?.score ?? 0;

  return {
    structure: clampScore(format),
    content: clampScore(content),
    tailoring: clampScore(jobFit?.overall ?? ats),
    overall: clampScore(proScore.overall),
  };
}

/**
 * Derives a 3D view with raw scale scores (Structure 0-40, Content 0-60, Tailoring 0-40).
 * This matches the exact scale used by the legacy 3D scoring system and UI components.
 *
 * @param proScore - PRO scoring result (full or partial)
 * @param jobFit - Optional job fit result from Layer 6
 * @returns ThreeDViewRaw with legacy-scale scores
 */
export function derive3DRawFromPRO(
  proScore: PROScoreInput,
  jobFit?: JobFitInput
): ThreeDViewRaw {
  const view = derive3DFromPRO(proScore, jobFit);

  return {
    structure: Math.round((view.structure / 100) * 40),
    content: Math.round((view.content / 100) * 60),
    tailoring: Math.round((view.tailoring / 100) * 40),
    overall: view.overall,
  };
}

/**
 * Converts a full ScoringResult into PROScoreInput for use with derive3DFromPRO.
 * This bridges the gap between the actual ScoringResult type and the simplified input.
 *
 * @param result - Full PRO ScoringResult
 * @returns PROScoreInput suitable for derive3DFromPRO
 */
export function scoringResultToPROInput(result: ScoringResult): PROScoreInput {
  return {
    overall: result.overallScore,
    dimensions: {
      format: { score: result.componentScores.formatStructure.score },
      content: { score: result.componentScores.contentQuality.score },
      ats: { score: result.componentScores.atsCompatibility.score },
      impact: { score: result.componentScores.impactMetrics.score },
    },
  };
}

// ==================== Helpers ====================

/**
 * Clamps a score to 0-100 range.
 */
function clampScore(score: number): number {
  return Math.round(Math.max(0, Math.min(100, score)));
}
