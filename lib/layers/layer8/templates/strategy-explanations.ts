/**
 * Layer 8 - AI Coach Interface
 * Strategy Explanation Templates
 *
 * Template functions for explaining strategy decisions.
 * Based on Layer 2 strategy analysis.
 */

import type { StrategyExplanationContext, Tone } from '../types';
import { StrategyMode } from '../../shared/types';
import { bold, joinParagraphs, formatBulletList, section } from '../formatters';
import { getEmoji, getThresholds } from '../config';

// ==================== Strategy Mode Explanations ====================

/**
 * Explain why IMPROVE_RESUME_FIRST mode is recommended
 */
export function explainImproveResumeFirst(context: StrategyExplanationContext): string {
  const emoji = getEmoji('target');
  const threshold = context.scoreThreshold || 75;
  
  const intro = `${emoji} ${bold('Current Mode: Improve Resume First')}`;
  
  const reasoning = `Based on your resume score of ${bold(String(context.resumeScore))} (below our threshold of ${threshold}), I recommend focusing on improving your resume first. A stronger resume significantly increases your interview rate.`;
  
  const benefits: string[] = [
    'Higher response rate from recruiters',
    'Better match scores for job applications',
    'More confidence in your application materials',
  ];
  
  const explanation = joinParagraphs(
    intro,
    reasoning,
    section('Why This Matters', formatBulletList(benefits))
  );
  
  // Add specific improvements if gaps are available
  if (context.gaps) {
    const improvements: string[] = [];
    
    if (context.gaps.skills?.critical_missing && context.gaps.skills.critical_missing.length > 0) {
      improvements.push(`Add missing skills: ${context.gaps.skills.critical_missing.slice(0, 3).join(', ')}`);
    }
    
    if (improvements.length > 0) {
      return joinParagraphs(
        explanation,
        section('Recommended Improvements', formatBulletList(improvements))
      );
    }
  }
  
  return explanation;
}

/**
 * Explain why APPLY_MODE is recommended
 */
export function explainApplyMode(context: StrategyExplanationContext): string {
  const emoji = getEmoji('rocket');
  const threshold = context.scoreThreshold || 75;
  
  const intro = `${emoji} ${bold('Current Mode: Apply Mode')}`;
  
  const reasoning = `Your resume score of ${bold(String(context.resumeScore))} is above our threshold of ${threshold}. This means your resume is competitive and ready for applications. Let's focus on finding and applying to the right opportunities.`;
  
  const stats: string[] = [];
  
  if (context.pipelineState) {
    const state = context.pipelineState;
    if (state.total_applications !== undefined) {
      stats.push(`Total applications: ${state.total_applications}`);
    }
    if (state.interview_requests !== undefined) {
      stats.push(`Interview requests: ${state.interview_requests}`);
    }
    if (state.interview_rate !== undefined) {
      const rate = (state.interview_rate * 100).toFixed(1);
      stats.push(`Interview rate: ${rate}%`);
    }
  }
  
  let explanation = joinParagraphs(intro, reasoning);
  
  if (stats.length > 0) {
    explanation = joinParagraphs(
      explanation,
      section('Your Pipeline Stats', formatBulletList(stats))
    );
  }
  
  return explanation;
}

/**
 * Explain why RETHINK_TARGETS mode is recommended
 */
export function explainRethinkTargets(context: StrategyExplanationContext): string {
  const emoji = getEmoji('thinking');
  
  const intro = `${emoji} ${bold('Current Mode: Rethink Targets')}`;
  
  let reasoning = "I've analyzed your recent application results, and the data suggests we should pause and reconsider our targeting strategy.";
  
  // Add specific reasoning if available
  if (context.pipelineState) {
    const state = context.pipelineState;
    if (state.total_applications !== undefined && 
        state.interview_requests !== undefined &&
        state.total_applications >= 20 && 
        state.interview_requests === 0) {
      reasoning = `You've sent ${state.total_applications} applications but haven't received any interview requests yet. This pattern suggests we should analyze what's not working and adjust our approach.`;
    } else if (state.interview_rate !== undefined && state.interview_rate < 0.05) {
      const rate = (state.interview_rate * 100).toFixed(1);
      reasoning = `Your current interview rate is ${rate}%, which is below the healthy threshold of 5-8%. Let's figure out why and make targeted improvements.`;
    }
  }
  
  const actions: string[] = [
    'Analyze which types of roles have better response rates',
    'Review if your target seniority level is aligned with your experience',
    'Consider if your target companies match your background',
    'Look for patterns in roles where you got callbacks',
  ];
  
  const explanation = joinParagraphs(
    intro,
    reasoning,
    section('Next Steps', formatBulletList(actions))
  );
  
  return explanation;
}

// ==================== Main Strategy Explanation ====================

/**
 * Generate a comprehensive strategy explanation based on current mode
 */
export function explainStrategyDecision(context: StrategyExplanationContext): string {
  switch (context.mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      return explainImproveResumeFirst(context);
    case StrategyMode.APPLY_MODE:
      return explainApplyMode(context);
    case StrategyMode.RETHINK_TARGETS:
      return explainRethinkTargets(context);
    default:
      return explainDefaultStrategy(context);
  }
}

/**
 * Default strategy explanation when mode is unknown
 */
function explainDefaultStrategy(context: StrategyExplanationContext): string {
  const emoji = getEmoji('info');
  const thresholds = getThresholds();
  
  let explanation = `${emoji} ${bold('Your Current Strategy')}`;
  
  if (context.resumeScore !== undefined) {
    explanation += `\n\nYour resume score is ${context.resumeScore}/100.`;
    
    if (context.resumeScore < thresholds.apply_mode_score) {
      explanation += ' I recommend focusing on improving your resume to increase your chances of getting interviews.';
    } else {
      explanation += ' Your resume is competitive — let\'s focus on finding the right opportunities.';
    }
  }
  
  return explanation;
}

// ==================== Strategy Change Explanations ====================

/**
 * Explain a strategy mode change
 */
export function explainStrategyChange(
  fromMode: StrategyMode,
  toMode: StrategyMode,
  reason: string,
  context: StrategyExplanationContext
): string {
  const emoji = getEmoji('lightbulb');
  
  const fromDescription = getStrategyModeDescription(fromMode);
  const toDescription = getStrategyModeDescription(toMode);
  
  const intro = `${emoji} ${bold('Strategy Update')}`;
  const change = `I'm recommending we switch from ${bold(fromDescription)} mode to ${bold(toDescription)} mode.`;
  
  let explanation = joinParagraphs(intro, change);
  
  if (reason) {
    explanation = joinParagraphs(explanation, `${bold('Why')}: ${reason}`);
  }
  
  // Add mode-specific details
  const modeDetails = getModeDetails(toMode, context);
  if (modeDetails) {
    explanation = joinParagraphs(explanation, modeDetails);
  }
  
  return explanation;
}

/**
 * Get human-readable strategy mode description
 */
function getStrategyModeDescription(mode: StrategyMode): string {
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      return 'Resume Improvement';
    case StrategyMode.APPLY_MODE:
      return 'Active Applying';
    case StrategyMode.RETHINK_TARGETS:
      return 'Strategy Review';
    default:
      return String(mode);
  }
}

/**
 * Get additional details for a strategy mode
 */
function getModeDetails(mode: StrategyMode, context: StrategyExplanationContext): string {
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      return `${bold('What this means')}: We'll prioritize resume improvements before sending more applications. This typically takes 3-5 focused sessions.`;
    
    case StrategyMode.APPLY_MODE:
      return `${bold('What this means')}: Your resume is ready. We'll focus on finding great matches and helping you apply efficiently.`;
    
    case StrategyMode.RETHINK_TARGETS:
      return `${bold('What this means')}: We'll take a few days to analyze your results and adjust targeting before resuming applications.`;
    
    default:
      return '';
  }
}

// ==================== Key Insights ====================

/**
 * Format key insights from strategy analysis
 */
export function formatKeyInsights(insights: string[]): string {
  if (!insights || insights.length === 0) {
    return '';
  }
  
  const emoji = getEmoji('lightbulb');
  const intro = `${emoji} ${bold('Key Insights')}`;
  
  return joinParagraphs(intro, formatBulletList(insights));
}

// ==================== Summary Templates ====================

/**
 * Generate a brief strategy summary
 */
export function generateStrategySummary(context: StrategyExplanationContext): string {
  const mode = context.mode;
  const score = context.resumeScore;
  
  let summary = `You're in ${bold(getStrategyModeDescription(mode))} mode`;
  
  if (score !== undefined) {
    summary += ` with a resume score of ${score}/100`;
  }
  
  summary += '.';
  
  // Add brief insight based on mode
  switch (mode) {
    case StrategyMode.IMPROVE_RESUME_FIRST:
      summary += ' Focus on strengthening your resume before sending applications.';
      break;
    case StrategyMode.APPLY_MODE:
      summary += ' Your resume is competitive — let\'s find great opportunities.';
      break;
    case StrategyMode.RETHINK_TARGETS:
      summary += ' Let\'s analyze your results and refine your targeting.';
      break;
  }
  
  return summary;
}
