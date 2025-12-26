/**
 * Layer 8 - AI Coach Interface
 * Job Recommendation Templates
 *
 * Template functions for explaining job recommendations and rankings.
 */

import type { JobExplanationContext, Tone } from '../types';
import type { JobCategory, CareerCapital } from '../../layer6/types';
import { bold, joinParagraphs, formatBulletList, section, keyValue, score } from '../formatters';
import { getEmoji } from '../config';

// ==================== Job Category Explanations ====================

/**
 * Explain a reach job (stretch opportunity)
 */
export function explainReachJob(context: JobExplanationContext): string {
  const emoji = getEmoji('rocket');
  
  const job = context.rankedJob?.job;
  const jobTitle = job?.job_title || 'This role';
  const company = job?.company || 'the company';
  const fitScore = context.fitScore;
  
  const intro = `${emoji} ${bold('Reach Opportunity')}: ${jobTitle} at ${company}`;
  
  let explanation = `This is a ${bold('stretch role')} with a fit score of ${bold(`${fitScore}/100`)}. While it's ambitious, it could be a great growth opportunity.`;
  
  // Add specific reasons
  const reasons: string[] = [];
  
  if (context.userLevel && context.jobLevel) {
    if (context.jobLevel !== context.userLevel) {
      reasons.push(`The role is at ${context.jobLevel} level while your experience suggests ${context.userLevel} level`);
    }
  }
  
  if (context.quickInsights && context.quickInsights.length > 0) {
    reasons.push(...context.quickInsights.slice(0, 3));
  }
  
  if (reasons.length > 0) {
    explanation = joinParagraphs(
      explanation,
      section('Why It\'s a Reach', formatBulletList(reasons))
    );
  }
  
  // Add green flags if available
  if (context.greenFlags && context.greenFlags.length > 0) {
    explanation = joinParagraphs(
      explanation,
      section('What\'s Good', formatBulletList(context.greenFlags.slice(0, 3)))
    );
  }
  
  // Add career capital context
  if (context.careerCapital) {
    const capitalSummary = summarizeCareerCapital(context.careerCapital);
    if (capitalSummary) {
      explanation = joinParagraphs(explanation, capitalSummary);
    }
  }
  
  return joinParagraphs(intro, explanation);
}

/**
 * Explain a target job (good fit)
 */
export function explainTargetJob(context: JobExplanationContext): string {
  const emoji = getEmoji('target');
  
  const job = context.rankedJob?.job;
  const jobTitle = job?.job_title || 'This role';
  const company = job?.company || 'the company';
  const fitScore = context.fitScore;
  
  const intro = `${emoji} ${bold('Target Match')}: ${jobTitle} at ${company}`;
  
  let explanation = `This is a ${bold('strong match')} with a fit score of ${bold(`${fitScore}/100`)}. Your skills and experience align well with the requirements.`;
  
  // Add specific strengths
  if (context.greenFlags && context.greenFlags.length > 0) {
    explanation = joinParagraphs(
      explanation,
      section('Why It\'s a Good Fit', formatBulletList(context.greenFlags.slice(0, 4)))
    );
  }
  
  // Add any considerations
  if (context.redFlags && context.redFlags.length > 0) {
    explanation = joinParagraphs(
      explanation,
      section('Things to Consider', formatBulletList(context.redFlags.slice(0, 2)))
    );
  }
  
  // Add career capital context
  if (context.careerCapital) {
    const capitalSummary = summarizeCareerCapital(context.careerCapital);
    if (capitalSummary) {
      explanation = joinParagraphs(explanation, capitalSummary);
    }
  }
  
  return joinParagraphs(intro, explanation);
}

/**
 * Explain a safety job (easy win)
 */
export function explainSafetyJob(context: JobExplanationContext): string {
  const emoji = getEmoji('success');
  
  const job = context.rankedJob?.job;
  const jobTitle = job?.job_title || 'This role';
  const company = job?.company || 'the company';
  const fitScore = context.fitScore;
  
  const intro = `${emoji} ${bold('Safety Option')}: ${jobTitle} at ${company}`;
  
  let explanation = `This is a ${bold('safe bet')} with a fit score of ${bold(`${fitScore}/100`)}. You exceed the requirements, making this a high-probability opportunity.`;
  
  // Add why it's safe
  const reasons: string[] = [
    'Your experience exceeds the requirements',
    'High likelihood of getting an interview',
    'Good for building momentum in your search',
  ];
  
  if (context.quickInsights && context.quickInsights.length > 0) {
    reasons.length = 0;
    reasons.push(...context.quickInsights.slice(0, 3));
  }
  
  explanation = joinParagraphs(
    explanation,
    section('Why It\'s Safe', formatBulletList(reasons))
  );
  
  // Add consideration about potential downsides
  const considerations = [
    'May not be as challenging as your current level',
    'Consider if the compensation matches your expectations',
  ];
  
  explanation = joinParagraphs(
    explanation,
    section('Considerations', formatBulletList(considerations))
  );
  
  return joinParagraphs(intro, explanation);
}

/**
 * Explain why to avoid a job
 */
export function explainAvoidJob(context: JobExplanationContext): string {
  const emoji = getEmoji('warning');
  
  const job = context.rankedJob?.job;
  const jobTitle = job?.job_title || 'This role';
  const company = job?.company || 'the company';
  const fitScore = context.fitScore;
  
  const intro = `${emoji} ${bold('Not Recommended')}: ${jobTitle} at ${company}`;
  
  let explanation = `This role has a fit score of ${bold(`${fitScore}/100`)}, which suggests it may not be the best use of your application effort.`;
  
  // Add specific reasons
  if (context.redFlags && context.redFlags.length > 0) {
    explanation = joinParagraphs(
      explanation,
      section('Concerns', formatBulletList(context.redFlags))
    );
  }
  
  // Add alternative suggestion
  explanation = joinParagraphs(
    explanation,
    `${bold('Suggestion')}: Focus your energy on better-matched opportunities instead.`
  );
  
  return joinParagraphs(intro, explanation);
}

// ==================== Main Job Explanation ====================

/**
 * Generate a job explanation based on category
 */
export function explainJobRanking(context: JobExplanationContext): string {
  switch (context.category) {
    case 'reach':
      return explainReachJob(context);
    case 'target':
      return explainTargetJob(context);
    case 'safety':
      return explainSafetyJob(context);
    case 'avoid':
      return explainAvoidJob(context);
    default:
      return explainGenericJob(context);
  }
}

/**
 * Generic job explanation
 */
function explainGenericJob(context: JobExplanationContext): string {
  const job = context.rankedJob?.job;
  const jobTitle = job?.job_title || 'This role';
  const company = job?.company || 'the company';
  const fitScore = context.fitScore;
  
  const intro = `${bold('Job')}: ${jobTitle} at ${company}`;
  let explanation = `Fit score: ${bold(`${fitScore}/100`)}`;
  
  if (context.quickInsights && context.quickInsights.length > 0) {
    explanation = joinParagraphs(
      explanation,
      section('Key Points', formatBulletList(context.quickInsights))
    );
  }
  
  return joinParagraphs(intro, explanation);
}

// ==================== Fit Score Explanation ====================

/**
 * Explain a fit score breakdown
 */
export function explainFitScore(context: JobExplanationContext): string {
  const emoji = getEmoji('chart');
  
  const intro = `${emoji} ${bold('Fit Score Breakdown')}`;
  
  const fitScore = context.fitScore;
  const category = getCategoryDescription(context.category);
  
  let explanation = `Your overall fit score is ${bold(`${fitScore}/100`)}, which puts this in the ${bold(category)} category.`;
  
  // Add breakdown if available from rankedJob
  const rankedJob = context.rankedJob;
  if (rankedJob?.score_breakdown) {
    const breakdown = rankedJob.score_breakdown;
    const items: string[] = [];
    
    if (breakdown.fit_component !== undefined) {
      items.push(`Skills & Experience Match: ${breakdown.fit_component}/100`);
    }
    if (breakdown.preference_component !== undefined) {
      items.push(`Preference Match: ${breakdown.preference_component}/100`);
    }
    if (breakdown.freshness_component !== undefined) {
      items.push(`Posting Freshness: ${breakdown.freshness_component}/100`);
    }
    
    if (items.length > 0) {
      explanation = joinParagraphs(
        explanation,
        section('Score Components', formatBulletList(items))
      );
    }
  }
  
  return joinParagraphs(intro, explanation);
}

// ==================== Career Capital Explanation ====================

/**
 * Explain career capital potential
 */
export function explainCareerCapital(context: JobExplanationContext): string {
  const emoji = getEmoji('star');
  
  const careerCapital = context.careerCapital;
  if (!careerCapital) {
    return '';
  }
  
  const intro = `${emoji} ${bold('Career Capital Analysis')}`;
  
  const items: string[] = [];
  
  if (careerCapital.brand_score !== undefined) {
    items.push(`Brand/Reputation: ${getScoreLabel(careerCapital.brand_score)}`);
  }
  if (careerCapital.skill_growth_score !== undefined) {
    items.push(`Skill Growth: ${getScoreLabel(careerCapital.skill_growth_score)}`);
  }
  if (careerCapital.network_score !== undefined) {
    items.push(`Network Opportunities: ${getScoreLabel(careerCapital.network_score)}`);
  }
  if (careerCapital.comp_score !== undefined) {
    items.push(`Compensation: ${getScoreLabel(careerCapital.comp_score)}`);
  }
  
  if (items.length === 0) {
    return '';
  }
  
  return joinParagraphs(intro, formatBulletList(items));
}

/**
 * Summarize career capital briefly
 */
function summarizeCareerCapital(careerCapital: Partial<CareerCapital>): string {
  if (!careerCapital.score) {
    return '';
  }
  
  const score = careerCapital.score;
  let assessment: string;
  
  if (score >= 80) {
    assessment = 'excellent career growth potential';
  } else if (score >= 60) {
    assessment = 'good career growth potential';
  } else if (score >= 40) {
    assessment = 'moderate career growth potential';
  } else {
    assessment = 'limited career growth potential';
  }
  
  return `${bold('Career Capital')}: This role offers ${assessment} (${score}/100).`;
}

// ==================== Helper Functions ====================

/**
 * Get human-readable category description
 */
function getCategoryDescription(category: JobCategory): string {
  switch (category) {
    case 'reach':
      return 'Reach';
    case 'target':
      return 'Target';
    case 'safety':
      return 'Safety';
    case 'avoid':
      return 'Not Recommended';
    default:
      return category;
  }
}

/**
 * Get label for a score value
 */
function getScoreLabel(score: number): string {
  if (score >= 80) return `High (${score}/100)`;
  if (score >= 60) return `Good (${score}/100)`;
  if (score >= 40) return `Moderate (${score}/100)`;
  return `Low (${score}/100)`;
}

// ==================== Job List Summaries ====================

/**
 * Generate a summary of job recommendations
 */
export function generateJobListSummary(
  jobs: { category: JobCategory; count: number }[],
  topRecommendation?: string
): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold('Your Job Matches')}`;
  
  const items = jobs.map(j => `${getCategoryDescription(j.category)}: ${j.count} jobs`);
  
  let summary = joinParagraphs(intro, formatBulletList(items));
  
  if (topRecommendation) {
    summary = joinParagraphs(
      summary,
      `${bold('Top Pick')}: ${topRecommendation}`
    );
  }
  
  return summary;
}
