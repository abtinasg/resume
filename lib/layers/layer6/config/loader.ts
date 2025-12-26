/**
 * Layer 6 - Job Discovery & Matching Module
 * Configuration Loader
 *
 * Loads and validates configuration for job parsing, ranking, and analysis.
 */

import { z } from 'zod';
import { SeniorityLevel } from '../../shared/types';
import type { WorkArrangement, JobCategory } from '../types';

// Import the config file
import configData from './job_parser_config.json';

// ==================== Configuration Schemas ====================

const ParsingConfigSchema = z.object({
  min_length: z.number().min(1),
  max_length: z.number().min(1),
  quality_thresholds: z.object({
    high: z.object({
      min_words: z.number().min(1),
      has_requirements: z.boolean(),
      has_responsibilities: z.boolean(),
    }),
    medium: z.object({
      min_words: z.number().min(1),
      has_requirements: z.boolean(),
    }),
    low: z.object({
      min_words: z.number().min(1),
    }),
  }),
});

const RequirementsExtractionConfigSchema = z.object({
  required_keywords: z.array(z.string()),
  preferred_keywords: z.array(z.string()),
  skill_section_keywords: z.array(z.string()),
  responsibility_section_keywords: z.array(z.string()),
});

const SeniorityMappingSchema = z.object({
  keywords: z.array(z.string()),
  min_years: z.number().optional(),
  max_years: z.number().optional(),
});

const SeniorityMappingsConfigSchema = z.object({
  entry: SeniorityMappingSchema,
  mid: SeniorityMappingSchema,
  senior: SeniorityMappingSchema,
  lead: SeniorityMappingSchema,
});

const RankingConfigSchema = z.object({
  weights: z.object({
    fit_score: z.number().min(0).max(1),
    preference_match: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1),
    category_bonus: z.number().min(0).max(1),
    urgency: z.number().min(0).max(1),
  }),
  category_bonuses: z.object({
    reach: z.number(),
    target: z.number(),
    safety: z.number(),
    avoid: z.number(),
  }),
  priority_bonuses: z.object({
    dream_job: z.number(),
    new: z.number(),
  }),
  priority_penalties: z.object({
    scam_risk: z.number(),
  }),
});

const CategorizationConfigSchema = z.object({
  thresholds: z.object({
    safety: z.object({
      min_fit: z.number(),
      max_fit: z.number(),
      alignment: z.array(z.string()),
      max_critical_missing: z.number(),
    }),
    target: z.object({
      min_fit: z.number(),
      max_fit: z.number(),
      alignment: z.array(z.string()),
      max_critical_missing: z.number(),
      max_gap_years: z.number(),
    }),
    reach: z.object({
      min_fit: z.number(),
      max_fit: z.number(),
      alignment: z.array(z.string()),
      max_critical_missing: z.number(),
      max_gap_years: z.number(),
    }),
    avoid: z.object({
      max_fit: z.number(),
      max_critical_missing: z.number(),
    }),
  }),
});

const CareerCapitalConfigSchema = z.object({
  weights: z.object({
    brand: z.number().min(0).max(1),
    skill_growth: z.number().min(0).max(1),
    network: z.number().min(0).max(1),
    compensation: z.number().min(0).max(1),
  }),
  company_tiers: z.object({
    tier1: z.array(z.string()),
    tier2: z.array(z.string()),
    tier3: z.array(z.string()),
  }),
  tier_scores: z.object({
    tier1: z.number(),
    tier2: z.number(),
    tier3: z.number(),
    unknown: z.number(),
  }),
  cutting_edge_tech: z.array(z.string()),
  tech_hub_locations: z.array(z.string()),
  salary_benchmarks: z.record(z.string(), z.number()),
  location_multipliers: z.record(z.string(), z.number()),
});

const ScamDetectionConfigSchema = z.object({
  red_flags: z.object({
    suspicious_keywords: z.array(z.string()),
    unrealistic_salary_threshold: z.number(),
    min_jd_length: z.number(),
    no_company_weight: z.number(),
    short_jd_weight: z.number(),
    unrealistic_salary_weight: z.number(),
    suspicious_keywords_weight: z.number(),
    no_requirements_weight: z.number(),
    vague_title_weight: z.number(),
    excessive_punctuation_weight: z.number(),
    urgency_pressure_weight: z.number(),
    personal_info_request_weight: z.number(),
    scam_threshold: z.number(),
    high_risk_threshold_offset: z.number(),
  }),
});

const UrgencyConfigSchema = z.object({
  deadline_scores: z.record(z.string(), z.number()),
  recency_scores: z.record(z.string(), z.number()),
  weights: z.object({
    deadline: z.number().min(0).max(1),
    recency: z.number().min(0).max(1),
  }),
});

const ConfigSchema = z.object({
  parsing: ParsingConfigSchema,
  requirements_extraction: RequirementsExtractionConfigSchema,
  seniority_mappings: SeniorityMappingsConfigSchema,
  ranking: RankingConfigSchema,
  categorization: CategorizationConfigSchema,
  career_capital: CareerCapitalConfigSchema,
  scam_detection: ScamDetectionConfigSchema,
  urgency: UrgencyConfigSchema,
  apply_decision: z.object({
    min_fit_any: z.number(),
    min_fit_reach: z.number(),
    min_fit_target: z.number(),
    min_fit_safety: z.number(),
  }),
  priority_thresholds: z.object({
    high: z.number(),
    medium: z.number(),
  }),
  freshness: z.object({
    new_job_days: z.number(),
  }),
  performance_targets: z.object({
    parse_single_job_ms: z.number(),
    rank_10_jobs_ms: z.number(),
    compare_5_jobs_ms: z.number(),
  }),
});

// ==================== Type Exports ====================

export type JobParserConfig = z.infer<typeof ConfigSchema>;
export type ParsingConfig = z.infer<typeof ParsingConfigSchema>;
export type RequirementsExtractionConfig = z.infer<typeof RequirementsExtractionConfigSchema>;
export type SeniorityMappingsConfig = z.infer<typeof SeniorityMappingsConfigSchema>;
export type RankingConfig = z.infer<typeof RankingConfigSchema>;
export type CategorizationConfig = z.infer<typeof CategorizationConfigSchema>;
export type CareerCapitalConfig = z.infer<typeof CareerCapitalConfigSchema>;
export type ScamDetectionConfig = z.infer<typeof ScamDetectionConfigSchema>;
export type UrgencyConfig = z.infer<typeof UrgencyConfigSchema>;

// ==================== Cached Configuration ====================

let cachedConfig: JobParserConfig | null = null;

/**
 * Load and validate configuration
 * Caches the result for performance
 */
export function loadConfig(): JobParserConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = ConfigSchema.safeParse(configData);

  if (!result.success) {
    console.error('[Layer6] Configuration validation failed:', result.error.errors);
    throw new Error(
      `Invalid job parser configuration: ${result.error.errors.map(e => e.message).join(', ')}`
    );
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/**
 * Get parsing configuration
 */
export function getParsingConfig(): ParsingConfig {
  return loadConfig().parsing;
}

/**
 * Get requirements extraction configuration
 */
export function getRequirementsExtractionConfig(): RequirementsExtractionConfig {
  return loadConfig().requirements_extraction;
}

/**
 * Get seniority mappings configuration
 */
export function getSeniorityMappingsConfig(): SeniorityMappingsConfig {
  return loadConfig().seniority_mappings;
}

/**
 * Get ranking configuration
 */
export function getRankingConfig(): RankingConfig {
  return loadConfig().ranking;
}

/**
 * Get categorization configuration
 */
export function getCategorizationConfig(): CategorizationConfig {
  return loadConfig().categorization;
}

/**
 * Get career capital configuration
 */
export function getCareerCapitalConfig(): CareerCapitalConfig {
  return loadConfig().career_capital;
}

/**
 * Get scam detection configuration
 */
export function getScamDetectionConfig(): ScamDetectionConfig {
  return loadConfig().scam_detection;
}

/**
 * Get urgency configuration
 */
export function getUrgencyConfig(): UrgencyConfig {
  return loadConfig().urgency;
}

/**
 * Get apply decision thresholds
 */
export function getApplyDecisionConfig(): {
  min_fit_any: number;
  min_fit_reach: number;
  min_fit_target: number;
  min_fit_safety: number;
} {
  return loadConfig().apply_decision;
}

/**
 * Get priority thresholds
 */
export function getPriorityThresholds(): { high: number; medium: number } {
  return loadConfig().priority_thresholds;
}

/**
 * Get freshness configuration
 */
export function getFreshnessConfig(): { new_job_days: number } {
  return loadConfig().freshness;
}

/**
 * Get performance targets
 */
export function getPerformanceTargets(): {
  parse_single_job_ms: number;
  rank_10_jobs_ms: number;
  compare_5_jobs_ms: number;
} {
  return loadConfig().performance_targets;
}

// ==================== Helper Functions ====================

/**
 * Get category bonus for a job category
 */
export function getCategoryBonus(category: JobCategory): number {
  const config = getRankingConfig();
  return config.category_bonuses[category] ?? 0;
}

/**
 * Get company tier score
 */
export function getCompanyTierScore(company: string): number {
  const config = getCareerCapitalConfig();
  const companyLower = company.toLowerCase();

  if (config.company_tiers.tier1.some(t => companyLower.includes(t))) {
    return config.tier_scores.tier1;
  }
  if (config.company_tiers.tier2.some(t => companyLower.includes(t))) {
    return config.tier_scores.tier2;
  }
  // Note: tier3 contains generic keywords that need different matching
  return config.tier_scores.unknown;
}

/**
 * Detect seniority level from text
 */
export function detectSeniorityFromText(text: string): SeniorityLevel {
  const config = getSeniorityMappingsConfig();
  const textLower = text.toLowerCase();

  // Check from highest to lowest
  const levels: Array<{ level: SeniorityLevel; keywords: string[] }> = [
    { level: SeniorityLevel.LEAD, keywords: config.lead.keywords },
    { level: SeniorityLevel.SENIOR, keywords: config.senior.keywords },
    { level: SeniorityLevel.MID, keywords: config.mid.keywords },
    { level: SeniorityLevel.ENTRY, keywords: config.entry.keywords },
  ];

  for (const { level, keywords } of levels) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return level;
    }
  }

  // Default to mid if no indicators
  return SeniorityLevel.MID;
}

/**
 * Detect seniority level from years of experience
 */
export function detectSeniorityFromYears(years: number): SeniorityLevel {
  const config = getSeniorityMappingsConfig();

  if (years >= (config.lead.min_years ?? 8)) {
    return SeniorityLevel.LEAD;
  }
  if (years >= (config.senior.min_years ?? 5)) {
    return SeniorityLevel.SENIOR;
  }
  if (years >= (config.mid.min_years ?? 2)) {
    return SeniorityLevel.MID;
  }
  return SeniorityLevel.ENTRY;
}

/**
 * Check if technology is cutting edge
 */
export function isCuttingEdgeTech(tech: string): boolean {
  const config = getCareerCapitalConfig();
  const techLower = tech.toLowerCase();
  return config.cutting_edge_tech.some(t => techLower.includes(t));
}

/**
 * Check if location is a tech hub
 */
export function isTechHub(location: string): boolean {
  const config = getCareerCapitalConfig();
  const locationLower = location.toLowerCase();
  return config.tech_hub_locations.some(hub => locationLower.includes(hub));
}

/**
 * Get location salary multiplier
 */
export function getLocationMultiplier(location: string): number {
  const config = getCareerCapitalConfig();
  const locationLower = location.toLowerCase();

  for (const [loc, multiplier] of Object.entries(config.location_multipliers)) {
    if (loc !== 'default' && locationLower.includes(loc)) {
      return multiplier;
    }
  }

  return config.location_multipliers.default;
}

/**
 * Get salary benchmark for years of experience
 */
export function getSalaryBenchmark(yearsExperience: number): number {
  const config = getCareerCapitalConfig();
  const benchmarks = Object.entries(config.salary_benchmarks)
    .map(([years, salary]) => ({ years: parseInt(years, 10), salary }))
    .sort((a, b) => b.years - a.years);

  for (const { years, salary } of benchmarks) {
    if (yearsExperience >= years) {
      return salary;
    }
  }

  return benchmarks[benchmarks.length - 1]?.salary ?? 80000;
}

/**
 * Clear cached configuration (for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}
