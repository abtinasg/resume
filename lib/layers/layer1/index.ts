/**
 * Layer 1 - Evaluation Engine
 * Public API Exports
 *
 * This module exports the primary evaluation functions and types
 * for use by other layers and external consumers.
 */

// ==================== Main Evaluation Functions ====================

export {
  evaluate,
  evaluate_fit,
  getScore,
  getFitRecommendation,
  parseJobDescription,
} from './evaluate';

// ==================== Types ====================

// Core request/response types
export type {
  EvaluationRequest,
  FitEvaluationRequest,
  ResumeInput,
  EvaluationMetadata,
  JobDescriptionInput,
  ParsedJobRequirements,
} from './types';

// Result types
export type {
  EvaluationResult,
  FitScore,
  DimensionScore,
  DimensionScores,
  ExtractedEntities,
  GapAnalysis,
  EvaluationFeedback,
  EvaluationFlags,
  WeakBullet,
  QuickWin,
  ResumeLevel,
  RecommendationType,
} from './types';

// Parsed resume types
export type {
  ParsedResume,
  PersonalInfo,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  CertificationEntry,
  CourseEntry,
  DocumentMetadata,
} from './types';

// Gap analysis types
export type {
  SkillsGap,
  ToolsGap,
  ExperienceGap,
  SeniorityGap,
  IndustryGap,
  FitDimensions,
  FitFlags,
  PriorityImprovement,
} from './types';

// Validation schemas (for runtime validation)
export {
  EvaluationRequestSchema,
  FitEvaluationRequestSchema,
  ResumeInputSchema,
  JobDescriptionInputSchema,
  ParsedJobRequirementsSchema,
} from './types';

// Type guards
export { isFitScore, isValidSeniorityLevel } from './types';

// ==================== Error Handling ====================

export {
  EvaluationError,
  EvaluationErrorCode,
  ERROR_MESSAGES,
  createError,
  isEvaluationError,
  getUserFriendlyError,
} from './errors';

// ==================== Cache Management ====================

export {
  generateContentHash,
  getCachedScore,
  setCachedScore,
  invalidateCache,
  clearCache,
  getCacheStats,
} from './cache';

// ==================== Utility Exports ====================

// Scoring utilities (for advanced use cases)
export { analyzeBulletQuality } from './scoring/execution-impact';
export { normalizeTitle, inferSeniorityFromTitle } from './modules/entity-extraction';

// Configuration exports (for customization)
export { DIMENSION_WEIGHTS, FIT_WEIGHTS, SCORE_LEVELS, getLevel } from './config/weights';
export { normalizeSkill, normalizeSkills } from './config/skills';
export { detectToolsInText, normalizeTool } from './config/tools';
export { detectIndustries, getIndustryDisplayName } from './config/industries';
export { getCompanyIndustry, isFAANGCompany, isUnicornCompany } from './config/companies';

// ==================== Internal Exports (for Layer 2/3/4 integration) ====================

// Parser (for direct access if needed)
export { parseResume } from './parser';

// Entity extraction
export { extractEntities } from './modules/entity-extraction';

// Gap detection
export { detectGaps, summarizeGaps, detectGenericGaps } from './modules/gap-detection';

// Recommendation
export { getRecommendation, suggestAlternatives, estimatePotentialImprovement } from './modules/recommendation';
