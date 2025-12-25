/**
 * Layer 3 - Execution Engine
 * Planning System Exports
 */

export {
  findWeakVerbs,
  findFirstWeakVerb,
  startsWithWeakVerb,
  suggestVerbUpgrade,
  suggestVerbUpgrades,
  getBestVerbForContext,
  hasWeakStartPattern,
  hasPassiveVoice,
  findPassiveVoicePhrases,
  isStrongVerb,
  extractFirstVerb,
  startsWithStrongVerb,
} from './verb-mapping';

export {
  detectMetrics,
  detectImpliedMetrics,
  detectScaleClaims,
  extractNumbers,
  extractAllNumbers,
  extractNumericValue,
  hasMetric,
  hasImpliedMetric,
  hasQuantifiableContent,
  findNewNumbers,
  findNewScaleClaims,
  type DetectedMetric,
  type MetricType,
} from './metric-detection';

export {
  detectFluff,
  hasFluff,
  hasFluffType,
  countFluff,
  removeFluff,
  getFluffRemovalSuggestions,
  detectFillers,
  detectVaguePhrases,
  detectHypeWords,
  detectCliches,
  type DetectedFluff,
  type FluffType,
} from './fluff-removal';

export {
  planMicroActions,
  createTenseAlignAction,
  getActionTypes,
  planHasAction,
  getVerbUpgradesFromPlan,
  getFluffTermsFromPlan,
  getToolsToSurfaceFromPlan,
  planRequiresTransformations,
  type PlanMicroActionsParams,
} from './micro-actions';
