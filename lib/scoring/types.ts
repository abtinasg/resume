/**
 * PRO Resume Scoring System - Type Definitions
 *
 * This module defines all TypeScript types and interfaces for the multi-layered
 * scoring system that evaluates resumes across 4 main components:
 * - Content Quality (40%)
 * - ATS Compatibility (35%)
 * - Format & Structure (15%)
 * - Impact & Metrics (10%)
 */

// ==================== Sub-Component Scores ====================

/**
 * Represents a single sub-component score with detailed calculation information
 */
export interface SubComponentScore {
  /** Score value (0-100) */
  score: number;

  /** Calculation formula and values used */
  calculation?: string;

  /** Additional details specific to this sub-component */
  details?: string | Record<string, any>;

  /** Any relevant data found during analysis */
  found?: string[] | Record<string, number>;

  /** Any missing or problematic data */
  missing?: string[];
}

/**
 * Achievement Quantification Analysis
 */
export interface AchievementQuantificationScore extends SubComponentScore {
  /** Total number of bullet points found */
  totalBullets: number;

  /** Number of quantified bullets (containing metrics) */
  quantifiedBullets: number;

  /** Percentage of quantified bullets */
  percentage: number;
}

/**
 * Action Verb Strength Analysis
 */
export interface ActionVerbScore extends SubComponentScore {
  /** Percentage of strong verbs */
  strongPercentage: number;

  /** Percentage of medium verbs */
  mediumPercentage: number;

  /** Percentage of weak verbs */
  weakPercentage: number;

  /** Strong verbs found in resume */
  strongVerbsFound: string[];

  /** Weak verbs found in resume */
  weakVerbsFound: string[];

  /** Total bullets analyzed */
  totalBullets: number;
}

/**
 * Skill Relevance Analysis
 */
export interface SkillRelevanceScore extends SubComponentScore {
  /** Number of expected keywords found */
  foundCount: number;

  /** Total expected keywords for the role */
  expectedCount: number;

  /** Percentage of match */
  matchPercentage: number;

  /** Keywords found */
  found: string[];

  /** Critical keywords missing */
  missing: string[];
}

/**
 * Clarity & Readability Analysis
 */
export interface ClarityReadabilityScore extends SubComponentScore {
  /** Average words per bullet point */
  avgWordsPerBullet: number;

  /** Number of grammar issues detected */
  grammarIssues: number;

  /** Issues with readability */
  readabilityIssues?: string[];
}

/**
 * Keyword Density Analysis
 */
export interface KeywordDensityScore extends SubComponentScore {
  /** Match rate for must-have keywords (0-100) */
  mustHaveMatch: number;

  /** Match rate for important keywords (0-100) */
  importantMatch: number;

  /** Match rate for nice-to-have keywords (0-100) */
  niceToHaveMatch: number;

  /** Critical keywords missing */
  missingCritical: string[];

  /** Frequency map of found keywords */
  keywordFrequency: Record<string, number>;
}

/**
 * Format Compatibility Analysis
 */
export interface FormatCompatibilityScore extends SubComponentScore {
  /** List of format issues detected */
  issues: FormatIssue[];

  /** Whether the document is ATS-friendly */
  isATSFriendly: boolean;
}

/**
 * Section Headers Analysis
 */
export interface SectionHeadersScore extends SubComponentScore {
  /** Standard section headers found */
  standardFound: string[];

  /** Non-standard section headers */
  nonStandard: string[];

  /** Missing recommended sections */
  missingRecommended?: string[];
}

/**
 * File Format Analysis
 */
export interface FileFormatScore extends SubComponentScore {
  /** Whether file is PDF */
  isPDF: boolean;

  /** Whether text is extractable (not scanned) */
  textExtractable: boolean;

  /** Number of pages */
  pageCount: number;

  /** File size (if available) */
  fileSize?: number;
}

/**
 * Length Optimization Analysis
 */
export interface LengthOptimizationScore extends SubComponentScore {
  /** Number of pages */
  pageCount: number;

  /** Years of experience (estimated) */
  yearsExperience: number;

  /** Verdict on length appropriateness */
  verdict: 'Too Short' | 'Optimal' | 'Too Long';

  /** Recommended page count */
  recommendedPages: number;
}

// ==================== Component Breakdown Interfaces ====================

/**
 * Content Quality Breakdown
 */
export interface ContentQualityBreakdown {
  achievementQuantification: AchievementQuantificationScore;
  actionVerbStrength: ActionVerbScore;
  skillRelevance: SkillRelevanceScore;
  clarityReadability: ClarityReadabilityScore;
}

/**
 * ATS Compatibility Breakdown
 */
export interface ATSCompatibilityBreakdown {
  keywordDensity: KeywordDensityScore;
  formatCompatibility: FormatCompatibilityScore;
  sectionHeaders: SectionHeadersScore;
  fileFormat: FileFormatScore;
}

/**
 * Format & Structure Breakdown
 */
export interface FormatStructureBreakdown {
  lengthOptimization: LengthOptimizationScore;
  sectionOrder: SubComponentScore;
  visualHierarchy: SubComponentScore;
  contactInfo: SubComponentScore;
}

/**
 * Impact & Metrics Breakdown
 */
export interface ImpactMetricsBreakdown {
  quantifiedResults: SubComponentScore & { percentage: number };
  scaleIndicators: SubComponentScore & { found: number };
  recognitionGrowth: SubComponentScore & { promotions?: number };
}

// ==================== Main Component Scores ====================

/**
 * Represents a main component score with sub-component breakdown
 */
export interface ComponentScore {
  /** Overall score for this component (0-100) */
  score: number;

  /** Weight of this component in overall score (percentage) */
  weight: number;

  /** Weighted contribution to overall score */
  weightedContribution: number;

  /** Detailed breakdown of sub-components */
  breakdown: ContentQualityBreakdown | ATSCompatibilityBreakdown | FormatStructureBreakdown | ImpactMetricsBreakdown;
}

// ==================== ATS Analysis ====================

/**
 * Format Issue
 */
export interface FormatIssue {
  /** Severity level */
  severity: 'error' | 'warning' | 'info';

  /** Description of the issue */
  issue: string;

  /** Points deducted for this issue */
  penalty: number;

  /** Suggested fix */
  fix?: string;
}

/**
 * ATS Pass Prediction
 */
export interface ATSPassPrediction {
  /** Probability of passing ATS (0-100) */
  probability: number;

  /** Confidence level */
  confidence: 'low' | 'medium' | 'high';

  /** Reasoning for the prediction */
  reasoning: string;

  /** Risk factors */
  riskFactors?: string[];
}

/**
 * Keyword Gap Analysis
 */
export interface KeywordGapAnalysis {
  /** Job role analyzed for */
  role: string;

  /** Must-have keywords analysis */
  mustHave: {
    found: number;
    total: number;
    missing: string[];
    foundKeywords: string[];
  };

  /** Important keywords analysis */
  important: {
    found: number;
    total: number;
    missing: string[];
    foundKeywords: string[];
  };

  /** Nice-to-have keywords analysis */
  niceToHave?: {
    found: number;
    total: number;
    missing: string[];
    foundKeywords: string[];
  };

  /** Frequency map of keywords in resume */
  keywordFrequency: Record<string, number>;
}

/**
 * Detailed ATS Report
 */
export interface ATSDetailedReport {
  /** Pass prediction */
  passPrediction: ATSPassPrediction;

  /** Keyword gap analysis */
  keywordGapAnalysis: KeywordGapAnalysis;

  /** Format issues found */
  formatIssues: FormatIssue[];
}

// ==================== Improvement Roadmap ====================

/**
 * Single improvement action
 */
export interface ImprovementAction {
  /** Action description */
  action: string;

  /** Expected points gain */
  pointsGain: number;

  /** Estimated time to complete */
  time: string;

  /** Priority level */
  priority?: 'high' | 'medium' | 'low';

  /** Category this action belongs to */
  category?: string;
}

/**
 * Improvement Roadmap
 */
export interface ImprovementRoadmap {
  /** Actions to reach score of 80 */
  toReach80: ImprovementAction[];

  /** Actions to reach score of 90 */
  toReach90: ImprovementAction[];

  /** Quick wins (high impact, low effort) */
  quickWins?: ImprovementAction[];
}

// ==================== Main Scoring Result ====================

/**
 * Complete PRO Scoring Result
 */
export interface ScoringResult {
  /** Overall score (0-100) */
  overallScore: number;

  /** Letter grade (A+, A, B+, B, C+, C, D, F) */
  grade: string;

  /** Probability of passing ATS (0-100) */
  atsPassProbability: number;

  /** Detailed component scores */
  componentScores: {
    contentQuality: ComponentScore;
    atsCompatibility: ComponentScore;
    formatStructure: ComponentScore;
    impactMetrics: ComponentScore;
  };

  /** Detailed ATS report */
  atsDetailedReport: ATSDetailedReport;

  /** Improvement roadmap */
  improvementRoadmap: ImprovementRoadmap;

  /** Metadata */
  metadata?: {
    /** Job role analyzed for */
    jobRole: string;

    /** Processing time (ms) */
    processingTime?: number;

    /** Timestamp */
    timestamp?: string;

    /** Resume statistics */
    resumeStats?: {
      totalWords: number;
      totalBullets: number;
      pageCount: number;
    };
  };
}

// ==================== Keyword Database Types ====================

/**
 * Keywords categorized by importance
 */
export interface RoleKeywords {
  /** Must-have keywords (critical for the role) */
  mustHave: string[];

  /** Important keywords (highly relevant) */
  important: string[];

  /** Nice-to-have keywords (adds value) */
  niceToHave: string[];
}

/**
 * Database of keywords by job role
 */
export type KeywordDatabase = Record<string, RoleKeywords>;

// ==================== Helper Types ====================

/**
 * Action verbs categorized by strength
 */
export interface ActionVerbCategories {
  strong: string[];
  medium: string[];
  weak: string[];
}

/**
 * Bullet point extracted from resume
 */
export interface BulletPoint {
  /** Original text */
  text: string;

  /** Whether it contains quantification */
  isQuantified: boolean;

  /** First word (usually action verb) */
  firstWord: string;

  /** Action verb category */
  verbCategory?: 'strong' | 'medium' | 'weak';

  /** Word count */
  wordCount: number;
}

/**
 * Resume text analysis result
 */
export interface ResumeTextAnalysis {
  /** Total word count */
  totalWords: number;

  /** Total bullet points */
  totalBullets: number;

  /** Extracted bullet points */
  bulletPoints: BulletPoint[];

  /** All words extracted (normalized) */
  words: string[];

  /** Detected sections */
  sections: string[];

  /** Estimated page count */
  pageCount: number;

  /** Estimated years of experience */
  yearsExperience: number;
}
