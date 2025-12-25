/**
 * Layer 2 - Strategy Engine
 * Mode Hysteresis Logic
 *
 * Prevents mode flip-flopping by applying buffers and minimum time requirements.
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 6.2
 */

import type {
  StrategyHistoryEntry,
  ModeHysteresis,
} from '../types';
import { StrategyMode } from '../types';
import { getStrategyThresholds } from '../config';
import { isApplyRethinkTransition } from '../constants';

// ==================== Types ====================

interface HysteresisCheckInput {
  /** Current strategy mode */
  currentMode: StrategyMode | null | undefined;
  /** Proposed new mode */
  proposedMode: StrategyMode;
  /** Current resume score */
  resumeScore: number;
  /** When the current mode was activated (ISO string) */
  modeActivatedAt?: string;
  /** Strategy change history */
  strategyHistory?: StrategyHistoryEntry[];
}

interface HysteresisResult {
  /** Whether the mode should change */
  shouldChange: boolean;
  /** Final recommended mode */
  finalMode: StrategyMode;
  /** Reason for the decision */
  reason: string;
  /** Whether hysteresis was applied */
  hysteresisApplied: boolean;
}

// ==================== Main Function ====================

/**
 * Check if a mode change should occur considering hysteresis
 *
 * Hysteresis rules (from spec):
 * 1. If current mode is IMPROVE and score is between
 *    [resume_score_min, resume_score_min + buffer], keep IMPROVE
 * 2. If switching modes within min_days_in_mode,
 *    require stronger trigger (e.g., interview_rate < 0.5 * threshold)
 *
 * @param input - Hysteresis check input
 * @returns Hysteresis result with decision
 */
export function checkHysteresis(input: HysteresisCheckInput): HysteresisResult {
  const {
    currentMode,
    proposedMode,
    resumeScore,
    modeActivatedAt,
    strategyHistory = [],
  } = input;

  // If no current mode, no hysteresis applies
  if (!currentMode) {
    return {
      shouldChange: true,
      finalMode: proposedMode,
      reason: 'No current mode - applying proposed mode',
      hysteresisApplied: false,
    };
  }

  // If same mode, no change needed
  if (currentMode === proposedMode) {
    return {
      shouldChange: false,
      finalMode: currentMode,
      reason: 'Proposed mode matches current mode',
      hysteresisApplied: false,
    };
  }

  const thresholds = getStrategyThresholds();
  const hysteresis = thresholds.mode_hysteresis;

  // Check score buffer hysteresis
  const bufferResult = checkScoreBufferHysteresis(
    currentMode,
    proposedMode,
    resumeScore,
    thresholds.resume_score_min,
    hysteresis.resume_score_buffer
  );

  if (bufferResult.hysteresisApplied) {
    return bufferResult;
  }

  // Check minimum days hysteresis
  const daysResult = checkMinDaysHysteresis(
    currentMode,
    proposedMode,
    modeActivatedAt,
    hysteresis.min_days_in_mode
  );

  if (daysResult.hysteresisApplied) {
    return daysResult;
  }

  // Check for frequent mode changes
  const frequencyResult = checkModeChangeFrequency(
    currentMode,
    proposedMode,
    strategyHistory
  );

  if (frequencyResult.hysteresisApplied) {
    return frequencyResult;
  }

  // No hysteresis applies - allow change
  return {
    shouldChange: true,
    finalMode: proposedMode,
    reason: 'Mode change approved - no hysteresis triggers',
    hysteresisApplied: false,
  };
}

// ==================== Hysteresis Checks ====================

/**
 * Check score buffer hysteresis
 *
 * If in IMPROVE mode and score is in buffer zone, stay in IMPROVE
 */
function checkScoreBufferHysteresis(
  currentMode: StrategyMode,
  proposedMode: StrategyMode,
  resumeScore: number,
  scoreMin: number,
  buffer: number
): HysteresisResult {
  // Only applies when switching from IMPROVE to APPLY
  if (
    currentMode === StrategyMode.IMPROVE_RESUME_FIRST &&
    proposedMode === StrategyMode.APPLY_MODE
  ) {
    // Check if score is in buffer zone
    if (resumeScore >= scoreMin && resumeScore < scoreMin + buffer) {
      return {
        shouldChange: false,
        finalMode: currentMode,
        reason: `Score ${resumeScore} is in buffer zone [${scoreMin}, ${scoreMin + buffer}). Staying in IMPROVE mode.`,
        hysteresisApplied: true,
      };
    }
  }

  return {
    shouldChange: true,
    finalMode: proposedMode,
    reason: '',
    hysteresisApplied: false,
  };
}

/**
 * Check minimum days in mode hysteresis
 *
 * If current mode was activated recently, be more conservative
 */
function checkMinDaysHysteresis(
  currentMode: StrategyMode,
  proposedMode: StrategyMode,
  modeActivatedAt: string | undefined,
  minDays: number
): HysteresisResult {
  if (!modeActivatedAt) {
    return {
      shouldChange: true,
      finalMode: proposedMode,
      reason: '',
      hysteresisApplied: false,
    };
  }

  const activatedDate = new Date(modeActivatedAt);
  const now = new Date();
  const daysSinceActivation = Math.floor(
    (now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActivation < minDays) {
    // Too soon to change modes - require stronger signal
    // For now, we'll just flag this and let the mode change
    // In production, you might require lower interview_rate thresholds
    
    // Only block changes between APPLY and RETHINK within min_days
    if (isApplyRethinkTransition(currentMode, proposedMode)) {
      return {
        shouldChange: false,
        finalMode: currentMode,
        reason: `Only ${daysSinceActivation} days in current mode (min: ${minDays}). Staying in ${currentMode}.`,
        hysteresisApplied: true,
      };
    }
  }

  return {
    shouldChange: true,
    finalMode: proposedMode,
    reason: '',
    hysteresisApplied: false,
  };
}

/**
 * Check for frequent mode changes (ping-pong prevention)
 */
function checkModeChangeFrequency(
  currentMode: StrategyMode,
  proposedMode: StrategyMode,
  history: StrategyHistoryEntry[]
): HysteresisResult {
  if (history.length < 3) {
    return {
      shouldChange: true,
      finalMode: proposedMode,
      reason: '',
      hysteresisApplied: false,
    };
  }

  // Check last 3 changes
  const recentChanges = history.slice(-3);
  
  // Count how many times we've switched to the proposed mode recently
  const switchesToProposed = recentChanges.filter(
    (h) => h.to === proposedMode
  ).length;

  // If we've switched to this mode 2+ times recently, be cautious
  if (switchesToProposed >= 2) {
    // Check if we're ping-ponging between two modes
    const uniqueModes = new Set(recentChanges.map((h) => h.to));
    if (uniqueModes.size <= 2) {
      return {
        shouldChange: false,
        finalMode: currentMode,
        reason: 'Detected mode ping-pong pattern. Staying in current mode.',
        hysteresisApplied: true,
      };
    }
  }

  return {
    shouldChange: true,
    finalMode: proposedMode,
    reason: '',
    hysteresisApplied: false,
  };
}

// ==================== Utilities ====================

/**
 * Calculate days since mode activation
 *
 * @param modeActivatedAt - ISO date string
 * @returns Number of days, or undefined if no date
 */
export function getDaysInCurrentMode(modeActivatedAt?: string): number | undefined {
  if (!modeActivatedAt) {
    return undefined;
  }

  const activatedDate = new Date(modeActivatedAt);
  const now = new Date();
  
  return Math.floor(
    (now.getTime() - activatedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Get hysteresis configuration
 *
 * @returns Current hysteresis configuration
 */
export function getHysteresisConfig(): ModeHysteresis {
  return getStrategyThresholds().mode_hysteresis;
}

/**
 * Check if we're approaching the buffer zone
 *
 * @param resumeScore - Current resume score
 * @returns True if close to threshold
 */
export function isNearThreshold(resumeScore: number): boolean {
  const thresholds = getStrategyThresholds();
  const buffer = thresholds.mode_hysteresis.resume_score_buffer;
  
  return (
    resumeScore >= thresholds.resume_score_min - buffer &&
    resumeScore <= thresholds.resume_score_min + buffer
  );
}
