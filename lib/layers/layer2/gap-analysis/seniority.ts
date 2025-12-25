/**
 * Layer 2 - Strategy Engine
 * Seniority Gap Analysis
 *
 * Analyzes the gap between user's seniority level and target role seniority.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 4.4
 */

import type {
  SeniorityGap,
  SeniorityAlignment,
  ConfidenceLevel,
  Layer1Evaluation,
  Layer4State,
  JobRequirements,
} from '../types';
import { SeniorityLevel } from '../types';
import { getSeniorityYearsMapping, getSeniorityTitleKeywords } from '../config';
import { canonicalize } from '../normalization';

// ==================== Types ====================

interface SeniorityGapInput {
  /** Most recent job title */
  currentTitle?: string;
  /** Years of experience */
  yearsExperience?: number;
  /** AI-detected seniority (from Layer 1) */
  aiSeniority?: SeniorityLevel;
  /** AI seniority confidence (from Layer 1) */
  aiConfidence?: ConfidenceLevel;
  /** Target role seniority */
  targetSeniority?: SeniorityLevel;
}

// ==================== Seniority Level Ordering ====================

const SENIORITY_ORDER: Record<SeniorityLevel, number> = {
  [SeniorityLevel.ENTRY]: 0,
  [SeniorityLevel.MID]: 1,
  [SeniorityLevel.SENIOR]: 2,
  [SeniorityLevel.LEAD]: 3,
};

// ==================== Main Analysis Function ====================

/**
 * Analyze seniority gap between user level and target role
 *
 * @param input - Seniority gap input data
 * @returns Seniority gap analysis result
 */
export function analyzeSeniorityGap(input: SeniorityGapInput): SeniorityGap {
  const {
    currentTitle,
    yearsExperience,
    aiSeniority,
    aiConfidence,
    targetSeniority = SeniorityLevel.MID,
  } = input;

  // Determine user level from multiple signals
  const { userLevel, flags, confidence } = determineUserLevel({
    currentTitle,
    yearsExperience,
    aiSeniority,
    aiConfidence,
  });

  // Determine alignment
  const alignment = determineAlignment(userLevel, targetSeniority);

  // Calculate years gap if misaligned
  const gapYears = calculateYearsGap(userLevel, targetSeniority, yearsExperience);

  return {
    user_level: userLevel,
    role_expected: targetSeniority,
    alignment,
    gap_years: gapYears,
    confidence,
    flags: flags.length > 0 ? flags : undefined,
  };
}

/**
 * Analyze seniority gap using Layer 1 evaluation and Layer 4 state
 *
 * @param evaluation - Layer 1 evaluation results
 * @param layer4State - Layer 4 state
 * @param jobRequirements - Optional job requirements
 * @returns Seniority gap analysis result
 */
export function analyzeSeniorityGapFromLayers(
  evaluation: Layer1Evaluation,
  layer4State: Layer4State,
  jobRequirements?: JobRequirements
): SeniorityGap {
  // Get title from extracted data
  const currentTitle = evaluation.extracted.titles[0];

  // Get years from Layer 4 user profile
  const yearsExperience = layer4State.user_profile.years_experience;

  // Get AI seniority if available
  const aiSeniority = evaluation.ai_summary?.seniority_level;
  const aiConfidence = evaluation.ai_summary?.seniority_confidence;

  // Get target seniority
  const targetSeniority = jobRequirements?.seniority_expected 
    ?? layer4State.user_profile.target_seniority
    ?? SeniorityLevel.MID;

  return analyzeSeniorityGap({
    currentTitle,
    yearsExperience,
    aiSeniority,
    aiConfidence,
    targetSeniority,
  });
}

// ==================== Helper Functions ====================

interface UserLevelResult {
  userLevel: SeniorityLevel;
  flags: string[];
  confidence: ConfidenceLevel;
}

/**
 * Determine user seniority level from multiple signals
 *
 * Priority (from spec Section 4.4):
 * 1. AI summary if confidence != low
 * 2. Title keywords
 * 3. Years experience mapping
 */
function determineUserLevel(input: {
  currentTitle?: string;
  yearsExperience?: number;
  aiSeniority?: SeniorityLevel;
  aiConfidence?: ConfidenceLevel;
}): UserLevelResult {
  const { currentTitle, yearsExperience, aiSeniority, aiConfidence } = input;
  const flags: string[] = [];

  // Signal 1: AI seniority (if confidence is not low)
  if (aiSeniority && aiConfidence && aiConfidence !== 'low') {
    const aiLevel = aiSeniority;
    
    // Check for conflict with years experience
    if (yearsExperience !== undefined) {
      const yearsLevel = getSeniorityFromYears(yearsExperience);
      const aiOrder = SENIORITY_ORDER[aiLevel];
      const yearsOrder = SENIORITY_ORDER[yearsLevel];

      // If title suggests 2+ levels higher than years
      if (aiOrder - yearsOrder >= 2) {
        flags.push('TITLE_YEARS_MISMATCH');
        // Use years mapping + 1 level as compromise
        const compromiseOrder = Math.min(yearsOrder + 1, 3);
        return {
          userLevel: getSeniorityFromOrder(compromiseOrder),
          flags,
          confidence: 'medium',
        };
      }
    }

    return {
      userLevel: aiLevel,
      flags,
      confidence: aiConfidence,
    };
  }

  // Signal 2: Title keywords
  if (currentTitle) {
    const titleLevel = getSeniorityFromTitle(currentTitle);
    if (titleLevel) {
      // Check for conflict with years
      if (yearsExperience !== undefined) {
        const yearsLevel = getSeniorityFromYears(yearsExperience);
        const titleOrder = SENIORITY_ORDER[titleLevel];
        const yearsOrder = SENIORITY_ORDER[yearsLevel];

        if (titleOrder - yearsOrder >= 2) {
          flags.push('TITLE_YEARS_MISMATCH');
          const compromiseOrder = Math.min(yearsOrder + 1, 3);
          return {
            userLevel: getSeniorityFromOrder(compromiseOrder),
            flags,
            confidence: 'medium',
          };
        }
      }

      return {
        userLevel: titleLevel,
        flags,
        confidence: 'medium',
      };
    }
  }

  // Signal 3: Years experience mapping
  if (yearsExperience !== undefined) {
    return {
      userLevel: getSeniorityFromYears(yearsExperience),
      flags,
      confidence: 'medium',
    };
  }

  // Default: assume mid level with low confidence
  flags.push('NO_SENIORITY_DATA');
  return {
    userLevel: SeniorityLevel.MID,
    flags,
    confidence: 'low',
  };
}

/**
 * Get seniority level from years of experience
 */
function getSeniorityFromYears(years: number): SeniorityLevel {
  const mapping = getSeniorityYearsMapping();

  for (const entry of mapping) {
    if (years < entry.max_years_exclusive) {
      return entry.level;
    }
  }

  // Default to lead for very experienced
  return SeniorityLevel.LEAD;
}

/**
 * Get seniority level from title keywords
 */
function getSeniorityFromTitle(title: string): SeniorityLevel | null {
  const titleLower = title.toLowerCase();
  const keywords = getSeniorityTitleKeywords();

  // Check lead first (most specific)
  for (const keyword of (keywords.lead ?? [])) {
    if (titleLower.includes(keyword)) {
      return SeniorityLevel.LEAD;
    }
  }

  // Check senior
  for (const keyword of (keywords.senior ?? [])) {
    if (titleLower.includes(keyword)) {
      return SeniorityLevel.SENIOR;
    }
  }

  // Check entry
  for (const keyword of (keywords.entry ?? [])) {
    if (titleLower.includes(keyword)) {
      return SeniorityLevel.ENTRY;
    }
  }

  // Default: mid level if no keywords match
  return SeniorityLevel.MID;
}

/**
 * Get seniority level from order number
 */
function getSeniorityFromOrder(order: number): SeniorityLevel {
  const levels = [SeniorityLevel.ENTRY, SeniorityLevel.MID, SeniorityLevel.SENIOR, SeniorityLevel.LEAD];
  return levels[Math.min(Math.max(order, 0), 3)];
}

/**
 * Determine alignment between user level and target
 */
function determineAlignment(
  userLevel: SeniorityLevel,
  targetLevel: SeniorityLevel
): SeniorityAlignment {
  const userOrder = SENIORITY_ORDER[userLevel];
  const targetOrder = SENIORITY_ORDER[targetLevel];

  if (userOrder < targetOrder) {
    return 'underqualified';
  }
  if (userOrder > targetOrder) {
    return 'overqualified';
  }
  return 'aligned';
}

/**
 * Calculate years gap if user is underqualified
 */
function calculateYearsGap(
  userLevel: SeniorityLevel,
  targetLevel: SeniorityLevel,
  currentYears?: number
): number | undefined {
  const alignment = determineAlignment(userLevel, targetLevel);
  
  if (alignment !== 'underqualified') {
    return undefined;
  }

  // Get typical years for target level
  const mapping = getSeniorityYearsMapping();
  let targetMinYears = 0;

  for (let i = 0; i < mapping.length; i++) {
    if (mapping[i].level === targetLevel) {
      targetMinYears = i > 0 ? mapping[i - 1].max_years_exclusive : 0;
      break;
    }
  }

  if (currentYears !== undefined) {
    return Math.max(0, targetMinYears - currentYears);
  }

  // Estimate based on level difference
  const levelDiff = SENIORITY_ORDER[targetLevel] - SENIORITY_ORDER[userLevel];
  return levelDiff * 2; // Roughly 2 years per level
}

/**
 * Get seniority gap summary for display
 *
 * @param gap - Seniority gap analysis result
 * @returns Human-readable summary
 */
export function getSeniorityGapSummary(gap: SeniorityGap): string {
  const userLabel = gap.user_level.charAt(0).toUpperCase() + gap.user_level.slice(1);
  const targetLabel = gap.role_expected.charAt(0).toUpperCase() + gap.role_expected.slice(1);

  if (gap.alignment === 'aligned') {
    return `Seniority aligned: ${userLabel} level matches ${targetLabel} role`;
  }

  if (gap.alignment === 'underqualified') {
    const gapText = gap.gap_years 
      ? ` (~${gap.gap_years} years gap)` 
      : '';
    return `Underqualified: ${userLabel} targeting ${targetLabel}${gapText}`;
  }

  return `Overqualified: ${userLabel} targeting ${targetLabel}`;
}

/**
 * Check if seniority gap is acceptable
 *
 * @param gap - Seniority gap analysis result
 * @returns True if alignment is acceptable (aligned or slightly over/under)
 */
export function isSeniorityAcceptable(gap: SeniorityGap): boolean {
  if (gap.alignment === 'aligned') {
    return true;
  }

  // One level difference is often acceptable
  const userOrder = SENIORITY_ORDER[gap.user_level];
  const targetOrder = SENIORITY_ORDER[gap.role_expected];
  
  return Math.abs(userOrder - targetOrder) <= 1;
}
