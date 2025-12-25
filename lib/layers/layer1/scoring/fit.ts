/**
 * Layer 1 - Evaluation Engine
 * Fit Evaluation Module
 *
 * Evaluates how well a resume fits a specific job description.
 * Builds on the generic evaluation and adds fit-specific analysis.
 */

import type {
  ParsedResume,
  EvaluationResult,
  FitScore,
  ParsedJobRequirements,
  GapAnalysis,
  FitDimensions,
  FitFlags,
  PriorityImprovement,
  ExtractedEntities,
  WeakBullet,
  RecommendationType,
} from '../types';
import { SeniorityLevel } from '../../shared/types';
import { evaluateGeneric } from './generic';
import { detectGaps, summarizeGaps } from '../modules/gap-detection';
import { getRecommendation, generateRecommendationReasoning } from '../modules/recommendation';
import {
  FIT_WEIGHTS,
  TECHNICAL_MATCH_WEIGHTS,
  RECOMMENDATION_THRESHOLDS,
} from '../config/weights';

// ==================== Main Fit Evaluation Function ====================

/**
 * Evaluate resume fit for a specific job description
 */
export function evaluateFit(
  parsed: ParsedResume,
  rawText: string,
  requirements: ParsedJobRequirements
): FitScore {
  const startTime = Date.now();

  // Step 1: Get generic evaluation first
  const { result: genericResult, extracted, weakBullets } = evaluateGeneric(parsed, rawText);

  // Step 2: Detect gaps against job requirements
  const gaps = detectGaps(parsed, extracted, requirements);

  // Step 3: Calculate fit dimensions
  const fitDimensions = calculateFitDimensions(genericResult, gaps);

  // Step 4: Calculate overall fit score
  const fitScore = calculateFitScore(fitDimensions, genericResult.resume_score);

  // Step 5: Generate fit flags
  const fitFlags = generateFitFlags(gaps, genericResult.resume_score);

  // Step 6: Get recommendation
  const { recommendation, reasoning } = getRecommendation(
    fitScore,
    genericResult.resume_score,
    gaps,
    fitFlags
  );

  // Step 7: Generate tailoring hints
  const tailoringHints = generateTailoringHints(gaps, requirements, extracted);

  // Step 8: Generate priority improvements
  const priorityImprovements = generatePriorityImprovements(gaps, requirements);

  // Build fit score result (extends generic result)
  const fitResult: FitScore = {
    // Include all generic evaluation fields
    ...genericResult,

    // Override weak_bullets to include fit context
    weak_bullets: prioritizeWeakBullets(weakBullets, requirements),

    // Fit-specific fields
    fit_score: fitScore,
    fit_dimensions: fitDimensions,
    gaps,
    fit_flags: fitFlags,
    recommendation,
    recommendation_reasoning: reasoning,
    tailoring_hints: tailoringHints,
    priority_improvements: priorityImprovements,

    // Fit-specific metadata
    fit_meta: {
      job_parsed_successfully: true,
      confidence: calculateConfidence(requirements),
    },

    // Update processing time to include fit analysis
    meta: {
      ...genericResult.meta,
      processing_time_ms: Date.now() - startTime,
    },
  };

  return fitResult;
}

// ==================== Fit Dimension Calculation ====================

/**
 * Calculate fit dimensions based on gaps and generic score
 */
function calculateFitDimensions(
  genericResult: EvaluationResult,
  gaps: GapAnalysis
): FitDimensions {
  // Technical match (skills + tools)
  const skillsScore = gaps.skills.match_percentage;
  const toolsScore = gaps.tools.match_percentage;
  const technicalMatch = Math.round(
    skillsScore * TECHNICAL_MATCH_WEIGHTS.skills +
    toolsScore * TECHNICAL_MATCH_WEIGHTS.tools
  );

  // Seniority match (based on alignment)
  let seniorityMatch: number;
  switch (gaps.seniority.alignment) {
    case 'aligned':
      seniorityMatch = 100;
      break;
    case 'underqualified':
      // Penalty based on years gap
      const yearsGap = gaps.seniority.gap_years || 2;
      seniorityMatch = Math.max(40, 100 - yearsGap * 15);
      break;
    case 'overqualified':
      // Slight penalty for overqualification
      seniorityMatch = 80;
      break;
    default:
      seniorityMatch = 70;
  }

  // Experience match
  const experienceMatch = Math.round(gaps.experience.coverage_score);

  // Signal quality from generic score
  const signalQuality = genericResult.dimensions.signal_quality.score;

  return {
    technical_match: technicalMatch,
    seniority_match: seniorityMatch,
    experience_match: experienceMatch,
    signal_quality: signalQuality,
  };
}

// ==================== Fit Score Calculation ====================

/**
 * Calculate overall fit score
 * Formula: Fit = Σ(dimension × weight) × qualityFactor
 * 
 * Quality Factor: Applies a smooth penalty when resume_score < 60.
 * Rationale: Poor presentation likely reduces hiring manager interest
 * even with good skill match. Factor ranges from 0.85 (at score 0) to
 * 1.0 (at score 60+), providing a gradual transition rather than a
 * hard cutoff.
 */
function calculateFitScore(
  fitDimensions: FitDimensions,
  resumeScore: number
): number {
  const rawFitScore =
    fitDimensions.technical_match * FIT_WEIGHTS.technical +
    fitDimensions.seniority_match * FIT_WEIGHTS.seniority +
    fitDimensions.experience_match * FIT_WEIGHTS.experience +
    fitDimensions.signal_quality * FIT_WEIGHTS.signal;

  // Apply resume quality factor: smooth transition from 0.85 to 1.0 based on resume score
  // At score 60+: factor = 1.0 (no penalty)
  // At score 0: factor = 0.85 (15% penalty)
  // Between 0-60: linear interpolation
  const qualityFactor = resumeScore >= 60 ? 1.0 : 0.85 + (resumeScore / 60) * 0.15;

  return Math.round(rawFitScore * qualityFactor);
}

// ==================== Fit Flags Generation ====================

/**
 * Generate fit-specific flags
 */
function generateFitFlags(gaps: GapAnalysis, resumeScore: number): FitFlags {
  const summary = summarizeGaps(gaps);

  return {
    underqualified: gaps.seniority.alignment === 'underqualified',
    overqualified: gaps.seniority.alignment === 'overqualified',
    career_switch:
      gaps.industry.match_percentage < 50 ||
      gaps.experience.missing_types.length > gaps.experience.matched_types.length,
    low_signal: resumeScore < RECOMMENDATION_THRESHOLDS.min_resume_quality,
    stretch_role:
      gaps.seniority.alignment === 'underqualified' &&
      (gaps.seniority.gap_years || 0) <= 2,
  };
}

// ==================== Tailoring Hints ====================

/**
 * Generate tailoring hints for resume improvement
 */
function generateTailoringHints(
  gaps: GapAnalysis,
  requirements: ParsedJobRequirements,
  extracted: ExtractedEntities
): string[] {
  const hints: string[] = [];

  // Skills to add
  if (gaps.skills.critical_missing.length > 0) {
    const topMissing = gaps.skills.critical_missing.slice(0, 3);
    hints.push(`Add these key skills if you have them: ${topMissing.join(', ')}`);
  }

  // Transferable skills to highlight
  if (gaps.skills.transferable.length > 0) {
    hints.push(
      `Highlight these transferable skills more prominently: ${gaps.skills.transferable.slice(0, 3).join(', ')}`
    );
  }

  // Tools to mention
  if (gaps.tools.critical_missing.length > 0) {
    const topTools = gaps.tools.critical_missing.slice(0, 3);
    hints.push(`Mention experience with: ${topTools.join(', ')} if applicable`);
  }

  // Experience type hints
  if (gaps.experience.missing_types.length > 0) {
    const missingExp = gaps.experience.missing_types.slice(0, 2);
    hints.push(
      `Include examples that demonstrate: ${missingExp.join(' and ')}`
    );
  }

  // Industry keywords
  if (gaps.industry.keywords_missing.length > 0) {
    const industryKws = gaps.industry.keywords_missing.slice(0, 3);
    hints.push(`Add industry-relevant keywords: ${industryKws.join(', ')}`);
  }

  // Seniority alignment
  if (gaps.seniority.alignment === 'underqualified') {
    hints.push(
      'Emphasize leadership experience and larger scope projects to appear more senior'
    );
  } else if (gaps.seniority.alignment === 'overqualified') {
    hints.push(
      'Consider highlighting specific hands-on technical work to show you\'re still engaged at this level'
    );
  }

  return hints.slice(0, 6);
}

// ==================== Priority Improvements ====================

/**
 * Generate priority improvements for fit
 */
function generatePriorityImprovements(
  gaps: GapAnalysis,
  requirements: ParsedJobRequirements
): PriorityImprovement[] {
  const improvements: PriorityImprovement[] = [];

  // Add missing critical skills
  for (const skill of gaps.skills.critical_missing.slice(0, 3)) {
    improvements.push({
      type: 'add_skill',
      target: skill,
      why: `This skill is listed as required in the job description`,
      estimated_impact: 5,
    });
  }

  // Add missing tools
  for (const tool of gaps.tools.critical_missing.slice(0, 2)) {
    improvements.push({
      type: 'add_skill',
      target: tool,
      why: `This tool is specifically mentioned as required`,
      estimated_impact: 3,
    });
  }

  // Add missing experience types
  for (const expType of gaps.experience.missing_types.slice(0, 2)) {
    improvements.push({
      type: 'add_experience',
      target: expType,
      why: `This type of experience is expected for this role`,
      estimated_impact: 4,
    });
  }

  // Sort by estimated impact
  improvements.sort((a, b) => b.estimated_impact - a.estimated_impact);

  return improvements.slice(0, 5);
}

// ==================== Weak Bullet Prioritization ====================

/**
 * Prioritize weak bullets based on job relevance
 */
function prioritizeWeakBullets(
  weakBullets: WeakBullet[],
  requirements: ParsedJobRequirements
): WeakBullet[] | undefined {
  if (weakBullets.length === 0) return undefined;

  // Score bullets based on relevance to job
  const scoredBullets = weakBullets.map(bullet => {
    let relevanceScore = 0;

    // Check if bullet contains any required skills
    for (const skill of requirements.required_skills) {
      if (bullet.bullet.toLowerCase().includes(skill.toLowerCase())) {
        relevanceScore += 3;
      }
    }

    // Check if bullet contains any required tools
    for (const tool of requirements.required_tools) {
      if (bullet.bullet.toLowerCase().includes(tool.toLowerCase())) {
        relevanceScore += 2;
      }
    }

    // Prioritize recent experience
    if (bullet.location.company) {
      relevanceScore += 1;
    }

    return { bullet, relevanceScore };
  });

  // Sort by relevance (highest first) and return top 5
  return scoredBullets
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5)
    .map(sb => sb.bullet);
}

// ==================== Confidence Calculation ====================

/**
 * Calculate confidence in fit analysis
 */
function calculateConfidence(
  requirements: ParsedJobRequirements
): 'low' | 'medium' | 'high' {
  // Higher confidence with more detailed requirements
  const detailScore =
    requirements.required_skills.length +
    requirements.required_tools.length +
    (requirements.preferred_skills?.length || 0) +
    (requirements.domain_keywords?.length || 0);

  if (detailScore >= 15) return 'high';
  if (detailScore >= 8) return 'medium';
  return 'low';
}

// ==================== Export ====================

export { evaluateFit as default };
