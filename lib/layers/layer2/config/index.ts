/**
 * Layer 2 - Strategy Engine
 * Configuration Module Index
 *
 * Exports all configuration loading and access functions.
 */

export {
  // Taxonomy loading
  loadTaxonomy,
  getAllSkills,
  getAllTools,
  getSynonyms,
  getIndustryKeywords,

  // Strategy config loading
  loadStrategyConfig,
  getStrategyThresholds,
  getFitWeights,
  getSeniorityYearsMapping,
  getFeatureFlags,
  getSenioritySubscores,
  getPenaltyConfig,
  getExperienceKeywords,
  getSeniorityTitleKeywords,
  getLimitsConfig,

  // Cache management
  clearConfigCache,
  getCacheStatus,
} from './loader';
