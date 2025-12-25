/**
 * Layer 2 - Strategy Engine
 * Type Definitions v2.1
 *
 * This module defines all TypeScript types and interfaces for the strategy engine.
 * It supports gap analysis, fit scoring, strategy mode selection, and action blueprints.
 *
 * Based on: Layer_2_Strategy_Engine_v2.1.md (PART I - MVP)
 */

import { z } from 'zod';
import { StrategyMode, ActionType, SeniorityLevel } from '../shared/types';

// ==================== Re-exports for Convenience ====================

export { StrategyMode, ActionType, SeniorityLevel };

// ==================== Confidence Levels ====================

/**
 * Confidence level for analysis results
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// ==================== Experience Types ====================

/**
 * Types of experience for gap analysis
 * Defined in spec Section 4.3
 */
export type ExperienceType =
  | 'leadership'
  | 'cross_functional'
  | 'project_management'
  | 'stakeholder_management'
  | 'customer_facing'
  | 'data_driven'
  | 'architecture_system_design'
  | 'shipping_ownership'
  | 'mentorship'
  | 'process_improvement';

/**
 * All valid experience types as an array (for validation)
 */
export const EXPERIENCE_TYPES: ExperienceType[] = [
  'leadership',
  'cross_functional',
  'project_management',
  'stakeholder_management',
  'customer_facing',
  'data_driven',
  'architecture_system_design',
  'shipping_ownership',
  'mentorship',
  'process_improvement',
];

// ==================== Seniority Alignment ====================

/**
 * Seniority alignment status
 */
export type SeniorityAlignment = 'underqualified' | 'aligned' | 'overqualified';

// ==================== Input Interfaces ====================

/**
 * Extracted data from Layer 1 evaluation
 * Required for Layer 2 analysis
 */
export interface Layer1Extracted {
  /** Normalized skill names */
  skills: string[];
  /** Technology/tool names */
  tools: string[];
  /** Job titles from experience (ordered most-recent first) */
  titles: string[];
  /** Inferred industries */
  industries?: string[];
  /** Sample bullets for experience analysis */
  bullets_sample?: string[];
}

/**
 * Identified gaps from Layer 1
 */
export interface Layer1IdentifiedGaps {
  /** Number of weak bullets */
  weak_bullets: number;
  /** Missing skills (role-based generic gaps) */
  missing_skills: string[];
  /** Whether experience descriptions are vague */
  vague_experience: boolean;
}

/**
 * Optional AI summary from Layer 1
 */
export interface Layer1AISummary {
  /** Seniority level detected by AI */
  seniority_level?: SeniorityLevel;
  /** Confidence in seniority detection */
  seniority_confidence?: ConfidenceLevel;
}

/**
 * Optional JD match results from Layer 1
 */
export interface Layer1JDMatch {
  /** Match score (0-100) */
  match_score: number;
  /** Critical missing keywords/skills */
  missing_critical: string[];
  /** Underrepresented keywords */
  underrepresented: string[];
  /** Irrelevant content */
  irrelevant: string[];
}

/**
 * Input from Layer 1 (Evaluation Engine)
 */
export interface Layer1Evaluation {
  /** Main resume score (0-100) */
  resume_score: number;
  /** Content quality score (0-100) */
  content_quality_score: number;
  /** ATS compatibility score (0-100) */
  ats_compatibility_score: number;
  /** List of weakness codes */
  weaknesses: string[];
  /** Identified gaps */
  identified_gaps: Layer1IdentifiedGaps;
  /** Extracted entities */
  extracted: Layer1Extracted;
  /** Optional JD match (if Layer 1 ran JD matching) */
  jd_match?: Layer1JDMatch;
  /** Optional AI summary (if Layer 1 ran LLM insights) */
  ai_summary?: Layer1AISummary;
}

/**
 * Pipeline state from Layer 4
 */
export interface Layer4PipelineState {
  /** Total applications submitted */
  total_applications: number;
  /** Applications in last 7 days */
  applications_last_7_days: number;
  /** Applications in last 30 days */
  applications_last_30_days: number;
  /** Number of interview requests */
  interview_requests: number;
  /** Interview rate (interviews / applications, 0-1) */
  interview_rate: number;
  /** Number of offers */
  offers: number;
  /** Number of rejections */
  rejections: number;
}

/**
 * User preferences from Layer 4
 */
export interface Layer4UserPreferences {
  /** Work arrangement preferences */
  work_arrangement?: string[];
  /** Preferred locations */
  locations?: string[];
  /** Minimum salary expectation */
  salary_minimum?: number;
  /** Industries to exclude */
  excluded_industries?: string[];
}

/**
 * User profile from Layer 4
 */
export interface Layer4UserProfile {
  /** Target roles */
  target_roles: string[];
  /** Target seniority level */
  target_seniority?: SeniorityLevel;
  /** Years of experience */
  years_experience?: number;
  /** User preferences */
  preferences?: Layer4UserPreferences;
  /** Weekly application target */
  weekly_target?: number;
}

/**
 * Strategy history entry
 */
export interface StrategyHistoryEntry {
  /** Previous mode */
  from: StrategyMode;
  /** New mode */
  to: StrategyMode;
  /** ISO date when changed */
  changed_at: string;
  /** Reason for change */
  reason: string;
}

/**
 * Input from Layer 4 (Memory & State)
 */
export interface Layer4State {
  /** Pipeline/application state */
  pipeline_state: Layer4PipelineState;
  /** User profile information */
  user_profile: Layer4UserProfile;
  /** Current strategy mode (if set) */
  current_strategy_mode?: StrategyMode | null;
  /** Strategy change history */
  strategy_history?: StrategyHistoryEntry[];
  /** When the current mode was activated */
  mode_activated_at?: string;
}

/**
 * Job requirements from external source (optional)
 */
export interface JobRequirements {
  /** Required skills */
  required_skills: string[];
  /** Preferred/nice-to-have skills */
  preferred_skills?: string[];
  /** Required tools */
  required_tools: string[];
  /** Preferred tools */
  preferred_tools?: string[];
  /** Expected seniority level */
  seniority_expected?: SeniorityLevel;
  /** Domain-specific keywords */
  domain_keywords?: string[];
  /** Keyword importance mapping */
  keyword_importance?: Record<string, 'critical' | 'important' | 'nice'>;
}

/**
 * Optional job context for analysis
 */
export interface JobContext {
  /** Raw job description text */
  job_description?: string;
  /** Parsed job requirements */
  job_requirements?: JobRequirements;
}

/**
 * Main input for strategy analysis
 */
export interface StrategyAnalysisRequest {
  /** Layer 1 evaluation results */
  layer1_evaluation: Layer1Evaluation;
  /** Layer 4 state data */
  layer4_state: Layer4State;
  /** Optional job context */
  job_context?: JobContext;
}

// ==================== Gap Analysis Output Interfaces ====================

/**
 * Skills gap analysis result
 */
export interface SkillsGap {
  /** Skills that matched requirements */
  matched: string[];
  /** Critical skills missing from resume */
  critical_missing: string[];
  /** Nice-to-have skills missing */
  nice_to_have_missing?: string[];
  /** Match percentage (0-100) */
  match_percentage: number;
  /** Confidence in analysis */
  confidence: ConfidenceLevel;
}

/**
 * Tools gap analysis result
 */
export interface ToolsGap {
  /** Tools that matched requirements */
  matched: string[];
  /** Critical tools missing */
  critical_missing: string[];
  /** Nice-to-have tools missing */
  nice_to_have_missing?: string[];
  /** Match percentage (0-100) */
  match_percentage: number;
  /** Confidence in analysis */
  confidence: ConfidenceLevel;
}

/**
 * Experience gap analysis result
 */
export interface ExperienceGap {
  /** Experience types present */
  present_types: ExperienceType[];
  /** Experience types missing */
  missing_types: ExperienceType[];
  /** Coverage score (0-100) */
  coverage_score: number;
  /** Confidence in analysis */
  confidence: ConfidenceLevel;
}

/**
 * Seniority gap analysis result
 */
export interface SeniorityGap {
  /** User's detected seniority level */
  user_level: SeniorityLevel;
  /** Role's expected seniority level */
  role_expected: SeniorityLevel;
  /** Alignment status */
  alignment: SeniorityAlignment;
  /** Years gap if misaligned */
  gap_years?: number;
  /** Confidence in analysis */
  confidence: ConfidenceLevel;
  /** Additional flags (e.g., title/years mismatch) */
  flags?: string[];
}

/**
 * Industry gap analysis result
 */
export interface IndustryGap {
  /** Industry keywords matched */
  keywords_matched: string[];
  /** Industry keywords missing */
  keywords_missing: string[];
  /** Match percentage (0-100) */
  match_percentage: number;
  /** Confidence in analysis */
  confidence: ConfidenceLevel;
}

/**
 * Complete gap analysis structure
 */
export interface GapAnalysis {
  /** Skills gap */
  skills: SkillsGap;
  /** Tools gap */
  tools: ToolsGap;
  /** Experience gap */
  experience: ExperienceGap;
  /** Seniority gap */
  seniority: SeniorityGap;
  /** Industry gap */
  industry: IndustryGap;
}

// ==================== Fit Score Interfaces ====================

/**
 * Fit score breakdown by dimension
 */
export interface FitScoreBreakdown {
  /** Skills dimension score (0-100) */
  skills_score: number;
  /** Tools dimension score (0-100) */
  tools_score: number;
  /** Experience dimension score (0-100) */
  experience_score: number;
  /** Industry dimension score (0-100) */
  industry_score: number;
  /** Seniority dimension score (0-100) */
  seniority_score: number;
  /** Penalties applied */
  penalties: number;
  /** Weight-adjusted final score before penalties */
  weighted_score: number;
}

// ==================== Strategy Mode Interfaces ====================

/**
 * Primary reasons for mode selection
 */
export type PrimaryReason =
  | 'resume_below_threshold'
  | 'low_interview_rate_after_volume'
  | 'healthy_state_default';

/**
 * Supporting factors for mode selection
 */
export type SupportingFactor =
  | 'critical_missing_skills'
  | 'critical_missing_tools'
  | 'seniority_mismatch'
  | 'industry_mismatch'
  | 'weak_bullets_high'
  | 'vague_experience_flag';

/**
 * Mode reasoning structure
 */
export interface ModeReasoning {
  /** Primary reason for the recommendation */
  primary_reason: PrimaryReason;
  /** Additional supporting factors */
  supporting_factors: SupportingFactor[];
  /** Confidence in the recommendation */
  confidence: ConfidenceLevel;
}

// ==================== Action Blueprint Interfaces ====================

/**
 * Blueprint action type (spec-defined)
 */
export type BlueprintActionType =
  | 'improve_resume'
  | 'apply_to_job'
  | 'follow_up'
  | 'update_targets'
  | 'collect_missing_info';

/**
 * Entities for action targeting
 */
export interface ActionEntities {
  /** Bullet index for improve_resume */
  bullet_index?: number;
  /** Section name for improve_resume */
  section?: string;
  /** Application ID for follow_up */
  application_id?: string;
  /** Job ID for apply_to_job */
  job_id?: string;
}

/**
 * Constraints for action execution
 */
export interface ActionConstraints {
  /** Maximum items to process */
  max_items?: number;
  /** Minimum score gain threshold */
  min_score_gain?: number;
}

/**
 * Action blueprint for Layer 5 (Orchestrator)
 */
export interface ActionBlueprint {
  /** Type of action */
  type: BlueprintActionType;
  /** Human-readable objective */
  objective: string;
  /** Target entities */
  entities?: ActionEntities;
  /** Execution constraints */
  constraints?: ActionConstraints;
  /** Explanation of why this action is needed */
  why: string;
  /** Confidence in the action */
  confidence: ConfidenceLevel;
  /** Priority (1-10, higher is more important) */
  priority: number;
}

// ==================== Main Output Interface ====================

/**
 * Inputs used tracking
 */
export interface InputsUsed {
  /** Whether JD text was used */
  used_jd: boolean;
  /** Whether parsed requirements were used */
  used_job_requirements: boolean;
}

/**
 * Debug information (optional, for troubleshooting)
 */
export interface DebugInfo {
  /** List of penalties applied */
  penalties_applied: string[];
  /** Snapshot of thresholds used */
  thresholds_snapshot: {
    resume_score_min: number;
    application_volume_test: number;
    interview_rate_min: number;
  };
}

/**
 * Main strategy analysis result
 */
export interface StrategyAnalysisResult {
  /** Analysis version */
  analysis_version: '2.1';
  /** ISO datetime when generated */
  generated_at: string;
  /** Which inputs were used */
  inputs_used: InputsUsed;

  /** Overall fit score (0-100) */
  overall_fit_score: number;
  /** Confidence in the analysis */
  confidence_level: ConfidenceLevel;
  /** Fit score breakdown */
  fit_score_breakdown: FitScoreBreakdown;

  /** Gap analysis results */
  gaps: GapAnalysis;

  /** Recommended strategy mode */
  recommended_mode: StrategyMode;
  /** Reasoning for mode selection */
  mode_reasoning: ModeReasoning;

  /** Human-readable priority actions (3-5 items) */
  priority_actions: string[];
  /** Machine-actionable blueprints (3-7 items) */
  action_blueprints: ActionBlueprint[];

  /** Key insights (3-7 items) */
  key_insights: string[];

  /** Debug info (optional, strip in production) */
  debug?: DebugInfo;
}

// ==================== Configuration Interfaces ====================

/**
 * Mode hysteresis configuration
 */
export interface ModeHysteresis {
  /** Score buffer to prevent flip-flopping */
  resume_score_buffer: number;
  /** Minimum days in mode before switch */
  min_days_in_mode: number;
}

/**
 * Strategy thresholds configuration
 */
export interface StrategyThresholds {
  /** Minimum resume score for APPLY_MODE */
  resume_score_min: number;
  /** Application count for RETHINK evaluation */
  application_volume_test: number;
  /** Minimum interview rate (0-1) */
  interview_rate_min: number;
  /** Hysteresis settings */
  mode_hysteresis: ModeHysteresis;
}

/**
 * Fit score weights configuration
 */
export interface FitWeights {
  /** Skills weight (default 0.35) */
  skills: number;
  /** Tools weight (default 0.20) */
  tools: number;
  /** Experience weight (default 0.20) */
  experience: number;
  /** Industry weight (default 0.15) */
  industry: number;
  /** Seniority weight (default 0.10) */
  seniority: number;
}

/**
 * Seniority-years mapping entry
 */
export interface SeniorityYearsMapping {
  /** Maximum years (exclusive) for this level */
  max_years_exclusive: number;
  /** Seniority level */
  level: SeniorityLevel;
}

/**
 * Feature flags for optional features
 */
export interface FeatureFlags {
  /** Enable semantic matching (v2.2+) */
  semantic_matching: boolean;
  /** Enable skill strength scoring (v2.2+) */
  skill_strength_scoring: boolean;
  /** Enable roadmap generation (v2.3+) */
  roadmap_generation: boolean;
  /** Enable ML mode selection (v2.3+) */
  ml_mode_selection: boolean;
  /** Enable confidence intervals (v2.4+) */
  confidence_intervals: boolean;
}

/**
 * Complete strategy configuration
 */
export interface StrategyConfig {
  /** Analysis version */
  analysis_version: string;
  /** Strategy thresholds */
  strategy_thresholds: StrategyThresholds;
  /** Fit score weights */
  fit_weights: FitWeights;
  /** Seniority-years mapping */
  seniority_years_mapping: SeniorityYearsMapping[];
  /** Feature flags */
  features: FeatureFlags;
}

// ==================== Taxonomy Interfaces ====================

/**
 * Capability taxonomy structure
 */
export interface CapabilityTaxonomy {
  /** Skills by category */
  skills: Record<string, string[]>;
  /** Tools by category */
  tools: Record<string, string[]>;
  /** Synonym mappings */
  synonyms: Record<string, string>;
}

// ==================== Zod Validation Schemas ====================

/**
 * Shared confidence level schema - used across multiple schemas
 */
export const ConfidenceLevelSchema = z.enum(['low', 'medium', 'high']);

/**
 * Layer 1 extracted data validation
 */
export const Layer1ExtractedSchema = z.object({
  skills: z.array(z.string()),
  tools: z.array(z.string()),
  titles: z.array(z.string()),
  industries: z.array(z.string()).optional(),
  bullets_sample: z.array(z.string()).optional(),
});

/**
 * Layer 1 identified gaps validation
 */
export const Layer1IdentifiedGapsSchema = z.object({
  weak_bullets: z.number().min(0),
  missing_skills: z.array(z.string()),
  vague_experience: z.boolean(),
});

/**
 * Layer 1 AI summary validation
 */
export const Layer1AISummarySchema = z.object({
  seniority_level: z.nativeEnum(SeniorityLevel).optional(),
  seniority_confidence: ConfidenceLevelSchema.optional(),
}).optional();

/**
 * Layer 1 JD match validation
 */
export const Layer1JDMatchSchema = z.object({
  match_score: z.number().min(0).max(100),
  missing_critical: z.array(z.string()),
  underrepresented: z.array(z.string()),
  irrelevant: z.array(z.string()),
}).optional();

/**
 * Layer 1 evaluation validation
 */
export const Layer1EvaluationSchema = z.object({
  resume_score: z.number().min(0).max(100),
  content_quality_score: z.number().min(0).max(100),
  ats_compatibility_score: z.number().min(0).max(100),
  weaknesses: z.array(z.string()),
  identified_gaps: Layer1IdentifiedGapsSchema,
  extracted: Layer1ExtractedSchema,
  jd_match: Layer1JDMatchSchema,
  ai_summary: Layer1AISummarySchema,
});

/**
 * Layer 4 pipeline state validation
 */
export const Layer4PipelineStateSchema = z.object({
  total_applications: z.number().min(0),
  applications_last_7_days: z.number().min(0),
  applications_last_30_days: z.number().min(0),
  interview_requests: z.number().min(0),
  interview_rate: z.number().min(0).max(1),
  offers: z.number().min(0),
  rejections: z.number().min(0),
});

/**
 * Layer 4 user preferences validation
 */
export const Layer4UserPreferencesSchema = z.object({
  work_arrangement: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  salary_minimum: z.number().positive().optional(),
  excluded_industries: z.array(z.string()).optional(),
}).optional();

/**
 * Layer 4 user profile validation
 */
export const Layer4UserProfileSchema = z.object({
  target_roles: z.array(z.string()),
  target_seniority: z.nativeEnum(SeniorityLevel).optional(),
  years_experience: z.number().min(0).max(50).optional(),
  preferences: Layer4UserPreferencesSchema,
  weekly_target: z.number().min(1).max(100).optional(),
});

/**
 * Strategy history entry validation
 */
export const StrategyHistoryEntrySchema = z.object({
  from: z.nativeEnum(StrategyMode),
  to: z.nativeEnum(StrategyMode),
  changed_at: z.string(),
  reason: z.string(),
});

/**
 * Layer 4 state validation
 */
export const Layer4StateSchema = z.object({
  pipeline_state: Layer4PipelineStateSchema,
  user_profile: Layer4UserProfileSchema,
  current_strategy_mode: z.nativeEnum(StrategyMode).nullable().optional(),
  strategy_history: z.array(StrategyHistoryEntrySchema).optional(),
  mode_activated_at: z.string().optional(),
});

/**
 * Job requirements validation
 */
export const JobRequirementsSchema = z.object({
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()).optional(),
  required_tools: z.array(z.string()),
  preferred_tools: z.array(z.string()).optional(),
  seniority_expected: z.nativeEnum(SeniorityLevel).optional(),
  domain_keywords: z.array(z.string()).optional(),
  keyword_importance: z.record(z.enum(['critical', 'important', 'nice'])).optional(),
}).optional();

/**
 * Job context validation
 */
export const JobContextSchema = z.object({
  job_description: z.string().optional(),
  job_requirements: JobRequirementsSchema,
}).optional();

/**
 * Strategy analysis request validation
 */
export const StrategyAnalysisRequestSchema = z.object({
  layer1_evaluation: Layer1EvaluationSchema,
  layer4_state: Layer4StateSchema,
  job_context: JobContextSchema,
});

// ==================== Type Guards ====================

/**
 * Check if a string is a valid ExperienceType
 */
export function isValidExperienceType(type: string): type is ExperienceType {
  return EXPERIENCE_TYPES.includes(type as ExperienceType);
}

/**
 * Check if a string is a valid SeniorityAlignment
 */
export function isValidSeniorityAlignment(alignment: string): alignment is SeniorityAlignment {
  return ['underqualified', 'aligned', 'overqualified'].includes(alignment);
}

/**
 * Check if a string is a valid ConfidenceLevel
 */
export function isValidConfidenceLevel(level: string): level is ConfidenceLevel {
  return ['low', 'medium', 'high'].includes(level);
}

/**
 * Check if a string is a valid BlueprintActionType
 */
export function isValidBlueprintActionType(type: string): type is BlueprintActionType {
  return [
    'improve_resume',
    'apply_to_job',
    'follow_up',
    'update_targets',
    'collect_missing_info',
  ].includes(type);
}
