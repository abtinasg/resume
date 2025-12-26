/**
 * Layer 8 - AI Coach Interface
 * Type Definitions v1.0
 *
 * This module defines all TypeScript types and interfaces for the AI Coach Interface.
 * The Coach provides template-based explanations and context-aware messaging.
 *
 * MVP Scope: Template-based responses only - no LLM calls, NLP, or complex AI.
 *
 * Based on: layer_8_ai_coach_interface_v3.0.md (Sections 0-6, MVP scope)
 */

import { z } from 'zod';
import { StrategyMode, SeniorityLevel, Priority } from '../shared/types';
import type { StrategyAnalysisResult, GapAnalysis, ModeReasoning } from '../layer2/types';
import type { EvaluationResult, FitScore, WeakBullet, DimensionScores } from '../layer1/types';
import type { RankedJob, JobCategory, CareerCapital } from '../layer6/types';
import type { WeeklyPlan, DailyPlan, Task, PipelineState } from '../layer5/types';

// ==================== Re-exports for Convenience ====================

export { StrategyMode, SeniorityLevel, Priority };

// ==================== Tone Types ====================

/**
 * Tone options for Coach responses
 * Based on spec Section 6 - Tone Adaptation
 */
export type Tone = 'professional' | 'empathetic' | 'encouraging' | 'direct';

/**
 * Tone configuration settings
 */
export interface ToneSettings {
  /** Formality level */
  formality: 'high' | 'medium' | 'low';
  /** Emoji usage level */
  emojiUsage: 'none' | 'minimal' | 'moderate';
  /** Sentence style preference */
  sentenceStyle: 'complete' | 'concise' | 'casual';
  /** Whether to include acknowledgment phrases */
  includeAcknowledgment: boolean;
  /** Whether to include positive reinforcement */
  positiveReinforcement: boolean;
}

/**
 * Context signals for tone detection
 */
export interface ToneContext {
  /** User's current state/mood signals */
  userSignals?: {
    /** Is user discouraged? */
    discouraged?: boolean;
    /** Is user frustrated? */
    frustrated?: boolean;
    /** Is user making progress? */
    progressing?: boolean;
    /** Is there urgency? */
    urgent?: boolean;
  };
  /** Recent events */
  recentEvents?: {
    /** User received rejection */
    rejection?: boolean;
    /** User received interview */
    interview?: boolean;
    /** User received offer */
    offer?: boolean;
    /** Score improved */
    scoreImproved?: boolean;
  };
  /** Pipeline state */
  pipelineState?: Partial<PipelineState>;
}

// ==================== Request/Response Types ====================

/**
 * Types of explanations the Coach can generate
 */
export type ExplanationType =
  | 'strategy'
  | 'action'
  | 'job_ranking'
  | 'score'
  | 'gap'
  | 'plan'
  | 'progress';

/**
 * Types of responses the Coach can generate
 */
export type ResponseType =
  | 'greeting'
  | 'strategy_explanation'
  | 'action_explanation'
  | 'job_recommendation'
  | 'progress_update'
  | 'encouragement'
  | 'help'
  | 'milestone';

/**
 * Output format for Coach responses
 */
export type OutputFormat = 'text' | 'markdown' | 'html';

/**
 * Coach request for generating responses
 */
export interface CoachRequest {
  /** Type of response requested */
  type: ResponseType;
  /** Desired tone (optional, will be detected if not provided) */
  tone?: Tone;
  /** Output format */
  format?: OutputFormat;
  /** Context for the response */
  context: CoachContext;
}

/**
 * Context data for generating responses
 */
export interface CoachContext {
  // User state
  /** User's name (for personalization) */
  userName?: string;
  /** Current strategy mode */
  strategyMode?: StrategyMode;
  /** Resume score */
  resumeScore?: number;
  /** Target roles */
  targetRoles?: string[];
  /** Years of experience */
  yearsExperience?: number;

  // Pipeline metrics
  /** Pipeline state */
  pipelineState?: Partial<PipelineState>;
  /** Applications this week */
  applicationsThisWeek?: number;
  /** Weekly target */
  weeklyTarget?: number;

  // Specific data for explanations
  /** Strategy analysis result */
  strategyAnalysis?: Partial<StrategyAnalysisResult>;
  /** Evaluation result */
  evaluation?: Partial<EvaluationResult>;
  /** Ranked job being discussed */
  rankedJob?: Partial<RankedJob>;
  /** Weekly plan */
  weeklyPlan?: Partial<WeeklyPlan>;
  /** Daily plan */
  dailyPlan?: Partial<DailyPlan>;
  /** Specific task */
  task?: Partial<Task>;
  /** Weak bullet */
  weakBullet?: Partial<WeakBullet>;

  // Event-specific
  /** Event type for milestone/encouragement */
  event?: string;
  /** Job title (for milestone messages) */
  jobTitle?: string;
  /** Company name */
  company?: string;
  /** Score change */
  scoreChange?: number;
  /** Old score */
  oldScore?: number;
  /** New score */
  newScore?: number;

  // Tone signals
  /** Tone context for detection */
  toneContext?: ToneContext;
}

/**
 * Coach response structure
 */
export interface CoachResponse {
  /** Main message content */
  message: string;
  /** Tone used in the response */
  tone: Tone;
  /** Output format */
  format: OutputFormat;
  /** Response type */
  type: ResponseType;
  /** Generation metadata */
  metadata: ResponseMetadata;
}

/**
 * Response metadata for tracking
 */
export interface ResponseMetadata {
  /** Template ID used */
  templateId: string;
  /** Timestamp (ISO 8601) */
  generatedAt: string;
  /** Variables substituted */
  variablesUsed: string[];
  /** Word count */
  wordCount: number;
  /** Character count */
  characterCount: number;
}

// ==================== Explanation Contexts ====================

/**
 * Context for strategy explanations
 */
export interface StrategyExplanationContext {
  /** Current strategy mode */
  mode: StrategyMode;
  /** Mode reasoning from Layer 2 */
  reasoning?: ModeReasoning;
  /** Resume score */
  resumeScore: number;
  /** Score threshold for apply mode */
  scoreThreshold?: number;
  /** Gap analysis */
  gaps?: Partial<GapAnalysis>;
  /** Pipeline state */
  pipelineState?: Partial<PipelineState>;
  /** Key insights */
  keyInsights?: string[];
}

/**
 * Context for action explanations
 */
export interface ActionExplanationContext {
  /** Action type */
  actionType: string;
  /** Action title */
  title: string;
  /** Why this action is recommended */
  whyNow: string;
  /** Expected outcome/benefit */
  expectedOutcome?: string;
  /** Estimated time */
  estimatedMinutes?: number;
  /** Priority level */
  priority?: number;
  /** Specific payload data */
  payload?: Record<string, unknown>;
}

/**
 * Context for job ranking explanations
 */
export interface JobExplanationContext {
  /** Ranked job data */
  rankedJob: Partial<RankedJob>;
  /** Job category */
  category: JobCategory;
  /** Fit score */
  fitScore: number;
  /** User's seniority level */
  userLevel?: SeniorityLevel;
  /** Job's expected seniority */
  jobLevel?: SeniorityLevel;
  /** Career capital analysis */
  careerCapital?: Partial<CareerCapital>;
  /** Quick insights */
  quickInsights?: string[];
  /** Green flags */
  greenFlags?: string[];
  /** Red flags */
  redFlags?: string[];
}

/**
 * Context for score explanations
 */
export interface ScoreExplanationContext {
  /** Overall score */
  overallScore: number;
  /** Score level */
  level: string;
  /** Dimension scores */
  dimensions?: Partial<DimensionScores>;
  /** Weaknesses identified */
  weaknesses?: string[];
  /** Strengths identified */
  strengths?: string[];
  /** Quick wins */
  quickWins?: Array<{ action: string; estimatedImpact: string }>;
}

/**
 * Context for progress update messages
 */
export interface ProgressContext {
  /** Progress type */
  progressType: 'weekly' | 'daily' | 'milestone';
  /** Completion percentage */
  completionPercentage?: number;
  /** Tasks completed */
  tasksCompleted?: number;
  /** Total tasks */
  totalTasks?: number;
  /** Applications submitted */
  applicationsSubmitted?: number;
  /** Applications target */
  applicationsTarget?: number;
  /** Score improvement */
  scoreImprovement?: number;
  /** Milestone type */
  milestoneType?: string;
}

// ==================== Template Types ====================

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable name */
  name: string;
  /** Variable type */
  type: 'string' | 'number' | 'boolean' | 'list';
  /** Whether required */
  required: boolean;
  /** Default value */
  defaultValue?: string | number | boolean;
  /** Description */
  description?: string;
}

/**
 * Template definition
 */
export interface TemplateDefinition {
  /** Template ID */
  id: string;
  /** Template category */
  category: string;
  /** Template name */
  name: string;
  /** Template content with variable placeholders */
  template: string;
  /** Variables used in template */
  variables: TemplateVariable[];
  /** Supported tones for this template */
  supportedTones: Tone[];
  /** Default tone */
  defaultTone: Tone;
  /** Description */
  description?: string;
}

/**
 * Template variables for substitution
 */
export type TemplateVariables = Record<string, string | number | boolean | string[] | undefined>;

// ==================== Configuration Types ====================

/**
 * Tone configuration from config file
 */
export interface ToneConfig {
  /** Formality setting */
  formality: 'high' | 'medium' | 'low';
  /** Emoji usage setting */
  emoji_usage: 'none' | 'minimal' | 'moderate';
  /** Sentence style */
  sentence_style?: 'complete' | 'concise' | 'casual';
  /** Acknowledgment phrases */
  acknowledgment_phrases?: string[];
  /** Positive reinforcement enabled */
  positive_reinforcement?: boolean;
}

/**
 * Complete Coach configuration
 */
export interface CoachConfig {
  /** Config version */
  version: string;
  /** Tone configurations */
  tones: Record<Tone, ToneConfig>;
  /** Default tone */
  default_tone: Tone;
  /** Score thresholds */
  thresholds: {
    /** Minimum score for apply mode */
    apply_mode_score: number;
    /** Low interview rate threshold */
    low_interview_rate: number;
    /** Application volume for testing */
    application_volume_test: number;
  };
  /** Message settings */
  messages: {
    /** Maximum message length */
    max_length: number;
    /** Whether to include emojis by default */
    include_emojis: boolean;
  };
}

// ==================== Zod Validation Schemas ====================

/**
 * Tone schema
 */
export const ToneSchema = z.enum(['professional', 'empathetic', 'encouraging', 'direct']);

/**
 * Output format schema
 */
export const OutputFormatSchema = z.enum(['text', 'markdown', 'html']);

/**
 * Response type schema
 */
export const ResponseTypeSchema = z.enum([
  'greeting',
  'strategy_explanation',
  'action_explanation',
  'job_recommendation',
  'progress_update',
  'encouragement',
  'help',
  'milestone',
]);

/**
 * Explanation type schema
 */
export const ExplanationTypeSchema = z.enum([
  'strategy',
  'action',
  'job_ranking',
  'score',
  'gap',
  'plan',
  'progress',
]);

/**
 * Tone context schema
 */
export const ToneContextSchema = z.object({
  userSignals: z.object({
    discouraged: z.boolean().optional(),
    frustrated: z.boolean().optional(),
    progressing: z.boolean().optional(),
    urgent: z.boolean().optional(),
  }).optional(),
  recentEvents: z.object({
    rejection: z.boolean().optional(),
    interview: z.boolean().optional(),
    offer: z.boolean().optional(),
    scoreImproved: z.boolean().optional(),
  }).optional(),
  pipelineState: z.record(z.unknown()).optional(),
}).optional();

/**
 * Coach context schema
 */
export const CoachContextSchema = z.object({
  userName: z.string().optional(),
  strategyMode: z.nativeEnum(StrategyMode).optional(),
  resumeScore: z.number().min(0).max(100).optional(),
  targetRoles: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  pipelineState: z.record(z.unknown()).optional(),
  applicationsThisWeek: z.number().min(0).optional(),
  weeklyTarget: z.number().min(0).optional(),
  strategyAnalysis: z.record(z.unknown()).optional(),
  evaluation: z.record(z.unknown()).optional(),
  rankedJob: z.record(z.unknown()).optional(),
  weeklyPlan: z.record(z.unknown()).optional(),
  dailyPlan: z.record(z.unknown()).optional(),
  task: z.record(z.unknown()).optional(),
  weakBullet: z.record(z.unknown()).optional(),
  event: z.string().optional(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  scoreChange: z.number().optional(),
  oldScore: z.number().optional(),
  newScore: z.number().optional(),
  toneContext: ToneContextSchema,
});

/**
 * Coach request schema
 */
export const CoachRequestSchema = z.object({
  type: ResponseTypeSchema,
  tone: ToneSchema.optional(),
  format: OutputFormatSchema.optional(),
  context: CoachContextSchema,
});

// ==================== Type Guards ====================

/**
 * Check if a tone is valid
 */
export function isValidTone(tone: string): tone is Tone {
  return ['professional', 'empathetic', 'encouraging', 'direct'].includes(tone);
}

/**
 * Check if an output format is valid
 */
export function isValidOutputFormat(format: string): format is OutputFormat {
  return ['text', 'markdown', 'html'].includes(format);
}

/**
 * Check if a response type is valid
 */
export function isValidResponseType(type: string): type is ResponseType {
  return [
    'greeting',
    'strategy_explanation',
    'action_explanation',
    'job_recommendation',
    'progress_update',
    'encouragement',
    'help',
    'milestone',
  ].includes(type);
}

/**
 * Check if an explanation type is valid
 */
export function isValidExplanationType(type: string): type is ExplanationType {
  return ['strategy', 'action', 'job_ranking', 'score', 'gap', 'plan', 'progress'].includes(type);
}
