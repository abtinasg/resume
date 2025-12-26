/**
 * Layer 8 - AI Coach Interface
 * Public API Exports
 *
 * This module exports the primary Coach functions and types
 * for use by other layers and external consumers.
 *
 * MVP Scope: Template-based responses only.
 */

// ==================== Main Coach Functions ====================

export {
  generateResponse,
  explainDecision,
  formatMessage,
  greet,
  help,
  explainStrategy,
  explainJob,
  explainResumeScore,
  explainTaskAction,
} from './coach';

// ==================== Types ====================

// Core request/response types
export type {
  CoachRequest,
  CoachResponse,
  CoachContext,
  ResponseType,
  ExplanationType,
  ResponseMetadata,
} from './types';

// Tone types
export type {
  Tone,
  ToneSettings,
  ToneContext,
} from './types';

// Context types
export type {
  StrategyExplanationContext,
  ActionExplanationContext,
  JobExplanationContext,
  ScoreExplanationContext,
  ProgressContext,
} from './types';

// Config types
export type {
  CoachConfig,
  ToneConfig,
  OutputFormat,
} from './types';

// Template types
export type {
  TemplateDefinition,
  TemplateVariable,
  TemplateVariables,
} from './types';

// Validation schemas
export {
  ToneSchema,
  OutputFormatSchema,
  ResponseTypeSchema,
  ExplanationTypeSchema,
  CoachRequestSchema,
  CoachContextSchema,
} from './types';

// Type guards
export {
  isValidTone,
  isValidOutputFormat,
  isValidResponseType,
  isValidExplanationType,
} from './types';

// ==================== Explanation Functions ====================

export {
  // Strategy explanations
  explainFromAnalysis,
  explainModeChange,
  generateBriefSummary,
  explainResumeImprovementNeeded,
  explainApplyModeReady,
  explainRethinkNeeded,
  explainConfidenceLevel,

  // Action explanations
  explainTask,
  explainBlueprint,
  explainDailyPlan,
  explainActionPriority,
  explainResumeImprovement,
  explainApplicationAction,
  explainFollowUpAction,
  groupAndExplainActions,
  generateCompletionMessage,

  // Job explanations
  explainRankedJob,
  explainJobFit,
  explainJobCareerCapital,
  explainJobList,
  explainTopRecommendations,
  explainGaps,
  explainCategory,
  explainApplicationStrategy,
  getFitScoreIndicator,
  generateJobOneLiner,

  // Score explanations
  explainEvaluation,
  explainScore,
  explainDimensions,
  explainFeedback,
  explainQuickWins,
  explainWeaknesses,
  explainWeakBullet,
  explainWeakBullets,
  explainScoreChange,
  explainScoreGoal,
} from './explanations';

// ==================== Templates ====================

export {
  // Greetings
  generateWelcome,
  generateReturningGreeting,
  generateDailyCheckIn,
  generateAcknowledgment,
  generateTimeBasedGreeting,
  generateMotivationalGreeting,
  generateFarewell,
  generateStatusGreeting,

  // Strategy explanations
  explainImproveResumeFirst,
  explainApplyMode,
  explainRethinkTargets,
  explainStrategyDecision,
  explainStrategyChange,
  formatKeyInsights,
  generateStrategySummary,

  // Action explanations
  explainBulletImprovement,
  explainJobApplication,
  explainFollowUp,
  explainSkillGap,
  explainAction,
  explainTaskList,
  explainPriority,

  // Job recommendations
  explainReachJob,
  explainTargetJob,
  explainSafetyJob,
  explainAvoidJob,
  explainJobRanking,
  explainFitScore,
  explainCareerCapital,
  generateJobListSummary,

  // Progress updates
  weeklyProgressSummary,
  dailyProgressUpdate,
  milestoneAchieved,
  celebrateFirstInterview,
  celebrateScoreImprovement,
  behindScheduleMessage,
  onTrackMessage,
  aheadOfScheduleMessage,

  // Encouragement
  encourageAfterRejection,
  encourageNoResponse,
  encourageAfterMultipleRejections,
  motivateToApply,
  motivateToImproveResume,
  motivateToFollowUp,
  celebrateProgress,
  encourageWhenStuck,
  encourageWhenAnxious,
  encourageKeepGoing,
  encourageApplicationMilestone,
  encourageConsistency,

  // Help responses
  explainHowItWorks,
  explainStrategyModes,
  explainScoring,
  listAvailableCommands,
  explainJobMatching,
  explainResumeImprovement as explainResumeImprovementProcess,
  explainInterviewRate,
  explainWeeklyTargets,
  quickHelp,
  didNotUnderstand,
  outOfScope,
} from './templates';

// ==================== Tone Functions ====================

export {
  // Detection
  detectTone,
  scoreTones,
  getToneRecommendation,
  analyzePipelineForTone,
  getToneForEvent,

  // Adaptation
  adaptTone,
  addEmojiPrefix,
  getScoreEmoji,
  getProgressEmoji,
  adjustSentenceStyle,
  formatWithTone,
  getOpeningPhrase,
  getClosingPhrase,
} from './tone';

// ==================== Formatters ====================

export {
  // Markdown formatters
  bold,
  italic,
  heading,
  link,
  inlineCode,
  codeBlock,
  blockquote,
  horizontalRule,
  bulletItem,
  numberedItem,
  joinParagraphs,
  joinLines,
  section,
  keyValue,
  score as formatScore,
  percentage,
  progressIndicator,
  markdownToText,
  markdownToHtml,
  formatAsOutput,
  truncate,
  wordWrap,
  normalizeWhitespace,

  // List formatters
  formatBulletList,
  formatNumberedList,
  formatCheckboxList,
  formatInlineList,
  formatComparisonTable,
  formatKeyValueList,
  formatSummaryList,
  formatPriorityList,
} from './formatters';

export type { ListItem, ListOptions, TableColumn } from './formatters';

// ==================== Configuration ====================

export {
  loadCoachConfig,
  getConfig,
  getDefaultTone,
  getToneConfig,
  getToneSettings,
  getThresholds,
  getMessageSettings,
  getEmoji,
  getAcknowledgmentPhrase,
  clearConfigCache,
  isToneSupported,
  getAvailableTones,
} from './config';

// ==================== Error Handling ====================

export {
  CoachError,
  CoachErrorCode,
  ERROR_MESSAGES,
  createTemplateNotFoundError,
  createTemplateRenderError,
  createMissingVariableError,
  createMissingContextError,
  createInvalidToneError,
  createExplanationError,
  createInternalError,
  isCoachError,
  getUserFriendlyError,
  wrapError,
  handleError,
} from './errors';
