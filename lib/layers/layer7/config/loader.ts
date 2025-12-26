/**
 * Layer 7 - Learning Engine Foundation
 * Configuration Loader
 *
 * Loads and validates analytics configuration from JSON file.
 */

import type { AnalyticsConfig, MetricsPeriod, ExportFormat } from '../types';
import analyticsConfigJson from './analytics_config.json';

// ==================== Defaults ====================

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: AnalyticsConfig = {
  version: '1.0',
  metrics: {
    defaultLookbackDays: 30,
    aggregationBuckets: ['daily', 'weekly', 'monthly'],
  },
  exports: {
    maxEventsPerExport: 10000,
    defaultFormat: 'json',
  },
};

// ==================== Validation ====================

/**
 * Valid aggregation buckets
 */
const VALID_BUCKETS: MetricsPeriod[] = ['daily', 'weekly', 'monthly'];

/**
 * Valid export formats
 */
const VALID_FORMATS: ExportFormat[] = ['json', 'csv'];

/**
 * Validates the analytics configuration
 */
function validateConfig(config: unknown): AnalyticsConfig {
  if (!config || typeof config !== 'object') {
    console.warn('[Layer7] Invalid config, using defaults');
    return DEFAULT_CONFIG;
  }

  const cfg = config as Record<string, unknown>;

  // Validate version
  const version = typeof cfg.version === 'string' ? cfg.version : DEFAULT_CONFIG.version;

  // Validate metrics
  const metricsRaw = cfg.metrics as Record<string, unknown> | undefined;
  const metrics = {
    defaultLookbackDays:
      typeof metricsRaw?.defaultLookbackDays === 'number' &&
      metricsRaw.defaultLookbackDays > 0 &&
      metricsRaw.defaultLookbackDays <= 365
        ? metricsRaw.defaultLookbackDays
        : DEFAULT_CONFIG.metrics.defaultLookbackDays,
    aggregationBuckets:
      Array.isArray(metricsRaw?.aggregationBuckets) &&
      metricsRaw.aggregationBuckets.every((b: unknown) =>
        VALID_BUCKETS.includes(b as MetricsPeriod)
      )
        ? (metricsRaw.aggregationBuckets as MetricsPeriod[])
        : DEFAULT_CONFIG.metrics.aggregationBuckets,
  };

  // Validate exports
  const exportsRaw = cfg.exports as Record<string, unknown> | undefined;
  const exports = {
    maxEventsPerExport:
      typeof exportsRaw?.maxEventsPerExport === 'number' &&
      exportsRaw.maxEventsPerExport > 0 &&
      exportsRaw.maxEventsPerExport <= 100000
        ? exportsRaw.maxEventsPerExport
        : DEFAULT_CONFIG.exports.maxEventsPerExport,
    defaultFormat: VALID_FORMATS.includes(exportsRaw?.defaultFormat as ExportFormat)
      ? (exportsRaw!.defaultFormat as ExportFormat)
      : DEFAULT_CONFIG.exports.defaultFormat,
  };

  return {
    version,
    metrics,
    exports,
  };
}

// ==================== Loader ====================

/**
 * Load and cache configuration
 */
let cachedConfig: AnalyticsConfig | null = null;

/**
 * Load analytics configuration
 * @returns Validated analytics configuration
 */
export function loadConfig(): AnalyticsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = validateConfig(analyticsConfigJson);
  return cachedConfig;
}

/**
 * Get a specific config value
 */
export function getConfigValue<K extends keyof AnalyticsConfig>(
  key: K
): AnalyticsConfig[K] {
  const config = loadConfig();
  return config[key];
}

/**
 * Get default lookback days
 */
export function getDefaultLookbackDays(): number {
  return loadConfig().metrics.defaultLookbackDays;
}

/**
 * Get max events per export
 */
export function getMaxEventsPerExport(): number {
  return loadConfig().exports.maxEventsPerExport;
}

/**
 * Get default export format
 */
export function getDefaultExportFormat(): ExportFormat {
  return loadConfig().exports.defaultFormat;
}

/**
 * Reset cached config (useful for testing)
 */
export function resetConfigCache(): void {
  cachedConfig = null;
}
