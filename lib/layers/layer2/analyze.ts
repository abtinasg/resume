/**
 * Layer 2 - Strategy Engine
 * Main Analysis Facade
 *
 * Provides the primary public API for strategy analysis.
 * Orchestrates gap analysis, fit scoring, mode selection, and blueprint generation.
 */

import type {
  StrategyAnalysisRequest,
  StrategyAnalysisResult,
  GapAnalysis,
  InputsUsed,
  ConfidenceLevel,
} from './types';
import { StrategyAnalysisRequestSchema } from './types';
import {
  StrategyAnalysisError,
  StrategyErrorCode,
  createValidationError,
  createInternalError,
  handleError,
} from './errors';
import { analyzeAllGaps } from './gap-analysis';
import { calculateFitScore, selectModeFromLayers } from './strategy';
import {
  generateActionBlueprints,
  generatePriorityActions,
  generateKeyInsights,
} from './actions';

// ==================== Main Public API ====================

/**
 * Perform complete strategy analysis
 *
 * This is the main entry point for Layer 2.
 * It orchestrates:
 * 1. Input validation
 * 2. Gap analysis (all 5 dimensions)
 * 3. Fit score calculation
 * 4. Strategy mode selection
 * 5. Action blueprint generation
 *
 * @param request - Strategy analysis request
 * @returns Strategy analysis result
 * @throws StrategyAnalysisError on validation or processing errors
 *
 * @example
 * ```typescript
 * import { analyzeStrategy } from '@/lib/layers/layer2';
 *
 * const result = await analyzeStrategy({
 *   layer1_evaluation: evaluationResult,
 *   layer4_state: userState,
 *   job_context: jobContext, // optional
 * });
 *
 * console.log(result.recommended_mode);
 * console.log(result.overall_fit_score);
 * ```
 */
export async function analyzeStrategy(
  request: StrategyAnalysisRequest
): Promise<StrategyAnalysisResult> {
  const startTime = Date.now();

  try {
    // Step 1: Validate input
    const validatedRequest = validateRequest(request);

    // Step 2: Perform gap analysis
    const gaps = analyzeAllGaps(
      validatedRequest.layer1_evaluation,
      validatedRequest.layer4_state,
      validatedRequest.job_context
    );

    // Step 3: Calculate fit score
    const fitResult = calculateFitScore(gaps);

    // Step 4: Select strategy mode
    const modeResult = selectModeFromLayers(
      validatedRequest.layer1_evaluation,
      validatedRequest.layer4_state,
      gaps
    );

    // Step 5: Generate action blueprints
    const blueprints = generateActionBlueprints({
      recommendedMode: modeResult.recommendedMode,
      modeReasoning: modeResult.reasoning,
      gaps,
      evaluation: validatedRequest.layer1_evaluation,
      layer4State: validatedRequest.layer4_state,
    });

    // Step 6: Generate priority actions and key insights
    const priorityActions = generatePriorityActions(
      blueprints,
      modeResult.recommendedMode
    );

    const keyInsights = generateKeyInsights(
      gaps,
      validatedRequest.layer1_evaluation,
      modeResult.recommendedMode
    );

    // Step 7: Determine inputs used
    const inputsUsed = determineInputsUsed(validatedRequest);

    // Step 8: Build result
    const result: StrategyAnalysisResult = {
      analysis_version: '2.1',
      generated_at: new Date().toISOString(),
      inputs_used: inputsUsed,

      overall_fit_score: fitResult.overall_fit_score,
      confidence_level: fitResult.confidence,
      fit_score_breakdown: fitResult.breakdown,

      gaps,

      recommended_mode: modeResult.recommendedMode,
      mode_reasoning: modeResult.reasoning,

      priority_actions: priorityActions,
      action_blueprints: blueprints,
      key_insights: keyInsights,

      // Include debug info in development
      debug: process.env.NODE_ENV === 'development' ? {
        penalties_applied: fitResult.penalties_applied,
        thresholds_snapshot: modeResult.context.thresholds,
      } : undefined,
    };

    // Log performance
    const processingTime = Date.now() - startTime;
    if (processingTime > 500) {
      console.warn(`[Layer 2] Analysis took ${processingTime}ms (target: <500ms)`);
    }

    return result;
  } catch (error) {
    throw handleError(error, 'analyzeStrategy');
  }
}

/**
 * Synchronous version of analyzeStrategy
 * (The async version is preferred but this is available for compatibility)
 */
export function analyzeStrategySync(
  request: StrategyAnalysisRequest
): StrategyAnalysisResult {
  const startTime = Date.now();

  try {
    const validatedRequest = validateRequest(request);

    const gaps = analyzeAllGaps(
      validatedRequest.layer1_evaluation,
      validatedRequest.layer4_state,
      validatedRequest.job_context
    );

    const fitResult = calculateFitScore(gaps);

    const modeResult = selectModeFromLayers(
      validatedRequest.layer1_evaluation,
      validatedRequest.layer4_state,
      gaps
    );

    const blueprints = generateActionBlueprints({
      recommendedMode: modeResult.recommendedMode,
      modeReasoning: modeResult.reasoning,
      gaps,
      evaluation: validatedRequest.layer1_evaluation,
      layer4State: validatedRequest.layer4_state,
    });

    const priorityActions = generatePriorityActions(
      blueprints,
      modeResult.recommendedMode
    );

    const keyInsights = generateKeyInsights(
      gaps,
      validatedRequest.layer1_evaluation,
      modeResult.recommendedMode
    );

    const inputsUsed = determineInputsUsed(validatedRequest);

    return {
      analysis_version: '2.1',
      generated_at: new Date().toISOString(),
      inputs_used: inputsUsed,
      overall_fit_score: fitResult.overall_fit_score,
      confidence_level: fitResult.confidence,
      fit_score_breakdown: fitResult.breakdown,
      gaps,
      recommended_mode: modeResult.recommendedMode,
      mode_reasoning: modeResult.reasoning,
      priority_actions: priorityActions,
      action_blueprints: blueprints,
      key_insights: keyInsights,
    };
  } catch (error) {
    throw handleError(error, 'analyzeStrategySync');
  }
}

// ==================== Validation ====================

/**
 * Validate the analysis request
 */
function validateRequest(request: StrategyAnalysisRequest): StrategyAnalysisRequest {
  const parseResult = StrategyAnalysisRequestSchema.safeParse(request);

  if (!parseResult.success) {
    const errorMessages = parseResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');

    throw createValidationError(
      `Invalid request: ${errorMessages}`,
      parseResult.error.errors
    );
  }

  return parseResult.data;
}

/**
 * Determine which inputs were used
 */
function determineInputsUsed(request: StrategyAnalysisRequest): InputsUsed {
  return {
    used_jd: !!request.job_context?.job_description,
    used_job_requirements: !!(
      request.job_context?.job_requirements &&
      (request.job_context.job_requirements.required_skills.length > 0 ||
        request.job_context.job_requirements.required_tools.length > 0)
    ),
  };
}

// ==================== Utility Functions ====================

/**
 * Quick analysis - just gaps and fit score
 *
 * Useful for lightweight analysis without full mode selection
 *
 * @param request - Strategy analysis request
 * @returns Quick analysis result
 */
export function analyzeQuick(request: StrategyAnalysisRequest): {
  gaps: GapAnalysis;
  fit_score: number;
  confidence: ConfidenceLevel;
} {
  const validatedRequest = validateRequest(request);

  const gaps = analyzeAllGaps(
    validatedRequest.layer1_evaluation,
    validatedRequest.layer4_state,
    validatedRequest.job_context
  );

  const fitResult = calculateFitScore(gaps);

  return {
    gaps,
    fit_score: fitResult.overall_fit_score,
    confidence: fitResult.confidence,
  };
}

/**
 * Analyze only gaps
 *
 * @param request - Strategy analysis request
 * @returns Gap analysis results
 */
export function analyzeGapsOnly(request: StrategyAnalysisRequest): GapAnalysis {
  const validatedRequest = validateRequest(request);

  return analyzeAllGaps(
    validatedRequest.layer1_evaluation,
    validatedRequest.layer4_state,
    validatedRequest.job_context
  );
}
