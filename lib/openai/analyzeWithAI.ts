/**
 * AI Analysis Helper - Reusable OpenAI integration for final verdict layer
 *
 * This module provides a lightweight, reusable helper that calls OpenAI or Anthropic model
 * to analyze structured data and return JSON responses.
 *
 * HYBRID MODE:
 * - When HYBRID_MODE is enabled, AI analysis is mandatory
 * - If OpenAI API key is missing or API fails, the function throws an error
 * - The calling code must handle this error and return AI_UNAVAILABLE response
 */

import OpenAI from "openai";
import type { ScoringResult } from "@/lib/scoring/types";

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Verdict Response Interface
 * Enhanced to support hybrid reasoning mode with component adjustments
 */
export interface AIVerdictResponse {
  ai_final_score: number;
  local_score_used?: number;
  score_adjustment_reasoning?: string;
  adjusted_components?: {
    content_quality?: number;
    ats_compatibility?: number;
    format_structure?: number;
    impact_metrics?: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  ats_verdict?: string;
  confidence_level?: string;
  before_after_rewrites?: BeforeAfterRewrite[];
  [key: string]: any; // Allow additional fields for flexibility
}

export interface BeforeAfterRewrite {
  title: string;
  before: string;
  after: string;
  priority: string;
}

/**
 * Custom error class for AI-specific errors
 */
export class AIAnalysisError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIAnalysisError';
  }
}

/**
 * Truncate prompt to maximum character limit while preserving structure
 *
 * @param prompt - The prompt to truncate
 * @param maxChars - Maximum characters (default: 12000)
 * @returns Truncated prompt with indication if truncation occurred
 */
function truncatePrompt(prompt: string, maxChars: number = 12000): { prompt: string; wasTruncated: boolean } {
  if (prompt.length <= maxChars) {
    return { prompt, wasTruncated: false };
  }

  // Try to truncate intelligently at a section boundary
  const truncated = prompt.substring(0, maxChars);
  const lastNewlineIndex = truncated.lastIndexOf('\n\n');

  // If we found a good break point, use it; otherwise use hard cut
  const finalPrompt = lastNewlineIndex > maxChars * 0.8
    ? truncated.substring(0, lastNewlineIndex) + '\n\n[Content truncated for length...]'
    : truncated + '\n[Content truncated...]';

  return { prompt: finalPrompt, wasTruncated: true };
}

const ENHANCED_RESUME_CHAR_LIMIT = 5000;

function truncateResumeText(resumeText: string): { text: string; wasTruncated: boolean } {
  if (resumeText.length <= ENHANCED_RESUME_CHAR_LIMIT) {
    return { text: resumeText, wasTruncated: false };
  }

  const truncated = resumeText.slice(0, ENHANCED_RESUME_CHAR_LIMIT);
  return {
    text: `${truncated}\n...[truncated to ${ENHANCED_RESUME_CHAR_LIMIT} characters for AI processing]`,
    wasTruncated: true,
  };
}

const ENHANCED_OUTPUT_SCHEMA_EXAMPLE = `{
  "ai_final_score": 85,
  "score_adjustment_reasoning": "Adjusted upward because quantified achievements outweigh formatting issues.",
  "summary": "Brief executive overview of the resume.",
  "strengths": ["Clear leadership impact", "Strong quantification"],
  "weaknesses": ["Missing cloud keywords", "Limited metrics in recent role"],
  "improvement_suggestions": [
    "Incorporate AWS/GCP keywords",
    "Add revenue or adoption metrics for flagship project"
  ],
  "before_after_rewrites": [
    {
      "title": "Quantify platform migration results",
      "before": "Migrated legacy platform to modern stack",
      "after": "Reframe as: 'Migrated a legacy platform to React/Node, cutting page load time by 45% and boosting NPS by 12 points.'",
      "priority": "HIGH"
    }
  ],
  "confidence_level": "high"
}`;

export function buildEnhancedPrompt(resumeText: string, scoringResult: ScoringResult): string {
  const sanitizedResume = resumeText?.trim() ?? "";
  const { text: truncatedResume, wasTruncated } = truncateResumeText(sanitizedResume);
  const scoringJson = JSON.stringify(scoringResult, null, 2);

  return [
    "You are the AI rewrite and final verdict layer for the PRO Resume Scoring System.",
    "Use the local scoring analytics to validate or adjust the overall score and produce resume-ready rewrites.",
    "",
    `Resume Text${wasTruncated ? " (truncated to 5000 characters)" : ""}:`,
    truncatedResume || "[No resume text provided]",
    "",
    "Local Scoring Result (JSON):",
    scoringJson,
    "",
    "Instructions:",
    "1. Review the local score and determine if it should be adjusted up or down (0-100).",
    "2. Provide a summary, strengths, weaknesses, and prioritized improvement suggestions.",
    "3. Rewrite every improvement suggestion into a BEFORE -> AFTER recommendation with a clear title and priority.",
    "4. BEFORE text must reflect the current issue/gap. AFTER text must be a polished, resume-ready rewrite or concrete guidance.",
    "5. Respond with strict JSON matching the following structure (no markdown, no commentary):",
    ENHANCED_OUTPUT_SCHEMA_EXAMPLE,
  ].join("\n");
}

/**
 * Analyze with AI - Generic helper for AI-powered analysis
 *
 * This function:
 * 1. Validates that OpenAI API key is configured
 * 2. Truncates prompt to max 12k characters if needed
 * 3. Calls OpenAI API with the provided prompt (60s timeout)
 * 4. Uses gpt-4o-mini model for cost-effective, fast responses
 * 5. Safely parses JSON response with validation
 * 6. Throws AIAnalysisError with specific error codes for better error handling
 *
 * @param prompt - The complete prompt to send to the AI
 * @returns Promise<AIVerdictResponse> - Parsed JSON response from AI
 * @throws AIAnalysisError with specific error codes
 *
 * @example
 * ```typescript
 * const prompt = buildFinalAIPrompt(resumeText, jobRole, scoringResult);
 * try {
 *   const verdict = await analyzeWithAI(prompt);
 *   console.log(verdict.ai_final_score);
 * } catch (error) {
 *   if (error instanceof AIAnalysisError && error.code === 'MISSING_API_KEY') {
 *     // Handle missing API key
 *   }
 * }
 * ```
 */
export async function analyzeWithAI(prompt: string): Promise<AIVerdictResponse> {
  const startTime = Date.now();

  // Validate API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
    console.error('[AI Verdict] ✗ OpenAI API key is not configured');
    throw new AIAnalysisError(
      'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.',
      'MISSING_API_KEY'
    );
  }

  // Truncate prompt if needed (max 12k chars for optimal performance)
  const { prompt: truncatedPrompt, wasTruncated } = truncatePrompt(prompt, 12000);

  if (wasTruncated) {
    console.log('[AI Verdict] ⚠️ Prompt truncated from', prompt.length, 'to', truncatedPrompt.length, 'characters');
  } else {
    console.log('[AI Verdict] 📝 Prompt length:', prompt.length, 'characters');
  }

  try {
    console.log('[AI Verdict] 🤖 Starting AI analysis with hybrid reasoning mode...');

    // Call OpenAI API with 60s timeout for robust handling
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3, // Lower temperature for more consistent, focused responses
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyst operating in hybrid reasoning mode. Provide your analysis as valid JSON only, no additional text or markdown formatting. Ensure all required fields are present.",
        },
        {
          role: "user",
          content: truncatedPrompt,
        },
      ],
      response_format: { type: "json_object" }, // Ensure JSON response
      timeout: 60000, // 60 second timeout for reliability
    });

    // Extract content from response
    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[AI Verdict] ✗ Empty response from OpenAI');
      throw new AIAnalysisError(
        'OpenAI returned an empty response',
        'EMPTY_RESPONSE'
      );
    }

    // Parse JSON safely
    let parsedResponse: AIVerdictResponse;
    try {
      parsedResponse = JSON.parse(content) as AIVerdictResponse;
    } catch (parseError) {
      console.error('[AI Verdict] ✗ Failed to parse JSON response:', parseError);
      throw new AIAnalysisError(
        'Failed to parse AI response as JSON',
        'INVALID_JSON',
        { content, parseError }
      );
    }

    // Validate required fields
    const validationErrors: string[] = [];
    if (typeof parsedResponse.ai_final_score !== 'number') {
      validationErrors.push('ai_final_score is missing or not a number');
    }
    if (!parsedResponse.summary || typeof parsedResponse.summary !== 'string') {
      validationErrors.push('summary is missing or not a string');
    }
    if (!Array.isArray(parsedResponse.strengths) || parsedResponse.strengths.length === 0) {
      validationErrors.push('strengths is missing or empty');
    }
    if (!Array.isArray(parsedResponse.weaknesses) || parsedResponse.weaknesses.length === 0) {
      validationErrors.push('weaknesses is missing or empty');
    }
    if (!Array.isArray(parsedResponse.improvement_suggestions) || parsedResponse.improvement_suggestions.length === 0) {
      validationErrors.push('improvement_suggestions is missing or empty');
    }

    if (validationErrors.length > 0) {
      console.error('[AI Verdict] ✗ Response validation failed:', validationErrors);
      throw new AIAnalysisError(
        `AI response is missing required fields: ${validationErrors.join(', ')}`,
        'INVALID_RESPONSE',
        { validationErrors, response: parsedResponse }
      );
    }

    const processingTime = Date.now() - startTime;
    console.log('[AI Verdict] ✓ AI analysis completed successfully:', {
      aiScore: parsedResponse.ai_final_score,
      localScore: parsedResponse.local_score_used,
      hasSummary: !!parsedResponse.summary,
      strengthsCount: parsedResponse.strengths.length,
      weaknessesCount: parsedResponse.weaknesses.length,
      suggestionsCount: parsedResponse.improvement_suggestions.length,
      processingTime: `${processingTime}ms`,
    });

    return parsedResponse;
  } catch (error) {
    // If already an AIAnalysisError, re-throw it
    if (error instanceof AIAnalysisError) {
      throw error;
    }

    // Extract comprehensive error details from OpenAI SDK error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = (error as any)?.response?.data || null;
    const errorStatus = (error as any)?.status || (error as any)?.response?.status || null;
    const errorCode = errorResponse?.error?.code || null;
    const errorType = errorResponse?.error?.type || null;

    // Log full error details for debugging
    console.error('[AI] 🔴 OpenAI API error occurred:');
    console.error('[AI] Error message:', errorMessage);
    if (errorStatus) {
      console.error('[AI] HTTP status:', errorStatus);
    }
    if (errorResponse) {
      console.error('[AI] Response data:', JSON.stringify(errorResponse, null, 2));
    }
    if (errorCode) {
      console.error('[AI] Error code:', errorCode);
    }
    if (errorType) {
      console.error('[AI] Error type:', errorType);
    }

    // Check for authentication errors (401)
    if (errorStatus === 401 || errorMessage.includes('API key') || errorMessage.includes('Incorrect API key') || errorMessage.includes('401') || errorCode === 'invalid_api_key') {
      console.error('[AI] 🔴 Failed with 401 (invalid key)');
      throw new AIAnalysisError(
        'OpenAI API key is invalid or unauthorized',
        'INVALID_API_KEY',
        { originalError: errorMessage, errorResponse, errorStatus }
      );
    }

    // Check for rate limit errors (429)
    if (errorStatus === 429 || errorMessage.includes('rate_limit') || errorMessage.includes('429') || errorCode === 'rate_limit_exceeded') {
      console.error('[AI] ⚠️ Rate limit exceeded (429)');
      throw new AIAnalysisError(
        'OpenAI API rate limit exceeded. Please try again later.',
        'RATE_LIMIT',
        { originalError: errorMessage, errorResponse, errorStatus }
      );
    }

    // Check for timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNABORTED') || errorCode === 'timeout') {
      console.error('[AI] ⏱️ Request timeout');
      throw new AIAnalysisError(
        'OpenAI API request timed out. Please try again.',
        'TIMEOUT',
        { originalError: errorMessage, errorResponse, errorStatus }
      );
    }

    // Check for network errors
    if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND') || errorCode === 'connection_error') {
      console.error('[AI] 🌐 Network error');
      throw new AIAnalysisError(
        'Network error connecting to OpenAI API. Please check your connection.',
        'NETWORK_ERROR',
        { originalError: errorMessage, errorResponse, errorStatus }
      );
    }

    // Check for model not found errors (404)
    if (errorStatus === 404 || errorMessage.includes('model') || errorMessage.includes('not found') || errorCode === 'model_not_found') {
      console.error('[AI] ⚠️ Model not found');
      throw new AIAnalysisError(
        'OpenAI model not available or not found',
        'MODEL_NOT_FOUND',
        { originalError: errorMessage, errorResponse, errorStatus }
      );
    }

    // Check for bad request errors (400)
    if (errorStatus === 400 || errorCode === 'invalid_request_error') {
      console.error('[AI] ⚠️ Bad request (400)');
      throw new AIAnalysisError(
        `Invalid request to OpenAI API: ${errorMessage}`,
        'BAD_REQUEST',
        { originalError: errorMessage, errorResponse, errorStatus }
      );
    }

    // Generic error - log full details
    console.error('[AI] ❌ Unhandled error type');
    throw new AIAnalysisError(
      `AI analysis failed: ${errorMessage}`,
      'AI_ERROR',
      { originalError: errorMessage, errorResponse, errorStatus, errorCode, errorType }
    );
  }
}

export async function analyzeWithAIEnhanced(
  resumeText: string,
  scoringResult: ScoringResult
): Promise<AIVerdictResponse> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
    throw new AIAnalysisError(
      "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment.",
      "MISSING_API_KEY"
    );
  }

  const prompt = buildEnhancedPrompt(resumeText, scoringResult);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume coach specializing in ATS optimization and rewriting suggestions in professional tone. Always output valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      timeout: 60000,
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new AIAnalysisError("OpenAI returned an empty response", "EMPTY_RESPONSE");
    }

    let parsedResponse: AIVerdictResponse;

    try {
      parsedResponse = JSON.parse(content) as AIVerdictResponse;
    } catch (error) {
      throw new AIAnalysisError("Failed to parse AI response as JSON", "INVALID_JSON", {
        content,
        error,
      });
    }

    const validationErrors: string[] = [];

    if (typeof parsedResponse.ai_final_score !== "number" || Number.isNaN(parsedResponse.ai_final_score)) {
      validationErrors.push("ai_final_score is missing or not a number");
    } else if (
      parsedResponse.ai_final_score < 0 ||
      parsedResponse.ai_final_score > 100
    ) {
      validationErrors.push("ai_final_score must be between 0 and 100");
    }

    if (!parsedResponse.summary || typeof parsedResponse.summary !== "string") {
      validationErrors.push("summary is missing or not a string");
    }

    if (!Array.isArray(parsedResponse.strengths) || parsedResponse.strengths.length === 0) {
      validationErrors.push("strengths is missing or empty");
    }

    if (!Array.isArray(parsedResponse.weaknesses) || parsedResponse.weaknesses.length === 0) {
      validationErrors.push("weaknesses is missing or empty");
    }

    if (
      !Array.isArray(parsedResponse.improvement_suggestions) ||
      parsedResponse.improvement_suggestions.length === 0
    ) {
      validationErrors.push("improvement_suggestions is missing or empty");
    }

    if (
      !Array.isArray(parsedResponse.before_after_rewrites) ||
      parsedResponse.before_after_rewrites.length === 0
    ) {
      validationErrors.push("before_after_rewrites is missing or empty");
    }

    if (Array.isArray(parsedResponse.before_after_rewrites)) {
      parsedResponse.before_after_rewrites.forEach((rewrite, index) => {
        if (!rewrite) {
          validationErrors.push(`before_after_rewrites[${index}] is undefined`);
          return;
        }

        const { title, before, after, priority } = rewrite as BeforeAfterRewrite;

        if (!title || typeof title !== "string") {
          validationErrors.push(`before_after_rewrites[${index}].title is missing or not a string`);
        }

        if (!before || typeof before !== "string") {
          validationErrors.push(`before_after_rewrites[${index}].before is missing or not a string`);
        }

        if (!after || typeof after !== "string") {
          validationErrors.push(`before_after_rewrites[${index}].after is missing or not a string`);
        }

        if (!priority || typeof priority !== "string") {
          validationErrors.push(`before_after_rewrites[${index}].priority is missing or not a string`);
        }
      });
    }

    if (
      parsedResponse.ai_final_score !== scoringResult.overallScore &&
      (!parsedResponse.score_adjustment_reasoning || parsedResponse.score_adjustment_reasoning.trim().length === 0)
    ) {
      validationErrors.push("score_adjustment_reasoning is required when AI score differs from local score");
    }

    if (validationErrors.length > 0) {
      throw new AIAnalysisError(
        `AI response is missing required fields: ${validationErrors.join(", ")}`,
        "INVALID_RESPONSE",
        { validationErrors, response: parsedResponse }
      );
    }

    const normalizedRewrites = parsedResponse.before_after_rewrites?.map((rewrite) => ({
      title: rewrite.title.trim(),
      before: rewrite.before.trim(),
      after: rewrite.after.trim(),
      priority: rewrite.priority.trim().toUpperCase(),
    }));

    const result: AIVerdictResponse = {
      ...parsedResponse,
      before_after_rewrites: normalizedRewrites,
      local_score_used: scoringResult.overallScore,
      confidence_level: parsedResponse.confidence_level ?? "medium",
    };

    return result;
  } catch (error) {
    if (error instanceof AIAnalysisError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    throw new AIAnalysisError(`AI analysis failed: ${errorMessage}`, "AI_ERROR", {
      originalError: error,
    });
  }
}

/**
 * Analyze with AI (with retry logic)
 *
 * Enhanced version with automatic retry on transient failures.
 * This function intelligently retries on transient errors (timeouts, network issues)
 * but immediately fails on permanent errors (auth issues, invalid responses).
 *
 * @param prompt - The complete prompt to send to the AI
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Promise<AIVerdictResponse> - Parsed JSON response from AI
 * @throws AIAnalysisError with specific error codes
 */
export async function analyzeWithAIRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<AIVerdictResponse> {
  let lastError: AIAnalysisError | null = null;

  console.log(`[AI Verdict] Starting AI analysis with retry (max ${maxRetries} retries)...`);

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[AI Verdict] Attempt ${attempt}/${maxRetries + 1}...`);
      }
      return await analyzeWithAI(prompt);
    } catch (error) {
      lastError = error instanceof AIAnalysisError
        ? error
        : new AIAnalysisError(
            error instanceof Error ? error.message : 'Unknown error',
            'UNKNOWN_ERROR'
          );

      // Don't retry on permanent errors
      const nonRetryableErrors = [
        'MISSING_API_KEY',
        'INVALID_API_KEY',
        'INVALID_JSON',
        'INVALID_RESPONSE',
        'EMPTY_RESPONSE',
        'MODEL_NOT_FOUND',
        'BAD_REQUEST',
      ];

      if (nonRetryableErrors.includes(lastError.code)) {
        console.error(`[AI Verdict] ✗ Non-retryable error (${lastError.code}):`, lastError.message);
        if (lastError.details) {
          console.error(`[AI Verdict] Error details:`, lastError.details);
        }
        throw lastError;
      }

      // Log retry attempt for transient errors
      if (attempt <= maxRetries) {
        const waitTime = 1000 * Math.pow(2, attempt - 1); // True exponential backoff: 1s, 2s, 4s, 8s...
        console.warn(`[AI Verdict] ⚠ Transient error (${lastError.code}), retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`);
        console.warn(`[AI Verdict] Error message:`, lastError.message);
        if (lastError.details) {
          console.warn(`[AI Verdict] Error details:`, lastError.details);
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error(`[AI Verdict] ✗ All ${maxRetries + 1} attempts failed`);
        console.error(`[AI Verdict] Last error code: ${lastError.code}`);
        console.error(`[AI Verdict] Last error message:`, lastError.message);
        if (lastError.details) {
          console.error(`[AI Verdict] Last error details:`, lastError.details);
        }
      }
    }
  }

  // All retries failed
  throw lastError || new AIAnalysisError('AI analysis failed after all retry attempts', 'RETRY_EXHAUSTED');
}
