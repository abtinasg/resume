/**
 * Layer 3 - Execution Engine
 * Temperature Configuration
 *
 * Different temperatures for different rewrite types.
 * Lower temperature = more deterministic
 * Higher temperature = more creative
 */

import { RewriteType } from '../types';

// ==================== Temperature Constants ====================

/**
 * Temperature for bullet rewrites
 * Low - we want deterministic, consistent improvements
 */
export const BULLET_TEMPERATURE = 0.3;

/**
 * Temperature for section rewrites
 * Slightly higher - need some creativity for coherence
 */
export const SECTION_TEMPERATURE = 0.4;

/**
 * Temperature for summary rewrites
 * Higher - summaries benefit from more creativity
 */
export const SUMMARY_TEMPERATURE = 0.5;

/**
 * Temperature for retry attempts
 * Lower than normal - we want stricter adherence
 */
export const RETRY_TEMPERATURE = 0.2;

// ==================== Temperature Config ====================

/**
 * Temperature configuration by rewrite type
 */
export interface TemperatureConfig {
  /** Base temperature for first attempt */
  base: number;
  /** Temperature for retry attempts */
  retry: number;
  /** Minimum allowed temperature */
  min: number;
  /** Maximum allowed temperature */
  max: number;
}

/**
 * Temperature configurations
 */
const TEMPERATURE_CONFIGS: Record<RewriteType, TemperatureConfig> = {
  bullet: {
    base: BULLET_TEMPERATURE,
    retry: RETRY_TEMPERATURE,
    min: 0.1,
    max: 0.5,
  },
  summary: {
    base: SUMMARY_TEMPERATURE,
    retry: 0.3,
    min: 0.2,
    max: 0.7,
  },
  section: {
    base: SECTION_TEMPERATURE,
    retry: 0.25,
    min: 0.15,
    max: 0.6,
  },
};

// ==================== Public Functions ====================

/**
 * Get temperature for a rewrite type
 */
export function getTemperatureForType(type: RewriteType): number {
  return TEMPERATURE_CONFIGS[type].base;
}

/**
 * Get retry temperature for a rewrite type
 */
export function getRetryTemperatureForType(type: RewriteType): number {
  return TEMPERATURE_CONFIGS[type].retry;
}

/**
 * Get full temperature config for a rewrite type
 */
export function getTemperatureConfig(type: RewriteType): TemperatureConfig {
  return TEMPERATURE_CONFIGS[type];
}

/**
 * Adjust temperature based on attempt number
 * Temperature decreases with each retry to be more deterministic
 */
export function getTemperatureForAttempt(
  type: RewriteType,
  attempt: number
): number {
  const config = TEMPERATURE_CONFIGS[type];

  if (attempt <= 0) {
    return config.base;
  }

  // Decrease temperature by 0.1 per retry, but don't go below minimum
  const adjusted = config.base - attempt * 0.1;
  return Math.max(adjusted, config.min);
}

/**
 * Validate and clamp temperature to valid range
 */
export function clampTemperature(
  type: RewriteType,
  temperature: number
): number {
  const config = TEMPERATURE_CONFIGS[type];
  return Math.max(config.min, Math.min(temperature, config.max));
}
