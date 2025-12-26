/**
 * Layer 8 - AI Coach Interface
 * Score Explainer
 *
 * Generates explanations for resume scores and evaluations.
 */

import type {
  ScoreExplanationContext,
  Tone,
} from '../types';
import type { 
  EvaluationResult, 
  DimensionScores, 
  EvaluationFeedback,
  WeakBullet,
  QuickWin 
} from '../../layer1/types';
import { bold, joinParagraphs, formatBulletList, section, progressIndicator } from '../formatters';
import { getScoreEmoji, adaptTone } from '../tone';
import { getEmoji } from '../config';

// ==================== Main Explainer Functions ====================

/**
 * Generate a comprehensive score explanation
 */
export function explainEvaluation(
  evaluation: EvaluationResult,
  tone?: Tone
): string {
  // Build context
  const context: ScoreExplanationContext = {
    overallScore: evaluation.resume_score,
    level: evaluation.level,
    dimensions: evaluation.dimensions,
    weaknesses: evaluation.weaknesses,
    strengths: evaluation.feedback.strengths,
    quickWins: evaluation.feedback.quick_wins?.map(qw => ({
      action: qw.action,
      estimatedImpact: qw.estimated_impact,
    })),
  };

  let explanation = explainScore(context);

  // Add dimension breakdown
  const dimensionExplanation = explainDimensions(evaluation.dimensions);
  if (dimensionExplanation) {
    explanation = joinParagraphs(explanation, dimensionExplanation);
  }

  // Add feedback
  const feedbackExplanation = explainFeedback(evaluation.feedback);
  if (feedbackExplanation) {
    explanation = joinParagraphs(explanation, feedbackExplanation);
  }

  // Adapt tone if specified
  if (tone) {
    explanation = adaptTone(explanation, tone);
  }

  return explanation;
}

/**
 * Generate a score overview
 */
export function explainScore(context: ScoreExplanationContext): string {
  const emoji = getScoreEmoji(context.overallScore);
  
  const intro = `${emoji} ${bold('Resume Score')}: ${context.overallScore}/100 (${context.level})`;
  
  let explanation = intro;

  // Add score interpretation
  const interpretation = getScoreInterpretation(context.overallScore);
  explanation = joinParagraphs(explanation, interpretation);

  return explanation;
}

/**
 * Explain dimension scores
 */
export function explainDimensions(dimensions?: Partial<DimensionScores>): string {
  if (!dimensions) return '';

  const emoji = getEmoji('chart');
  const intro = `${emoji} ${bold('Score Breakdown')}`;

  const items: string[] = [];

  if (dimensions.skill_capital) {
    items.push(formatDimensionScore('Skill Capital', dimensions.skill_capital.score, 
      'Your technical skills and expertise'));
  }

  if (dimensions.execution_impact) {
    items.push(formatDimensionScore('Execution Impact', dimensions.execution_impact.score,
      'Quantified achievements and results'));
  }

  if (dimensions.learning_adaptivity) {
    items.push(formatDimensionScore('Learning Adaptivity', dimensions.learning_adaptivity.score,
      'Growth and continuous learning signals'));
  }

  if (dimensions.signal_quality) {
    items.push(formatDimensionScore('Signal Quality', dimensions.signal_quality.score,
      'Formatting, clarity, and ATS compatibility'));
  }

  if (items.length === 0) return '';

  return joinParagraphs(intro, formatBulletList(items));
}

/**
 * Explain feedback from evaluation
 */
export function explainFeedback(feedback: EvaluationFeedback): string {
  const sections: string[] = [];

  // Strengths
  if (feedback.strengths && feedback.strengths.length > 0) {
    const strengthsSection = section(
      '✅ Strengths',
      formatBulletList(feedback.strengths)
    );
    sections.push(strengthsSection);
  }

  // Critical gaps
  if (feedback.critical_gaps && feedback.critical_gaps.length > 0) {
    const gapsSection = section(
      '⚠️ Areas to Improve',
      formatBulletList(feedback.critical_gaps)
    );
    sections.push(gapsSection);
  }

  // Quick wins
  if (feedback.quick_wins && feedback.quick_wins.length > 0) {
    const quickWinsSection = explainQuickWins(feedback.quick_wins);
    sections.push(quickWinsSection);
  }

  return sections.join('\n\n');
}

/**
 * Explain quick wins
 */
export function explainQuickWins(quickWins: QuickWin[]): string {
  const emoji = getEmoji('lightbulb');
  const intro = `${emoji} ${bold('Quick Wins')} — Easy improvements with high impact:`;

  const items = quickWins.slice(0, 5).map(qw => ({
    text: qw.action,
    detail: `${qw.estimated_impact} • ${qw.effort}`,
  }));

  return joinParagraphs(intro, formatBulletList(items));
}

// ==================== Weakness Explanations ====================

/**
 * Explain weaknesses in detail
 */
export function explainWeaknesses(weaknesses: string[]): string {
  if (!weaknesses || weaknesses.length === 0) {
    return 'No significant weaknesses identified.';
  }

  const emoji = getEmoji('target');
  const intro = `${emoji} ${bold('Areas for Improvement')}`;

  const explanations = weaknesses.map(formatWeaknessExplanation);

  return joinParagraphs(intro, formatBulletList(explanations));
}

/**
 * Format a single weakness with explanation
 */
function formatWeaknessExplanation(weakness: string): string {
  const explanations: Record<string, { issue: string; fix: string }> = {
    no_metrics: {
      issue: 'Missing quantified metrics',
      fix: 'Add numbers to your achievements (e.g., "increased by 25%")',
    },
    weak_verbs: {
      issue: 'Using weak action verbs',
      fix: 'Replace verbs like "helped" or "worked" with stronger alternatives',
    },
    generic_descriptions: {
      issue: 'Generic descriptions',
      fix: 'Be specific about your contributions and impact',
    },
    poor_formatting: {
      issue: 'Formatting issues',
      fix: 'Ensure consistent formatting, clear sections, and readable fonts',
    },
    spelling_errors: {
      issue: 'Spelling or grammar errors',
      fix: 'Proofread carefully or use a grammar checker',
    },
    few_skills_listed: {
      issue: 'Not enough skills listed',
      fix: 'Add more relevant skills that match your target roles',
    },
    no_learning_signals: {
      issue: 'Missing learning/growth indicators',
      fix: 'Add certifications, courses, or self-improvement activities',
    },
    too_short: {
      issue: 'Resume is too brief',
      fix: 'Add more detail to your experience and achievements',
    },
  };

  const info = explanations[weakness];
  if (info) {
    return `${bold(info.issue)}: ${info.fix}`;
  }

  return weakness;
}

// ==================== Weak Bullet Explanations ====================

/**
 * Explain a weak bullet and how to improve it
 */
export function explainWeakBullet(bullet: WeakBullet): string {
  const intro = `${bold('Bullet to Improve:')}`;
  const quote = `> "${bullet.bullet}"`;
  
  const location = `(${bullet.location.title} at ${bullet.location.company})`;
  
  let explanation = joinParagraphs(intro, quote, location);

  // Explain issues
  if (bullet.issues && bullet.issues.length > 0) {
    const issueExplanations = bullet.issues.map(formatBulletIssue);
    explanation = joinParagraphs(
      explanation,
      section('Issues', formatBulletList(issueExplanations))
    );
  }

  return explanation;
}

/**
 * Format a bullet issue
 */
function formatBulletIssue(issue: string): string {
  const issueMap: Record<string, string> = {
    weak_verb: 'Starts with a weak verb — use a stronger action word',
    no_metric: 'No quantified metric — add a number or percentage',
    vague: 'Too vague — be more specific about what you did',
    too_short: 'Too short — add more detail about your impact',
  };

  return issueMap[issue] || issue;
}

/**
 * Explain multiple weak bullets
 */
export function explainWeakBullets(bullets: WeakBullet[]): string {
  if (!bullets || bullets.length === 0) {
    return 'No weak bullets identified.';
  }

  const emoji = getEmoji('target');
  const intro = `${emoji} ${bold(`${bullets.length} Bullets to Improve`)}`;

  const summaries = bullets.slice(0, 5).map((b, i) => {
    const preview = b.bullet.length > 60 ? b.bullet.slice(0, 60) + '...' : b.bullet;
    const issues = b.issues.join(', ');
    return `${i + 1}. "${preview}" — ${issues}`;
  });

  let explanation = joinParagraphs(intro, summaries.join('\n'));

  if (bullets.length > 5) {
    explanation += `\n\n...and ${bullets.length - 5} more.`;
  }

  return explanation;
}

// ==================== Score Comparison ====================

/**
 * Explain score improvement
 */
export function explainScoreChange(
  oldScore: number,
  newScore: number
): string {
  const change = newScore - oldScore;
  const emoji = change > 0 ? getEmoji('chart') : getEmoji('warning');

  let explanation: string;

  if (change > 0) {
    explanation = `${emoji} ${bold('Score Improved!')} Your resume score went from ${oldScore} to ${bold(String(newScore))} (+${change} points).`;
    
    if (change >= 10) {
      explanation += ' That\'s significant progress!';
    } else if (change >= 5) {
      explanation += ' Nice improvement!';
    } else {
      explanation += ' Every point helps.';
    }
  } else if (change < 0) {
    explanation = `${emoji} Your resume score went from ${oldScore} to ${newScore} (${change} points). Let's review what changed.`;
  } else {
    explanation = `Your resume score remains at ${newScore}/100.`;
  }

  return explanation;
}

/**
 * Explain what's needed to reach a target score
 */
export function explainScoreGoal(
  currentScore: number,
  targetScore: number,
  quickWins?: QuickWin[]
): string {
  const gap = targetScore - currentScore;

  if (gap <= 0) {
    return `You've already reached your target score of ${targetScore}! 🎉`;
  }

  let explanation = `To reach your target of ${bold(String(targetScore))}, you need to improve by ${bold(`+${gap}`)} points.`;

  if (quickWins && quickWins.length > 0) {
    // Estimate potential from quick wins
    const potentialGain = quickWins.length * 3; // Rough estimate
    
    if (potentialGain >= gap) {
      explanation += ` The quick wins I identified could get you there!`;
    } else {
      explanation += ` Start with the quick wins, then we'll work on deeper improvements.`;
    }
  }

  return explanation;
}

// ==================== Helper Functions ====================

/**
 * Format a dimension score line
 */
function formatDimensionScore(
  name: string,
  score: number,
  description: string
): string {
  const indicator = getScoreIndicator(score);
  return `${indicator} ${bold(name)}: ${score}/100 — ${description}`;
}

/**
 * Get score indicator emoji
 */
function getScoreIndicator(score: number): string {
  if (score >= 80) return '🟢';
  if (score >= 60) return '🟡';
  if (score >= 40) return '🟠';
  return '🔴';
}

/**
 * Get score interpretation text
 */
function getScoreInterpretation(score: number): string {
  if (score >= 90) {
    return 'Your resume is exceptional! It effectively communicates your value and stands out from the competition.';
  }
  if (score >= 75) {
    return 'Your resume is strong and competitive. Minor improvements could make it even better.';
  }
  if (score >= 60) {
    return 'Your resume is solid but has room for improvement. Focus on the suggested changes to increase your response rate.';
  }
  if (score >= 40) {
    return 'Your resume needs work before it will be competitive. Let\'s focus on the key improvements.';
  }
  return 'Your resume needs significant improvement. Let\'s start with the fundamentals.';
}
