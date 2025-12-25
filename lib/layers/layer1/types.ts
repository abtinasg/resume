/**
 * Layer 1 - Evaluation Engine
 * Type Definitions v2.1
 *
 * This module defines all TypeScript types and interfaces for the evaluation engine.
 * It supports both generic resume evaluation and job-specific fit analysis.
 *
 * Based on: Layer_1_Evaluation_Engine_v2.1.md (PART I)
 */

import { z } from 'zod';
import { SeniorityLevel } from '../shared/types';

// ==================== Enums ====================

/**
 * Recommendation decision for job applications
 */
export type RecommendationType = 'APPLY' | 'OPTIMIZE_FIRST' | 'NOT_READY';

/**
 * Resume score level based on overall score
 */
export type ResumeLevel = 'Early' | 'Growing' | 'Solid' | 'Strong' | 'Exceptional';

/**
 * Seniority alignment status
 */
export type SeniorityAlignment = 'underqualified' | 'aligned' | 'overqualified';

/**
 * Parse quality indicator
 */
export type ParseQuality = 'high' | 'medium' | 'low';

/**
 * Supported MIME types for resume files
 */
export type SupportedMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain';

// ==================== Input Interfaces ====================

/**
 * Resume file input
 */
export interface ResumeInput {
  /** File content as Buffer or plain text string */
  content: Buffer | string;
  /** Original filename */
  filename: string;
  /** MIME type of the file */
  mimeType: SupportedMimeType;
}

/**
 * Optional metadata for evaluation context
 */
export interface EvaluationMetadata {
  /** User ID for tracking */
  user_id?: string;
  /** Target role for insights */
  target_role?: string;
  /** Target seniority level */
  target_seniority?: SeniorityLevel;
  /** Self-reported years of experience */
  years_experience?: number;
}

/**
 * Request for generic evaluation (no job context)
 */
export interface EvaluationRequest {
  /** Resume file data */
  resume: ResumeInput;
  /** Optional metadata for context */
  metadata?: EvaluationMetadata;
}

/**
 * Parsed job requirements (optional if pre-parsed)
 */
export interface ParsedJobRequirements {
  /** Required skills for the role */
  required_skills: string[];
  /** Preferred/nice-to-have skills */
  preferred_skills?: string[];
  /** Required tools/technologies */
  required_tools: string[];
  /** Preferred tools/technologies */
  preferred_tools?: string[];
  /** Expected seniority level */
  seniority_expected?: SeniorityLevel;
  /** Domain-specific keywords */
  domain_keywords?: string[];
  /** Minimum years of experience */
  years_experience_min?: number;
  /** Maximum years of experience */
  years_experience_max?: number;
}

/**
 * Job description input
 */
export interface JobDescriptionInput {
  /** Raw job description text */
  raw_text: string;
  /** Pre-parsed requirements (optional, will be extracted if not provided) */
  parsed_requirements?: ParsedJobRequirements;
}

/**
 * Request for job-specific fit evaluation
 */
export interface FitEvaluationRequest extends EvaluationRequest {
  /** Job description data */
  job_description: JobDescriptionInput;
}

// ==================== Parsed Resume Interfaces ====================

/**
 * Personal information extracted from resume
 */
export interface PersonalInfo {
  /** Full name */
  name?: string;
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Location/city */
  location?: string;
  /** LinkedIn profile URL */
  linkedin?: string;
  /** GitHub profile URL */
  github?: string;
  /** Portfolio/website URL */
  portfolio?: string;
}

/**
 * Work experience entry
 */
export interface ExperienceEntry {
  /** Job title */
  title: string;
  /** Company name */
  company: string;
  /** Work location */
  location?: string;
  /** Start date (format: "2020-01" or "Jan 2020") */
  start_date: string;
  /** End date or "Present" */
  end_date: string | 'Present';
  /** Calculated duration in months */
  duration_months: number;
  /** Bullet points describing responsibilities/achievements */
  bullets: string[];
  /** Whether this is the current position */
  is_current: boolean;
}

/**
 * Education entry
 */
export interface EducationEntry {
  /** Degree type (e.g., "Bachelor of Science") */
  degree: string;
  /** Field of study */
  field?: string;
  /** Institution name */
  institution: string;
  /** Graduation year */
  graduation_year?: number;
  /** GPA (if listed) */
  gpa?: number;
}

/**
 * Project entry
 */
export interface ProjectEntry {
  /** Project name */
  name: string;
  /** Project description */
  description: string;
  /** Technologies used */
  technologies?: string[];
  /** Year completed */
  year?: number;
  /** Project link */
  link?: string;
}

/**
 * Certification entry
 */
export interface CertificationEntry {
  /** Certification name */
  name: string;
  /** Issuing organization */
  issuer: string;
  /** Year obtained */
  year?: number;
}

/**
 * Course entry
 */
export interface CourseEntry {
  /** Course name */
  name: string;
  /** Institution/platform */
  institution: string;
  /** Year completed */
  year?: number;
}

/**
 * Document metadata from parsing
 */
export interface DocumentMetadata {
  /** Number of pages */
  page_count: number;
  /** Total word count */
  word_count: number;
  /** Whether document contains tables */
  has_tables: boolean;
  /** Whether document contains images */
  has_images: boolean;
  /** Original file format */
  format: 'pdf' | 'docx' | 'txt';
  /** Parse quality indicator */
  parse_quality: ParseQuality;
}

/**
 * Fully parsed resume structure
 */
export interface ParsedResume {
  /** Personal information */
  personal: PersonalInfo;
  /** Work experience entries */
  experiences: ExperienceEntry[];
  /** Education entries */
  education: EducationEntry[];
  /** Listed skills */
  skills: string[];
  /** Project entries */
  projects?: ProjectEntry[];
  /** Certifications */
  certifications?: CertificationEntry[];
  /** Courses */
  courses?: CourseEntry[];
  /** Document metadata */
  metadata: DocumentMetadata;
}

// ==================== Scoring Interfaces ====================

/**
 * Individual dimension score with breakdown
 */
export interface DimensionScore {
  /** Score value (0-100) */
  score: number;
  /** Detailed breakdown of sub-scores */
  breakdown?: Record<string, number>;
  /** Issues identified in this dimension */
  issues?: string[];
}

/**
 * All four dimension scores
 */
export interface DimensionScores {
  /** Skill capital score */
  skill_capital: DimensionScore;
  /** Execution impact score */
  execution_impact: DimensionScore;
  /** Learning adaptivity score */
  learning_adaptivity: DimensionScore;
  /** Signal quality score */
  signal_quality: DimensionScore;
}

/**
 * Extracted entities from resume
 */
export interface ExtractedEntities {
  /** Normalized skill names */
  skills: string[];
  /** Technology/tool names */
  tools: string[];
  /** Job titles from experience */
  titles: string[];
  /** Company names */
  companies: string[];
  /** Inferred industries */
  industries?: string[];
  /** Sample bullets for rewrite suggestions */
  bullets_sample?: string[];
  /** Certification names */
  certifications?: string[];
}

/**
 * Identified gaps in resume
 */
export interface IdentifiedGaps {
  /** Missing skills section or very few skills */
  missing_skills: boolean;
  /** Missing quantified metrics in achievements */
  missing_metrics: boolean;
  /** Using weak action verbs */
  weak_action_verbs: boolean;
  /** Generic/vague descriptions */
  generic_descriptions: boolean;
  /** Poor formatting issues */
  poor_formatting: boolean;
  /** Missing education section */
  no_education: boolean;
  /** Spelling/grammar errors detected */
  spelling_errors: boolean;
}

/**
 * Weak bullet information for Layer 3 improvement
 */
export interface WeakBullet {
  /** The bullet text */
  bullet: string;
  /** Issues with this bullet */
  issues: string[];
  /** Location information */
  location: {
    company: string;
    title: string;
    index: number;
  };
}

/**
 * Quick win improvement suggestion
 */
export interface QuickWin {
  /** Action to take */
  action: string;
  /** Estimated point improvement */
  estimated_impact: string;
  /** Time to implement */
  effort: string;
  /** Priority (1-5, 1 is highest) */
  priority: number;
}

/**
 * Feedback structure for user
 */
export interface EvaluationFeedback {
  /** 2-4 positive strengths */
  strengths: string[];
  /** 1-3 critical gaps to address */
  critical_gaps: string[];
  /** Quick wins for easy improvements */
  quick_wins: QuickWin[];
  /** General recommendations (5-8) */
  recommendations: string[];
}

/**
 * Evaluation flags for special conditions
 */
export interface EvaluationFlags {
  /** No skills section or skills listed */
  no_skills_listed: boolean;
  /** Resume appears to be spam/invalid */
  possible_spam: boolean;
  /** No work experience listed */
  no_experience: boolean;
  /** Many generic descriptions */
  generic_descriptions: boolean;
  /** No quantified metrics */
  no_metrics: boolean;
  /** Career appears stagnant */
  stagnant: boolean;
  /** Parsing had issues */
  parsing_failed: boolean;
  /** Resume too short */
  too_short: boolean;
}

/**
 * Processing metadata
 */
export interface ProcessingMeta {
  /** Processing time in milliseconds */
  processing_time_ms: number;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Evaluation engine version */
  version: '2.1';
  /** Parse quality */
  parse_quality: ParseQuality;
}

/**
 * Main evaluation result (generic score)
 */
export interface EvaluationResult {
  // Overall scores
  /** Main resume score (0-100) - Layer 2 expects this name */
  resume_score: number;
  /** Alias for Layer 4 storage */
  overall_score: number;
  /** Score level */
  level: ResumeLevel;

  // Component scores for Layer 2 integration
  /** Content quality score (skill_capital + execution_impact average) */
  content_quality_score: number;
  /** ATS compatibility score (signal_quality) */
  ats_compatibility_score: number;
  /** Format quality score (signal_quality) */
  format_quality_score: number;
  /** Impact score (execution_impact) */
  impact_score: number;

  // Dimension breakdown
  /** All four dimension scores */
  dimensions: DimensionScores;

  // Extracted data
  /** Weakness codes for Layer 2 */
  weaknesses: string[];
  /** Extracted entities */
  extracted: ExtractedEntities;
  /** Identified gaps */
  identified_gaps: IdentifiedGaps;

  // For Layer 3 improvement
  /** Weak bullets for rewriting */
  weak_bullets?: WeakBullet[];

  // User feedback
  /** Actionable feedback */
  feedback: EvaluationFeedback;

  // Flags
  /** Special condition flags */
  flags: EvaluationFlags;

  // Summary
  /** 1-2 sentence summary */
  summary: string;

  // Metadata
  /** Processing metadata */
  meta: ProcessingMeta;
}

// ==================== Gap Analysis Interfaces ====================

/**
 * Skills gap analysis
 */
export interface SkillsGap {
  /** Skills that matched requirements */
  matched: string[];
  /** Critical skills missing from resume */
  critical_missing: string[];
  /** Nice-to-have skills missing */
  nice_to_have_missing: string[];
  /** Skills that could transfer */
  transferable: string[];
  /** Match percentage (0-100) */
  match_percentage: number;
}

/**
 * Tools gap analysis
 */
export interface ToolsGap {
  /** Tools that matched requirements */
  matched: string[];
  /** Critical tools missing */
  critical_missing: string[];
  /** Nice-to-have tools missing */
  nice_to_have_missing: string[];
  /** Match percentage (0-100) */
  match_percentage: number;
}

/**
 * Experience gap analysis
 */
export interface ExperienceGap {
  /** Experience types that matched */
  matched_types: string[];
  /** Experience types missing */
  missing_types: string[];
  /** Coverage score (0-100) */
  coverage_score: number;
}

/**
 * Seniority gap analysis
 */
export interface SeniorityGap {
  /** User's detected level */
  user_level: SeniorityLevel;
  /** Role's expected level */
  role_expected: SeniorityLevel;
  /** Alignment status */
  alignment: SeniorityAlignment;
  /** Years gap if underqualified */
  gap_years?: number;
}

/**
 * Industry gap analysis
 */
export interface IndustryGap {
  /** Industry keywords matched */
  keywords_matched: string[];
  /** Industry keywords missing */
  keywords_missing: string[];
  /** Match percentage (0-100) */
  match_percentage: number;
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
 * Fit dimension breakdown
 */
export interface FitDimensions {
  /** Technical match (skills + tools) */
  technical_match: number;
  /** Seniority level match */
  seniority_match: number;
  /** Experience type match */
  experience_match: number;
  /** Signal quality from generic score */
  signal_quality: number;
}

/**
 * Fit-specific flags
 */
export interface FitFlags {
  /** Too junior for role */
  underqualified: boolean;
  /** Too senior for role */
  overqualified: boolean;
  /** Switching industries/roles */
  career_switch: boolean;
  /** Resume quality too low */
  low_signal: boolean;
  /** Ambitious but possible */
  stretch_role: boolean;
}

/**
 * Priority improvement suggestion for fit
 */
export interface PriorityImprovement {
  /** Type of improvement */
  type: 'add_skill' | 'add_metric' | 'strengthen_verb' | 'add_experience';
  /** What to add/improve */
  target: string;
  /** Why it matters for this job */
  why: string;
  /** Estimated impact on fit score */
  estimated_impact: number;
}

/**
 * Fit processing metadata
 */
export interface FitProcessingMeta {
  /** Whether JD was parsed successfully */
  job_parsed_successfully: boolean;
  /** Confidence in fit analysis */
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Job-specific fit score (extends EvaluationResult)
 */
export interface FitScore extends EvaluationResult {
  /** Overall fit score (0-100) */
  fit_score: number;

  /** Multi-dimensional fit breakdown */
  fit_dimensions: FitDimensions;

  /** Detailed gap analysis */
  gaps: GapAnalysis;

  /** Fit-specific flags */
  fit_flags: FitFlags;

  /** Decision recommendation */
  recommendation: RecommendationType;
  /** Reasoning for recommendation */
  recommendation_reasoning: string;

  /** Tailoring hints for improvement */
  tailoring_hints: string[];
  /** Priority improvements */
  priority_improvements: PriorityImprovement[];

  /** Fit-specific metadata */
  fit_meta: FitProcessingMeta;
}

// ==================== Cache Interfaces ====================

/**
 * Cached evaluation result
 */
export interface CachedEvaluationResult {
  /** The cached score */
  score: EvaluationResult;
  /** Cache timestamp */
  timestamp: number;
}

// ==================== Zod Validation Schemas ====================

/**
 * Resume input validation schema
 */
export const ResumeInputSchema = z.object({
  content: z.union([
    z.instanceof(Buffer),
    z.string().min(1, 'Resume content cannot be empty'),
  ]),
  filename: z.string().min(1, 'Filename is required'),
  mimeType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]),
});

/**
 * Evaluation metadata validation schema
 */
export const EvaluationMetadataSchema = z
  .object({
    user_id: z.string().optional(),
    target_role: z.string().optional(),
    target_seniority: z.enum(['entry', 'mid', 'senior', 'lead']).optional(),
    years_experience: z.number().min(0).max(50).optional(),
  })
  .optional();

/**
 * Evaluation request validation schema
 */
export const EvaluationRequestSchema = z.object({
  resume: ResumeInputSchema,
  metadata: EvaluationMetadataSchema,
});

/**
 * Parsed job requirements validation schema
 */
export const ParsedJobRequirementsSchema = z.object({
  required_skills: z.array(z.string()),
  preferred_skills: z.array(z.string()).optional(),
  required_tools: z.array(z.string()),
  preferred_tools: z.array(z.string()).optional(),
  seniority_expected: z.enum(['entry', 'mid', 'senior', 'lead']).optional(),
  domain_keywords: z.array(z.string()).optional(),
  years_experience_min: z.number().min(0).optional(),
  years_experience_max: z.number().min(0).optional(),
});

/**
 * Job description input validation schema
 */
export const JobDescriptionInputSchema = z.object({
  raw_text: z.string().min(50, 'Job description must be at least 50 characters'),
  parsed_requirements: ParsedJobRequirementsSchema.optional(),
});

/**
 * Fit evaluation request validation schema
 */
export const FitEvaluationRequestSchema = EvaluationRequestSchema.extend({
  job_description: JobDescriptionInputSchema,
});

// ==================== Type Guards ====================

/**
 * Check if a result is a FitScore (has fit_score property)
 */
export function isFitScore(result: EvaluationResult | FitScore): result is FitScore {
  return 'fit_score' in result;
}

/**
 * Check if a seniority level is valid
 */
export function isValidSeniorityLevel(level: string): level is SeniorityLevel {
  return ['entry', 'mid', 'senior', 'lead'].includes(level);
}

// ==================== Utility Types ====================

/**
 * Content hash for caching
 */
export type ContentHash = string;

/**
 * Weakness code type
 */
export type WeaknessCode =
  | 'no_metrics'
  | 'weak_verbs'
  | 'generic_descriptions'
  | 'poor_formatting'
  | 'spelling_errors'
  | 'few_skills_listed'
  | 'no_learning_signals'
  | 'no_experience'
  | 'parsing_failed'
  | 'too_short'
  | 'possible_spam';

/**
 * Bullet issue type
 */
export type BulletIssue = 'weak_verb' | 'no_metric' | 'vague' | 'too_short';
