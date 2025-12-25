/**
 * Layer 2 - Strategy Engine
 * Configuration Loader
 *
 * Loads and validates configuration files for the strategy engine.
 * Implements caching for performance.
 */

import type {
  StrategyConfig,
  CapabilityTaxonomy,
  StrategyThresholds,
  FitWeights,
  SeniorityYearsMapping,
  FeatureFlags,
} from '../types';
import { SeniorityLevel } from '../types';

// Import JSON files
import capabilityTaxonomyJson from './capability_taxonomy.json';
import strategyConfigJson from './strategy_config.json';

// ==================== Cached Configurations ====================

let cachedTaxonomy: CapabilityTaxonomy | null = null;
let cachedConfig: StrategyConfig | null = null;

// ==================== Type Assertions for JSON Imports ====================

interface RawStrategyConfig {
  analysis_version: string;
  strategy_thresholds: {
    resume_score_min: number;
    application_volume_test: number;
    interview_rate_min: number;
    mode_hysteresis: {
      resume_score_buffer: number;
      min_days_in_mode: number;
    };
  };
  fit_weights: {
    skills: number;
    tools: number;
    experience: number;
    industry: number;
    seniority: number;
  };
  seniority_years_mapping: Array<{
    max_years_exclusive: number;
    level: string;
  }>;
  features: {
    semantic_matching: boolean;
    skill_strength_scoring: boolean;
    roadmap_generation: boolean;
    ml_mode_selection: boolean;
    confidence_intervals: boolean;
  };
  seniority_subscores?: {
    aligned: number;
    underqualified: number;
    overqualified: number;
  };
  penalty_config?: {
    critical_missing_skills_penalty_per_item: number;
    critical_missing_skills_max_penalty: number;
    critical_missing_tools_penalty_per_item: number;
    critical_missing_tools_max_penalty: number;
  };
  experience_keywords?: Record<string, string[]>;
  seniority_title_keywords?: Record<string, string[]>;
  limits?: {
    max_priority_actions: number;
    max_action_blueprints: number;
    max_key_insights: number;
    min_priority_actions: number;
    min_action_blueprints: number;
    min_key_insights: number;
    skill_spam_threshold: number;
  };
}

interface RawTaxonomy {
  skills: Record<string, string[]>;
  tools: Record<string, string[]>;
  synonyms: Record<string, string>;
  industry_keywords?: Record<string, string[]>;
}

// ==================== Taxonomy Loading ====================

/**
 * Load the capability taxonomy
 * @returns Loaded and validated taxonomy
 */
export function loadTaxonomy(): CapabilityTaxonomy {
  if (cachedTaxonomy) {
    return cachedTaxonomy;
  }

  const rawTaxonomy = capabilityTaxonomyJson as RawTaxonomy;

  // Validate structure
  if (!rawTaxonomy.skills || typeof rawTaxonomy.skills !== 'object') {
    throw new Error('Invalid taxonomy: missing skills');
  }
  if (!rawTaxonomy.tools || typeof rawTaxonomy.tools !== 'object') {
    throw new Error('Invalid taxonomy: missing tools');
  }
  if (!rawTaxonomy.synonyms || typeof rawTaxonomy.synonyms !== 'object') {
    throw new Error('Invalid taxonomy: missing synonyms');
  }

  cachedTaxonomy = {
    skills: rawTaxonomy.skills,
    tools: rawTaxonomy.tools,
    synonyms: rawTaxonomy.synonyms,
  };

  return cachedTaxonomy;
}

/**
 * Get all skills as a flat array
 * @returns Array of all skill names (lowercase)
 */
export function getAllSkills(): string[] {
  const taxonomy = loadTaxonomy();
  const skills: string[] = [];

  for (const category of Object.values(taxonomy.skills)) {
    skills.push(...category);
  }

  return skills;
}

/**
 * Get all tools as a flat array
 * @returns Array of all tool names (lowercase)
 */
export function getAllTools(): string[] {
  const taxonomy = loadTaxonomy();
  const tools: string[] = [];

  for (const category of Object.values(taxonomy.tools)) {
    tools.push(...category);
  }

  return tools;
}

/**
 * Get synonyms map
 * @returns Synonym mappings
 */
export function getSynonyms(): Record<string, string> {
  const taxonomy = loadTaxonomy();
  return taxonomy.synonyms;
}

/**
 * Get industry keywords from taxonomy
 * @returns Industry keyword mappings
 */
export function getIndustryKeywords(): Record<string, string[]> {
  const rawTaxonomy = capabilityTaxonomyJson as RawTaxonomy;
  return rawTaxonomy.industry_keywords ?? {};
}

// ==================== Strategy Config Loading ====================

/**
 * Load the strategy configuration
 * @returns Loaded and validated strategy config
 */
export function loadStrategyConfig(): StrategyConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawConfig = strategyConfigJson as RawStrategyConfig;

  // Validate and transform
  const thresholds: StrategyThresholds = {
    resume_score_min: rawConfig.strategy_thresholds.resume_score_min,
    application_volume_test: rawConfig.strategy_thresholds.application_volume_test,
    interview_rate_min: rawConfig.strategy_thresholds.interview_rate_min,
    mode_hysteresis: {
      resume_score_buffer: rawConfig.strategy_thresholds.mode_hysteresis.resume_score_buffer,
      min_days_in_mode: rawConfig.strategy_thresholds.mode_hysteresis.min_days_in_mode,
    },
  };

  const weights: FitWeights = {
    skills: rawConfig.fit_weights.skills,
    tools: rawConfig.fit_weights.tools,
    experience: rawConfig.fit_weights.experience,
    industry: rawConfig.fit_weights.industry,
    seniority: rawConfig.fit_weights.seniority,
  };

  // Validate weights sum to 1
  const weightSum = weights.skills + weights.tools + weights.experience + weights.industry + weights.seniority;
  if (Math.abs(weightSum - 1.0) > 0.001) {
    console.warn(`Fit weights sum to ${weightSum}, expected 1.0`);
  }

  const seniorityMapping: SeniorityYearsMapping[] = rawConfig.seniority_years_mapping.map((entry) => ({
    max_years_exclusive: entry.max_years_exclusive,
    level: entry.level as SeniorityLevel,
  }));

  const features: FeatureFlags = {
    semantic_matching: rawConfig.features.semantic_matching,
    skill_strength_scoring: rawConfig.features.skill_strength_scoring,
    roadmap_generation: rawConfig.features.roadmap_generation,
    ml_mode_selection: rawConfig.features.ml_mode_selection,
    confidence_intervals: rawConfig.features.confidence_intervals,
  };

  cachedConfig = {
    analysis_version: rawConfig.analysis_version,
    strategy_thresholds: thresholds,
    fit_weights: weights,
    seniority_years_mapping: seniorityMapping,
    features,
  };

  return cachedConfig;
}

/**
 * Get strategy thresholds
 * @returns Strategy threshold configuration
 */
export function getStrategyThresholds(): StrategyThresholds {
  return loadStrategyConfig().strategy_thresholds;
}

/**
 * Get fit weights
 * @returns Fit weight configuration
 */
export function getFitWeights(): FitWeights {
  return loadStrategyConfig().fit_weights;
}

/**
 * Get seniority years mapping
 * @returns Seniority years mapping
 */
export function getSeniorityYearsMapping(): SeniorityYearsMapping[] {
  return loadStrategyConfig().seniority_years_mapping;
}

/**
 * Get feature flags
 * @returns Feature flag configuration
 */
export function getFeatureFlags(): FeatureFlags {
  return loadStrategyConfig().features;
}

/**
 * Get seniority subscores
 * @returns Seniority alignment subscores
 */
export function getSenioritySubscores(): { aligned: number; underqualified: number; overqualified: number } {
  const rawConfig = strategyConfigJson as RawStrategyConfig;
  return rawConfig.seniority_subscores ?? {
    aligned: 100,
    underqualified: 70,
    overqualified: 80,
  };
}

/**
 * Get penalty configuration
 * @returns Penalty configuration
 */
export function getPenaltyConfig(): {
  critical_missing_skills_penalty_per_item: number;
  critical_missing_skills_max_penalty: number;
  critical_missing_tools_penalty_per_item: number;
  critical_missing_tools_max_penalty: number;
} {
  const rawConfig = strategyConfigJson as RawStrategyConfig;
  return rawConfig.penalty_config ?? {
    critical_missing_skills_penalty_per_item: 5,
    critical_missing_skills_max_penalty: 20,
    critical_missing_tools_penalty_per_item: 3,
    critical_missing_tools_max_penalty: 15,
  };
}

/**
 * Get experience detection keywords
 * @returns Experience type to keywords mapping
 */
export function getExperienceKeywords(): Record<string, string[]> {
  const rawConfig = strategyConfigJson as RawStrategyConfig;
  return rawConfig.experience_keywords ?? {};
}

/**
 * Get seniority title keywords
 * @returns Seniority level to title keywords mapping
 */
export function getSeniorityTitleKeywords(): Record<string, string[]> {
  const rawConfig = strategyConfigJson as RawStrategyConfig;
  return rawConfig.seniority_title_keywords ?? {};
}

/**
 * Get limits configuration
 * @returns Limits configuration
 */
export function getLimitsConfig(): {
  max_priority_actions: number;
  max_action_blueprints: number;
  max_key_insights: number;
  min_priority_actions: number;
  min_action_blueprints: number;
  min_key_insights: number;
  skill_spam_threshold: number;
} {
  const rawConfig = strategyConfigJson as RawStrategyConfig;
  return rawConfig.limits ?? {
    max_priority_actions: 5,
    max_action_blueprints: 7,
    max_key_insights: 7,
    min_priority_actions: 3,
    min_action_blueprints: 3,
    min_key_insights: 3,
    skill_spam_threshold: 60,
  };
}

// ==================== Cache Management ====================

/**
 * Clear the configuration cache
 * Useful for testing or hot-reloading
 */
export function clearConfigCache(): void {
  cachedTaxonomy = null;
  cachedConfig = null;
}

/**
 * Check if configurations are cached
 * @returns Object with cache status
 */
export function getCacheStatus(): { taxonomy: boolean; config: boolean } {
  return {
    taxonomy: cachedTaxonomy !== null,
    config: cachedConfig !== null,
  };
}
