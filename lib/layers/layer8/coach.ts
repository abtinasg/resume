/**
 * Layer 8 - AI Coach Interface
 * Main Facade
 *
 * This is the primary public interface for the AI Coach.
 * It provides a unified API for generating explanations, responses, and messages.
 *
 * MVP Scope: Template-based responses only.
 */

import type {
  CoachRequest,
  CoachResponse,
  CoachContext,
  ResponseType,
  ExplanationType,
  Tone,
  OutputFormat,
  ResponseMetadata,
  StrategyExplanationContext,
  ActionExplanationContext,
  JobExplanationContext,
  ScoreExplanationContext,
  ProgressContext,
} from './types';
import type { StrategyAnalysisResult } from '../layer2/types';
import type { EvaluationResult } from '../layer1/types';
import type { RankedJob } from '../layer6/types';
import type { Task, WeeklyPlan, DailyPlan } from '../layer5/types';
import { StrategyMode } from '../shared/types';

// Config
import { getDefaultTone } from './config';

// Tone
import { detectTone, adaptTone, formatWithTone } from './tone';

// Formatters
import { formatAsOutput, joinParagraphs, normalizeWhitespace } from './formatters';

// Templates
import {
  generateWelcome,
  generateReturningGreeting,
  generateDailyCheckIn,
  generateAcknowledgment,
  explainHowItWorks,
  explainStrategyModes,
  explainScoring,
  listAvailableCommands,
  encourageAfterRejection,
  encourageKeepGoing,
  celebrateProgress,
  weeklyProgressSummary,
  dailyProgressUpdate,
  milestoneAchieved,
} from './templates';

// Explanations
import {
  explainFromAnalysis,
  generateBriefSummary,
  explainTask,
  explainDailyPlan,
  explainRankedJob,
  explainJobList,
  explainEvaluation,
  explainScore,
  explainWeaknesses,
} from './explanations';

// Errors
import {
  CoachError,
  CoachErrorCode,
  createMissingContextError,
  handleError,
} from './errors';

// ==================== Main Public API ====================

/**
 * Generate a Coach response based on request type and context
 */
export function generateResponse(request: CoachRequest): CoachResponse {
  const startTime = Date.now();

  try {
    // Determine tone
    const tone = request.tone || detectTone(request.context.toneContext);
    const format = request.format || 'markdown';

    // Generate message based on type
    let message = generateMessageByType(request.type, request.context, tone);

    // Format output
    message = formatAsOutput(message, format);
    message = normalizeWhitespace(message);

    // Build metadata
    const metadata: ResponseMetadata = {
      templateId: `${request.type}_template`,
      generatedAt: new Date().toISOString(),
      variablesUsed: extractUsedVariables(request.context),
      wordCount: message.split(/\s+/).length,
      characterCount: message.length,
    };

    return {
      message,
      tone,
      format,
      type: request.type,
      metadata,
    };
  } catch (error) {
    const coachError = handleError(error, 'generateResponse');
    
    // Return error message as response
    return {
      message: `I encountered an issue: ${coachError.message}. ${coachError.suggestion}`,
      tone: 'professional',
      format: request.format || 'markdown',
      type: request.type,
      metadata: {
        templateId: 'error_template',
        generatedAt: new Date().toISOString(),
        variablesUsed: [],
        wordCount: 0,
        characterCount: 0,
      },
    };
  }
}

/**
 * Generate an explanation for a decision
 */
export function explainDecision(
  decisionType: ExplanationType,
  context: CoachContext,
  tone?: Tone
): string {
  const effectiveTone = tone || detectTone(context.toneContext);

  try {
    switch (decisionType) {
      case 'strategy':
        return explainStrategyDecision(context, effectiveTone);
      case 'action':
        return explainActionDecision(context, effectiveTone);
      case 'job_ranking':
        return explainJobDecision(context, effectiveTone);
      case 'score':
        return explainScoreDecision(context, effectiveTone);
      case 'gap':
        return explainGapDecision(context, effectiveTone);
      case 'plan':
        return explainPlanDecision(context, effectiveTone);
      case 'progress':
        return explainProgressDecision(context, effectiveTone);
      default:
        return `I can't explain that decision type yet.`;
    }
  } catch (error) {
    const coachError = handleError(error, 'explainDecision');
    return `I couldn't generate the explanation: ${coachError.message}`;
  }
}

/**
 * Format a message with tone and output format
 */
export function formatMessage(
  content: string,
  tone: Tone = 'professional',
  format: OutputFormat = 'markdown'
): string {
  let result = adaptTone(content, tone);
  result = formatAsOutput(result, format);
  return normalizeWhitespace(result);
}

// ==================== Response Type Handlers ====================

/**
 * Generate message based on response type
 */
function generateMessageByType(
  type: ResponseType,
  context: CoachContext,
  tone: Tone
): string {
  switch (type) {
    case 'greeting':
      return generateGreeting(context, tone);
    case 'strategy_explanation':
      return generateStrategyExplanation(context, tone);
    case 'action_explanation':
      return generateActionExplanation(context, tone);
    case 'job_recommendation':
      return generateJobRecommendation(context, tone);
    case 'progress_update':
      return generateProgressUpdate(context, tone);
    case 'encouragement':
      return generateEncouragement(context, tone);
    case 'help':
      return generateHelpResponse(context, tone);
    case 'milestone':
      return generateMilestoneMessage(context, tone);
    default:
      return 'How can I help you with your job search today?';
  }
}

/**
 * Generate a greeting message
 */
function generateGreeting(context: CoachContext, tone: Tone): string {
  // Check if returning user
  if (context.strategyMode || context.resumeScore !== undefined) {
    return formatWithTone(generateReturningGreeting(context), tone);
  }

  // Check if daily check-in
  if (context.dailyPlan) {
    return formatWithTone(generateDailyCheckIn(context), tone);
  }

  // Default welcome
  return formatWithTone(generateWelcome(context), tone);
}

/**
 * Generate a strategy explanation
 */
function generateStrategyExplanation(context: CoachContext, tone: Tone): string {
  if (!context.strategyAnalysis && !context.strategyMode) {
    return formatWithTone(
      'I need more information about your current strategy to explain it. Let me analyze your situation.',
      tone
    );
  }

  if (context.strategyAnalysis) {
    return explainFromAnalysis(
      context.strategyAnalysis as Partial<StrategyAnalysisResult>,
      {
        pipelineState: context.pipelineState,
      },
      tone
    );
  }

  // Minimal explanation from just mode
  const strategyContext: StrategyExplanationContext = {
    mode: context.strategyMode || StrategyMode.IMPROVE_RESUME_FIRST,
    resumeScore: context.resumeScore || 0,
    pipelineState: context.pipelineState,
  };

  return generateBriefSummary(
    { recommended_mode: strategyContext.mode },
    tone
  );
}

/**
 * Generate an action explanation
 */
function generateActionExplanation(context: CoachContext, tone: Tone): string {
  if (!context.task) {
    return formatWithTone(
      'I need a specific task to explain. Check your daily plan for current recommendations.',
      tone
    );
  }

  return explainTask(context.task as Task, tone);
}

/**
 * Generate a job recommendation explanation
 */
function generateJobRecommendation(context: CoachContext, tone: Tone): string {
  if (!context.rankedJob) {
    return formatWithTone(
      'I need job data to provide recommendations. Paste a job description or check your saved jobs.',
      tone
    );
  }

  return explainRankedJob(context.rankedJob as RankedJob, tone);
}

/**
 * Generate a progress update
 */
function generateProgressUpdate(context: CoachContext, tone: Tone): string {
  const progressContext: ProgressContext = {
    progressType: 'weekly',
    tasksCompleted: context.dailyPlan?.tasks?.filter(t => t.status === 'completed').length,
    totalTasks: context.dailyPlan?.tasks?.length,
    applicationsSubmitted: context.applicationsThisWeek,
    applicationsTarget: context.weeklyTarget,
  };

  if (context.pipelineState?.total_applications !== undefined) {
    progressContext.applicationsSubmitted = context.pipelineState.total_applications;
  }

  return formatWithTone(weeklyProgressSummary(progressContext), tone);
}

/**
 * Generate an encouragement message
 */
function generateEncouragement(context: CoachContext, tone: Tone): string {
  // Check for specific encouragement triggers
  if (context.toneContext?.recentEvents?.rejection) {
    return formatWithTone(encourageAfterRejection(context), tone);
  }

  if (context.toneContext?.userSignals?.progressing) {
    return formatWithTone(celebrateProgress(context), tone);
  }

  // Default encouragement
  return formatWithTone(encourageKeepGoing(context), tone);
}

/**
 * Generate a help response
 */
function generateHelpResponse(context: CoachContext, tone: Tone): string {
  // Could be more specific based on what help is needed
  return formatWithTone(explainHowItWorks(), tone);
}

/**
 * Generate a milestone message
 */
function generateMilestoneMessage(context: CoachContext, tone: Tone): string {
  return formatWithTone(milestoneAchieved(context), tone);
}

// ==================== Decision Explainers ====================

function explainStrategyDecision(context: CoachContext, tone: Tone): string {
  if (context.strategyAnalysis) {
    return explainFromAnalysis(
      context.strategyAnalysis as Partial<StrategyAnalysisResult>,
      { pipelineState: context.pipelineState },
      tone
    );
  }
  return formatWithTone('No strategy analysis available to explain.', tone);
}

function explainActionDecision(context: CoachContext, tone: Tone): string {
  if (context.task) {
    return explainTask(context.task as Task, tone);
  }
  if (context.dailyPlan?.tasks) {
    return explainDailyPlan(context.dailyPlan.tasks as Task[], tone);
  }
  return formatWithTone('No action to explain.', tone);
}

function explainJobDecision(context: CoachContext, tone: Tone): string {
  if (context.rankedJob) {
    return explainRankedJob(context.rankedJob as RankedJob, tone);
  }
  return formatWithTone('No job ranking to explain.', tone);
}

function explainScoreDecision(context: CoachContext, tone: Tone): string {
  if (context.evaluation) {
    return explainEvaluation(context.evaluation as EvaluationResult, tone);
  }
  if (context.resumeScore !== undefined) {
    return formatWithTone(
      explainScore({
        overallScore: context.resumeScore,
        level: getScoreLevel(context.resumeScore),
      }),
      tone
    );
  }
  return formatWithTone('No score data available to explain.', tone);
}

function explainGapDecision(context: CoachContext, tone: Tone): string {
  if (context.evaluation?.weaknesses) {
    return formatWithTone(
      explainWeaknesses(context.evaluation.weaknesses as string[]),
      tone
    );
  }
  return formatWithTone('No gap analysis available.', tone);
}

function explainPlanDecision(context: CoachContext, tone: Tone): string {
  if (context.dailyPlan?.tasks) {
    return explainDailyPlan(context.dailyPlan.tasks as Task[], tone);
  }
  if (context.weeklyPlan) {
    return formatWithTone('Weekly plan explanation coming soon.', tone);
  }
  return formatWithTone('No plan data available to explain.', tone);
}

function explainProgressDecision(context: CoachContext, tone: Tone): string {
  const progressContext: ProgressContext = {
    progressType: 'weekly',
    applicationsSubmitted: context.pipelineState?.total_applications,
    applicationsTarget: context.weeklyTarget,
  };
  return formatWithTone(weeklyProgressSummary(progressContext), tone);
}

// ==================== Utility Functions ====================

/**
 * Extract variables used from context (for metadata)
 */
function extractUsedVariables(context: CoachContext): string[] {
  const used: string[] = [];

  if (context.userName) used.push('userName');
  if (context.strategyMode) used.push('strategyMode');
  if (context.resumeScore !== undefined) used.push('resumeScore');
  if (context.pipelineState) used.push('pipelineState');
  if (context.strategyAnalysis) used.push('strategyAnalysis');
  if (context.evaluation) used.push('evaluation');
  if (context.rankedJob) used.push('rankedJob');
  if (context.task) used.push('task');
  if (context.dailyPlan) used.push('dailyPlan');
  if (context.weeklyPlan) used.push('weeklyPlan');

  return used;
}

/**
 * Get score level from numeric score
 * Note: These thresholds are consistent with Layer 1's ResumeLevel definitions
 */
function getScoreLevel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Solid';
  if (score >= 40) return 'Growing';
  return 'Early';
}

// ==================== Convenience Functions ====================

/**
 * Quick greeting generation
 */
export function greet(context: CoachContext): string {
  return generateResponse({
    type: 'greeting',
    context,
  }).message;
}

/**
 * Quick help generation
 */
export function help(): string {
  return generateResponse({
    type: 'help',
    context: {},
  }).message;
}

/**
 * Quick strategy explanation
 */
export function explainStrategy(
  analysis: Partial<StrategyAnalysisResult>,
  tone?: Tone
): string {
  return explainFromAnalysis(analysis, undefined, tone);
}

/**
 * Quick job explanation
 */
export function explainJob(rankedJob: RankedJob, tone?: Tone): string {
  return explainRankedJob(rankedJob, tone);
}

/**
 * Quick score explanation
 */
export function explainResumeScore(
  evaluation: EvaluationResult,
  tone?: Tone
): string {
  return explainEvaluation(evaluation, tone);
}

/**
 * Quick task explanation
 */
export function explainTaskAction(task: Task, tone?: Tone): string {
  return explainTask(task, tone);
}
