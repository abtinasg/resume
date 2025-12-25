/**
 * Layer 1 - Evaluation Engine
 * Scoring Weights and Thresholds Configuration
 *
 * Defines all weights, thresholds, and scoring parameters
 * used by the evaluation engine.
 */

// ==================== Dimension Weights ====================

/**
 * Weights for the four scoring dimensions
 * Total must equal 1.0
 */
export const DIMENSION_WEIGHTS = {
  skill_capital: 0.30,
  execution_impact: 0.30,
  learning_adaptivity: 0.20,
  signal_quality: 0.20,
} as const;

// ==================== Fit Calculation Weights ====================

/**
 * Weights for fit score calculation
 * Total must equal 1.0
 */
export const FIT_WEIGHTS = {
  technical: 0.40, // Skills + tools match
  seniority: 0.20, // Level alignment
  experience: 0.20, // Experience type match
  signal: 0.20, // Resume quality (from generic score)
} as const;

/**
 * Technical match sub-weights
 */
export const TECHNICAL_MATCH_WEIGHTS = {
  skills: 0.60,
  tools: 0.40,
} as const;

// ==================== Score Thresholds ====================

/**
 * Score level thresholds
 */
export const SCORE_LEVELS = {
  early: { min: 0, max: 34 },
  growing: { min: 35, max: 54 },
  solid: { min: 55, max: 74 },
  strong: { min: 75, max: 89 },
  exceptional: { min: 90, max: 100 },
} as const;

/**
 * Get level from score
 */
export function getLevel(
  score: number
): 'Early' | 'Growing' | 'Solid' | 'Strong' | 'Exceptional' {
  if (score < 35) return 'Early';
  if (score < 55) return 'Growing';
  if (score < 75) return 'Solid';
  if (score < 90) return 'Strong';
  return 'Exceptional';
}

// ==================== Signal Quality Modifiers ====================

/**
 * Signal quality impact on final score
 */
export const SIGNAL_QUALITY_MODIFIERS = {
  poor: { threshold: 40, factor: 0.90 }, // 10% penalty
  neutral: { threshold: 80, factor: 1.00 }, // No modifier
  excellent: { threshold: 81, factor: 1.05 }, // 5% bonus
} as const;

// ==================== Score Constraints ====================

/**
 * Hard caps based on critical gaps
 */
export const SCORE_CONSTRAINTS = {
  // If skill capital very low, cap score
  low_skill_capital: { threshold: 25, max_score: 45 },
  // If execution impact very low, cap score
  low_execution_impact: { threshold: 20, max_score: 50 },
  // If learning stagnant, cap high scores
  stagnant_learning: { threshold: 30, max_score: 60, applies_above: 60 },
  // If parsing failed, cap score
  parsing_failed: { max_score: 40 },
  // If possible spam, cap score
  possible_spam: { max_score: 25 },
} as const;

// ==================== Recommendation Thresholds ====================

/**
 * Thresholds for APPLY/OPTIMIZE_FIRST/NOT_READY decisions
 */
export const RECOMMENDATION_THRESHOLDS = {
  // Minimum resume quality for application
  min_resume_quality: 60,
  // Fit score thresholds
  apply_threshold: 75, // High fit = APPLY
  optimize_threshold: 60, // Medium fit = OPTIMIZE_FIRST
  // Gap thresholds
  max_critical_gaps_for_apply: 2,
  max_critical_gaps_for_not_ready: 5,
  // Seniority gap threshold
  max_seniority_gap_years: 2,
} as const;

// ==================== Metric Detection Patterns ====================

/**
 * Patterns for detecting metrics in bullet points
 */
export const METRIC_PATTERNS = [
  // Numbers with units
  /\d+%/,
  /\$[\d,]+[KMB]?/i,
  /[\d,]+\s*(users|customers|clients|members|subscribers)/i,
  /[\d,]+\s*(sales|leads|orders|transactions)/i,
  /[\d,]+\s*(applications|requests|tickets)/i,
  /[\d,]+\s*(views|impressions|clicks|visits)/i,
  // Time metrics
  /\d+\s*(hours?|days?|weeks?|months?|years?)/i,
  /\d+x\s*(faster|improvement|increase|growth)/i,
  // Comparison metrics
  /increased?\s*by\s*\d+/i,
  /reduced?\s*by\s*\d+/i,
  /improved?\s*by\s*\d+/i,
  /saved?\s*\$?[\d,]+/i,
  /cut\s*\d+/i,
  // Team/scope metrics
  /team\s*of\s*\d+/i,
  /\d+\s*(team members|engineers|developers|people)/i,
  /\d+\s*(projects?|initiatives?|campaigns?)/i,
  // Revenue/impact
  /\$[\d,]+\s*(revenue|savings?|budget|funding)/i,
  /[\d,]+\s*(million|billion|thousand)/i,
] as const;

// ==================== Action Verb Categories ====================

/**
 * Strong action verbs (high impact)
 */
export const STRONG_ACTION_VERBS = [
  // Leadership
  'led',
  'directed',
  'managed',
  'headed',
  'orchestrated',
  'spearheaded',
  'championed',
  'pioneered',
  // Achievement
  'achieved',
  'exceeded',
  'delivered',
  'accomplished',
  'attained',
  'surpassed',
  // Creation
  'created',
  'built',
  'designed',
  'developed',
  'established',
  'founded',
  'launched',
  'initiated',
  // Improvement
  'optimized',
  'improved',
  'enhanced',
  'streamlined',
  'accelerated',
  'transformed',
  'revamped',
  'modernized',
  // Technical
  'engineered',
  'architected',
  'implemented',
  'automated',
  'integrated',
  'deployed',
  'scaled',
  // Impact
  'drove',
  'increased',
  'reduced',
  'generated',
  'saved',
  'expanded',
  'boosted',
  // Collaboration
  'collaborated',
  'partnered',
  'mentored',
  'coached',
  'trained',
] as const;

/**
 * Weak action verbs (low impact)
 */
export const WEAK_ACTION_VERBS = [
  'worked',
  'helped',
  'assisted',
  'participated',
  'involved',
  'responsible',
  'handled',
  'did',
  'made',
  'got',
  'put',
  'used',
  'tried',
  'contributed',
  'supported',
  'was part of',
  'tasked with',
  'in charge of',
] as const;

// ==================== Section Detection ====================

/**
 * Standard resume section patterns
 */
export const SECTION_PATTERNS = {
  experience: [
    /work\s*experience/i,
    /professional\s*experience/i,
    /employment\s*history/i,
    /career\s*history/i,
    /experience/i,
  ],
  education: [
    /education/i,
    /academic\s*background/i,
    /academic\s*history/i,
    /qualifications/i,
  ],
  skills: [
    /skills/i,
    /technical\s*skills/i,
    /core\s*competencies/i,
    /competencies/i,
    /expertise/i,
    /technologies/i,
  ],
  projects: [
    /projects/i,
    /personal\s*projects/i,
    /side\s*projects/i,
    /portfolio/i,
  ],
  certifications: [
    /certifications/i,
    /certificates/i,
    /licenses/i,
    /credentials/i,
  ],
  summary: [
    /summary/i,
    /professional\s*summary/i,
    /profile/i,
    /objective/i,
    /about/i,
  ],
} as const;

// ==================== Content Thresholds ====================

/**
 * Content quality thresholds
 */
export const CONTENT_THRESHOLDS = {
  // Minimum word count for valid resume
  min_word_count: 100,
  // Optimal word count range
  optimal_word_count: { min: 300, max: 800 },
  // Minimum bullets with metrics
  min_metric_ratio: 0.30, // 30% of bullets should have metrics
  // Minimum strong action verb ratio
  min_strong_verb_ratio: 0.50, // 50% should use strong verbs
  // Maximum generic description ratio
  max_generic_ratio: 0.40, // No more than 40% generic
  // Minimum skills count
  min_skills_count: 5,
  // Optimal bullet length (words)
  optimal_bullet_length: { min: 8, max: 25 },
} as const;

// ==================== Learning Signals ====================

/**
 * Patterns indicating learning and growth
 */
export const LEARNING_SIGNAL_PATTERNS = {
  certifications: [
    /certified/i,
    /certification/i,
    /certificate/i,
    /AWS\s*(Certified|Solutions)/i,
    /Google\s*Cloud/i,
    /Azure/i,
    /PMP/i,
    /Scrum/i,
    /CISSP/i,
  ],
  courses: [
    /completed?\s*(course|training)/i,
    /coursera/i,
    /udemy/i,
    /edx/i,
    /linkedin\s*learning/i,
    /bootcamp/i,
  ],
  progression: [
    /promoted\s*to/i,
    /advanced\s*to/i,
    /grew\s*from/i,
    /progressed\s*to/i,
    /elevated\s*to/i,
  ],
  newSkills: [
    /learned/i,
    /mastered/i,
    /acquired/i,
    /adopted/i,
    /transitioned\s*to/i,
  ],
} as const;

// ==================== Experience Type Patterns ====================

/**
 * Patterns for detecting experience types
 */
export const EXPERIENCE_TYPE_PATTERNS = {
  leadership: ['led', 'managed', 'directed', 'supervised', 'mentored', 'coached'],
  cross_functional: [
    'cross-functional',
    'collaborated',
    'stakeholders',
    'partnered',
    'coordinated with',
  ],
  customer_facing: ['customer', 'client', 'user', 'stakeholder', 'end-user'],
  technical_architecture: [
    'architected',
    'designed system',
    'scalable',
    'infrastructure',
    'microservices',
  ],
  data_analysis: [
    'analyzed',
    'data-driven',
    'insights',
    'metrics',
    'analytics',
    'KPIs',
  ],
  project_management: [
    'managed project',
    'delivered',
    'roadmap',
    'timeline',
    'sprint',
    'agile',
  ],
} as const;

// ==================== Seniority Estimation ====================

/**
 * Years of experience for seniority levels
 */
export const SENIORITY_YEARS = {
  entry: { min: 0, max: 2 },
  mid: { min: 2, max: 5 },
  senior: { min: 5, max: 10 },
  lead: { min: 8, max: 100 },
} as const;

/**
 * Estimate years gap for seniority
 */
export function estimateYearsGap(
  userLevel: 'entry' | 'mid' | 'senior' | 'lead',
  roleExpected: 'entry' | 'mid' | 'senior' | 'lead'
): number {
  const levels = ['entry', 'mid', 'senior', 'lead'];
  const userIndex = levels.indexOf(userLevel);
  const roleIndex = levels.indexOf(roleExpected);

  if (userIndex >= roleIndex) return 0;

  // Estimate 2-3 years per level gap
  return (roleIndex - userIndex) * 2.5;
}

// ==================== Cache Configuration ====================

/**
 * Cache settings
 */
export const CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds
  maxSize: 1000, // Maximum entries
} as const;

// ==================== Performance Targets ====================

/**
 * Performance requirements
 */
export const PERFORMANCE_TARGETS = {
  parsing: 500, // ms
  scoring: 1000, // ms
  entity_extraction: 500, // ms
  total_generic: 2000, // ms
  total_fit: 3000, // ms
} as const;

// ==================== Skill Capital Configuration ====================

/**
 * Important skill categories for scoring
 */
export const IMPORTANT_SKILL_CATEGORIES = [
  'programming_languages',
  'backend_frameworks',
  'frontend_frameworks',
  'cloud_platforms',
  'databases',
  'devops_tools',
] as const;

// ==================== Signal Quality Configuration ====================

/**
 * Buzzwords to detect in resumes (overused/generic terms)
 */
export const BUZZWORDS = [
  'team player',
  'hard worker',
  'self-starter',
  'detail-oriented',
  'results-driven',
  'go-getter',
  'synergy',
  'think outside the box',
  'passionate',
  'dynamic',
  'proactive',
  'leverage',
] as const;

// ==================== Generic Phrase Patterns ====================

/**
 * Generic phrases to detect in bullet points
 */
export const GENERIC_PHRASES = [
  'responsible for',
  'duties included',
  'worked on',
  'helped with',
  'assisted with',
  'participated in',
  'involved in',
  'tasked with',
  'in charge of',
] as const;

// ==================== Job Title Keywords ====================

/**
 * Keywords for detecting job titles in resume text
 */
export const JOB_TITLE_KEYWORDS = [
  'engineer',
  'developer',
  'manager',
  'director',
  'analyst',
  'designer',
  'lead',
  'senior',
  'junior',
  'architect',
  'consultant',
  'specialist',
  'coordinator',
  'associate',
  'intern',
  'head',
  'chief',
  'officer',
  'president',
  'founder',
] as const;
