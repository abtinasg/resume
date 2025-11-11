/**
 * AI Analysis Helper - Reusable OpenAI integration for final verdict layer
 *
 * This module provides a lightweight, reusable helper that calls OpenAI or Anthropic model
 * to analyze structured data and return JSON responses.
 */

import OpenAI from "openai";

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Verdict Response Interface
 */
export interface AIVerdictResponse {
  ai_final_score?: number;
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvement_suggestions?: string[];
  [key: string]: any; // Allow additional fields
}

/**
 * Analyze with AI - Generic helper for AI-powered analysis
 *
 * This function:
 * 1. Calls OpenAI API with the provided prompt
 * 2. Uses gpt-4o-mini model for cost-effective, fast responses
 * 3. Safely parses JSON response
 * 4. Handles errors gracefully
 *
 * @param prompt - The complete prompt to send to the AI
 * @returns Promise<AIVerdictResponse> - Parsed JSON response from AI
 * @throws Error if API call fails or response is invalid
 *
 * @example
 * ```typescript
 * const prompt = buildFinalAIPrompt(resumeText, jobRole, scoringResult);
 * const verdict = await analyzeWithAI(prompt);
 * console.log(verdict.ai_final_score);
 * ```
 */
export async function analyzeWithAI(prompt: string): Promise<AIVerdictResponse> {
  try {
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3, // Lower temperature for more consistent, focused responses
      messages: [
        {
          role: "system",
          content: "You are an expert resume analyst. Provide your analysis as valid JSON only, no additional text or markdown formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" }, // Ensure JSON response
    });

    // Extract content from response
    const content = response.choices?.[0]?.message?.content || "{}";

    // Parse JSON safely
    try {
      const parsedResponse = JSON.parse(content) as AIVerdictResponse;

      console.log('[AI Verdict] ✓ Successfully analyzed with AI:', {
        hasScore: !!parsedResponse.ai_final_score,
        hasSummary: !!parsedResponse.summary,
        strengthsCount: parsedResponse.strengths?.length || 0,
        weaknessesCount: parsedResponse.weaknesses?.length || 0,
      });

      return parsedResponse;
    } catch (parseError) {
      // If JSON parsing fails, return the content as summary
      console.warn('[AI Verdict] ⚠ Failed to parse JSON, returning as summary:', parseError);
      return {
        summary: content,
      };
    }
  } catch (error) {
    // Handle API errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI Verdict] ✗ AI analysis failed:', errorMessage);

    // Check for specific error types
    if (errorMessage.includes('API key')) {
      throw new Error('OPENAI_API_KEY is not configured or invalid');
    }

    if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later.');
    }

    if (errorMessage.includes('timeout')) {
      throw new Error('OpenAI API request timed out. Please try again.');
    }

    // Generic error
    throw new Error(`AI analysis failed: ${errorMessage}`);
  }
}

/**
 * Analyze with AI (with retry logic)
 *
 * Enhanced version with automatic retry on transient failures.
 *
 * @param prompt - The complete prompt to send to the AI
 * @param maxRetries - Maximum number of retry attempts (default: 2)
 * @returns Promise<AIVerdictResponse> - Parsed JSON response from AI
 */
export async function analyzeWithAIRetry(
  prompt: string,
  maxRetries: number = 2
): Promise<AIVerdictResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await analyzeWithAI(prompt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on authentication or configuration errors
      if (
        lastError.message.includes('API key') ||
        lastError.message.includes('invalid')
      ) {
        throw lastError;
      }

      // Log retry attempt
      if (attempt <= maxRetries) {
        console.warn(`[AI Verdict] Retry attempt ${attempt}/${maxRetries} after error:`, lastError.message);

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  throw lastError || new Error('AI analysis failed after retries');
}
