/**
 * Environment Configuration
 *
 * Centralized environment variable configuration for the application.
 * This includes runtime flags for controlling application behavior.
 */

/**
 * HYBRID_MODE - Controls whether the AI layer is mandatory
 *
 * - true (default): AI layer is mandatory - system will fail if AI is unavailable
 * - false: Local scoring only mode - AI layer is skipped (for testing/development)
 *
 * When HYBRID_MODE is true:
 * - calculatePROScore() runs first (local scoring)
 * - analyzeWithAI() must run next (AI validation/refinement)
 * - If AI fails, the entire request fails with AI_UNAVAILABLE error
 *
 * When HYBRID_MODE is false:
 * - Only local scoring runs
 * - AI layer is completely skipped
 * - Useful for testing, development, or offline scenarios
 */
export const HYBRID_MODE = process.env.HYBRID_MODE !== 'false'; // Default: true

/**
 * OpenAI API Configuration
 */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Validate that required environment variables are set when HYBRID_MODE is enabled
 */
export function validateEnvironment(): { valid: boolean; error?: string } {
  if (HYBRID_MODE) {
    if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === '') {
      return {
        valid: false,
        error: 'OPENAI_API_KEY is required when HYBRID_MODE is enabled. Please set it in your .env file.',
      };
    }
  }

  return { valid: true };
}

/**
 * Get environment configuration summary
 */
export function getEnvironmentInfo() {
  return {
    hybridMode: HYBRID_MODE,
    hasOpenAIKey: !!OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}
