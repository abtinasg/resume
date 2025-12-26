/**
 * Layer 8 - AI Coach Interface
 * Explanations Module Exports
 */

// Strategy explainer exports
export {
  explainFromAnalysis,
  explainModeChange,
  generateBriefSummary,
  explainResumeImprovementNeeded,
  explainApplyModeReady,
  explainRethinkNeeded,
  explainConfidenceLevel,
} from './strategy-explainer';

// Action explainer exports
export {
  explainTask,
  explainBlueprint,
  explainDailyPlan,
  explainActionPriority,
  explainResumeImprovement,
  explainApplicationAction,
  explainFollowUpAction,
  groupAndExplainActions,
  generateCompletionMessage,
} from './action-explainer';

// Job explainer exports
export {
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
} from './job-explainer';

// Score explainer exports
export {
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
} from './score-explainer';
