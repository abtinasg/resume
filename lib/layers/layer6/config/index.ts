/**
 * Layer 6 - Job Discovery & Matching Module
 * Configuration Exports
 */

export {
  loadConfig,
  getParsingConfig,
  getRequirementsExtractionConfig,
  getSeniorityMappingsConfig,
  getRankingConfig,
  getCategorizationConfig,
  getCareerCapitalConfig,
  getScamDetectionConfig,
  getUrgencyConfig,
  getApplyDecisionConfig,
  getPriorityThresholds,
  getFreshnessConfig,
  getPerformanceTargets,
  getCategoryBonus,
  getCompanyTierScore,
  detectSeniorityFromText,
  detectSeniorityFromYears,
  isCuttingEdgeTech,
  isTechHub,
  getLocationMultiplier,
  getSalaryBenchmark,
  clearConfigCache,
} from './loader';

export type {
  JobParserConfig,
  ParsingConfig,
  RequirementsExtractionConfig,
  SeniorityMappingsConfig,
  RankingConfig,
  CategorizationConfig,
  CareerCapitalConfig,
  ScamDetectionConfig,
  UrgencyConfig,
} from './loader';
