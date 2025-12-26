/**
 * Layer 6 - Job Discovery & Matching Module
 * Type Definitions v1.1
 *
 * This module defines all TypeScript types and interfaces for job discovery,
 * parsing, ranking, and comparison functionality.
 *
 * Based on: Layer_6_JobDiscovery_v1.1.md (PART I - MVP)
 */

import { z } from 'zod';
import type { SeniorityLevel, Priority, LayerOutput } from '../shared/types';
import type { FitScore, GapAnalysis } from '../layer1/types';

// ==================== Enums ====================

/**
 * Job categories based on fit analysis
 */
export type JobCategory = 'reach' | 'target' | 'safety' | 'avoid';

/**
 * Job priority level
 */
export type JobPriority = 'high' | 'medium' | 'low';

/**
 * Parse quality indicator
 */
export type ParseQuality = 'high' | 'medium' | 'low';

/**
 * Work arrangement type
 */
export type WorkArrangement = 'remote' | 'hybrid' | 'onsite';

/**
 * Job status in pipeline
 */
export type JobStatus = 'discovered' | 'saved' | 'applied' | 'archived';

/**
 * Scam risk level
 */
export type ScamRiskLevel = 'high' | 'medium' | 'low' | 'none';

/**
 * Extraction importance level
 */
export type ImportanceLevel = 'critical' | 'important' | 'nice_to_have';

/**
 * Source of job posting
 */
export type JobSource = 'manual_paste' | 'email_forward' | 'api';

// ==================== Input Contracts ====================

/**
 * User preferences for job matching
 */
export interface UserPreferences {
  /** Preferred work arrangements */
  work_arrangement?: WorkArrangement[];
  /** Preferred locations */
  locations?: string[];
  /** Minimum acceptable salary */
  salary_minimum?: number;
  /** Industries to avoid */
  excluded_industries?: string[];
  /** Enforce location match strictly */
  strict_location?: boolean;
}

/**
 * Job paste request from user
 */
export interface JobPasteRequest {
  /** User ID */
  user_id: string;
  /** Resume version to evaluate against */
  resume_version_id: string;
  /** Full job description text */
  job_description: string;
  /** Optional metadata provided by user */
  metadata?: JobMetadataInput;
  /** Language of the JD (default: 'en') */
  language?: string;
}

/**
 * Optional metadata user can provide
 */
export interface JobMetadataInput {
  /** Job title if not in JD */
  job_title?: string;
  /** Company name if not in JD */
  company?: string;
  /** Job URL */
  job_url?: string;
  /** Location */
  location?: string;
  /** Posted date (ISO 8601) */
  posted_date?: string;
  /** Application deadline (ISO 8601) */
  application_deadline?: string;
  /** Source of the job */
  source?: JobSource;
}

/**
 * Job filters for list queries
 */
export interface JobFilters {
  /** Filter by category */
  category?: JobCategory;
  /** Minimum fit score */
  min_fit_score?: number;
  /** Maximum fit score */
  max_fit_score?: number;
  /** Location filter */
  location?: string;
  /** Only show jobs user should apply to */
  only_should_apply?: boolean;
  /** Job status */
  status?: JobStatus;
  /** Include expired jobs */
  include_expired?: boolean;
  /** Include rejected jobs */
  include_rejected?: boolean;
}

// ==================== Evidence & Extraction Interfaces ====================

/**
 * Evidence span showing where information was extracted from
 */
export interface EvidenceSpan {
  /** Exact quote from JD */
  quote: string;
  /** Start character position */
  start?: number;
  /** End character position */
  end?: number;
  /** Confidence of extraction (0-1) */
  confidence: number;
}

/**
 * Extracted item with evidence
 */
export interface ExtractedItem {
  /** Normalized skill/tool name */
  value: string;
  /** Evidence spans where found */
  evidence: EvidenceSpan[];
  /** Importance level */
  importance: ImportanceLevel;
}

/**
 * Salary range information
 */
export interface SalaryRange {
  /** Minimum salary */
  min?: number;
  /** Maximum salary */
  max?: number;
  /** Currency (default: 'USD') */
  currency?: string;
}

// ==================== Parsed Job Interfaces ====================

/**
 * Extracted job requirements
 */
export interface JobRequirements {
  /** Required skills */
  required_skills: ExtractedItem[];
  /** Preferred/nice-to-have skills */
  preferred_skills: ExtractedItem[];
  /** Required tools/technologies */
  required_tools: ExtractedItem[];
  /** Preferred tools/technologies */
  preferred_tools: ExtractedItem[];
  /** Expected seniority level */
  seniority_expected: SeniorityLevel;
  /** Minimum years of experience */
  years_experience_min?: number;
  /** Maximum years of experience */
  years_experience_max?: number;
  /** Education requirements */
  education_requirements?: string[];
  /** Certifications */
  certifications?: string[];
  /** Domain-specific keywords */
  domain_keywords: string[];
  /** Extraction confidence (0-1) */
  extraction_confidence: number;
  /** Extraction method used */
  extraction_method: 'llm' | 'regex' | 'hybrid';
}

/**
 * Job metadata after parsing
 */
export interface JobMetadata {
  /** Job URL */
  job_url?: string;
  /** Source of the job */
  source?: string;
  /** Posted date (ISO 8601) */
  posted_date?: string;
  /** Application deadline (ISO 8601) */
  application_deadline?: string;
  /** Parse quality */
  parse_quality: ParseQuality;
  /** Parse confidence (0-100) */
  parse_confidence: number;
  /** Company tier for career capital */
  company_tier?: 'top_tier' | 'unicorn' | 'established' | 'startup' | 'unknown';
  /** Company size */
  company_size?: string;
  /** Industry */
  industry?: string;
}

/**
 * Fully parsed job structure
 */
export interface ParsedJob {
  /** Generated UUID */
  job_id: string;
  /** Canonical ID for deduplication */
  canonical_id: string;
  /** Job title */
  job_title: string;
  /** Company name */
  company: string;
  /** Location */
  location: string;
  /** Original JD text */
  raw_text: string;
  /** Parsed requirements */
  requirements: JobRequirements;
  /** Key responsibilities */
  responsibilities: string[];
  /** Benefits and perks */
  benefits?: string[];
  /** Work arrangement */
  work_arrangement?: WorkArrangement;
  /** Salary range */
  salary_range?: SalaryRange;
  /** Metadata */
  metadata: JobMetadata;
  /** Created timestamp (ISO 8601) */
  created_at: string;
  /** Updated timestamp (ISO 8601) */
  updated_at: string;
}

// ==================== Score & Breakdown Interfaces ====================

/**
 * Score penalty
 */
export interface ScorePenalty {
  /** Penalty code */
  code: string;
  /** Penalty amount (negative) */
  amount: number;
  /** Human-readable reason */
  reason: string;
}

/**
 * Detailed score breakdown for transparency
 */
export interface ScoreBreakdown {
  /** Fit score component (from Layer 1) */
  fit_component: number;
  /** User preferences match component */
  preference_component: number;
  /** Freshness/recency component */
  freshness_component: number;
  /** Category bonus component */
  category_component: number;
  /** Urgency component */
  urgency_component: number;
  /** Applied penalties */
  penalties: ScorePenalty[];
  /** Raw score before penalties */
  raw_score: number;
  /** Final score after penalties */
  final_score: number;
}

/**
 * Career capital analysis
 */
export interface CareerCapital {
  /** Overall career capital score (0-100) */
  score: number;
  /** Brand/reputation score */
  brand_score: number;
  /** Skill growth potential score */
  skill_growth_score: number;
  /** Network opportunities score */
  network_score: number;
  /** Compensation competitiveness score */
  comp_score: number;
  /** Human-readable breakdown */
  breakdown: {
    brand: string;
    skill_growth: string;
    network: string;
    comp: string;
  };
}

/**
 * Job flags for status tracking
 */
export interface JobFlags {
  /** User marked as dream job */
  dream_job: boolean;
  /** Already applied */
  applied: boolean;
  /** User rejected this job */
  rejected: boolean;
  /** Past deadline */
  expired: boolean;
  /** Added in last 7 days */
  new: boolean;
  /** Suspicious patterns detected */
  scam_risk: boolean;
}

// ==================== Ranked Job Interfaces ====================

/**
 * Scam detection result
 */
export interface ScamDetectionResult {
  /** Risk level */
  risk_level: ScamRiskLevel;
  /** Detected red flags */
  red_flags: string[];
  /** Number of red flags */
  red_flag_count: number;
}

/**
 * Ranked job with all analysis
 */
export interface RankedJob {
  /** Parsed job info */
  job: ParsedJob;
  /** Fit score (0-100) from Layer 1 */
  fit_score: number;
  /** Complete fit analysis from Layer 1 */
  fit_analysis: FitScore | null;
  /** Job category */
  category: JobCategory;
  /** Reasoning for category */
  category_reasoning: string;
  /** 1-based rank */
  rank: number;
  /** Priority score (0-100) for sorting */
  priority_score: number;
  /** Detailed score breakdown */
  score_breakdown: ScoreBreakdown;
  /** Job flags */
  flags: JobFlags;
  /** Whether user should apply */
  should_apply: boolean;
  /** Application priority */
  application_priority: JobPriority;
  /** Quick insights (3-7 points) */
  quick_insights: string[];
  /** Potential issues/red flags */
  red_flags?: string[];
  /** Strong matches/green flags */
  green_flags?: string[];
  /** Career capital analysis */
  career_capital: CareerCapital;
  /** Scam detection result */
  scam_detection: ScamDetectionResult;
}

// ==================== Job List Interfaces ====================

/**
 * Summary statistics for job list
 */
export interface JobListSummary {
  /** Total jobs */
  total_jobs: number;
  /** Reach category count */
  reach_count: number;
  /** Target category count */
  target_count: number;
  /** Safety category count */
  safety_count: number;
  /** Avoid category count */
  avoid_count: number;
  /** Average fit score */
  average_fit_score: number;
  /** Applied count */
  applied_count: number;
  /** New jobs count */
  new_count: number;
}

/**
 * Job list result
 */
export interface JobListResult {
  /** Jobs grouped by category */
  jobs: {
    reach: RankedJob[];
    target: RankedJob[];
    safety: RankedJob[];
    avoid: RankedJob[];
  };
  /** Summary statistics */
  summary: JobListSummary;
  /** Top recommendations (up to 5) */
  top_recommendations: RankedJob[];
  /** Portfolio-level insights */
  insights: string[];
}

// ==================== Job Comparison Interfaces ====================

/**
 * Skills overlap analysis
 */
export interface SkillsOverlap {
  /** Skills all jobs need */
  common_requirements: string[];
  /** Skills unique to each job */
  unique_per_job: Record<string, string[]>;
  /** User's coverage percentage (0-100) */
  your_coverage: number;
}

/**
 * Job comparison details
 */
export interface ComparisonDetails {
  /** Fit scores array */
  fit_scores: number[];
  /** Categories array */
  categories: JobCategory[];
  /** Skills overlap analysis */
  skills_overlap: SkillsOverlap;
  /** Seniority levels array */
  seniority_levels: SeniorityLevel[];
  /** User's level */
  your_level?: SeniorityLevel;
  /** Locations array */
  locations: string[];
  /** Remote friendly flags */
  remote_friendly: boolean[];
  /** Salary ranges (if available) */
  salary_ranges?: SalaryRange[];
}

/**
 * Job comparison result
 */
export interface JobComparisonResult {
  /** Jobs being compared */
  jobs: RankedJob[];
  /** Comparison details */
  comparison: ComparisonDetails;
  /** Job ID of best fit */
  best_fit: string;
  /** Job ID of easiest to get */
  easiest_to_get: string;
  /** Job ID with best growth opportunity */
  best_for_growth: string;
  /** Job ID with best brand */
  best_for_brand?: string;
  /** Job ID with best compensation */
  best_for_compensation?: string;
  /** Comparative insights */
  insights: string[];
}

// ==================== Layer Output Types ====================

/**
 * Layer 6 output for parse and rank
 */
export type Layer6ParseRankOutput = LayerOutput<RankedJob>;

/**
 * Layer 6 output for job list
 */
export type Layer6JobListOutput = LayerOutput<JobListResult>;

/**
 * Layer 6 output for comparison
 */
export type Layer6ComparisonOutput = LayerOutput<JobComparisonResult>;

// ==================== Zod Validation Schemas ====================

/**
 * Salary range schema
 */
export const SalaryRangeSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().optional(),
});

/**
 * Job metadata input schema
 */
export const JobMetadataInputSchema = z.object({
  job_title: z.string().optional(),
  company: z.string().optional(),
  job_url: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  posted_date: z.string().datetime().optional().or(z.literal('')),
  application_deadline: z.string().datetime().optional().or(z.literal('')),
  source: z.enum(['manual_paste', 'email_forward', 'api']).optional(),
}).optional();

/**
 * Job paste request schema
 */
export const JobPasteRequestSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  resume_version_id: z.string().min(1, 'Resume version ID is required'),
  job_description: z.string()
    .min(50, 'Job description must be at least 50 characters')
    .max(50000, 'Job description must be at most 50000 characters'),
  metadata: JobMetadataInputSchema,
  language: z.string().optional(),
});

/**
 * User preferences schema
 */
export const UserPreferencesSchema = z.object({
  work_arrangement: z.array(z.enum(['remote', 'hybrid', 'onsite'])).optional(),
  locations: z.array(z.string()).optional(),
  salary_minimum: z.number().min(0).optional(),
  excluded_industries: z.array(z.string()).optional(),
  strict_location: z.boolean().optional(),
});

/**
 * Job filters schema
 */
export const JobFiltersSchema = z.object({
  category: z.enum(['reach', 'target', 'safety', 'avoid']).optional(),
  min_fit_score: z.number().min(0).max(100).optional(),
  max_fit_score: z.number().min(0).max(100).optional(),
  location: z.string().optional(),
  only_should_apply: z.boolean().optional(),
  status: z.enum(['discovered', 'saved', 'applied', 'archived']).optional(),
  include_expired: z.boolean().optional(),
  include_rejected: z.boolean().optional(),
});

// ==================== Type Guards ====================

/**
 * Check if a job category is valid
 */
export function isValidJobCategory(category: string): category is JobCategory {
  return ['reach', 'target', 'safety', 'avoid'].includes(category);
}

/**
 * Check if work arrangement is valid
 */
export function isValidWorkArrangement(arrangement: string): arrangement is WorkArrangement {
  return ['remote', 'hybrid', 'onsite'].includes(arrangement);
}

/**
 * Check if job status is valid
 */
export function isValidJobStatus(status: string): status is JobStatus {
  return ['discovered', 'saved', 'applied', 'archived'].includes(status);
}

/**
 * Check if parse quality is valid
 */
export function isValidParseQuality(quality: string): quality is ParseQuality {
  return ['high', 'medium', 'low'].includes(quality);
}

// ==================== Utility Types ====================

/**
 * Content hash for caching/deduplication
 */
export type ContentHash = string;

/**
 * Job ID type
 */
export type JobId = string;

/**
 * Canonical job ID for deduplication
 */
export type CanonicalJobId = string;
