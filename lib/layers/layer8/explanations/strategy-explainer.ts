/**
 * Layer 8 - AI Coach Interface
 * Strategy Explainer
 *
 * Generates comprehensive strategy explanations by combining
 * Layer 2 analysis with Coach templates.
 */

import type {
  StrategyExplanationContext,
  CoachContext,
  Tone,
} from '../types';
import type { StrategyAnalysisResult, ModeReasoning, GapAnalysis } from '../../layer2/types';
import type { PipelineState } from '../../layer5/types';
import { StrategyMode } from '../../shared/types';
import {
  explainStrategyDecision,
  explainStrategyChange,
  formatKeyInsights,
  generateStrategySummary,
} from '../templates';
import { joinParagraphs } from '../formatters';
import { adaptTone } from '../tone';

// ==================== Main Explainer Functions ====================

/**
 * Generate a comprehensive strategy explanation from Layer 2 analysis
 */
export function explainFromAnalysis(
  analysis: Partial<StrategyAnalysisResult>,
  state?: {
    pipelineState?: Partial<PipelineState>;
    scoreThreshold?: number;
  },
  tone?: Tone
): string {
  // Build explanation context
  const context: StrategyExplanationContext = {
    mode: analysis.recommended_mode || StrategyMode.IMPROVE_RESUME_FIRST,
    reasoning: analysis.mode_reasoning as ModeReasoning | undefined,
    resumeScore: extractResumeScore(analysis),
    scoreThreshold: state?.scoreThreshold || 75,
    gaps: analysis.gaps as GapAnalysis | undefined,
    pipelineState: state?.pipelineState,
    keyInsights: analysis.key_insights,
  };

  // Generate the explanation
  let explanation = explainStrategyDecision(context);

  // Add key insights if available
  if (analysis.key_insights && analysis.key_insights.length > 0) {
    explanation = joinParagraphs(explanation, formatKeyInsights(analysis.key_insights));
  }

  // Add priority actions if available
  if (analysis.priority_actions && analysis.priority_actions.length > 0) {
    const prioritySection = formatPriorityActions(analysis.priority_actions);
    explanation = joinParagraphs(explanation, prioritySection);
  }

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Generate a strategy change explanation
 */
export function explainModeChange(
  fromMode: StrategyMode,
  toMode: StrategyMode,
  reason: string,
  context?: {
    resumeScore?: number;
    pipelineState?: Partial<PipelineState>;
  },
  tone?: Tone
): string {
  const explanationContext: StrategyExplanationContext = {
    mode: toMode,
    resumeScore: context?.resumeScore || 0,
    pipelineState: context?.pipelineState,
  };

  let explanation = explainStrategyChange(fromMode, toMode, reason, explanationContext);

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Generate a brief strategy summary
 */
export function generateBriefSummary(
  analysis: Partial<StrategyAnalysisResult>,
  tone?: Tone
): string {
  const context: StrategyExplanationContext = {
    mode: analysis.recommended_mode || StrategyMode.IMPROVE_RESUME_FIRST,
    resumeScore: extractResumeScore(analysis),
  };

  let summary = generateStrategySummary(context);

  // Adapt tone if specified
  if (tone) {
    summary = adaptTone(summary, tone);
  }

  return summary;
}

// ==================== Helper Functions ====================

/**
 * Extract resume score from analysis (may be in different places)
 */
function extractResumeScore(analysis: Partial<StrategyAnalysisResult>): number {
  // The overall_fit_score in Layer 2 includes resume quality
  // For strategy explanations, we typically want the resume-specific score
  // which would come from the input, but we can use overall_fit_score as proxy
  return analysis.overall_fit_score || 0;
}

/**
 * Format priority actions list
 */
function formatPriorityActions(actions: string[]): string {
  if (actions.length === 0) return '';

  const intro = '**Recommended Actions:**';
  const items = actions.slice(0, 5).map((action, i) => `${i + 1}. ${action}`);

  return `${intro}\n${items.join('\n')}`;
}

// ==================== Mode-Specific Explanations ====================

/**
 * Explain why resume improvement is needed
 */
export function explainResumeImprovementNeeded(
  resumeScore: number,
  threshold: number,
  weaknesses?: string[]
): string {
  let explanation = `Your resume score of ${resumeScore}/100 is below our competitive threshold of ${threshold}. Improving your resume before applying will significantly increase your response rate.`;

  if (weaknesses && weaknesses.length > 0) {
    explanation += '\n\n**Areas to Focus On:**\n';
    explanation += weaknesses.slice(0, 5).map(w => `- ${formatWeakness(w)}`).join('\n');
  }

  return explanation;
}

/**
 * Explain why apply mode is recommended
 */
export function explainApplyModeReady(
  resumeScore: number,
  threshold: number,
  pipelineState?: Partial<PipelineState>
): string {
  let explanation = `Your resume score of ${resumeScore}/100 exceeds our threshold of ${threshold}. You're ready to start applying!`;

  if (pipelineState) {
    if (pipelineState.total_applications === 0) {
      explanation += " Let's get your first applications out there.";
    } else if (pipelineState.interview_rate && pipelineState.interview_rate > 0.05) {
      explanation += " Your current approach is working well.";
    }
  }

  return explanation;
}

/**
 * Explain why rethinking targets is needed
 */
export function explainRethinkNeeded(
  pipelineState: Partial<PipelineState>,
  analysis?: Partial<StrategyAnalysisResult>
): string {
  const apps = pipelineState.total_applications || 0;
  const interviews = pipelineState.interview_requests || 0;
  const rate = pipelineState.interview_rate || 0;

  let explanation = `After ${apps} applications with ${interviews} interview${interviews !== 1 ? 's' : ''} (${(rate * 100).toFixed(1)}% rate), we should analyze what's working and what isn't.`;

  explanation += '\n\n**Key Questions to Consider:**\n';
  explanation += '- Are you targeting roles at the right seniority level?\n';
  explanation += '- Is there a pattern in the types of companies responding?\n';
  explanation += '- Could your target role description be refined?';

  return explanation;
}

// ==================== Formatting Helpers ====================

/**
 * Format a weakness code into human-readable text
 */
function formatWeakness(weakness: string): string {
  const weaknessMap: Record<string, string> = {
    no_metrics: 'Missing quantified metrics in achievements',
    weak_verbs: 'Using weak action verbs',
    generic_descriptions: 'Too many generic descriptions',
    poor_formatting: 'Formatting issues affecting readability',
    spelling_errors: 'Spelling or grammar errors',
    few_skills_listed: 'Not enough skills listed',
    no_learning_signals: 'Missing continuous learning indicators',
    no_experience: 'No work experience listed',
    too_short: 'Resume content is too brief',
  };

  return weaknessMap[weakness] || weakness;
}

// ==================== Confidence Explanations ====================

/**
 * Explain the confidence level of an analysis
 */
export function explainConfidenceLevel(
  confidence: 'low' | 'medium' | 'high',
  context?: string
): string {
  const explanations = {
    high: 'I have high confidence in this recommendation based on clear signals in the data.',
    medium: 'This recommendation has moderate confidence. Some signals are mixed, but the overall direction is clear.',
    low: "This recommendation has lower confidence due to limited data. Consider it directional guidance rather than definitive advice.",
  };

  let explanation = explanations[confidence];

  if (context) {
    explanation += ` ${context}`;
  }

  return explanation;
}
