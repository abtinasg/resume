/**
 * Layer 2 - Strategy Engine
 * Experience Gap Analysis
 *
 * Analyzes the gap between resume experience types and required experience.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 4.3
 */

import type {
  ExperienceGap,
  ExperienceType,
  ConfidenceLevel,
  Layer1Evaluation,
  JobContext,
} from '../types';
import { EXPERIENCE_TYPES } from '../types';
import { getExperienceKeywords } from '../config';
import { canonicalize } from '../normalization';

// ==================== Types ====================

interface ExperienceGapInput {
  /** Job titles from resume (most recent first) */
  titles: string[];
  /** Bullet samples from resume */
  bulletsSample?: string[];
  /** Required experience types from job */
  requiredTypes?: ExperienceType[];
  /** Job description text (for keyword extraction) */
  jobDescription?: string;
}

// ==================== Main Analysis Function ====================

/**
 * Analyze experience gap between resume and requirements
 *
 * @param input - Experience gap input data
 * @returns Experience gap analysis result
 */
export function analyzeExperienceGap(input: ExperienceGapInput): ExperienceGap {
  const {
    titles,
    bulletsSample = [],
    requiredTypes = [],
    jobDescription,
  } = input;

  // Detect present experience types from titles and bullets
  const presentTypes = detectExperienceTypes(titles, bulletsSample);

  // Determine required types
  let actualRequiredTypes: ExperienceType[];
  if (requiredTypes.length > 0) {
    actualRequiredTypes = requiredTypes;
  } else if (jobDescription) {
    actualRequiredTypes = extractRequiredTypesFromJD(jobDescription);
  } else {
    // No requirements provided, use default common types
    actualRequiredTypes = ['shipping_ownership', 'cross_functional'];
  }

  // Calculate coverage
  const matchedTypes = presentTypes.filter(t => actualRequiredTypes.includes(t));
  const missingTypes = actualRequiredTypes.filter(t => !presentTypes.includes(t));

  // Calculate coverage score
  const coverageScore = actualRequiredTypes.length > 0
    ? Math.round((matchedTypes.length / actualRequiredTypes.length) * 100)
    : 100;

  // Determine confidence
  const confidence = determineConfidence(
    bulletsSample.length,
    requiredTypes.length,
    !!jobDescription
  );

  return {
    present_types: presentTypes,
    missing_types: missingTypes,
    coverage_score: coverageScore,
    confidence,
  };
}

/**
 * Analyze experience gap using Layer 1 evaluation and job context
 *
 * @param evaluation - Layer 1 evaluation results
 * @param jobContext - Optional job context
 * @returns Experience gap analysis result
 */
export function analyzeExperienceGapFromLayers(
  evaluation: Layer1Evaluation,
  jobContext?: JobContext
): ExperienceGap {
  const titles = evaluation.extracted.titles;
  const bulletsSample = evaluation.extracted.bullets_sample;
  const jobDescription = jobContext?.job_description;

  // No explicit required types from job_requirements, so derive from JD
  const requiredTypes: ExperienceType[] = [];

  return analyzeExperienceGap({
    titles,
    bulletsSample,
    requiredTypes,
    jobDescription,
  });
}

// ==================== Experience Type Detection ====================

/**
 * Detect experience types from titles and bullets
 *
 * @param titles - Job titles
 * @param bullets - Bullet point samples
 * @returns Array of detected experience types
 */
export function detectExperienceTypes(
  titles: string[],
  bullets: string[]
): ExperienceType[] {
  const detectedTypes = new Set<ExperienceType>();
  const experienceKeywords = getExperienceKeywords();

  // Combine titles and bullets for analysis
  const allText = [...titles, ...bullets]
    .join(' ')
    .toLowerCase();

  // Check each experience type
  for (const expType of EXPERIENCE_TYPES) {
    const keywords = experienceKeywords[expType] ?? [];
    
    for (const keyword of keywords) {
      if (allText.includes(keyword.toLowerCase())) {
        detectedTypes.add(expType);
        break; // Found a match, move to next type
      }
    }
  }

  return Array.from(detectedTypes);
}

/**
 * Extract required experience types from job description
 *
 * @param jobDescription - Job description text
 * @returns Array of required experience types
 */
export function extractRequiredTypesFromJD(jobDescription: string): ExperienceType[] {
  const detectedTypes = new Set<ExperienceType>();
  const experienceKeywords = getExperienceKeywords();
  const jdLower = jobDescription.toLowerCase();

  // Check for each experience type keyword in JD
  for (const expType of EXPERIENCE_TYPES) {
    const keywords = experienceKeywords[expType] ?? [];
    
    for (const keyword of keywords) {
      if (jdLower.includes(keyword.toLowerCase())) {
        detectedTypes.add(expType);
        break;
      }
    }
  }

  return Array.from(detectedTypes);
}

// ==================== Helper Functions ====================

/**
 * Determine confidence level based on input completeness
 */
function determineConfidence(
  bulletCount: number,
  requiredCount: number,
  hasJD: boolean
): ConfidenceLevel {
  // High confidence: have bullets and requirements or JD
  if (bulletCount >= 5 && (requiredCount > 0 || hasJD)) {
    return 'high';
  }

  // Medium confidence: have some bullets or JD
  if (bulletCount > 0 || hasJD) {
    return 'medium';
  }

  // Low confidence: no bullets or JD
  return 'low';
}

/**
 * Get experience gap summary for display
 *
 * @param gap - Experience gap analysis result
 * @returns Human-readable summary
 */
export function getExperienceGapSummary(gap: ExperienceGap): string {
  const parts: string[] = [];

  if (gap.present_types.length > 0) {
    parts.push(`${gap.present_types.length} experience types demonstrated`);
  }

  if (gap.missing_types.length > 0) {
    const missingFormatted = gap.missing_types
      .map(t => t.replace(/_/g, ' '))
      .join(', ');
    parts.push(`Missing: ${missingFormatted}`);
  }

  parts.push(`${gap.coverage_score}% coverage`);

  return parts.join('. ');
}

/**
 * Check if experience gap indicates a good fit
 *
 * @param gap - Experience gap analysis result
 * @param threshold - Coverage score threshold (default 60%)
 * @returns True if experience coverage meets threshold
 */
export function isGoodExperienceFit(gap: ExperienceGap, threshold: number = 60): boolean {
  return gap.coverage_score >= threshold;
}

/**
 * Get display name for an experience type
 *
 * @param type - Experience type
 * @returns Human-readable name
 */
export function getExperienceTypeDisplayName(type: ExperienceType): string {
  const displayNames: Record<ExperienceType, string> = {
    leadership: 'Leadership',
    cross_functional: 'Cross-Functional Collaboration',
    project_management: 'Project Management',
    stakeholder_management: 'Stakeholder Management',
    customer_facing: 'Customer-Facing Experience',
    data_driven: 'Data-Driven Decision Making',
    architecture_system_design: 'Architecture & System Design',
    shipping_ownership: 'Product Shipping & Ownership',
    mentorship: 'Mentorship',
    process_improvement: 'Process Improvement',
  };

  return displayNames[type] ?? type;
}
