/**
 * Layer 3 - Execution Engine
 * LLM Client
 *
 * OpenAI integration for evidence-anchored rewriting.
 */

import OpenAI from 'openai';
import { getLLMConfig } from '../config';
import { ExecutionError, ExecutionErrorCode, createLLMError } from '../errors';
import { LLMPrompt, parseLLMResponse, LLMRewriteResponse } from './prompt-builder';
import { getTemperatureForAttempt } from './temperature-config';
import { RewriteType } from '../types';

// ==================== Types ====================

/**
 * LLM generation options
 */
export interface LLMGenerationOptions {
  /** Rewrite type (for temperature selection) */
  type: RewriteType;
  /** Attempt number (0 = first attempt) */
  attempt?: number;
  /** Override temperature */
  temperature?: number;
  /** Override max tokens */
  maxTokens?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * LLM generation result
 */
export interface LLMGenerationResult {
  /** Parsed response */
  response: LLMRewriteResponse;
  /** Raw response text */
  rawResponse: string;
  /** Usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model used */
  model: string;
}

// ==================== Client ====================

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client
 */
function getClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new ExecutionError(
        ExecutionErrorCode.CONFIG_ERROR,
        { message: 'OPENAI_API_KEY environment variable is not set' }
      );
    }

    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

/**
 * Reset client (for testing)
 */
export function resetLLMClient(): void {
  openaiClient = null;
}

// ==================== Main Generation Function ====================

/**
 * Generate improvement using LLM
 */
export async function generateImprovement(
  prompt: LLMPrompt,
  options: LLMGenerationOptions
): Promise<LLMGenerationResult> {
  const config = getLLMConfig();
  const client = getClient();

  const {
    type,
    attempt = 0,
    temperature = getTemperatureForAttempt(type, attempt),
    maxTokens = config.max_tokens,
    timeout = 30000,
  } = options;

  try {
    const response = await Promise.race([
      client.chat.completions.create({
        model: config.primary_model,
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user },
        ],
        temperature,
        max_tokens: maxTokens,
        // Note: json_object format requires OpenAI API with gpt-4-turbo or gpt-3.5-turbo-1106+
        // The prompt must also ask for JSON output for this to work
        response_format: { type: 'json_object' },
      }),
      createTimeoutPromise(timeout),
    ]);

    // Handle timeout
    if (response === 'timeout') {
      throw createLLMError(ExecutionErrorCode.LLM_TIMEOUT);
    }

    const completion = response as OpenAI.ChatCompletion;
    const rawResponse = completion.choices[0]?.message?.content || '';

    // Parse response
    const parsed = parseLLMResponse(rawResponse);
    if (!parsed) {
      throw createLLMError(
        ExecutionErrorCode.LLM_INVALID_RESPONSE,
        new Error('Failed to parse LLM response as valid JSON')
      );
    }

    return {
      response: parsed,
      rawResponse,
      usage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
      model: config.primary_model,
    };
  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw createLLMError(ExecutionErrorCode.LLM_RATE_LIMIT, error);
      }
      if (error.status === 408 || error.code === 'ETIMEDOUT') {
        throw createLLMError(ExecutionErrorCode.LLM_TIMEOUT, error);
      }
      throw createLLMError(ExecutionErrorCode.LLM_ERROR, error);
    }

    // Re-throw ExecutionErrors
    if (error instanceof ExecutionError) {
      throw error;
    }

    // Wrap unknown errors
    throw createLLMError(
      ExecutionErrorCode.LLM_ERROR,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Create timeout promise
 */
function createTimeoutPromise(ms: number): Promise<'timeout'> {
  return new Promise((resolve) => {
    setTimeout(() => resolve('timeout'), ms);
  });
}

// ==================== Fallback Generation ====================

/**
 * Generate with fallback to secondary model
 */
export async function generateWithFallback(
  prompt: LLMPrompt,
  options: LLMGenerationOptions
): Promise<LLMGenerationResult> {
  const config = getLLMConfig();

  try {
    return await generateImprovement(prompt, options);
  } catch (error) {
    // Only fallback for certain errors
    if (
      error instanceof ExecutionError &&
      [ExecutionErrorCode.LLM_RATE_LIMIT, ExecutionErrorCode.LLM_ERROR].includes(
        error.code
      )
    ) {
      console.warn(
        `[Layer 3] Primary model failed, falling back to ${config.fallback_model}`
      );

      // Try fallback model
      const client = getClient();
      const temperature = getTemperatureForAttempt(options.type, options.attempt || 0);

      try {
        const response = await client.chat.completions.create({
          model: config.fallback_model,
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          temperature,
          max_tokens: options.maxTokens || config.max_tokens,
        });

        const rawResponse = response.choices[0]?.message?.content || '';
        const parsed = parseLLMResponse(rawResponse);

        if (!parsed) {
          throw createLLMError(
            ExecutionErrorCode.LLM_INVALID_RESPONSE,
            new Error('Fallback model returned invalid response')
          );
        }

        return {
          response: parsed,
          rawResponse,
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              }
            : undefined,
          model: config.fallback_model,
        };
      } catch (fallbackError) {
        // If fallback also fails, throw original error
        throw error;
      }
    }

    throw error;
  }
}

// ==================== Utility Functions ====================

/**
 * Check if LLM is available (API key is set)
 */
export function isLLMAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get current model configuration
 */
export function getModelConfig(): {
  primaryModel: string;
  fallbackModel: string;
  maxTokens: number;
} {
  const config = getLLMConfig();
  return {
    primaryModel: config.primary_model,
    fallbackModel: config.fallback_model,
    maxTokens: config.max_tokens,
  };
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Check if prompt will fit in context
 */
export function willPromptFit(prompt: LLMPrompt, maxContextTokens = 8000): boolean {
  const totalText = prompt.system + prompt.user;
  const estimatedTokens = estimateTokenCount(totalText);
  // Leave room for response
  return estimatedTokens < maxContextTokens - 500;
}
