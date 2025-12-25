/**
 * Layer 3 - Execution Engine
 * Configuration Exports
 */

export {
  loadVerbMappings,
  loadFluffPhrases,
  loadMetricPatterns,
  loadConfig,
  getLLMConfig,
  getThresholds,
  getFeatureFlags,
  getDefaultEvidenceScope,
  getDefaultAllowResumeEnrichment,
  getWeakVerbs,
  getVerbUpgrades,
  getAllFluffPhrases,
  getMetricRegexPatterns,
  getImpliedMetricPhrases,
  getScaleClaimPhrases,
  clearConfigCache,
  overrideConfig,
  type VerbMapping,
  type FluffPhrasesConfig,
  type MetricPattern,
  type MetricPatternsConfig,
} from './loader';

export {
  SYSTEM_PROMPT_BASE,
  SYSTEM_PROMPT_BULLET,
  SYSTEM_PROMPT_SUMMARY,
  SYSTEM_PROMPT_SECTION,
  USER_PROMPT_BULLET,
  USER_PROMPT_SUMMARY,
  USER_PROMPT_RETRY,
  GOOD_REWRITE_EXAMPLES,
  BAD_REWRITE_EXAMPLES,
  formatEvidenceLedgerForPrompt,
  formatTransformationsForPrompt,
  buildConstraintStrings,
  formatValidationErrorsForPrompt,
} from './prompts';
