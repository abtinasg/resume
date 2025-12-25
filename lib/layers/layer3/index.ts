/**
 * Layer 3 - Execution Engine
 * Public API Exports
 *
 * This module exports the primary rewrite functions and types
 * for use by other layers and external consumers.
 *
 * Layer 3 is the execution layer that:
 * - Rewrites resume content (bullets, summaries, sections)
 * - Enforces evidence-anchored validation (NO fabrication)
 * - Returns improved text with audit trail (evidence map)
 *
 * KEY INNOVATION: Evidence-Anchored Rewriting
 * Every claim in improved text must trace to source evidence.
 * This prevents fabrication and builds user trust.
 */

// ==================== Main Rewrite Functions ====================

export {
  rewrite,
  rewriteBullet,
  rewriteSummary,
  rewriteSection,
  quickRewriteBullet,
  canImprove,
  rewriteBulletsParallel,
  isBulletResult,
  isSummaryResult,
  isSectionResult,
} from './rewrite';

// ==================== Types ====================

// Core request/response types
export type {
  RewriteRequest,
  RewriteResult,
  BulletRewriteRequest,
  SummaryRewriteRequest,
  SectionRewriteRequest,
  BulletRewriteResult,
  SummaryRewriteResult,
  SectionRewriteResult,
} from './types';

// Evidence types
export type {
  EvidenceItem,
  EvidenceLedger,
  EvidenceMapItem,
  EvidenceMap,
  EvidenceScope,
  EvidenceType,
} from './types';

// Planning types
export type {
  MicroAction,
  MicroActionType,
  RewritePlan,
  RewriteGoal,
  RewriteConstraints,
} from './types';

// Validation types
export type {
  ValidationResult,
  ValidationItem,
  ValidationSeverity,
} from './types';

// Other types
export type {
  RewriteQualitySignals,
  UserInputRequest,
  ConfidenceLevel,
  SectionType,
  BulletContext,
  Layer1Signals,
  Layer2Signals,
  Layer3Config,
} from './types';

// Enums
export { ValidationCode, RewriteType, SeniorityLevel } from './types';

// Type guards
export {
  isBulletRequest,
  isSummaryRequest,
  isSectionRequest,
  validationPassed,
  isValidEvidenceScope,
  isValidConfidenceLevel,
} from './types';

// Validation schemas (for runtime validation)
export {
  RewriteRequestSchema,
  BulletRewriteRequestSchema,
  SummaryRewriteRequestSchema,
  SectionRewriteRequestSchema,
  EvidenceItemSchema,
  EvidenceMapItemSchema,
  ValidationResultSchema,
  BulletRewriteResultSchema,
  SummaryRewriteResultSchema,
  SectionRewriteResultSchema,
  RewriteResultSchema,
} from './types';

// ==================== Evidence System ====================

export {
  buildEvidenceLedger,
  buildSectionEvidenceLedger,
  buildSummaryEvidenceLedger,
  allowResumeEnrichmentInBullet,
  getEvidenceById,
  getEvidenceByType,
  getEvidenceBySource,
  getAllNormalizedTerms,
  termExistsInLedger,
  findEvidenceForTerm,
  createEvidenceMap,
  addEvidenceMapItem,
  createEvidenceMapItem,
  getAllReferencedEvidenceIds,
  getAllMappedSpans,
  isSpanMapped,
  findEvidenceIdsForSpan,
  validateEvidenceIdsExist,
  validateSpansExist,
  mergeEvidenceMaps,
  calculateEvidenceCoverage,
  formatEvidenceMap,
} from './evidence';

// ==================== Planning ====================

export {
  findWeakVerbs,
  findFirstWeakVerb,
  startsWithWeakVerb,
  suggestVerbUpgrade,
  suggestVerbUpgrades,
  getBestVerbForContext,
  hasWeakStartPattern,
  hasPassiveVoice,
  isStrongVerb,
  startsWithStrongVerb,
  detectMetrics,
  detectImpliedMetrics,
  detectScaleClaims,
  extractNumbers,
  hasMetric,
  hasImpliedMetric,
  hasQuantifiableContent,
  findNewNumbers,
  findNewScaleClaims,
  detectFluff,
  hasFluff,
  countFluff,
  removeFluff,
  getFluffRemovalSuggestions,
  planMicroActions,
  getActionTypes,
  planHasAction,
  getVerbUpgradesFromPlan,
  getFluffTermsFromPlan,
  getToolsToSurfaceFromPlan,
  planRequiresTransformations,
} from './planning';

// ==================== Generation ====================

export {
  isLLMAvailable,
  getModelConfig,
  estimateTokenCount,
  willPromptFit,
  getTemperatureForType,
  getTemperatureConfig,
  BULLET_TEMPERATURE,
  SECTION_TEMPERATURE,
  SUMMARY_TEMPERATURE,
} from './generation';

// ==================== Validation ====================

export {
  validateRewrite,
  validateEvidenceMap,
  extractTechTerms,
  getCriticalErrors,
  getWarnings,
  formatValidationResult,
  hasFabricationErrors,
  verifySemanticOverlap,
  calculateOverlapRatio,
  analyzeOverlap,
  jaccardSimilarity,
  overlapCoefficient,
} from './validation';

// ==================== Coherence ====================

export {
  detectBulletTense,
  detectDominantTense,
  unifyTense,
  unifyToDominant,
  hasConsistentTense,
  getInconsistentBullets,
  unifyFormatting,
  applyFullFormatting,
  applyFullFormattingToAll,
  makeATSSafe,
  makeAllATSSafe,
  rewriteSectionCoherent,
  rewriteSectionSync,
  hasVariedStarts,
} from './coherence';

// ==================== Configuration ====================

export {
  loadVerbMappings,
  loadFluffPhrases,
  loadMetricPatterns,
  loadConfig,
  getLLMConfig,
  getThresholds,
  getFeatureFlags,
  getDefaultEvidenceScope,
  getWeakVerbs,
  getVerbUpgrades,
  getAllFluffPhrases,
  getMetricRegexPatterns,
  clearConfigCache,
  overrideConfig,
} from './config';

// ==================== Error Handling ====================

export {
  ExecutionError,
  ExecutionErrorCode,
  ERROR_MESSAGES,
  createInvalidInputError,
  createValidationError,
  createEvidenceBuildError,
  createFabricationError,
  createLLMError,
  createMaxRetriesError,
  createInternalError,
  isExecutionError,
  isFabricationError,
  isRecoverableError,
  getUserFriendlyError,
  wrapError,
  handleError,
  logError,
} from './errors';
