/**
 * Layer 3 - Execution Engine
 * Type Definitions v2.3
 *
 * This module defines all TypeScript types and interfaces for the execution engine.
 * It supports evidence-anchored rewriting with validation to prevent fabrication.
 *
 * Based on: Layer_3_Execution_Engine_v2.2.md (PART I - MVP)
 */

import { z } from 'zod';
import { RewriteType, SeniorityLevel } from '../shared/types';

// ==================== Re-exports for Convenience ====================

export { RewriteType, SeniorityLevel };

// ==================== Evidence Types ====================

/**
 * Evidence scope determines how far we look for allowed facts
 * - bullet_only: Only use facts from the bullet being rewritten
 * - section: May use facts from other bullets in the same role/section
 * - resume: May use resume-wide facts (with restrictions for experience bullets)
 */
export type EvidenceScope = 'bullet_only' | 'section' | 'resume';

/**
 * Type of evidence item (what kind of content)
 */
export type EvidenceType = 'bullet' | 'section' | 'skills' | 'tools' | 'titles';

/**
 * A single piece of evidence from the resume
 * Every claim in the improved text must trace back to one of these
 */
export interface EvidenceItem {
  /** Unique identifier (e.g., "E1", "E2", "E_skills") */
  id: string;
  /** Type of evidence content */
  type: EvidenceType;
  /** Scope of evidence (how far it can be used) */
  scope: EvidenceScope;
  /** Source of evidence (where it came from) */
  source: 'bullet' | 'section' | 'resume';
  /** Raw evidence text */
  text: string;
  /** Extracted/normalized terms (optional) */
  normalized_terms?: string[];
}

/**
 * Collection of all evidence available for rewriting
 */
export interface EvidenceLedger {
  /** All evidence items */
  items: EvidenceItem[];
  /** Scope used to build this ledger */
  scope: EvidenceScope;
  /** Whether resume-level enrichment is allowed */
  allow_resume_enrichment: boolean;
}

/**
 * Maps a span in the improved text to its evidence sources
 * This is the core of evidence-anchored validation
 */
export interface EvidenceMapItem {
  /** Phrase in the improved text */
  improved_span: string;
  /** Evidence IDs that support this phrase */
  evidence_ids: string[];
}

/**
 * Complete evidence map for a rewrite
 */
export type EvidenceMap = EvidenceMapItem[];

// ==================== Micro-Action Types ====================

/**
 * Types of micro-actions that can be planned
 */
export type MicroActionType =
  | 'verb_upgrade'
  | 'remove_fluff'
  | 'add_how'
  | 'surface_tool'
  | 'tense_align'
  | 'add_specificity';

/**
 * A planned micro-action transformation
 */
export interface MicroAction {
  /** Type of transformation */
  type: MicroActionType;
  /** Action-specific data */
  data:
    | VerbUpgradeData
    | RemoveFluffData
    | AddHowData
    | SurfaceToolData
    | TenseAlignData
    | AddSpecificityData;
}

/**
 * Data for verb upgrade action
 */
export interface VerbUpgradeData {
  /** Original weak verb */
  from: string;
  /** Suggested strong verb */
  to: string;
  /** Context hint for selection */
  context?: string;
}

/**
 * Data for fluff removal action
 */
export interface RemoveFluffData {
  /** Terms to remove */
  terms: string[];
}

/**
 * Data for add_how action
 */
export interface AddHowData {
  /** Hint for what to add */
  hint: string;
}

/**
 * Data for surface_tool action
 */
export interface SurfaceToolData {
  /** Tool/skill to surface */
  tool: string;
  /** Evidence ID supporting this */
  evidence_id: string;
}

/**
 * Data for tense alignment action
 */
export interface TenseAlignData {
  /** Target tense */
  tense: 'past' | 'present';
}

/**
 * Data for add specificity action
 */
export interface AddSpecificityData {
  /** Type of specificity to add */
  specificity_type: 'technical' | 'metric' | 'outcome';
  /** Hint for what to add */
  hint?: string;
}

// ==================== Validation Types ====================

/**
 * Severity levels for validation items
 */
export type ValidationSeverity = 'info' | 'warning' | 'critical';

/**
 * Validation codes for different types of issues
 */
export enum ValidationCode {
  // Critical issues (will fail validation)
  NEW_NUMBER_ADDED = 'NEW_NUMBER_ADDED',
  NEW_TOOL_ADDED = 'NEW_TOOL_ADDED',
  NEW_COMPANY_ADDED = 'NEW_COMPANY_ADDED',
  NEW_IMPLIED_METRIC = 'NEW_IMPLIED_METRIC',
  INVALID_EVIDENCE_ID = 'INVALID_EVIDENCE_ID',
  SPAN_NOT_FOUND = 'SPAN_NOT_FOUND',
  UNSUPPORTED_TOOL_CLAIM = 'UNSUPPORTED_TOOL_CLAIM',
  UNSUPPORTED_METRIC_CLAIM = 'UNSUPPORTED_METRIC_CLAIM',

  // Warning issues (validation passes with warnings)
  LENGTH_EXPLOSION = 'LENGTH_EXPLOSION',
  MEANING_SHIFT = 'MEANING_SHIFT',
  WEAK_EVIDENCE_MATCH = 'WEAK_EVIDENCE_MATCH',

  // Info issues
  NO_CHANGES = 'NO_CHANGES',
  ORIGINAL_STRONG = 'ORIGINAL_STRONG',
}

/**
 * A single validation item
 */
export interface ValidationItem {
  /** Validation code */
  code: ValidationCode | string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Human-readable message */
  message: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  /** Whether validation passed (no critical issues) */
  passed: boolean;
  /** All validation items */
  items: ValidationItem[];
}

// ==================== Quality Signals Types ====================

/**
 * Signals about what changed in the rewrite
 */
export interface RewriteQualitySignals {
  /** Whether a stronger verb was used */
  stronger_verb: boolean;
  /** Whether a metric was added (only if implied in original) */
  added_metric: boolean;
  /** Whether the text became more specific */
  more_specific: boolean;
  /** Whether fluff/filler was removed */
  removed_fluff: boolean;
  /** Whether content was tailored to target role */
  tailored_to_role: boolean;
}

// ==================== Request Types ====================

/**
 * Layer 1 signals for context
 */
export interface Layer1Signals {
  /** Weak bullets identified by Layer 1 */
  weak_bullets?: Array<{
    bullet: string;
    index?: number;
    issues: string[];
  }>;
  /** Extracted entities from resume */
  extracted?: {
    skills?: string[];
    tools?: string[];
    titles?: string[];
  };
}

/**
 * Layer 2 signals for context
 */
export interface Layer2Signals {
  /** Target role from strategy */
  target_role?: string;
  /** Missing experience types (context only) */
  missing_experience_types?: string[];
  /** Critical missing skills (context only) */
  critical_missing_skills?: string[];
}

/**
 * User input request when evidence is insufficient
 */
export interface UserInputRequest {
  /** The question to ask */
  prompt: string;
  /** Example answer */
  example_answer?: string;
}

/**
 * Confidence level for rewrites
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Section type for context
 */
export type SectionType = 'experience' | 'summary' | 'skills' | 'headline' | 'projects';

/**
 * Context for the bullet being rewritten
 */
export interface BulletContext {
  /** Section type */
  section_type: SectionType;
  /** Role/company (for experience bullets) */
  role?: string;
  /** Company name */
  company?: string;
  /** Index in the section */
  index?: number;
}

/**
 * Base rewrite request
 */
export interface BaseRewriteRequest {
  /** Target role for tailoring */
  target_role?: string;
  /** Target seniority level */
  target_seniority?: SeniorityLevel;
  /** Job description (style guide only, NOT factual source) */
  job_description?: string;
  /** Pre-computed evidence (optional) */
  evidence?: EvidenceItem[];
  /** Evidence scope to use */
  evidence_scope?: EvidenceScope;
  /** Allow resume-level enrichment */
  allow_resume_enrichment?: boolean;
  /** Layer 1 signals */
  layer1?: Layer1Signals;
  /** Layer 2 signals */
  layer2?: Layer2Signals;
}

/**
 * Request to rewrite a single bullet
 */
export interface BulletRewriteRequest extends BaseRewriteRequest {
  /** Type discriminator */
  type: 'bullet';
  /** The bullet text to rewrite */
  bullet: string;
  /** Bullet context */
  context?: BulletContext;
  /** Issues identified for this bullet */
  issues?: string[];
}

/**
 * Request to rewrite a summary/headline
 */
export interface SummaryRewriteRequest extends BaseRewriteRequest {
  /** Type discriminator */
  type: 'summary';
  /** The summary text to rewrite */
  summary: string;
}

/**
 * Request to rewrite an entire section
 */
export interface SectionRewriteRequest extends BaseRewriteRequest {
  /** Type discriminator */
  type: 'section';
  /** All bullets in the section */
  bullets: string[];
  /** Section type */
  section_type?: SectionType;
  /** Role/company (for experience sections) */
  role?: string;
  /** Company name */
  company?: string;
}

/**
 * Union type for all rewrite requests
 */
export type RewriteRequest = BulletRewriteRequest | SummaryRewriteRequest | SectionRewriteRequest;

// ==================== Result Types ====================

/**
 * Result of rewriting a single bullet
 */
export interface BulletRewriteResult {
  /** Type discriminator - CRITICAL for Layer 4 */
  type: 'bullet';
  /** Original bullet text */
  original: string;
  /** Improved bullet text */
  improved: string;
  /** Human-readable reasoning for the changes */
  reasoning: string;
  /** What changed */
  changes: RewriteQualitySignals;
  /** Evidence map for audit trail */
  evidence_map: EvidenceMap;
  /** Validation result */
  validation: ValidationResult;
  /** Confidence level */
  confidence: ConfidenceLevel;
  /** User input requests if evidence insufficient */
  needs_user_input?: UserInputRequest[];
  /** Estimated score improvement (0-10) */
  estimated_score_gain?: number;
}

/**
 * Result of rewriting a summary/headline
 */
export interface SummaryRewriteResult {
  /** Type discriminator - CRITICAL for Layer 4 */
  type: 'summary';
  /** Original summary text */
  original: string;
  /** Improved summary text */
  improved: string;
  /** Human-readable reasoning */
  reasoning: string;
  /** What changed */
  changes: RewriteQualitySignals;
  /** Evidence map for audit trail */
  evidence_map: EvidenceMap;
  /** Validation result */
  validation: ValidationResult;
  /** Confidence level */
  confidence: ConfidenceLevel;
  /** Estimated score improvement (0-10) */
  estimated_score_gain?: number;
}

/**
 * Per-bullet detail in section rewrite
 */
export interface SectionBulletDetail {
  /** Index of the bullet */
  index: number;
  /** Full result for this bullet */
  bullet_result: BulletRewriteResult;
}

/**
 * Result of rewriting an entire section
 */
export interface SectionRewriteResult {
  /** Type discriminator - CRITICAL for Layer 4 */
  type: 'section';
  /** Original bullets */
  original_bullets: string[];
  /** Improved bullets */
  improved_bullets: string[];
  /** Estimated aggregate score gain */
  estimated_aggregate_gain: number;
  /** Validation summary for the section */
  validation_summary: ValidationResult;
  /** Per-bullet details */
  per_bullet_details: SectionBulletDetail[];
  /** Notes about section-level changes */
  section_notes: string[];
  /** Confidence level */
  confidence: ConfidenceLevel;
}

/**
 * Union type for all rewrite results
 */
export type RewriteResult = BulletRewriteResult | SummaryRewriteResult | SectionRewriteResult;

// ==================== Configuration Types ====================

/**
 * LLM configuration
 */
export interface LLMConfig {
  /** Primary model to use */
  primary_model: string;
  /** Fallback model */
  fallback_model: string;
  /** Temperature for generation */
  temperature: number;
  /** Maximum tokens to generate */
  max_tokens: number;
  /** Maximum retries on failure */
  max_retries: number;
}

/**
 * Rewrite thresholds
 */
export interface RewriteThresholds {
  /** Max length multiplier before warning */
  max_length_multiplier: number;
  /** Minimum bullet length */
  min_bullet_length: number;
  /** Maximum bullet length */
  max_bullet_length: number;
  /** Minimum semantic similarity before warning */
  semantic_similarity_min: number;
  /** Semantic overlap threshold for evidence validation */
  evidence_overlap_threshold: number;
}

/**
 * Feature flags
 */
export interface RewriteFeatureFlags {
  /** Enable evidence-anchored rewriting */
  evidence_anchored_rewrite: boolean;
  /** Enable section coherence pass */
  section_coherence_pass: boolean;
  /** Enable meaning shift detection */
  meaning_shift_check: boolean;
  /** Enable retry on validation failure */
  retry_on_validation_failure: boolean;
}

/**
 * Complete Layer 3 configuration
 */
export interface Layer3Config {
  /** Version string */
  version: string;
  /** Default settings */
  defaults: {
    evidence_scope: EvidenceScope;
    allow_resume_enrichment: boolean;
  };
  /** LLM configuration */
  llm: LLMConfig;
  /** Threshold values */
  thresholds: RewriteThresholds;
  /** Feature flags */
  features: RewriteFeatureFlags;
}

// ==================== Planning Types ====================

/**
 * Constraints for the rewrite
 */
export interface RewriteConstraints {
  /** Maximum length in characters */
  max_length: number;
  /** Forbid adding new numbers */
  forbid_new_numbers: boolean;
  /** Forbid adding new tools */
  forbid_new_tools: boolean;
  /** Forbid adding new companies */
  forbid_new_companies: boolean;
}

/**
 * Goal of the rewrite
 */
export type RewriteGoal = 'impact' | 'clarity' | 'ats' | 'conciseness';

/**
 * Complete rewrite plan
 */
export interface RewritePlan {
  /** Primary goal */
  goal: RewriteGoal;
  /** Issues to address */
  issues: string[];
  /** Planned transformations */
  transformations: MicroAction[];
  /** Constraints to enforce */
  constraints: RewriteConstraints;
  /** User input requests if needed */
  needs_user_input?: UserInputRequest[];
}

// ==================== Zod Validation Schemas ====================

/**
 * Evidence scope validation
 */
export const EvidenceScopeSchema = z.enum(['bullet_only', 'section', 'resume']);

/**
 * Evidence type validation
 */
export const EvidenceTypeSchema = z.enum(['bullet', 'section', 'skills', 'tools', 'titles']);

/**
 * Evidence item validation
 */
export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  type: EvidenceTypeSchema,
  scope: EvidenceScopeSchema,
  source: z.enum(['bullet', 'section', 'resume']),
  text: z.string().min(1),
  normalized_terms: z.array(z.string()).optional(),
});

/**
 * Evidence map item validation
 */
export const EvidenceMapItemSchema = z.object({
  improved_span: z.string().min(1),
  evidence_ids: z.array(z.string().min(1)).min(1),
});

/**
 * Validation severity
 */
export const ValidationSeveritySchema = z.enum(['info', 'warning', 'critical']);

/**
 * Validation item
 */
export const ValidationItemSchema = z.object({
  code: z.string(),
  severity: ValidationSeveritySchema,
  message: z.string(),
});

/**
 * Validation result
 */
export const ValidationResultSchema = z.object({
  passed: z.boolean(),
  items: z.array(ValidationItemSchema),
});

/**
 * Rewrite quality signals
 */
export const RewriteQualitySignalsSchema = z.object({
  stronger_verb: z.boolean(),
  added_metric: z.boolean(),
  more_specific: z.boolean(),
  removed_fluff: z.boolean(),
  tailored_to_role: z.boolean(),
});

/**
 * Confidence level
 */
export const ConfidenceLevelSchema = z.enum(['low', 'medium', 'high']);

/**
 * Section type
 */
export const SectionTypeSchema = z.enum(['experience', 'summary', 'skills', 'headline', 'projects']);

/**
 * Layer 1 signals validation
 */
export const Layer1SignalsSchema = z.object({
  weak_bullets: z.array(z.object({
    bullet: z.string(),
    index: z.number().optional(),
    issues: z.array(z.string()),
  })).optional(),
  extracted: z.object({
    skills: z.array(z.string()).optional(),
    tools: z.array(z.string()).optional(),
    titles: z.array(z.string()).optional(),
  }).optional(),
}).optional();

/**
 * Layer 2 signals validation
 */
export const Layer2SignalsSchema = z.object({
  target_role: z.string().optional(),
  missing_experience_types: z.array(z.string()).optional(),
  critical_missing_skills: z.array(z.string()).optional(),
}).optional();

/**
 * Bullet context validation
 */
export const BulletContextSchema = z.object({
  section_type: SectionTypeSchema,
  role: z.string().optional(),
  company: z.string().optional(),
  index: z.number().optional(),
});

/**
 * Base rewrite request fields
 */
const BaseRewriteRequestFields = {
  target_role: z.string().optional(),
  target_seniority: z.nativeEnum(SeniorityLevel).optional(),
  job_description: z.string().optional(),
  evidence: z.array(EvidenceItemSchema).optional(),
  evidence_scope: EvidenceScopeSchema.optional(),
  allow_resume_enrichment: z.boolean().optional(),
  layer1: Layer1SignalsSchema,
  layer2: Layer2SignalsSchema,
};

/**
 * Bullet rewrite request validation
 */
export const BulletRewriteRequestSchema = z.object({
  type: z.literal('bullet'),
  bullet: z.string().min(1, 'Bullet text is required'),
  context: BulletContextSchema.optional(),
  issues: z.array(z.string()).optional(),
  ...BaseRewriteRequestFields,
});

/**
 * Summary rewrite request validation
 */
export const SummaryRewriteRequestSchema = z.object({
  type: z.literal('summary'),
  summary: z.string().min(1, 'Summary text is required'),
  ...BaseRewriteRequestFields,
});

/**
 * Section rewrite request validation
 */
export const SectionRewriteRequestSchema = z.object({
  type: z.literal('section'),
  bullets: z.array(z.string().min(1)).min(1, 'At least one bullet is required'),
  section_type: SectionTypeSchema.optional(),
  role: z.string().optional(),
  company: z.string().optional(),
  ...BaseRewriteRequestFields,
});

/**
 * Union schema for all rewrite requests
 */
export const RewriteRequestSchema = z.discriminatedUnion('type', [
  BulletRewriteRequestSchema,
  SummaryRewriteRequestSchema,
  SectionRewriteRequestSchema,
]);

/**
 * User input request validation
 */
export const UserInputRequestSchema = z.object({
  prompt: z.string(),
  example_answer: z.string().optional(),
});

/**
 * Bullet rewrite result validation
 */
export const BulletRewriteResultSchema = z.object({
  type: z.literal('bullet'),
  original: z.string(),
  improved: z.string(),
  reasoning: z.string(),
  changes: RewriteQualitySignalsSchema,
  evidence_map: z.array(EvidenceMapItemSchema),
  validation: ValidationResultSchema,
  confidence: ConfidenceLevelSchema,
  needs_user_input: z.array(UserInputRequestSchema).optional(),
  estimated_score_gain: z.number().min(0).max(10).optional(),
});

/**
 * Summary rewrite result validation
 */
export const SummaryRewriteResultSchema = z.object({
  type: z.literal('summary'),
  original: z.string(),
  improved: z.string(),
  reasoning: z.string(),
  changes: RewriteQualitySignalsSchema,
  evidence_map: z.array(EvidenceMapItemSchema),
  validation: ValidationResultSchema,
  confidence: ConfidenceLevelSchema,
  estimated_score_gain: z.number().min(0).max(10).optional(),
});

/**
 * Section bullet detail validation
 */
export const SectionBulletDetailSchema = z.object({
  index: z.number(),
  bullet_result: BulletRewriteResultSchema,
});

/**
 * Section rewrite result validation
 */
export const SectionRewriteResultSchema = z.object({
  type: z.literal('section'),
  original_bullets: z.array(z.string()),
  improved_bullets: z.array(z.string()),
  estimated_aggregate_gain: z.number(),
  validation_summary: ValidationResultSchema,
  per_bullet_details: z.array(SectionBulletDetailSchema),
  section_notes: z.array(z.string()),
  confidence: ConfidenceLevelSchema,
});

/**
 * Union schema for all rewrite results
 */
export const RewriteResultSchema = z.discriminatedUnion('type', [
  BulletRewriteResultSchema,
  SummaryRewriteResultSchema,
  SectionRewriteResultSchema,
]);

// ==================== Type Guards ====================

/**
 * Check if a request is a bullet rewrite request
 */
export function isBulletRequest(request: RewriteRequest): request is BulletRewriteRequest {
  return request.type === 'bullet';
}

/**
 * Check if a request is a summary rewrite request
 */
export function isSummaryRequest(request: RewriteRequest): request is SummaryRewriteRequest {
  return request.type === 'summary';
}

/**
 * Check if a request is a section rewrite request
 */
export function isSectionRequest(request: RewriteRequest): request is SectionRewriteRequest {
  return request.type === 'section';
}

/**
 * Check if a result is a bullet rewrite result
 */
export function isBulletResult(result: RewriteResult): result is BulletRewriteResult {
  return result.type === 'bullet';
}

/**
 * Check if a result is a summary rewrite result
 */
export function isSummaryResult(result: RewriteResult): result is SummaryRewriteResult {
  return result.type === 'summary';
}

/**
 * Check if a result is a section rewrite result
 */
export function isSectionResult(result: RewriteResult): result is SectionRewriteResult {
  return result.type === 'section';
}

/**
 * Check if validation passed (no critical issues)
 */
export function validationPassed(validation: ValidationResult): boolean {
  return validation.passed;
}

/**
 * Check if a string is a valid evidence scope
 */
export function isValidEvidenceScope(scope: string): scope is EvidenceScope {
  return ['bullet_only', 'section', 'resume'].includes(scope);
}

/**
 * Check if a string is a valid confidence level
 */
export function isValidConfidenceLevel(level: string): level is ConfidenceLevel {
  return ['low', 'medium', 'high'].includes(level);
}
