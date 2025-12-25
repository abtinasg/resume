/**
 * Layer 2 - Strategy Engine
 * Public API Exports
 *
 * This module exports the primary analysis functions and types
 * for use by other layers and external consumers.
 *
 * Layer 2 is the analytical layer that:
 * - Computes gap analyses (skills, tools, experience, seniority, industry)
 * - Computes an overall fit score (0-100) for the current target
 * - Recommends a strategy mode based on resume quality + pipeline signals + gaps
 * - Emits structured reasoning for downstream layers
 */

// ==================== Main Analysis Functions ====================

export {
  analyzeStrategy,
  analyzeStrategySync,
  analyzeQuick,
  analyzeGapsOnly,
} from './analyze';

// ==================== Types ====================

// Core types
export type {
  StrategyAnalysisRequest,
  StrategyAnalysisResult,
  GapAnalysis,
  ActionBlueprint,
  FitScoreBreakdown,
  ModeReasoning,
} from './types';

// Input types
export type {
  Layer1Evaluation,
  Layer1Extracted,
  Layer1IdentifiedGaps,
  Layer1AISummary,
  Layer1JDMatch,
  Layer4State,
  Layer4PipelineState,
  Layer4UserProfile,
  Layer4UserPreferences,
  JobContext,
  JobRequirements,
  StrategyHistoryEntry,
} from './types';

// Gap types
export type {
  SkillsGap,
  ToolsGap,
  ExperienceGap,
  SeniorityGap,
  IndustryGap,
  ExperienceType,
  SeniorityAlignment,
  ConfidenceLevel,
} from './types';

// Blueprint types
export type {
  BlueprintActionType,
  ActionEntities,
  ActionConstraints,
  PrimaryReason,
  SupportingFactor,
} from './types';

// Config types
export type {
  StrategyConfig,
  StrategyThresholds,
  FitWeights,
  ModeHysteresis,
  FeatureFlags,
  CapabilityTaxonomy,
} from './types';

// Re-export enums from shared
export { StrategyMode, ActionType, SeniorityLevel } from './types';

// Validation schemas
export {
  StrategyAnalysisRequestSchema,
  Layer1EvaluationSchema,
  Layer4StateSchema,
  JobContextSchema,
} from './types';

// Type guards
export {
  isValidExperienceType,
  isValidSeniorityAlignment,
  isValidConfidenceLevel,
  isValidBlueprintActionType,
  EXPERIENCE_TYPES,
} from './types';

// ==================== Error Handling ====================

export {
  StrategyAnalysisError,
  StrategyErrorCode,
  isStrategyAnalysisError,
  getUserFriendlyError,
  wrapError,
} from './errors';

// ==================== Gap Analysis (for advanced use) ====================

export {
  analyzeAllGaps,
  analyzeSkillsGapFromLayers,
  analyzeToolsGapFromLayers,
  analyzeExperienceGapFromLayers,
  analyzeSeniorityGapFromLayers,
  analyzeIndustryGapFromLayers,
  getCriticalGaps,
  calculateGapSeverity,
} from './gap-analysis';

// ==================== Strategy (for advanced use) ====================

export {
  calculateFitScore,
  getFitLevel,
  getFitRecommendations,
  selectMode,
  selectModeFromLayers,
  getModeName,
  getModeDescription,
  checkHysteresis,
  getDaysInCurrentMode,
} from './strategy';

// ==================== Normalization (for advanced use) ====================

export {
  canonicalize,
  canonicalizeAll,
  areEquivalent,
  findMatches,
  calculateMatchPercentage,
  isSkill,
  isTool,
  getCategory,
  classifyTerm,
  classifyTerms,
} from './normalization';

// ==================== Configuration (for customization) ====================

export {
  loadTaxonomy,
  loadStrategyConfig,
  getStrategyThresholds,
  getFitWeights,
  getSeniorityYearsMapping,
  getFeatureFlags,
  clearConfigCache,
} from './config';
