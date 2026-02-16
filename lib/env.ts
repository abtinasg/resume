/**
 * Environment Configuration
 *
 * Centralized environment variable configuration for the application.
 * This includes runtime flags for controlling application behavior.
 */

/**
 * HYBRID_MODE - Controls whether the AI layer runs alongside local scoring
 *
 * - false (default): Local scoring only - instant results (<5 seconds)
 * - true: AI layer runs after local scoring (adds 30-60 seconds)
 *
 * When HYBRID_MODE is true:
 * - calculatePROScore() runs first (local scoring)
 * - AI validation/refinement runs next
 * - If AI fails, falls back to local scores
 *
 * When HYBRID_MODE is false:
 * - Only local scoring runs
 * - AI layer is completely skipped
 * - Users get instant deterministic scores
 */
export const HYBRID_MODE = process.env.HYBRID_MODE === 'true'; // Default: false (instant scoring)

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
