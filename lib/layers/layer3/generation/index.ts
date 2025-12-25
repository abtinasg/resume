/**
 * Layer 3 - Execution Engine
 * Generation System Exports
 */

export {
  generateImprovement,
  generateWithFallback,
  resetLLMClient,
  isLLMAvailable,
  getModelConfig,
  estimateTokenCount,
  willPromptFit,
  type LLMGenerationOptions,
  type LLMGenerationResult,
} from './llm-client';

export {
  buildBulletRewritePrompt,
  buildSummaryRewritePrompt,
  buildRetryPrompt,
  addExamplesToPrompt,
  addStrictConstraintsToPrompt,
  buildCompactEvidenceSummary,
  parseLLMResponse,
  extractImprovedTextFallback,
  type LLMPrompt,
  type LLMRewriteResponse,
} from './prompt-builder';

export {
  BULLET_TEMPERATURE,
  SECTION_TEMPERATURE,
  SUMMARY_TEMPERATURE,
  RETRY_TEMPERATURE,
  getTemperatureForType,
  getRetryTemperatureForType,
  getTemperatureConfig,
  getTemperatureForAttempt,
  clampTemperature,
  type TemperatureConfig,
} from './temperature-config';
