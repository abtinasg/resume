/**
 * Layer 8 - AI Coach Interface
 * Tone Detector
 *
 * Detects the appropriate tone for Coach responses based on context.
 * This is a template-based approach - no NLP or sentiment analysis.
 */

import type { Tone, ToneContext } from '../types';
import type { PipelineState } from '../../layer5/types';
import { getDefaultTone, getThresholds } from '../config';

// ==================== Tone Detection ====================

/**
 * Detect the most appropriate tone based on context
 * 
 * Priority order:
 * 1. If user seems discouraged or frustrated → empathetic
 * 2. If user is making progress or achieved milestone → encouraging
 * 3. If there's urgency or action needed → direct
 * 4. Default → professional
 */
export function detectTone(context?: ToneContext): Tone {
  if (!context) {
    return getDefaultTone();
  }

  // Check for signals that require empathetic tone
  if (shouldUseEmpathetic(context)) {
    return 'empathetic';
  }

  // Check for signals that require encouraging tone
  if (shouldUseEncouraging(context)) {
    return 'encouraging';
  }

  // Check for signals that require direct tone
  if (shouldUseDirect(context)) {
    return 'direct';
  }

  // Default to professional
  return 'professional';
}

/**
 * Check if empathetic tone should be used
 */
function shouldUseEmpathetic(context: ToneContext): boolean {
  const { userSignals, recentEvents, pipelineState } = context;

  // Explicit signals of frustration or discouragement
  if (userSignals?.discouraged || userSignals?.frustrated) {
    return true;
  }

  // Recent rejection
  if (recentEvents?.rejection) {
    return true;
  }

  // Low interview rate with sufficient applications
  if (pipelineState) {
    const thresholds = getThresholds();
    const totalApps = pipelineState.total_applications || 0;
    const interviewRate = pipelineState.interview_rate || 0;

    if (totalApps >= thresholds.application_volume_test && 
        interviewRate < thresholds.low_interview_rate) {
      return true;
    }
  }

  return false;
}

/**
 * Check if encouraging tone should be used
 */
function shouldUseEncouraging(context: ToneContext): boolean {
  const { userSignals, recentEvents } = context;

  // User is making progress
  if (userSignals?.progressing) {
    return true;
  }

  // Positive recent events
  if (recentEvents?.interview || recentEvents?.offer || recentEvents?.scoreImproved) {
    return true;
  }

  return false;
}

/**
 * Check if direct tone should be used
 */
function shouldUseDirect(context: ToneContext): boolean {
  const { userSignals } = context;

  // Urgency signals
  if (userSignals?.urgent) {
    return true;
  }

  return false;
}

// ==================== Tone Scoring ====================

/**
 * Calculate a score for each tone based on context
 * Returns scores for all tones (useful for debugging/transparency)
 */
export function scoreTones(context?: ToneContext): Record<Tone, number> {
  const scores: Record<Tone, number> = {
    professional: 50, // Base score
    empathetic: 0,
    encouraging: 0,
    direct: 0,
  };

  if (!context) {
    return scores;
  }

  const { userSignals, recentEvents, pipelineState } = context;

  // Score empathetic signals
  if (userSignals?.discouraged) scores.empathetic += 40;
  if (userSignals?.frustrated) scores.empathetic += 35;
  if (recentEvents?.rejection) scores.empathetic += 25;

  // Score based on pipeline state
  if (pipelineState) {
    const thresholds = getThresholds();
    const totalApps = pipelineState.total_applications || 0;
    const interviewRate = pipelineState.interview_rate || 0;

    if (totalApps >= thresholds.application_volume_test) {
      if (interviewRate < thresholds.low_interview_rate) {
        scores.empathetic += 20;
      } else if (interviewRate > thresholds.low_interview_rate * 2) {
        scores.encouraging += 15;
      }
    }
  }

  // Score encouraging signals
  if (userSignals?.progressing) scores.encouraging += 35;
  if (recentEvents?.interview) scores.encouraging += 40;
  if (recentEvents?.offer) scores.encouraging += 50;
  if (recentEvents?.scoreImproved) scores.encouraging += 25;

  // Score direct signals
  if (userSignals?.urgent) scores.direct += 40;

  return scores;
}

/**
 * Get the recommended tone with explanation
 */
export function getToneRecommendation(context?: ToneContext): {
  tone: Tone;
  scores: Record<Tone, number>;
  reason: string;
} {
  const scores = scoreTones(context);
  const tone = detectTone(context);

  let reason: string;
  switch (tone) {
    case 'empathetic':
      reason = 'User appears to be facing challenges or feeling discouraged';
      break;
    case 'encouraging':
      reason = 'User is making progress or achieved a positive outcome';
      break;
    case 'direct':
      reason = 'Urgent action is needed';
      break;
    default:
      reason = 'Standard professional communication';
  }

  return { tone, scores, reason };
}

// ==================== Pipeline State Analysis ====================

/**
 * Analyze pipeline state to determine emotional context
 */
export function analyzePipelineForTone(
  pipelineState: Partial<PipelineState>
): {
  suggestedTone: Tone;
  signals: string[];
} {
  const signals: string[] = [];
  let suggestedTone: Tone = 'professional';

  const thresholds = getThresholds();
  const totalApps = pipelineState.total_applications || 0;
  const interviewRate = pipelineState.interview_rate || 0;
  const interviews = pipelineState.interview_requests || 0;
  const offers = pipelineState.offers || 0;
  const rejections = pipelineState.rejections || 0;

  // Check for encouraging signals
  if (offers > 0) {
    signals.push('has_offer');
    suggestedTone = 'encouraging';
  } else if (interviews > 0) {
    signals.push('has_interviews');
    suggestedTone = 'encouraging';
  } else if (interviewRate > thresholds.low_interview_rate * 2) {
    signals.push('good_interview_rate');
    suggestedTone = 'encouraging';
  }

  // Check for empathetic signals
  if (totalApps >= thresholds.application_volume_test) {
    if (interviewRate < thresholds.low_interview_rate) {
      signals.push('low_interview_rate');
      suggestedTone = 'empathetic';
    }
    if (interviews === 0) {
      signals.push('no_interviews_after_volume');
      suggestedTone = 'empathetic';
    }
  }

  if (rejections > 0 && interviews === 0) {
    signals.push('rejections_no_interviews');
    suggestedTone = 'empathetic';
  }

  return { suggestedTone, signals };
}

// ==================== Event-Based Tone Detection ====================

/**
 * Determine tone based on an event type
 */
export function getToneForEvent(eventType: string): Tone {
  const encouragingEvents = [
    'first_interview',
    'interview_scheduled',
    'offer_received',
    'score_improved',
    'milestone_achieved',
    'weekly_target_met',
    'application_submitted',
  ];

  const empatheticEvents = [
    'rejection_received',
    'no_response',
    'application_withdrawn',
    'offer_declined',
    'interview_cancelled',
  ];

  const directEvents = [
    'deadline_approaching',
    'action_required',
    'state_stale',
    'urgent_followup',
  ];

  if (encouragingEvents.includes(eventType)) {
    return 'encouraging';
  }

  if (empatheticEvents.includes(eventType)) {
    return 'empathetic';
  }

  if (directEvents.includes(eventType)) {
    return 'direct';
  }

  return 'professional';
}
