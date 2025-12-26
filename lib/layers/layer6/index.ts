/**
 * Layer 6 - Job Discovery & Matching Module
 * Public API Exports
 *
 * This module exports the primary job discovery functions and types
 * for use by other layers and external consumers.
 */

// ==================== Main API Functions ====================

export {
  parseAndRankJob,
  getRankedJobs,
  compareJobsSideBySide,
  quickParseJob,
  parseJobText,
} from './job-discovery';

// ==================== Types ====================

// Core types
export type {
  JobCategory,
  JobPriority,
  ParseQuality,
  WorkArrangement,
  JobStatus,
  ScamRiskLevel,
  ImportanceLevel,
  JobSource,
} from './types';

// Input types
export type {
  UserPreferences,
  JobPasteRequest,
  JobMetadataInput,
  JobFilters,
} from './types';

// Parsed job types
export type {
  EvidenceSpan,
  ExtractedItem,
  SalaryRange,
  JobRequirements,
  JobMetadata,
  ParsedJob,
} from './types';

// Ranked job types
export type {
  ScorePenalty,
  ScoreBreakdown,
  CareerCapital,
  JobFlags,
  ScamDetectionResult,
  RankedJob,
} from './types';

// Result types
export type {
  JobListSummary,
  JobListResult,
  SkillsOverlap,
  ComparisonDetails,
  JobComparisonResult,
  Layer6ParseRankOutput,
  Layer6JobListOutput,
  Layer6ComparisonOutput,
} from './types';

// ==================== Validation Schemas ====================

export {
  JobPasteRequestSchema,
  UserPreferencesSchema,
  JobFiltersSchema,
  SalaryRangeSchema,
  JobMetadataInputSchema,
} from './types';

// ==================== Type Guards ====================

export {
  isValidJobCategory,
  isValidWorkArrangement,
  isValidJobStatus,
  isValidParseQuality,
} from './types';

// ==================== Error Handling ====================

export {
  JobDiscoveryError,
  JobDiscoveryErrorCode,
  ERROR_MESSAGES,
  createError,
  isJobDiscoveryError,
  getUserFriendlyError,
} from './errors';

// ==================== Parsing Utilities ====================

export {
  parseJobDescription,
  parseJobDescriptionWithFallback,
  generateCanonicalId,
  checkDuplicate,
  assessParseQuality,
} from './parsing';

export {
  extractMetadata,
  extractJobTitle,
  extractCompany,
  extractLocation,
  extractWorkArrangement,
  extractSalary,
} from './parsing';

export {
  extractRequirements,
  extractResponsibilities,
  extractBenefits,
  extractSkillsFromText,
  extractToolsFromText,
  extractYearsExperience,
  detectSeniority,
} from './parsing';

// ==================== Ranking Utilities ====================

export {
  rankJob,
  rankJobs,
  groupJobsByCategory,
  generateJobListResult,
  getTopRecommendations,
} from './ranking';

export {
  categorizeJob,
  categorizeByFitScore,
  shouldUserApply,
  checkHardConstraints,
} from './ranking';

export {
  calculateUrgencyScore,
  calculateFreshnessScore,
  calculatePreferenceMatch,
  calculateScoreBreakdown,
  determinePriority,
  determineJobFlags,
} from './ranking';

// ==================== Analysis Utilities ====================

export {
  getFitAnalysis,
  analyzeFitBatch,
  createMockFitAnalysis,
  calculateFitScoreFromGaps,
} from './analysis';

export {
  calculateCareerCapital,
  calculateBrandValue,
  calculateSkillGrowthPotential,
  calculateNetworkPotential,
  calculateCompCompetitiveness,
} from './analysis';

export {
  detectScamRisk,
  isScamJob,
} from './analysis';

// ==================== Comparison Utilities ====================

export {
  compareJobs,
  analyzeSkillsOverlap,
  getComparisonSummary,
} from './comparison';

// ==================== Configuration ====================

export {
  loadConfig,
  getParsingConfig,
  getRankingConfig,
  getCategorizationConfig,
  getCareerCapitalConfig,
  getScamDetectionConfig,
  getUrgencyConfig,
  getApplyDecisionConfig,
  getPriorityThresholds,
  getPerformanceTargets,
  getCategoryBonus,
  getCompanyTierScore,
  detectSeniorityFromText,
  detectSeniorityFromYears,
  isCuttingEdgeTech,
  isTechHub,
} from './config';
