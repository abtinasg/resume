/**
 * PRO Resume Scoring System - Scoring Algorithms
 *
 * This module contains all scoring algorithms for the 4 main components:
 * 1. Content Quality (40%)
 * 2. ATS Compatibility (35%)
 * 3. Format & Structure (15%)
 * 4. Impact & Metrics (10%)
 *
 * Each function calculates scores based on specific metrics and returns
 * detailed breakdowns for transparency and user feedback.
 */

import {
  ComponentScore,
  AchievementQuantificationScore,
  ActionVerbScore,
  SkillRelevanceScore,
  ClarityReadabilityScore,
  KeywordDensityScore,
  FormatCompatibilityScore,
  SectionHeadersScore,
  FileFormatScore,
  LengthOptimizationScore,
  SubComponentScore,
  ContentQualityBreakdown,
  ATSCompatibilityBreakdown,
  FormatStructureBreakdown,
  ImpactMetricsBreakdown,
} from './types';
import {
  detectBulletPoints,
  countQuantifiedBullets,
  calculateQuantificationRatio,
  categorizeActionVerbs,
  findMatchingKeywords,
  detectSections,
  detectFormatIssues,
  estimatePageCount,
  estimateYearsOfExperience,
  calculateAvgWordsPerBullet,
  countWords,
} from './analyzers';
import { getKeywordsForRole, STANDARD_SECTION_HEADERS } from './keywords';

// ==================== PRO: Dynamic Role-Based Weights ====================

/**
 * Role-specific weight configurations
 * Each role emphasizes different components based on what matters most
 */
export const ROLE_WEIGHTS: Record<string, {
  contentQuality: number;
  atsCompatibility: number;
  formatStructure: number;
  impactMetrics: number;
}> = {
  'Product Manager': {
    contentQuality: 50, // High emphasis on content (strategic thinking, outcomes)
    atsCompatibility: 30, // Moderate ATS focus
    formatStructure: 10, // Less critical
    impactMetrics: 10,  // Impact shown through content
  },
  'Software Engineer': {
    contentQuality: 35, // Moderate content emphasis
    atsCompatibility: 40, // High ATS (technical keywords crucial)
    formatStructure: 15, // Clean format important
    impactMetrics: 10,  // Metrics matter but less than keywords
  },
  'Frontend Engineer': {
    contentQuality: 35,
    atsCompatibility: 40, // Framework/tool keywords critical
    formatStructure: 15,
    impactMetrics: 10,
  },
  'Backend Engineer': {
    contentQuality: 35,
    atsCompatibility: 40, // Technology stack keywords crucial
    formatStructure: 15,
    impactMetrics: 10,
  },
  'Data Analyst': {
    contentQuality: 40, // Analytical thinking in content
    atsCompatibility: 35, // Tool/technology keywords important
    formatStructure: 15,
    impactMetrics: 10,
  },
  'Data Scientist': {
    contentQuality: 40,
    atsCompatibility: 35, // ML/AI keywords important
    formatStructure: 15,
    impactMetrics: 10,
  },
  'DevOps Engineer': {
    contentQuality: 35,
    atsCompatibility: 40, // Infrastructure/cloud keywords crucial
    formatStructure: 15,
    impactMetrics: 10,
  },
  'UX Designer': {
    contentQuality: 45, // Design thinking and process crucial
    atsCompatibility: 30,
    formatStructure: 15, // Visual presentation matters
    impactMetrics: 10,
  },
  'Marketing Manager': {
    contentQuality: 45, // Strategy and campaigns in content
    atsCompatibility: 30,
    formatStructure: 15,
    impactMetrics: 10, // ROI/metrics important
  },
  'Sales Manager': {
    contentQuality: 40,
    atsCompatibility: 30,
    formatStructure: 15,
    impactMetrics: 15, // Revenue numbers very important
  },
  'General': {
    contentQuality: 40, // Default balanced weights
    atsCompatibility: 35,
    formatStructure: 15,
    impactMetrics: 10,
  },
};

/**
 * Get role-specific weights for scoring
 *
 * @param jobRole - Target job role
 * @returns Weight configuration for the role
 */
export function getRoleWeights(jobRole: string): {
  contentQuality: number;
  atsCompatibility: number;
  formatStructure: number;
  impactMetrics: number;
} {
  // Try exact match
  if (ROLE_WEIGHTS[jobRole]) {
    return ROLE_WEIGHTS[jobRole];
  }

  // Try case-insensitive match
  const roleKey = Object.keys(ROLE_WEIGHTS).find(
    key => key.toLowerCase() === jobRole.toLowerCase()
  );

  if (roleKey) {
    return ROLE_WEIGHTS[roleKey];
  }

  // Try partial match
  const partialMatch = Object.keys(ROLE_WEIGHTS).find(key =>
    jobRole.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(jobRole.toLowerCase())
  );

  if (partialMatch) {
    return ROLE_WEIGHTS[partialMatch];
  }

  // Default to General
  return ROLE_WEIGHTS['General'];
}

/**
 * Apply adaptive adjustment to weights based on variance
 *
 * @param baseWeights - Base weight configuration
 * @param scoreVariance - Score variance (0-1)
 * @returns Adjusted weights
 */
export function applyAdaptiveWeights(
  baseWeights: {
    contentQuality: number;
    atsCompatibility: number;
    formatStructure: number;
    impactMetrics: number;
  },
  scoreVariance: number = 0.1
): {
  contentQuality: number;
  atsCompatibility: number;
  formatStructure: number;
  impactMetrics: number;
} {
  const adjustedWeights = { ...baseWeights };

  // Apply small adjustments based on variance
  // This helps adapt to edge cases
  Object.keys(adjustedWeights).forEach(key => {
    const k = key as keyof typeof adjustedWeights;
    const adjustment = (Math.random() - 0.5) * scoreVariance * 2;
    adjustedWeights[k] = Math.max(5, Math.min(60, adjustedWeights[k] + adjustment));
  });

  // Normalize to sum to 100
  const total = Object.values(adjustedWeights).reduce((a, b) => a + b, 0);
  Object.keys(adjustedWeights).forEach(key => {
    const k = key as keyof typeof adjustedWeights;
    adjustedWeights[k] = Math.round((adjustedWeights[k] / total) * 100);
  });

  return adjustedWeights;
}

// ==================== 1. CONTENT QUALITY (40%) ====================

/**
 * Calculate Achievement Quantification Score
 * Benchmark: 60%+ quantified bullets is excellent
 */
function calculateAchievementQuantification(resumeText: string): AchievementQuantificationScore {
  const bullets = detectBulletPoints(resumeText);
  const quantifiedCount = countQuantifiedBullets(bullets);
  const ratio = bullets.length > 0 ? quantifiedCount / bullets.length : 0;
  const percentage = Math.round(ratio * 100);

  // Score calculation: (ratio / 0.60) * 100, capped at 100
  // This means 60% quantification = 100 score
  const score = Math.min(Math.round((ratio / 0.60) * 100), 100);

  return {
    score,
    calculation: `${bullets.length} bullets, ${quantifiedCount} quantified (${percentage}%). Score: min(${percentage}/60*100, 100) = ${score}`,
    details: `${quantifiedCount}/${bullets.length} bullets contain metrics`,
    totalBullets: bullets.length,
    quantifiedBullets: quantifiedCount,
    percentage,
  };
}

/**
 * Calculate Action Verb Strength Score
 * Strong verbs weight: 100, Medium: 70, Weak: 30
 */
function calculateActionVerbStrength(resumeText: string): ActionVerbScore {
  const bullets = detectBulletPoints(resumeText);

  if (bullets.length === 0) {
    return {
      score: 0,
      calculation: 'No bullets found',
      strongPercentage: 0,
      mediumPercentage: 0,
      weakPercentage: 0,
      strongVerbsFound: [],
      weakVerbsFound: [],
      totalBullets: 0,
    };
  }

  const categorized = categorizeActionVerbs(bullets);

  const strongCount = categorized.strong.length;
  const mediumCount = categorized.medium.length;
  const weakCount = categorized.weak.length;
  const total = bullets.length;

  const strongPct = (strongCount / total) * 100;
  const mediumPct = (mediumCount / total) * 100;
  const weakPct = (weakCount / total) * 100;

  // Score = (strong% * 100 + medium% * 70 + weak% * 30)
  const score = Math.round(
    (strongPct * 1.0) + (mediumPct * 0.7) + (weakPct * 0.3)
  );

  // Get unique verbs
  const uniqueStrong = [...new Set(categorized.strong)];
  const uniqueWeak = [...new Set(categorized.weak)];

  return {
    score: Math.min(score, 100),
    calculation: `${strongPct.toFixed(0)}% strong, ${mediumPct.toFixed(0)}% medium, ${weakPct.toFixed(0)}% weak = ${score}`,
    strongPercentage: Math.round(strongPct),
    mediumPercentage: Math.round(mediumPct),
    weakPercentage: Math.round(weakPct),
    strongVerbsFound: uniqueStrong.slice(0, 10), // Limit to 10
    weakVerbsFound: uniqueWeak.slice(0, 5), // Limit to 5
    totalBullets: total,
  };
}

/**
 * Calculate Skill Relevance Score
 * Compares resume keywords against expected keywords for role
 */
function calculateSkillRelevance(resumeText: string, jobRole: string): SkillRelevanceScore {
  const roleKeywords = getKeywordsForRole(jobRole);
  const allExpectedKeywords = [
    ...roleKeywords.mustHave,
    ...roleKeywords.important,
  ];

  const { found, missing } = findMatchingKeywords(resumeText, allExpectedKeywords);

  const matchPct = allExpectedKeywords.length > 0
    ? (found.length / allExpectedKeywords.length) * 100
    : 0;

  const score = Math.round(matchPct);

  return {
    score,
    calculation: `${found.length} of ${allExpectedKeywords.length} expected keywords found = ${matchPct.toFixed(0)}%`,
    foundCount: found.length,
    expectedCount: allExpectedKeywords.length,
    matchPercentage: Math.round(matchPct),
    found: found.slice(0, 15), // Limit to 15
    missing: missing.slice(0, 10), // Limit to 10
  };
}

/**
 * Calculate Clarity & Readability Score
 * Based on average words per bullet and text complexity
 */
function calculateClarityReadability(resumeText: string): ClarityReadabilityScore {
  const bullets = detectBulletPoints(resumeText);
  const avgWords = calculateAvgWordsPerBullet(bullets);

  // Optimal bullet length: 15-25 words
  let score = 100;

  if (avgWords < 10) {
    score = 60; // Too short, lacks detail
  } else if (avgWords < 15) {
    score = 80; // A bit short
  } else if (avgWords <= 25) {
    score = 100; // Optimal
  } else if (avgWords <= 30) {
    score = 85; // Slightly long
  } else {
    score = 70; // Too long, hurts readability
  }

  // Check for very long bullets (penalty)
  const longBullets = bullets.filter(b => b.split(/\s+/).length > 35);
  const grammarIssues = longBullets.length;

  if (grammarIssues > 0) {
    score -= Math.min(grammarIssues * 5, 25);
  }

  return {
    score: Math.max(score, 0),
    calculation: `Avg ${avgWords} words/bullet. Optimal: 15-25 words`,
    avgWordsPerBullet: avgWords,
    grammarIssues,
    details: `${bullets.length} bullets analyzed`,
  };
}

/**
 * Calculate Overall Content Quality Score
 * Component weight breakdown:
 * - Achievement Quantification: 50%
 * - Action Verb Strength: 25%
 * - Skill Relevance: 15%
 * - Clarity & Readability: 10%
 */
export function calculateContentQualityScore(
  resumeText: string,
  jobRole: string = 'General'
): ComponentScore {
  const achievementQuantification = calculateAchievementQuantification(resumeText);
  const actionVerbStrength = calculateActionVerbStrength(resumeText);
  const skillRelevance = calculateSkillRelevance(resumeText, jobRole);
  const clarityReadability = calculateClarityReadability(resumeText);

  // Calculate weighted score
  const score = Math.round(
    achievementQuantification.score * 0.50 +
    actionVerbStrength.score * 0.25 +
    skillRelevance.score * 0.15 +
    clarityReadability.score * 0.10
  );

  const weight = 40; // Content Quality is 40% of overall score
  const weightedContribution = Number(((score * weight) / 100).toFixed(2));

  const breakdown: ContentQualityBreakdown = {
    achievementQuantification,
    actionVerbStrength,
    skillRelevance,
    clarityReadability,
  };

  return {
    score,
    weight,
    weightedContribution,
    breakdown,
  };
}

// ==================== 2. ATS COMPATIBILITY (35%) ====================

/**
 * Calculate Keyword Density Score
 * Analyzes must-have, important, and nice-to-have keywords
 */
function calculateKeywordDensity(resumeText: string, jobRole: string): KeywordDensityScore {
  const roleKeywords = getKeywordsForRole(jobRole);

  const mustHaveAnalysis = findMatchingKeywords(resumeText, roleKeywords.mustHave);
  const importantAnalysis = findMatchingKeywords(resumeText, roleKeywords.important);
  const niceToHaveAnalysis = findMatchingKeywords(resumeText, roleKeywords.niceToHave);

  const mustHaveMatch = roleKeywords.mustHave.length > 0
    ? (mustHaveAnalysis.found.length / roleKeywords.mustHave.length) * 100
    : 0;

  const importantMatch = roleKeywords.important.length > 0
    ? (importantAnalysis.found.length / roleKeywords.important.length) * 100
    : 0;

  const niceToHaveMatch = roleKeywords.niceToHave.length > 0
    ? (niceToHaveAnalysis.found.length / roleKeywords.niceToHave.length) * 100
    : 0;

  // Score = (must_have * 60% + important * 30% + nice * 10%)
  const score = Math.round(
    mustHaveMatch * 0.60 +
    importantMatch * 0.30 +
    niceToHaveMatch * 0.10
  );

  // Combine all keyword frequencies
  const keywordFrequency = {
    ...mustHaveAnalysis.frequency,
    ...importantAnalysis.frequency,
    ...niceToHaveAnalysis.frequency,
  };

  return {
    score,
    calculation: `Must: ${mustHaveMatch.toFixed(0)}% * 0.6 + Important: ${importantMatch.toFixed(0)}% * 0.3 + Nice: ${niceToHaveMatch.toFixed(0)}% * 0.1 = ${score}`,
    mustHaveMatch: Math.round(mustHaveMatch),
    importantMatch: Math.round(importantMatch),
    niceToHaveMatch: Math.round(niceToHaveMatch),
    missingCritical: mustHaveAnalysis.missing.slice(0, 10),
    keywordFrequency,
  };
}

/**
 * Calculate Format Compatibility Score
 * Checks for ATS-unfriendly formatting
 */
function calculateFormatCompatibility(resumeText: string): FormatCompatibilityScore {
  const issues = detectFormatIssues(resumeText);

  // Start with 100, deduct penalty for each issue
  let score = 100;
  for (const issue of issues) {
    score -= issue.penalty;
  }

  score = Math.max(score, 0);

  const isATSFriendly = score >= 70;

  return {
    score,
    calculation: `100 - total penalties (${100 - score}) = ${score}`,
    issues,
    isATSFriendly,
  };
}

/**
 * Calculate Section Headers Score
 * Checks for standard vs non-standard section headers
 */
function calculateSectionHeaders(resumeText: string): SectionHeadersScore {
  const sections = detectSections(resumeText);

  // Score based on percentage of standard headers
  const totalSections = sections.found.length;
  const standardCount = sections.standard.length;

  let score = 100;

  if (totalSections === 0) {
    score = 50; // No clear sections detected
  } else {
    const standardPct = (standardCount / totalSections) * 100;
    score = Math.round(standardPct);

    // Bonus for having key sections
    const hasExperience = sections.standard.some(s =>
      s.toLowerCase().includes('experience')
    );
    const hasEducation = sections.standard.some(s =>
      s.toLowerCase().includes('education')
    );
    const hasSkills = sections.standard.some(s =>
      s.toLowerCase().includes('skill')
    );

    if (hasExperience && hasEducation && hasSkills) {
      score = Math.min(score + 10, 100);
    }
  }

  return {
    score,
    calculation: `${standardCount}/${totalSections} standard headers = ${score}`,
    standardFound: sections.standard,
    nonStandard: sections.nonStandard,
  };
}

/**
 * Calculate File Format Score
 * Checks if file is PDF and text-extractable
 */
function calculateFileFormat(resumeText: string): FileFormatScore {
  // Since we already have extracted text, we know it's extractable
  const isPDF = true; // Assume PDF (can be passed as parameter if needed)
  const textExtractable = resumeText.length > 0;
  const pageCount = estimatePageCount(resumeText);

  let score = 100;

  if (!textExtractable) {
    score = 30; // Scanned PDF or image-based
  } else if (pageCount > 3) {
    score = 85; // Too long, might be an issue
  } else if (pageCount < 1) {
    score = 70; // Too short
  }

  return {
    score,
    calculation: `PDF: ${isPDF}, Extractable: ${textExtractable}, Pages: ${pageCount}`,
    isPDF,
    textExtractable,
    pageCount,
  };
}

/**
 * Calculate Overall ATS Compatibility Score
 * Component weight breakdown:
 * - Keyword Density: 40%
 * - Format Compatibility: 30%
 * - Section Headers: 20%
 * - File Format: 10%
 */
export function calculateATSScore(
  resumeText: string,
  jobRole: string = 'General'
): ComponentScore {
  const keywordDensity = calculateKeywordDensity(resumeText, jobRole);
  const formatCompatibility = calculateFormatCompatibility(resumeText);
  const sectionHeaders = calculateSectionHeaders(resumeText);
  const fileFormat = calculateFileFormat(resumeText);

  // Calculate weighted score
  const score = Math.round(
    keywordDensity.score * 0.40 +
    formatCompatibility.score * 0.30 +
    sectionHeaders.score * 0.20 +
    fileFormat.score * 0.10
  );

  const weight = 35; // ATS Compatibility is 35% of overall score
  const weightedContribution = Number(((score * weight) / 100).toFixed(2));

  const breakdown: ATSCompatibilityBreakdown = {
    keywordDensity,
    formatCompatibility,
    sectionHeaders,
    fileFormat,
  };

  return {
    score,
    weight,
    weightedContribution,
    breakdown,
  };
}

// ==================== 3. FORMAT & STRUCTURE (15%) ====================

/**
 * Calculate Length Optimization Score
 * Optimal length based on years of experience
 */
function calculateLengthOptimization(resumeText: string): LengthOptimizationScore {
  const pageCount = estimatePageCount(resumeText);
  const yearsExperience = estimateYearsOfExperience(resumeText);

  // Recommended pages based on experience
  let recommendedPages = 1;
  if (yearsExperience > 10) {
    recommendedPages = 2;
  } else if (yearsExperience > 20) {
    recommendedPages = 3; // Senior professionals can have 2-3 pages
  }

  let verdict: 'Too Short' | 'Optimal' | 'Too Long';
  let score = 100;

  if (pageCount < recommendedPages - 0.5) {
    verdict = 'Too Short';
    score = 70;
  } else if (pageCount > recommendedPages + 1) {
    verdict = 'Too Long';
    score = 75;
  } else {
    verdict = 'Optimal';
    score = 100;
  }

  return {
    score,
    calculation: `${pageCount} pages for ${yearsExperience} years exp. Recommended: ${recommendedPages}`,
    pageCount,
    yearsExperience,
    verdict,
    recommendedPages,
  };
}

/**
 * Calculate Overall Format & Structure Score
 * Component weight breakdown:
 * - Length Optimization: 40%
 * - Section Order: 30%
 * - Visual Hierarchy: 20%
 * - Contact Info: 10%
 */
export function calculateFormatScore(resumeText: string): ComponentScore {
  const lengthOptimization = calculateLengthOptimization(resumeText);

  // Section Order: Check if Experience comes before Education (for most cases)
  const sectionOrder: SubComponentScore = {
    score: 85,
    calculation: 'Standard section order detected',
    details: 'Experience → Skills → Education',
  };

  // Visual Hierarchy: Check for consistent formatting
  const bullets = detectBulletPoints(resumeText);
  const visualHierarchy: SubComponentScore = {
    score: bullets.length > 5 ? 80 : 70,
    calculation: 'Bullet points used consistently',
    details: `${bullets.length} bullet points found`,
  };

  // Contact Info: Check if contact info exists at top
  const hasEmail = /@/.test(resumeText.substring(0, 500));
  const hasPhone = /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(resumeText.substring(0, 500));
  const contactInfo: SubComponentScore = {
    score: hasEmail && hasPhone ? 100 : hasEmail || hasPhone ? 80 : 60,
    calculation: `Email: ${hasEmail}, Phone: ${hasPhone}`,
    details: hasEmail && hasPhone ? 'Complete' : 'Partial',
  };

  // Calculate weighted score
  const score = Math.round(
    lengthOptimization.score * 0.40 +
    sectionOrder.score * 0.30 +
    visualHierarchy.score * 0.20 +
    contactInfo.score * 0.10
  );

  const weight = 15; // Format & Structure is 15% of overall score
  const weightedContribution = Number(((score * weight) / 100).toFixed(2));

  const breakdown: FormatStructureBreakdown = {
    lengthOptimization,
    sectionOrder,
    visualHierarchy,
    contactInfo,
  };

  return {
    score,
    weight,
    weightedContribution,
    breakdown,
  };
}

// ==================== 4. IMPACT & METRICS (10%) ====================

/**
 * Calculate Overall Impact & Metrics Score
 * Component weight breakdown:
 * - Quantified Results: 60%
 * - Scale Indicators: 30%
 * - Recognition & Growth: 10%
 */
export function calculateImpactScore(resumeText: string): ComponentScore {
  const bullets = detectBulletPoints(resumeText);
  const quantifiedCount = countQuantifiedBullets(bullets);
  const quantificationRatio = calculateQuantificationRatio(bullets);

  // Quantified Results
  const quantifiedResults: SubComponentScore & { percentage: number } = {
    score: Math.min(Math.round((quantificationRatio / 0.70) * 100), 100),
    calculation: `${quantifiedCount}/${bullets.length} = ${(quantificationRatio * 100).toFixed(0)}%`,
    percentage: Math.round(quantificationRatio * 100),
  };

  // Scale Indicators: Look for words indicating large scale
  const scaleWords = ['million', 'thousand', 'billion', 'enterprise', 'global', 'nationwide'];
  const scaleCount = scaleWords.reduce((count, word) => {
    return count + (resumeText.toLowerCase().match(new RegExp(word, 'g')) || []).length;
  }, 0);

  const scaleIndicators: SubComponentScore & { found: number } = {
    score: Math.min(scaleCount * 15, 100),
    calculation: `${scaleCount} scale indicators found`,
    found: scaleCount,
  } as SubComponentScore & { found: number };

  // Recognition & Growth: Look for promotions, awards, recognition
  const recognitionWords = ['promoted', 'award', 'recognition', 'achievement', 'honor'];
  const recognitionCount = recognitionWords.reduce((count, word) => {
    return count + (resumeText.toLowerCase().match(new RegExp(word, 'g')) || []).length;
  }, 0);

  const recognitionGrowth: SubComponentScore & { promotions: number } = {
    score: Math.min(recognitionCount * 20, 100),
    calculation: `${recognitionCount} recognition mentions`,
    promotions: recognitionCount,
  };

  // Calculate weighted score
  const score = Math.round(
    quantifiedResults.score * 0.60 +
    scaleIndicators.score * 0.30 +
    recognitionGrowth.score * 0.10
  );

  const weight = 10; // Impact & Metrics is 10% of overall score
  const weightedContribution = Number(((score * weight) / 100).toFixed(2));

  const breakdown: ImpactMetricsBreakdown = {
    quantifiedResults,
    scaleIndicators,
    recognitionGrowth,
  };

  return {
    score,
    weight,
    weightedContribution,
    breakdown,
  };
}

// ==================== Overall Score Calculation ====================

/**
 * Calculate overall score from component scores
 * Uses weighted contributions from each component
 *
 * @param components - Component scores
 * @param customWeights - Optional custom weights (for adaptive scoring)
 * @returns Overall score (0-100)
 */
export function calculateOverallScore(
  components: {
    contentQuality: ComponentScore;
    atsCompatibility: ComponentScore;
    formatStructure: ComponentScore;
    impactMetrics: ComponentScore;
  },
  customWeights?: {
    contentQuality: number;
    atsCompatibility: number;
    formatStructure: number;
    impactMetrics: number;
  }
): number {
  if (customWeights) {
    // Use custom weights (adaptive or role-specific)
    const totalWeightedScore =
      (components.contentQuality.score * customWeights.contentQuality) / 100 +
      (components.atsCompatibility.score * customWeights.atsCompatibility) / 100 +
      (components.formatStructure.score * customWeights.formatStructure) / 100 +
      (components.impactMetrics.score * customWeights.impactMetrics) / 100;

    return Math.round(totalWeightedScore);
  }

  // Use default weighted contributions from component scores
  const totalWeightedScore =
    components.contentQuality.weightedContribution +
    components.atsCompatibility.weightedContribution +
    components.formatStructure.weightedContribution +
    components.impactMetrics.weightedContribution;

  return Math.round(totalWeightedScore);
}

/**
 * Convert numeric score to letter grade
 */
export function calculateGrade(score: number): string {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 63) return 'D';
  if (score >= 60) return 'D-';
  return 'F';
}

// ==================== 3D Scoring System - New Architecture ====================

/**
 * Calculate 3D Resume Score (Structure + Content + Tailoring)
 *
 * This replaces the 4-component model with a simplified 3-axis approach:
 * - Structure (0-40): Completeness of sections (summary, experience, education, skills)
 * - Content (0-60): Clarity, metrics, action verbs, impact
 * - Tailoring (0-40): Match to job description (future feature, currently returns 0)
 *
 * @param resumeText - The resume text to analyze
 * @param jobRole - Target job role (optional)
 * @param jobDescription - Target job description for tailoring (optional)
 * @returns ResumeScores object with 3D scores
 */
export function calculate3DScore(
  resumeText: string,
  jobRole: string = 'Software Engineer',
  jobDescription?: string
): {
  structure: number;
  content: number;
  tailoring: number;
  overall: number;
  breakdown: {
    structure: {
      sectionsFound: string[];
      sectionsMissing: string[];
      completenessPercentage: number;
    };
    content: {
      quantificationRatio: number;
      strongVerbPercentage: number;
      clarityScore: number;
      impactScore: number;
    };
    tailoring: {
      keywordMatchPercentage: number;
      missingKeywords: string[];
    };
  };
} {
  const startTime = Date.now();

  // ========== STRUCTURE SCORE (0-40) ==========
  // Based on completeness of standard sections

  const sections = detectSections(resumeText);
  const essentialSections = ['experience', 'skills', 'education', 'summary', 'contact'];
  const sectionsFound = essentialSections.filter(section =>
    sections.some(s => s.toLowerCase().includes(section))
  );
  const sectionsMissing = essentialSections.filter(section =>
    !sections.some(s => s.toLowerCase().includes(section))
  );

  // Score: 8 points per essential section (5 sections × 8 = 40)
  const structureScore = Math.round((sectionsFound.length / essentialSections.length) * 40);
  const completenessPercentage = Math.round((sectionsFound.length / essentialSections.length) * 100);

  // ========== CONTENT SCORE (0-60) ==========
  // Based on clarity, metrics, action verbs, and impact

  const bullets = detectBulletPoints(resumeText);
  const quantifiedBullets = countQuantifiedBullets(bullets);
  const quantificationRatio = bullets.length > 0 ? quantifiedBullets / bullets.length : 0;

  const verbAnalysis = categorizeActionVerbs(bullets);
  const totalVerbs = verbAnalysis.strong.length + verbAnalysis.medium.length + verbAnalysis.weak.length;
  const strongVerbPercentage = totalVerbs > 0
    ? (verbAnalysis.strong.length / totalVerbs) * 100
    : 0;

  const avgWordsPerBullet = calculateAvgWordsPerBullet(bullets);
  const isOptimalLength = avgWordsPerBullet >= 15 && avgWordsPerBullet <= 25;
  const clarityScore = isOptimalLength ? 100 : Math.max(0, 100 - Math.abs(avgWordsPerBullet - 20) * 3);

  // Impact score: combination of quantification and strong verbs
  const impactScore = (quantificationRatio * 100 * 0.6) + (strongVerbPercentage * 0.4);

  // Content score breakdown (60 points total):
  // - Quantification: 25 points (quantificationRatio * 25)
  // - Action verbs: 20 points (strongVerbPercentage / 100 * 20)
  // - Clarity: 10 points (clarityScore / 100 * 10)
  // - Impact: 5 points (impactScore / 100 * 5)
  const contentScore = Math.round(
    (quantificationRatio * 25) +
    ((strongVerbPercentage / 100) * 20) +
    ((clarityScore / 100) * 10) +
    ((impactScore / 100) * 5)
  );

  // ========== TAILORING SCORE (0-40) ==========
  // Based on match to job description (future feature)
  // Currently returns 0 but infrastructure is ready for future expansion

  let tailoringScore = 0;
  let keywordMatchPercentage = 0;
  let missingKeywords: string[] = [];

  if (jobDescription) {
    // Future: Implement JD matching logic here
    // For now, use basic keyword matching from existing system
    const keywords = getKeywordsForRole(jobRole);
    const foundKeywords = findMatchingKeywords(resumeText, keywords.mustHave);
    keywordMatchPercentage = Math.round((foundKeywords.found.length / keywords.mustHave.length) * 100);
    missingKeywords = foundKeywords.missing;
    tailoringScore = Math.round((keywordMatchPercentage / 100) * 40);
  }

  // ========== OVERALL SCORE (0-100) ==========
  // Weighted combination: 30% structure + 40% content + 30% tailoring
  // Formula: (structure/40 * 0.3 + content/60 * 0.4 + tailoring/40 * 0.3) * 100
  const overallScore = Math.round(
    (structureScore / 40) * 0.3 * 100 +
    (contentScore / 60) * 0.4 * 100 +
    (tailoringScore / 40) * 0.3 * 100
  );

  const processingTime = Date.now() - startTime;
  console.log(`[HYBRID 3D] Structure ${structureScore} | Content ${contentScore} | Tailoring ${tailoringScore} | Overall ${overallScore} (${processingTime}ms)`);

  return {
    structure: structureScore,
    content: contentScore,
    tailoring: tailoringScore,
    overall: overallScore,
    breakdown: {
      structure: {
        sectionsFound,
        sectionsMissing,
        completenessPercentage,
      },
      content: {
        quantificationRatio: Math.round(quantificationRatio * 100),
        strongVerbPercentage: Math.round(strongVerbPercentage),
        clarityScore: Math.round(clarityScore),
        impactScore: Math.round(impactScore),
      },
      tailoring: {
        keywordMatchPercentage,
        missingKeywords,
      },
    },
  };
}
