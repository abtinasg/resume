/**
 * Layer 1 - Evaluation Engine
 * Main Evaluation Facade
 *
 * Provides the primary public API for resume evaluation.
 * Handles input validation, parsing, caching, and orchestration.
 */

import type {
  EvaluationRequest,
  FitEvaluationRequest,
  EvaluationResult,
  FitScore,
  ParsedJobRequirements,
} from './types';
import {
  EvaluationRequestSchema,
  FitEvaluationRequestSchema,
} from './types';
import { parseResume } from './parser';
import { evaluateGeneric } from './scoring/generic';
import { evaluateFit } from './scoring/fit';
import { parseJobDescription } from './modules/job-parser';
import {
  generateContentHash,
  getCachedScore,
  setCachedScore,
} from './cache';
import {
  EvaluationError,
  EvaluationErrorCode,
  logError,
} from './errors';
import { PERFORMANCE_TARGETS } from './config/weights';

// ==================== Main Evaluation API ====================

/**
 * Evaluate a resume without job context (generic evaluation)
 *
 * @param request - Evaluation request containing resume data
 * @returns Generic evaluation result with scores and feedback
 *
 * @example
 * ```typescript
 * const result = await evaluate({
 *   resume: {
 *     content: pdfBuffer,
 *     filename: 'resume.pdf',
 *     mimeType: 'application/pdf',
 *   },
 * });
 * console.log(`Score: ${result.resume_score}`);
 * ```
 */
export async function evaluate(
  request: EvaluationRequest
): Promise<EvaluationResult> {
  const startTime = Date.now();

  try {
    // Step 1: Validate input
    const validatedRequest = validateEvaluationRequest(request);

    // Step 2: Check cache
    const contentHash = generateContentHash(validatedRequest.resume.content);
    const cachedResult = getCachedScore(contentHash);
    if (cachedResult) {
      console.log('[Layer1] Cache hit for generic evaluation');
      return cachedResult;
    }

    // Step 3: Parse resume
    const parsed = await parseResume(validatedRequest.resume);

    // Step 4: Use cached raw text from parsing (avoids re-parsing)
    const rawText = parsed.metadata.raw_text || 
      (typeof validatedRequest.resume.content === 'string'
        ? validatedRequest.resume.content
        : await extractRawText(validatedRequest.resume));

    // Step 5: Perform evaluation
    const { result } = evaluateGeneric(parsed, rawText);

    // Step 6: Cache result
    setCachedScore(contentHash, result);

    // Step 7: Log performance
    const processingTime = Date.now() - startTime;
    logPerformance('evaluate', processingTime, PERFORMANCE_TARGETS.total_generic);

    return result;
  } catch (error) {
    if (error instanceof EvaluationError) {
      logError(error, 'evaluate');
      throw error;
    }

    // Wrap unexpected errors
    const evaluationError = new EvaluationError(
      EvaluationErrorCode.INTERNAL_ERROR,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
    logError(evaluationError, 'evaluate');
    throw evaluationError;
  }
}

/**
 * Evaluate a resume against a specific job description (fit evaluation)
 *
 * @param request - Fit evaluation request with resume and job description
 * @returns Fit evaluation result with gaps, recommendation, and tailoring hints
 *
 * @example
 * ```typescript
 * const result = await evaluate_fit({
 *   resume: { content: pdfBuffer, filename: 'resume.pdf', mimeType: 'application/pdf' },
 *   job_description: { raw_text: jobDescriptionText },
 * });
 * console.log(`Fit: ${result.fit_score}, Recommendation: ${result.recommendation}`);
 * ```
 */
export async function evaluate_fit(
  request: FitEvaluationRequest
): Promise<FitScore> {
  const startTime = Date.now();

  try {
    // Step 1: Validate input
    const validatedRequest = validateFitRequest(request);

    // Step 2: Parse resume
    const parsed = await parseResume(validatedRequest.resume);

    // Step 3: Use cached raw text from parsing (avoids re-parsing)
    const rawText = parsed.metadata.raw_text || 
      (typeof validatedRequest.resume.content === 'string'
        ? validatedRequest.resume.content
        : await extractRawText(validatedRequest.resume));

    // Step 4: Parse job requirements
    const requirements = validatedRequest.job_description.parsed_requirements
      || await parseJobDescription(validatedRequest.job_description.raw_text);

    // Step 5: Perform fit evaluation
    const result = evaluateFit(parsed, rawText, requirements);

    // Step 6: Log performance
    const processingTime = Date.now() - startTime;
    logPerformance('evaluate_fit', processingTime, PERFORMANCE_TARGETS.total_fit);

    return result;
  } catch (error) {
    if (error instanceof EvaluationError) {
      logError(error, 'evaluate_fit');
      throw error;
    }

    // Wrap unexpected errors
    const evaluationError = new EvaluationError(
      EvaluationErrorCode.INTERNAL_ERROR,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
    logError(evaluationError, 'evaluate_fit');
    throw evaluationError;
  }
}

// ==================== Validation ====================

/**
 * Validate generic evaluation request
 */
function validateEvaluationRequest(request: EvaluationRequest): EvaluationRequest {
  const result = EvaluationRequestSchema.safeParse(request);

  if (!result.success) {
    throw new EvaluationError(EvaluationErrorCode.VALIDATION_ERROR, {
      errors: result.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  return result.data;
}

/**
 * Validate fit evaluation request
 */
function validateFitRequest(request: FitEvaluationRequest): FitEvaluationRequest {
  const result = FitEvaluationRequestSchema.safeParse(request);

  if (!result.success) {
    throw new EvaluationError(EvaluationErrorCode.VALIDATION_ERROR, {
      errors: result.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  return result.data;
}

// ==================== Helper Functions ====================

/**
 * Extract raw text from resume input
 */
async function extractRawText(resume: EvaluationRequest['resume']): Promise<string> {
  if (typeof resume.content === 'string') {
    return resume.content;
  }

  // For binary content, parse and join all text
  const parsed = await parseResume(resume);
  const textParts: string[] = [];

  // Personal info
  if (parsed.personal.name) textParts.push(parsed.personal.name);

  // Experience
  for (const exp of parsed.experiences) {
    textParts.push(`${exp.title} at ${exp.company}`);
    textParts.push(...exp.bullets);
  }

  // Skills
  textParts.push(parsed.skills.join(' '));

  // Education
  for (const edu of parsed.education) {
    textParts.push(`${edu.degree} from ${edu.institution}`);
  }

  // Projects
  if (parsed.projects) {
    for (const proj of parsed.projects) {
      textParts.push(`${proj.name}: ${proj.description}`);
    }
  }

  return textParts.join('\n');
}

/**
 * Log performance metrics
 */
function logPerformance(operation: string, actualMs: number, targetMs: number): void {
  const status = actualMs <= targetMs ? '✓' : '⚠️';
  console.log(`[Layer1][Performance] ${status} ${operation}: ${actualMs}ms (target: ${targetMs}ms)`);
}

// ==================== Convenience Functions ====================

/**
 * Quick score check (returns just the score number)
 */
export async function getScore(
  content: Buffer | string,
  filename: string,
  mimeType: 'application/pdf' | 'text/plain' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
): Promise<number> {
  const result = await evaluate({
    resume: { content, filename, mimeType },
  });
  return result.resume_score;
}

/**
 * Quick fit check (returns just the recommendation)
 */
export async function getFitRecommendation(
  content: Buffer | string,
  filename: string,
  mimeType: 'application/pdf' | 'text/plain' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jobDescription: string
): Promise<{
  fit_score: number;
  recommendation: string;
  reasoning: string;
}> {
  const result = await evaluate_fit({
    resume: { content, filename, mimeType },
    job_description: { raw_text: jobDescription },
  });

  return {
    fit_score: result.fit_score,
    recommendation: result.recommendation,
    reasoning: result.recommendation_reasoning,
  };
}

// ==================== Job Description Parser ====================

/**
 * Parse job description into requirements (exposed for external use)
 */
export { parseJobDescription } from './modules/job-parser';
