/**
 * Layer 8 - AI Coach Interface
 * Help Response Templates
 *
 * Template functions for help, info, and system explanation messages.
 */

import type { CoachContext, Tone } from '../types';
import { StrategyMode } from '../../shared/types';
import { bold, joinParagraphs, formatBulletList, formatNumberedList, section } from '../formatters';
import { getEmoji } from '../config';

// ==================== System Explanation ====================

/**
 * Explain how the system works
 */
export function explainHowItWorks(): string {
  const emoji = getEmoji('info');
  
  const intro = `${emoji} ${bold('How I Can Help You')}`;
  
  const overview = 'I\'m your AI career coach. I analyze your resume, track your job search progress, and provide personalized guidance to help you land your next role.';
  
  const capabilities = [
    'Evaluate and improve your resume',
    'Find and rank job opportunities based on your fit',
    'Track your application pipeline',
    'Provide strategic advice based on your progress',
    'Help you stay motivated and on track',
  ];
  
  const howToUse = [
    'Upload your resume for analysis',
    'Tell me about roles you\'re interested in',
    'Paste job descriptions for fit analysis',
    'Check in regularly for guidance',
  ];
  
  return joinParagraphs(
    intro,
    overview,
    section('What I Can Do', formatBulletList(capabilities)),
    section('How to Get Started', formatBulletList(howToUse))
  );
}

/**
 * Explain the strategy modes
 */
export function explainStrategyModes(): string {
  const emoji = getEmoji('lightbulb');
  
  const intro = `${emoji} ${bold('Understanding Strategy Modes')}`;
  
  const overview = 'Your job search goes through different phases. I adapt my recommendations based on where you are in your journey.';
  
  const modes = [
    {
      text: `${bold('Resume Improvement Mode')}`,
      detail: 'Focus on strengthening your resume before sending applications. Used when your resume score is below threshold.',
    },
    {
      text: `${bold('Apply Mode')}`,
      detail: 'Your resume is competitive. Focus on finding great matches and applying efficiently.',
    },
    {
      text: `${bold('Rethink Targets Mode')}`,
      detail: 'Pause to analyze results and adjust strategy. Used when applications aren\'t generating expected responses.',
    },
  ];
  
  const switchingNote = 'I automatically recommend mode switches based on your progress, but you can always override if you prefer a different approach.';
  
  return joinParagraphs(
    intro,
    overview,
    formatBulletList(modes),
    switchingNote
  );
}

/**
 * Explain the scoring system
 */
export function explainScoring(): string {
  const emoji = getEmoji('chart');
  
  const intro = `${emoji} ${bold('Understanding Scores')}`;
  
  const resumeScore = section(
    'Resume Score (0-100)',
    'Measures the overall quality and effectiveness of your resume. Components include:\n' +
    formatBulletList([
      'Skill Capital: Your skills and expertise',
      'Execution Impact: Quantified achievements and results',
      'Learning Adaptivity: Growth and continuous learning signals',
      'Signal Quality: Formatting, clarity, and ATS compatibility',
    ])
  );
  
  const fitScore = section(
    'Job Fit Score (0-100)',
    'How well you match a specific job. Components include:\n' +
    formatBulletList([
      'Skills Match: How your skills align with requirements',
      'Tools Match: Technical tools and platforms',
      'Experience Match: Type and level of experience',
      'Seniority Alignment: Career level fit',
    ])
  );
  
  const levels = section(
    'Score Levels',
    formatBulletList([
      '90-100: Exceptional',
      '75-89: Strong',
      '60-74: Solid',
      '40-59: Growing',
      '0-39: Early',
    ])
  );
  
  return joinParagraphs(intro, resumeScore, fitScore, levels);
}

/**
 * List available commands/capabilities
 */
export function listAvailableCommands(): string {
  const emoji = getEmoji('info');
  
  const intro = `${emoji} ${bold('What You Can Ask Me')}`;
  
  const categories = [
    {
      category: 'Resume',
      commands: [
        'Show my resume score',
        'How can I improve my resume?',
        'What are my weak points?',
      ],
    },
    {
      category: 'Strategy',
      commands: [
        'What\'s my current strategy?',
        'Why am I in this mode?',
        'What should I focus on?',
      ],
    },
    {
      category: 'Jobs',
      commands: [
        'Find matching jobs',
        'Analyze this job description',
        'Why is this job ranked this way?',
      ],
    },
    {
      category: 'Progress',
      commands: [
        'Show my progress',
        'What\'s my plan for today?',
        'How am I doing this week?',
      ],
    },
    {
      category: 'Help',
      commands: [
        'How does this work?',
        'Explain strategy modes',
        'What do the scores mean?',
      ],
    },
  ];
  
  let content = intro;
  
  for (const cat of categories) {
    content = joinParagraphs(
      content,
      section(cat.category, formatBulletList(cat.commands))
    );
  }
  
  return content;
}

// ==================== Feature Explanations ====================

/**
 * Explain job matching
 */
export function explainJobMatching(): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold('How Job Matching Works')}`;
  
  const steps = [
    'I analyze the job description to extract requirements',
    'I compare your resume against those requirements',
    'I calculate a fit score based on skills, experience, and seniority',
    'I categorize jobs as Reach, Target, Safety, or Avoid',
    'I rank jobs by priority to help you focus your effort',
  ];
  
  const categories = [
    `${bold('Reach')}: Ambitious roles slightly above your current level`,
    `${bold('Target')}: Strong matches where you meet most requirements`,
    `${bold('Safety')}: Roles where you exceed requirements`,
    `${bold('Avoid')}: Poor matches not worth your application effort`,
  ];
  
  return joinParagraphs(
    intro,
    section('The Process', formatNumberedList(steps)),
    section('Job Categories', formatBulletList(categories))
  );
}

/**
 * Explain resume improvement
 */
export function explainResumeImprovement(): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold('How Resume Improvement Works')}`;
  
  const process = [
    'I identify weak bullets in your experience section',
    'I find missing skills that could strengthen your profile',
    'I suggest improvements with estimated score impact',
    'You approve changes and I help you implement them',
    'We re-score to measure improvement',
  ];
  
  const focusAreas = [
    'Adding quantified metrics to achievements',
    'Using strong action verbs',
    'Including relevant skills and tools',
    'Improving formatting and clarity',
  ];
  
  return joinParagraphs(
    intro,
    section('The Process', formatNumberedList(process)),
    section('Key Focus Areas', formatBulletList(focusAreas))
  );
}

// ==================== FAQ Templates ====================

/**
 * Answer FAQ about interview rate
 */
export function explainInterviewRate(): string {
  const emoji = getEmoji('chart');
  
  const intro = `${emoji} ${bold('Understanding Interview Rate')}`;
  
  const explanation = 'Interview rate = interviews received ÷ applications sent. A healthy interview rate is typically 5-15%.';
  
  const factors = [
    'Resume quality and relevance',
    'How well you match the role requirements',
    'Timing of your application',
    'Company\'s hiring pace and volume',
  ];
  
  const improving = [
    'Improve your resume score to 75+',
    'Focus on jobs where you\'re a strong match',
    'Tailor your resume for each application',
    'Apply early when possible',
  ];
  
  return joinParagraphs(
    intro,
    explanation,
    section('What Affects Interview Rate', formatBulletList(factors)),
    section('How to Improve', formatBulletList(improving))
  );
}

/**
 * Answer FAQ about weekly targets
 */
export function explainWeeklyTargets(): string {
  const emoji = getEmoji('target');
  
  const intro = `${emoji} ${bold('About Weekly Targets')}`;
  
  const explanation = 'I set a weekly application target based on your strategy mode, resume quality, and historical data.';
  
  const guidelines = [
    'Typical target: 8-12 applications per week',
    'Lower targets when in Resume Improvement mode',
    'Higher targets when in Apply Mode with a strong resume',
    'Quality matters more than quantity',
  ];
  
  const note = 'You can adjust your weekly target in your preferences if my recommendation doesn\'t fit your schedule.';
  
  return joinParagraphs(
    intro,
    explanation,
    formatBulletList(guidelines),
    note
  );
}

// ==================== Quick Help ====================

/**
 * Generate a quick help message
 */
export function quickHelp(): string {
  const emoji = getEmoji('info');
  
  return `${emoji} ${bold('Quick Help')}: Ask me about your resume score, job matches, strategy, or daily plan. Type "help" for more options.`;
}

/**
 * Generate a "I don't understand" response
 */
export function didNotUnderstand(): string {
  return 'I\'m not sure I understood that. Could you rephrase? You can also ask "what can you help with?" to see available options.';
}

/**
 * Generate an out-of-scope response
 */
export function outOfScope(topic: string): string {
  return `That's outside my expertise as a career coach. I can help with resume improvement, job search strategy, and application tracking. Would you like help with any of those?`;
}
