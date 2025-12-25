/**
 * Layer 2 - Strategy Engine
 * Strategy Mode Selection
 *
 * Determines the recommended strategy mode based on resume quality,
 * application metrics, and gap analysis.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 6
 */

import type {
  ModeReasoning,
  PrimaryReason,
  SupportingFactor,
  ConfidenceLevel,
  Layer1Evaluation,
  Layer4State,
  GapAnalysis,
} from '../types';
import { StrategyMode } from '../types';
import { getStrategyThresholds } from '../config';
import { checkHysteresis, getDaysInCurrentMode } from './hysteresis';
import {
  WeaknessCodes,
  SupportingFactorCodes,
  PrimaryReasonCodes,
  ConfidenceLevels,
  ConfidenceThresholds,
} from '../constants';

// ==================== Types ====================

interface ModeSelectionInput {
  /** Resume score from Layer 1 */
  resumeScore: number;
  /** Total applications submitted */
  totalApplications: number;
  /** Applications in last 30 days */
  applicationsLast30Days: number;
  /** Interview rate (0-1) */
  interviewRate: number;
  /** Gap analysis results */
  gaps: GapAnalysis;
  /** Current strategy mode */
  currentMode?: StrategyMode | null;
  /** When current mode was activated */
  modeActivatedAt?: string;
  /** Strategy change history */
  strategyHistory?: { from: StrategyMode; to: StrategyMode; changed_at: string; reason: string }[];
  /** Weaknesses from Layer 1 */
  weaknesses?: string[];
}

interface ModeSelectionResult {
  /** Recommended mode */
  recommendedMode: StrategyMode;
  /** Reasoning for the recommendation */
  reasoning: ModeReasoning;
  /** Whether hysteresis was applied */
  hysteresisApplied: boolean;
  /** Additional context */
  context: {
    thresholds: {
      resume_score_min: number;
      application_volume_test: number;
      interview_rate_min: number;
    };
    metrics: {
      resumeScore: number;
      applications30d: number;
      interviewRate: number;
    };
  };
}

// ==================== Main Selection Function ====================

/**
 * Select the recommended strategy mode
 *
 * Decision rules (from spec Section 6.2):
 * 1. IMPROVE_RESUME_FIRST if resume_score < resume_score_min
 * 2. RETHINK_TARGETS if applications >= volume_test AND interview_rate < interview_rate_min
 * 3. Else APPLY_MODE
 *
 * @param input - Mode selection input
 * @returns Mode selection result with reasoning
 */
export function selectMode(input: ModeSelectionInput): ModeSelectionResult {
  const {
    resumeScore,
    totalApplications,
    applicationsLast30Days,
    interviewRate,
    gaps,
    currentMode,
    modeActivatedAt,
    strategyHistory = [],
    weaknesses = [],
  } = input;

  const thresholds = getStrategyThresholds();

  // Step 1: Determine proposed mode based on rules
  const { proposedMode, primaryReason, supportingFactors, confidence } = evaluateRules(
    {
      resumeScore,
      applicationsLast30Days,
      interviewRate,
      gaps,
      weaknesses,
    },
    thresholds
  );

  // Step 2: Apply hysteresis if needed
  const hysteresisResult = checkHysteresis({
    currentMode,
    proposedMode,
    resumeScore,
    modeActivatedAt,
    strategyHistory,
  });

  // Step 3: Construct result
  const finalMode = hysteresisResult.finalMode;
  const finalReason = hysteresisResult.hysteresisApplied
    ? 'healthy_state_default' // When hysteresis keeps us in current mode
    : primaryReason;

  return {
    recommendedMode: finalMode,
    reasoning: {
      primary_reason: finalReason,
      supporting_factors: supportingFactors,
      confidence,
    },
    hysteresisApplied: hysteresisResult.hysteresisApplied,
    context: {
      thresholds: {
        resume_score_min: thresholds.resume_score_min,
        application_volume_test: thresholds.application_volume_test,
        interview_rate_min: thresholds.interview_rate_min,
      },
      metrics: {
        resumeScore,
        applications30d: applicationsLast30Days,
        interviewRate,
      },
    },
  };
}

/**
 * Select mode from Layer data
 *
 * @param evaluation - Layer 1 evaluation
 * @param layer4State - Layer 4 state
 * @param gaps - Gap analysis results
 * @returns Mode selection result
 */
export function selectModeFromLayers(
  evaluation: Layer1Evaluation,
  layer4State: Layer4State,
  gaps: GapAnalysis
): ModeSelectionResult {
  return selectMode({
    resumeScore: evaluation.resume_score,
    totalApplications: layer4State.pipeline_state.total_applications,
    applicationsLast30Days: layer4State.pipeline_state.applications_last_30_days,
    interviewRate: layer4State.pipeline_state.interview_rate,
    gaps,
    currentMode: layer4State.current_strategy_mode,
    modeActivatedAt: layer4State.mode_activated_at,
    strategyHistory: layer4State.strategy_history,
    weaknesses: evaluation.weaknesses,
  });
}

// ==================== Rule Evaluation ====================

interface RuleEvaluationInput {
  resumeScore: number;
  applicationsLast30Days: number;
  interviewRate: number;
  gaps: GapAnalysis;
  weaknesses: string[];
}

interface RuleEvaluationResult {
  proposedMode: StrategyMode;
  primaryReason: PrimaryReason;
  supportingFactors: SupportingFactor[];
  confidence: ConfidenceLevel;
}

/**
 * Evaluate the decision rules to determine proposed mode
 */
function evaluateRules(
  input: RuleEvaluationInput,
  thresholds: {
    resume_score_min: number;
    application_volume_test: number;
    interview_rate_min: number;
  }
): RuleEvaluationResult {
  const {
    resumeScore,
    applicationsLast30Days,
    interviewRate,
    gaps,
    weaknesses,
  } = input;

  // Collect supporting factors
  const supportingFactors: SupportingFactor[] = [];

  // Check for supporting factors
  if (gaps.skills.critical_missing.length > 0) {
    supportingFactors.push('critical_missing_skills');
  }
  if (gaps.tools.critical_missing.length > 0) {
    supportingFactors.push('critical_missing_tools');
  }
  if (gaps.seniority.alignment === 'underqualified') {
    supportingFactors.push('seniority_mismatch');
  }
  if (gaps.industry.match_percentage < 30) {
    supportingFactors.push(SupportingFactorCodes.INDUSTRY_MISMATCH);
  }
  if (weaknesses.includes(WeaknessCodes.WEAK_VERBS) || weaknesses.includes(WeaknessCodes.NO_METRICS)) {
    supportingFactors.push(SupportingFactorCodes.WEAK_BULLETS_HIGH);
  }
  if (weaknesses.includes(WeaknessCodes.GENERIC_DESCRIPTIONS)) {
    supportingFactors.push(SupportingFactorCodes.VAGUE_EXPERIENCE_FLAG);
  }

  // Rule 1: Check if resume score is below threshold
  if (resumeScore < thresholds.resume_score_min) {
    return {
      proposedMode: StrategyMode.IMPROVE_RESUME_FIRST,
      primaryReason: PrimaryReasonCodes.RESUME_BELOW_THRESHOLD,
      supportingFactors,
      confidence: determineConfidence(resumeScore, applicationsLast30Days, gaps),
    };
  }

  // Rule 2: Check if applying but getting low interviews
  if (
    applicationsLast30Days >= thresholds.application_volume_test &&
    interviewRate < thresholds.interview_rate_min
  ) {
    return {
      proposedMode: StrategyMode.RETHINK_TARGETS,
      primaryReason: PrimaryReasonCodes.LOW_INTERVIEW_RATE_AFTER_VOLUME,
      supportingFactors,
      confidence: determineConfidence(resumeScore, applicationsLast30Days, gaps),
    };
  }

  // Rule 3: Default to APPLY mode
  return {
    proposedMode: StrategyMode.APPLY_MODE,
    primaryReason: PrimaryReasonCodes.HEALTHY_STATE_DEFAULT,
    supportingFactors,
    confidence: determineConfidence(resumeScore, applicationsLast30Days, gaps),
  };
}

/**
 * Determine confidence level for mode selection
 */
function determineConfidence(
  resumeScore: number,
  applications: number,
  gaps: GapAnalysis
): ConfidenceLevel {
  // High confidence: have clear signals
  if (resumeScore > 0 && applications >= ConfidenceThresholds.MIN_APPLICATIONS_FOR_CONFIDENCE) {
    return ConfidenceLevels.HIGH;
  }

  // Medium confidence: some data available
  if (resumeScore > 0 || applications > 0) {
    return ConfidenceLevels.MEDIUM;
  }

  // Low confidence: minimal data
  return ConfidenceLevels.LOW;
}

// ==================== Utilities ====================

/**
 * Get human-readable mode name
 *
 * @param mode - Strategy mode
 * @returns Human-readable name
 */
export function getModeName(mode: StrategyMode): string {
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      return 'Improve Resume First';
    case StrategyMode.APPLY_MODE:
      return 'Apply Mode';
    case StrategyMode.RETHINK_TARGETS:
      return 'Rethink Targets';
    default:
      return 'Unknown Mode';
  }
}

/**
 * Get mode description
 *
 * @param mode - Strategy mode
 * @returns Description of what to do in this mode
 */
export function getModeDescription(mode: StrategyMode): string {
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      return 'Focus on improving your resume before applying to jobs. Address critical gaps and strengthen your presentation.';
    case StrategyMode.APPLY_MODE:
      return 'Your resume is ready! Focus on applying to jobs that match your profile and following up on applications.';
    case StrategyMode.RETHINK_TARGETS:
      return 'Your applications are not generating interviews. Consider adjusting your target roles, industries, or seniority level.';
    default:
      return '';
  }
}

/**
 * Get reason description
 *
 * @param reason - Primary reason code
 * @returns Human-readable description
 */
export function getReasonDescription(reason: PrimaryReason): string {
  switch (reason) {
    case 'resume_below_threshold':
      return 'Resume score is below the recommended threshold for effective job applications.';
    case 'low_interview_rate_after_volume':
      return 'Despite submitting many applications, interview rate is below expectations.';
    case 'healthy_state_default':
      return 'Resume quality and application metrics are healthy.';
    default:
      return '';
  }
}

/**
 * Get supporting factor description
 *
 * @param factor - Supporting factor code
 * @returns Human-readable description
 */
export function getFactorDescription(factor: SupportingFactor): string {
  switch (factor) {
    case 'critical_missing_skills':
      return 'Missing critical skills required for target roles';
    case 'critical_missing_tools':
      return 'Missing critical tools/technologies';
    case 'seniority_mismatch':
      return 'Seniority level does not match target roles';
    case 'industry_mismatch':
      return 'Limited experience in target industry';
    case 'weak_bullets_high':
      return 'Resume has many weak bullet points';
    case 'vague_experience_flag':
      return 'Experience descriptions are vague or generic';
    default:
      return '';
  }
}
