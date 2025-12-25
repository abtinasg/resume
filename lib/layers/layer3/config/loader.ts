/**
 * Layer 3 - Execution Engine
 * Configuration Loader
 *
 * Loads and caches configuration files for the execution engine.
 */

import verbMappingData from './verb_mapping.json';
import fluffPhrasesData from './fluff_phrases.json';
import metricPatternsData from './metric_patterns.json';
import {
  Layer3Config,
  EvidenceScope,
  LLMConfig,
  RewriteThresholds,
  RewriteFeatureFlags,
} from '../types';

// ==================== Type Definitions ====================

/**
 * Verb mapping structure
 */
export interface VerbMapping {
  upgrades: string[];
  context_hints?: Record<string, string>;
}

/**
 * Fluff phrases configuration
 */
export interface FluffPhrasesConfig {
  fillers: string[];
  weak_descriptors: string[];
  redundant_phrases: string[];
  vague_phrases: string[];
  hype_words: string[];
  unnecessary_adverbs: string[];
  cliches: string[];
}

/**
 * Metric pattern definition
 */
export interface MetricPattern {
  pattern?: string;
  patterns?: string[];
  description: string;
  examples?: string[];
}

/**
 * Metric patterns configuration
 */
export interface MetricPatternsConfig {
  percentage: MetricPattern;
  dollar_amount: MetricPattern;
  number_with_users: MetricPattern;
  number_with_people: MetricPattern;
  multiplier: MetricPattern;
  time_saved: MetricPattern;
  time_duration: MetricPattern;
  quantity_with_unit: MetricPattern;
  scale_numbers: MetricPattern;
  range: MetricPattern;
  ratio: MetricPattern;
  performance_improvement: MetricPattern;
  revenue_profit: MetricPattern;
  implied_metrics: MetricPattern;
  scale_claims: MetricPattern;
}

// ==================== Cache ====================

let verbMappingCache: Record<string, VerbMapping> | null = null;
let fluffPhrasesCache: FluffPhrasesConfig | null = null;
let metricPatternsCache: MetricPatternsConfig | null = null;
let configCache: Layer3Config | null = null;

// ==================== Default Configuration ====================

/**
 * Default LLM configuration
 */
const DEFAULT_LLM_CONFIG: LLMConfig = {
  primary_model: 'gpt-4o-mini',
  fallback_model: 'gpt-3.5-turbo',
  temperature: 0.2,
  max_tokens: 250,
  max_retries: 2,
};

/**
 * Default thresholds
 */
const DEFAULT_THRESHOLDS: RewriteThresholds = {
  max_length_multiplier: 2.0,
  min_bullet_length: 20,
  max_bullet_length: 200,
  semantic_similarity_min: 0.78,
  evidence_overlap_threshold: 0.3,
};

/**
 * Default feature flags
 */
const DEFAULT_FEATURES: RewriteFeatureFlags = {
  evidence_anchored_rewrite: true,
  section_coherence_pass: true,
  meaning_shift_check: true,
  retry_on_validation_failure: true,
};

/**
 * Default full configuration
 */
const DEFAULT_CONFIG: Layer3Config = {
  version: '2.3',
  defaults: {
    evidence_scope: 'section' as EvidenceScope,
    allow_resume_enrichment: true,
  },
  llm: DEFAULT_LLM_CONFIG,
  thresholds: DEFAULT_THRESHOLDS,
  features: DEFAULT_FEATURES,
};

// ==================== Loaders ====================

/**
 * Load verb mappings
 */
export function loadVerbMappings(): Record<string, VerbMapping> {
  if (verbMappingCache) {
    return verbMappingCache;
  }

  verbMappingCache = verbMappingData as Record<string, VerbMapping>;
  return verbMappingCache;
}

/**
 * Load fluff phrases configuration
 */
export function loadFluffPhrases(): FluffPhrasesConfig {
  if (fluffPhrasesCache) {
    return fluffPhrasesCache;
  }

  fluffPhrasesCache = fluffPhrasesData as FluffPhrasesConfig;
  return fluffPhrasesCache;
}

/**
 * Load metric patterns configuration
 */
export function loadMetricPatterns(): MetricPatternsConfig {
  if (metricPatternsCache) {
    return metricPatternsCache;
  }

  metricPatternsCache = metricPatternsData as MetricPatternsConfig;
  return metricPatternsCache;
}

/**
 * Load full Layer 3 configuration
 */
export function loadConfig(): Layer3Config {
  if (configCache) {
    return configCache;
  }

  // Use defaults - can be extended to load from file/env
  configCache = { ...DEFAULT_CONFIG };
  return configCache;
}

// ==================== Getters ====================

/**
 * Get LLM configuration
 */
export function getLLMConfig(): LLMConfig {
  return loadConfig().llm;
}

/**
 * Get threshold configuration
 */
export function getThresholds(): RewriteThresholds {
  return loadConfig().thresholds;
}

/**
 * Get feature flags
 */
export function getFeatureFlags(): RewriteFeatureFlags {
  return loadConfig().features;
}

/**
 * Get default evidence scope
 */
export function getDefaultEvidenceScope(): EvidenceScope {
  return loadConfig().defaults.evidence_scope;
}

/**
 * Get default resume enrichment setting
 */
export function getDefaultAllowResumeEnrichment(): boolean {
  return loadConfig().defaults.allow_resume_enrichment;
}

// ==================== Helpers ====================

/**
 * Get all weak verbs that have mappings
 */
export function getWeakVerbs(): string[] {
  const mappings = loadVerbMappings();
  return Object.keys(mappings);
}

/**
 * Get upgrade suggestions for a weak verb
 */
export function getVerbUpgrades(weakVerb: string, context?: string): string[] {
  const mappings = loadVerbMappings();
  const mapping = mappings[weakVerb.toLowerCase()];

  if (!mapping) {
    return [];
  }

  // If context is provided and there's a context hint, use it
  if (context && mapping.context_hints) {
    for (const [hint, upgrade] of Object.entries(mapping.context_hints)) {
      if (context.toLowerCase().includes(hint)) {
        return [upgrade, ...mapping.upgrades.filter((u) => u !== upgrade)];
      }
    }
  }

  return mapping.upgrades;
}

/**
 * Get all fluff phrases (combined)
 */
export function getAllFluffPhrases(): string[] {
  const config = loadFluffPhrases();
  return [
    ...config.fillers,
    ...config.weak_descriptors,
    ...config.redundant_phrases,
    ...config.vague_phrases,
    ...config.hype_words,
    ...config.unnecessary_adverbs,
    ...config.cliches,
  ];
}

/**
 * Get metric regex patterns
 */
export function getMetricRegexPatterns(): RegExp[] {
  const config = loadMetricPatterns();
  const patterns: RegExp[] = [];

  // Add patterns from config that have regex pattern strings
  const patternKeys: (keyof MetricPatternsConfig)[] = [
    'percentage',
    'dollar_amount',
    'number_with_users',
    'number_with_people',
    'multiplier',
    'time_saved',
    'time_duration',
    'quantity_with_unit',
    'scale_numbers',
    'range',
    'ratio',
    'performance_improvement',
    'revenue_profit',
  ];

  for (const key of patternKeys) {
    const item = config[key];
    if (item.pattern) {
      try {
        patterns.push(new RegExp(item.pattern, 'gi'));
      } catch {
        // Skip invalid patterns
      }
    }
  }

  return patterns;
}

/**
 * Get implied metric phrases
 */
export function getImpliedMetricPhrases(): string[] {
  const config = loadMetricPatterns();
  return config.implied_metrics.patterns || [];
}

/**
 * Get scale claim phrases
 */
export function getScaleClaimPhrases(): string[] {
  const config = loadMetricPatterns();
  return config.scale_claims.patterns || [];
}

// ==================== Cache Management ====================

/**
 * Clear all configuration caches
 */
export function clearConfigCache(): void {
  verbMappingCache = null;
  fluffPhrasesCache = null;
  metricPatternsCache = null;
  configCache = null;
}

/**
 * Override configuration (for testing)
 */
export function overrideConfig(config: Partial<Layer3Config>): void {
  configCache = { ...DEFAULT_CONFIG, ...config };
}
