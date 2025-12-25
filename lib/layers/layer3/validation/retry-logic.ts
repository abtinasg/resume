/**
 * Layer 3 - Execution Engine
 * Retry Logic
 *
 * Implements retry mechanism with validation error feedback.
 * If validation fails, adds errors to prompt and retries with stricter constraints.
 */

import {
  RewriteRequest,
  BulletRewriteResult,
  SummaryRewriteResult,
  EvidenceLedger,
  ValidationResult,
  RewritePlan,
  RewriteQualitySignals,
  ConfidenceLevel,
  BulletRewriteRequest,
  SummaryRewriteRequest,
} from '../types';
import { getLLMConfig } from '../config';
import {
  generateImprovement,
  buildBulletRewritePrompt,
  buildSummaryRewritePrompt,
  buildRetryPrompt,
  addStrictConstraintsToPrompt,
  LLMPrompt,
} from '../generation';
import { validateRewrite, formatValidationResult, getCriticalErrors } from './evidence-validator';
import { createEvidenceMap } from '../evidence';
import { ExecutionError, ExecutionErrorCode, createMaxRetriesError } from '../errors';

// ==================== Types ====================

/**
 * Retry context for tracking attempts
 */
interface RetryContext {
  /** Original text */
  original: string;
  /** Evidence ledger */
  evidence: EvidenceLedger;
  /** Rewrite plan */
  plan: RewritePlan;
  /** System prompt */
  systemPrompt: string;
  /** Current attempt number */
  attempt: number;
  /** Previous validation results */
  previousValidations: ValidationResult[];
}

/**
 * Retry result
 */
interface RetryResult {
  /** Final improved text */
  improved: string;
  /** Evidence map */
  evidenceMap: Array<{ improved_span: string; evidence_ids: string[] }>;
  /** Reasoning */
  reasoning: string;
  /** Quality signals */
  changes: RewriteQualitySignals;
  /** Final validation result */
  validation: ValidationResult;
  /** Confidence level */
  confidence: ConfidenceLevel;
  /** Number of attempts made */
  attempts: number;
  /** Whether we fell back to original */
  fellBackToOriginal: boolean;
}

// ==================== Main Retry Function ====================

/**
 * Rewrite bullet with retry logic
 */
export async function rewriteBulletWithRetry(
  request: BulletRewriteRequest,
  evidence: EvidenceLedger,
  plan: RewritePlan
): Promise<BulletRewriteResult> {
  const config = getLLMConfig();
  const maxRetries = config.max_retries;

  // Build initial prompt
  const initialPrompt = buildBulletRewritePrompt(request, evidence, plan);

  // Create retry context
  const context: RetryContext = {
    original: request.bullet,
    evidence,
    plan,
    systemPrompt: initialPrompt.system,
    attempt: 0,
    previousValidations: [],
  };

  // Attempt with retries
  const result = await executeWithRetry(context, initialPrompt, maxRetries, 'bullet');

  return {
    type: 'bullet',
    original: request.bullet,
    improved: result.improved,
    reasoning: result.reasoning,
    changes: result.changes,
    evidence_map: result.evidenceMap,
    validation: result.validation,
    confidence: result.confidence,
    estimated_score_gain: calculateScoreGain(result),
  };
}

/**
 * Rewrite summary with retry logic
 */
export async function rewriteSummaryWithRetry(
  request: SummaryRewriteRequest,
  evidence: EvidenceLedger
): Promise<SummaryRewriteResult> {
  const config = getLLMConfig();
  const maxRetries = config.max_retries;

  // Build initial prompt
  const initialPrompt = buildSummaryRewritePrompt(request, evidence);

  // Create retry context
  const context: RetryContext = {
    original: request.summary,
    evidence,
    plan: createDefaultPlan(request.summary),
    systemPrompt: initialPrompt.system,
    attempt: 0,
    previousValidations: [],
  };

  // Attempt with retries
  const result = await executeWithRetry(context, initialPrompt, maxRetries, 'summary');

  return {
    type: 'summary',
    original: request.summary,
    improved: result.improved,
    reasoning: result.reasoning,
    changes: result.changes,
    evidence_map: result.evidenceMap,
    validation: result.validation,
    confidence: result.confidence,
    estimated_score_gain: calculateScoreGain(result),
  };
}

// ==================== Core Retry Logic ====================

/**
 * Execute rewrite with retry logic
 */
async function executeWithRetry(
  context: RetryContext,
  prompt: LLMPrompt,
  maxRetries: number,
  type: 'bullet' | 'summary'
): Promise<RetryResult> {
  let currentPrompt = prompt;
  let attempts = 0;

  while (attempts <= maxRetries) {
    context.attempt = attempts;

    try {
      // Generate improvement
      const llmResult = await generateImprovement(currentPrompt, {
        type,
        attempt: attempts,
      });

      // Validate result
      const validation = validateRewrite(
        context.original,
        llmResult.response.improved,
        context.evidence,
        llmResult.response.evidence_map
      );

      // Store validation for potential retry
      context.previousValidations.push(validation);

      // If validation passed, return result
      if (validation.passed) {
        return {
          improved: llmResult.response.improved,
          evidenceMap: llmResult.response.evidence_map,
          reasoning: llmResult.response.reasoning,
          changes: llmResult.response.changes,
          validation,
          confidence: determineConfidence(validation, attempts),
          attempts: attempts + 1,
          fellBackToOriginal: false,
        };
      }

      // Validation failed - prepare for retry
      if (attempts < maxRetries) {
        console.warn(
          `[Layer 3] Validation failed on attempt ${attempts + 1}, retrying...`,
          formatValidationResult(validation)
        );

        // Build retry prompt with validation errors
        const retryPrompt = buildRetryPrompt(
          context.original,
          context.evidence,
          getCriticalErrors(validation),
          context.systemPrompt
        );

        // Add strict constraints for retry
        currentPrompt = addStrictConstraintsToPrompt(retryPrompt);
      }

      attempts++;
    } catch (error) {
      // Log error and continue to next attempt
      console.error(`[Layer 3] Error on attempt ${attempts + 1}:`, error);
      attempts++;

      // If this was the last attempt, fall through to fallback
    }
  }

  // Max retries exceeded - return original as fallback
  console.warn(
    `[Layer 3] Max retries exceeded, falling back to original text`
  );

  return createFallbackResult(context);
}

// ==================== Fallback ====================

/**
 * Create fallback result (return original)
 */
function createFallbackResult(context: RetryContext): RetryResult {
  const lastValidation = context.previousValidations[context.previousValidations.length - 1];

  return {
    improved: context.original, // Return original
    evidenceMap: [
      {
        improved_span: context.original,
        evidence_ids: ['E1'], // Original always has E1 evidence
      },
    ],
    reasoning: 'Could not improve without fabricating content. Returning original to maintain truthfulness.',
    changes: {
      stronger_verb: false,
      added_metric: false,
      more_specific: false,
      removed_fluff: false,
      tailored_to_role: false,
    },
    validation: {
      passed: true, // Original is always valid
      items: lastValidation?.items ?? [],
    },
    confidence: 'low',
    attempts: context.attempt + 1,
    fellBackToOriginal: true,
  };
}

// ==================== Helpers ====================

/**
 * Create default plan (for summary rewrite)
 */
function createDefaultPlan(original: string): RewritePlan {
  return {
    goal: 'impact',
    issues: [],
    transformations: [],
    constraints: {
      max_length: 300,
      forbid_new_numbers: true,
      forbid_new_tools: false,
      forbid_new_companies: true,
    },
  };
}

/**
 * Determine confidence based on validation and attempts
 */
function determineConfidence(
  validation: ValidationResult,
  attempts: number
): ConfidenceLevel {
  // If we had to retry, confidence is lower
  if (attempts > 0) {
    return 'medium';
  }

  // If there are warnings, confidence is medium
  if (validation.items.length > 0) {
    return 'medium';
  }

  return 'high';
}

/**
 * Calculate estimated score gain
 */
function calculateScoreGain(result: RetryResult): number {
  if (result.fellBackToOriginal) {
    return 0;
  }

  let gain = 0;

  if (result.changes.stronger_verb) gain += 2;
  if (result.changes.added_metric) gain += 2;
  if (result.changes.more_specific) gain += 2;
  if (result.changes.removed_fluff) gain += 1;
  if (result.changes.tailored_to_role) gain += 1;

  // Reduce gain if we had to retry
  if (result.attempts > 1) {
    gain = Math.max(gain - 1, 0);
  }

  // Cap at 10
  return Math.min(gain, 10);
}

// ==================== Synchronous Fallback ====================

/**
 * Synchronous fallback when LLM is not available
 * Applies simple rule-based improvements
 */
export function rewriteBulletSync(
  request: BulletRewriteRequest,
  evidence: EvidenceLedger
): BulletRewriteResult {
  // For now, just return original with no changes
  // A more sophisticated version could apply rule-based transformations

  return {
    type: 'bullet',
    original: request.bullet,
    improved: request.bullet,
    reasoning: 'LLM not available. Returning original text.',
    changes: {
      stronger_verb: false,
      added_metric: false,
      more_specific: false,
      removed_fluff: false,
      tailored_to_role: false,
    },
    evidence_map: [
      {
        improved_span: request.bullet,
        evidence_ids: ['E1'],
      },
    ],
    validation: { passed: true, items: [] },
    confidence: 'low',
    estimated_score_gain: 0,
  };
}

/**
 * Synchronous fallback for summary
 */
export function rewriteSummarySync(
  request: SummaryRewriteRequest,
  evidence: EvidenceLedger
): SummaryRewriteResult {
  return {
    type: 'summary',
    original: request.summary,
    improved: request.summary,
    reasoning: 'LLM not available. Returning original text.',
    changes: {
      stronger_verb: false,
      added_metric: false,
      more_specific: false,
      removed_fluff: false,
      tailored_to_role: false,
    },
    evidence_map: [
      {
        improved_span: request.summary,
        evidence_ids: ['E1'],
      },
    ],
    validation: { passed: true, items: [] },
    confidence: 'low',
    estimated_score_gain: 0,
  };
}
