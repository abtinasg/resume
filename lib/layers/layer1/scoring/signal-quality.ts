/**
 * Layer 1 - Evaluation Engine
 * Signal Quality Scoring Module
 *
 * Evaluates presentation and communication quality:
 * - Formatting assessment
 * - Writing quality (clarity, conciseness)
 * - ATS compatibility indicators
 * - Structure and organization
 */

import type { ParsedResume, DimensionScore } from '../types';
import { SECTION_PATTERNS, CONTENT_THRESHOLDS } from '../config/weights';

// ==================== Constants ====================

/**
 * Standard resume sections in recommended order
 */
const STANDARD_SECTION_ORDER = [
  'summary',
  'experience',
  'skills',
  'education',
  'projects',
  'certifications',
];

/**
 * Essential sections for a complete resume
 */
const ESSENTIAL_SECTIONS = ['experience', 'skills', 'education'];

/**
 * Common formatting issues that hurt ATS compatibility
 */
const FORMATTING_ISSUES_PATTERNS = [
  { pattern: /\t{2,}/g, issue: 'excessive_tabs', penalty: 3 },
  { pattern: /[│┌└├┐┘┤┬┴┼]/g, issue: 'special_characters', penalty: 5 },
  { pattern: /[^\x00-\x7F]/g, issue: 'non_ascii_characters', penalty: 2 },
  { pattern: /^\s{10,}/gm, issue: 'excessive_indentation', penalty: 2 },
];

// ==================== Main Scoring Function ====================

/**
 * Calculate signal quality score (0-100)
 */
export function calculateSignalQualityScore(
  parsed: ParsedResume,
  rawText: string
): DimensionScore {
  const breakdown: Record<string, number> = {};
  const issues: string[] = [];

  // 1. Structure score (0-30)
  const structureScore = calculateStructureScore(parsed, rawText, issues);
  breakdown.structure = structureScore;

  // 2. Writing quality score (0-30)
  const writingScore = calculateWritingQualityScore(parsed, issues);
  breakdown.writing_quality = writingScore;

  // 3. Formatting/ATS score (0-25)
  const formattingScore = calculateFormattingScore(parsed, rawText, issues);
  breakdown.formatting = formattingScore;

  // 4. Completeness score (0-15)
  const completenessScore = calculateCompletenessScore(parsed, issues);
  breakdown.completeness = completenessScore;

  // Calculate total score
  const totalScore = structureScore + writingScore + formattingScore + completenessScore;
  const normalizedScore = Math.min(100, totalScore);

  return {
    score: Math.round(normalizedScore),
    breakdown,
    issues: issues.length > 0 ? issues : undefined,
  };
}

// ==================== Structure Assessment ====================

/**
 * Calculate score based on resume structure
 */
function calculateStructureScore(
  parsed: ParsedResume,
  rawText: string,
  issues: string[]
): number {
  let score = 0;

  // Check for essential sections
  const detectedSections = detectSectionsInText(rawText);
  const essentialPresent = ESSENTIAL_SECTIONS.filter(s => 
    detectedSections.includes(s)
  );

  // Essential sections (0-15)
  const essentialRatio = essentialPresent.length / ESSENTIAL_SECTIONS.length;
  if (essentialRatio >= 1) {
    score += 15;
  } else if (essentialRatio >= 0.66) {
    score += 10;
    issues.push('missing_essential_sections');
  } else {
    score += 5;
    issues.push('many_missing_sections');
  }

  // Section organization (0-10)
  const sectionOrder = analyzeSectionOrder(detectedSections);
  score += sectionOrder.score;
  if (!sectionOrder.isWellOrdered) {
    issues.push('poor_section_order');
  }

  // Clear section headers (0-5)
  const hasVisibleHeaders = rawText.split('\n').filter(line => {
    const trimmed = line.trim();
    return (
      trimmed.length > 0 &&
      trimmed.length < 30 &&
      /^[A-Z]/.test(trimmed) &&
      Object.values(SECTION_PATTERNS).some(patterns =>
        patterns.some(p => p.test(trimmed))
      )
    );
  }).length;

  if (hasVisibleHeaders >= 3) {
    score += 5;
  } else if (hasVisibleHeaders >= 2) {
    score += 3;
  } else {
    score += 1;
    issues.push('unclear_section_headers');
  }

  return Math.min(30, score);
}

/**
 * Detect which sections are present in text
 */
function detectSectionsInText(text: string): string[] {
  const detected: string[] = [];

  for (const [sectionName, patterns] of Object.entries(SECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        detected.push(sectionName);
        break;
      }
    }
  }

  return detected;
}

/**
 * Analyze if sections are in a logical order
 */
function analyzeSectionOrder(detectedSections: string[]): {
  score: number;
  isWellOrdered: boolean;
} {
  if (detectedSections.length < 2) {
    return { score: 5, isWellOrdered: true };
  }

  // Count sections in correct relative order
  let correctOrder = 0;
  let totalPairs = 0;

  for (let i = 0; i < detectedSections.length - 1; i++) {
    const currentIdx = STANDARD_SECTION_ORDER.indexOf(detectedSections[i]);
    const nextIdx = STANDARD_SECTION_ORDER.indexOf(detectedSections[i + 1]);

    if (currentIdx !== -1 && nextIdx !== -1) {
      totalPairs++;
      if (currentIdx < nextIdx) {
        correctOrder++;
      }
    }
  }

  const orderRatio = totalPairs > 0 ? correctOrder / totalPairs : 1;

  return {
    score: Math.round(orderRatio * 10),
    isWellOrdered: orderRatio >= 0.7,
  };
}

// ==================== Writing Quality Assessment ====================

/**
 * Calculate score based on writing quality
 */
function calculateWritingQualityScore(
  parsed: ParsedResume,
  issues: string[]
): number {
  let score = 0;

  // Get all bullets for analysis
  const allBullets = parsed.experiences.flatMap(exp => exp.bullets);
  
  if (allBullets.length === 0) {
    issues.push('no_bullet_points');
    return 10;
  }

  // Bullet length analysis (0-10)
  const lengthAnalysis = analyzeBulletLengths(allBullets);
  score += lengthAnalysis.score;
  if (!lengthAnalysis.isOptimal) {
    if (lengthAnalysis.tooShort) issues.push('bullets_too_short');
    if (lengthAnalysis.tooLong) issues.push('bullets_too_long');
  }

  // Consistency (0-10)
  const consistencyScore = analyzeConsistency(allBullets, issues);
  score += consistencyScore;

  // Clarity (0-10) - no filler words, jargon overload
  const clarityScore = analyzeClarity(allBullets, issues);
  score += clarityScore;

  return Math.min(30, score);
}

/**
 * Analyze bullet point lengths
 */
function analyzeBulletLengths(bullets: string[]): {
  score: number;
  isOptimal: boolean;
  tooShort: boolean;
  tooLong: boolean;
} {
  const lengths = bullets.map(b => b.split(/\s+/).filter(w => w.length > 0).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  const { min, max } = CONTENT_THRESHOLDS.optimal_bullet_length;
  const optimalCount = lengths.filter(l => l >= min && l <= max).length;
  const optimalRatio = optimalCount / lengths.length;

  const tooShortCount = lengths.filter(l => l < min).length;
  const tooLongCount = lengths.filter(l => l > max).length;

  let score: number;
  if (optimalRatio >= 0.7) {
    score = 10;
  } else if (optimalRatio >= 0.5) {
    score = 7;
  } else if (optimalRatio >= 0.3) {
    score = 5;
  } else {
    score = 3;
  }

  return {
    score,
    isOptimal: optimalRatio >= 0.5,
    tooShort: tooShortCount > lengths.length * 0.3,
    tooLong: tooLongCount > lengths.length * 0.3,
  };
}

/**
 * Analyze writing consistency
 */
function analyzeConsistency(bullets: string[], issues: string[]): number {
  let score = 10;

  // Check for consistent capitalization (all start with capital or all don't)
  const startsWithCapital = bullets.filter(b => /^[A-Z]/.test(b.trim())).length;
  const capitalRatio = startsWithCapital / bullets.length;
  
  if (capitalRatio !== 1 && capitalRatio !== 0) {
    // Inconsistent capitalization
    score -= 3;
    if (capitalRatio < 0.5 || capitalRatio > 0.8) {
      issues.push('inconsistent_capitalization');
    }
  }

  // Check for consistent punctuation at end
  const endsWithPeriod = bullets.filter(b => /\.\s*$/.test(b)).length;
  const periodRatio = endsWithPeriod / bullets.length;
  
  if (periodRatio > 0.2 && periodRatio < 0.8) {
    // Inconsistent punctuation
    score -= 2;
    issues.push('inconsistent_punctuation');
  }

  // Check for consistent tense (past vs present)
  const presentTense = bullets.filter(b => {
    const firstWord = b.trim().split(/\s+/)[0];
    return firstWord && !firstWord.endsWith('ed') && !firstWord.endsWith('ing');
  }).length;
  const tenseRatio = presentTense / bullets.length;
  
  if (tenseRatio > 0.3 && tenseRatio < 0.7) {
    score -= 2;
    issues.push('inconsistent_tense');
  }

  return Math.max(0, score);
}

/**
 * Analyze writing clarity
 */
function analyzeClarity(bullets: string[], issues: string[]): number {
  let score = 10;

  // Filler words
  const fillerPatterns = [
    /\bvery\b/gi,
    /\breally\b/gi,
    /\bjust\b/gi,
    /\bbasically\b/gi,
    /\bactually\b/gi,
  ];

  let fillerCount = 0;
  for (const bullet of bullets) {
    for (const pattern of fillerPatterns) {
      const matches = bullet.match(pattern);
      if (matches) {
        fillerCount += matches.length;
      }
    }
  }

  if (fillerCount > bullets.length * 0.5) {
    score -= 3;
    issues.push('too_many_filler_words');
  }

  // Jargon/buzzword overload
  const buzzwords = [
    'synergy',
    'leverage',
    'paradigm',
    'streamline',
    'best-in-class',
    'cutting-edge',
    'innovative',
    'world-class',
    'holistic',
  ];

  let buzzwordCount = 0;
  for (const bullet of bullets) {
    for (const buzzword of buzzwords) {
      if (bullet.toLowerCase().includes(buzzword)) {
        buzzwordCount++;
      }
    }
  }

  if (buzzwordCount > 5) {
    score -= 2;
    issues.push('buzzword_overload');
  }

  // Run-on sentences (very long without commas/periods)
  const runOnCount = bullets.filter(b => {
    const words = b.split(/\s+/).length;
    const punctuation = (b.match(/[,;:.]/g) || []).length;
    return words > 30 && punctuation < 2;
  }).length;

  if (runOnCount > 2) {
    score -= 2;
    issues.push('run_on_sentences');
  }

  return Math.max(0, score);
}

// ==================== Formatting/ATS Assessment ====================

/**
 * Calculate score based on formatting and ATS compatibility
 */
function calculateFormattingScore(
  parsed: ParsedResume,
  rawText: string,
  issues: string[]
): number {
  let score = 25;

  // Check for formatting issues
  for (const { pattern, issue, penalty } of FORMATTING_ISSUES_PATTERNS) {
    const matches = rawText.match(pattern);
    if (matches && matches.length > 5) {
      score -= penalty;
      issues.push(issue);
    }
  }

  // Check parse quality
  if (parsed.metadata.parse_quality === 'low') {
    score -= 10;
    issues.push('poor_formatting');
  } else if (parsed.metadata.parse_quality === 'medium') {
    score -= 5;
  }

  // Check for tables (can cause ATS issues)
  if (parsed.metadata.has_tables) {
    score -= 3;
    issues.push('tables_detected');
  }

  // Check word count
  const { min, max } = CONTENT_THRESHOLDS.optimal_word_count;
  if (parsed.metadata.word_count < min) {
    score -= 5;
    issues.push('resume_too_short');
  } else if (parsed.metadata.word_count > max) {
    score -= 3;
    issues.push('resume_too_long');
  }

  return Math.max(0, score);
}

// ==================== Completeness Assessment ====================

/**
 * Calculate score based on completeness of information
 */
function calculateCompletenessScore(
  parsed: ParsedResume,
  issues: string[]
): number {
  let score = 0;

  // Contact information (0-5)
  const contactFields = [
    parsed.personal.email,
    parsed.personal.phone,
    parsed.personal.location,
    parsed.personal.linkedin,
  ].filter(Boolean);

  if (contactFields.length >= 3) {
    score += 5;
  } else if (contactFields.length >= 2) {
    score += 3;
  } else {
    score += 1;
    issues.push('incomplete_contact_info');
  }

  // Experience details (0-5)
  if (parsed.experiences.length > 0) {
    const hasDetailedExperience = parsed.experiences.every(
      exp => exp.bullets.length >= 2 && exp.title && exp.company
    );

    if (hasDetailedExperience) {
      score += 5;
    } else if (parsed.experiences.some(exp => exp.bullets.length >= 2)) {
      score += 3;
    } else {
      score += 1;
      issues.push('sparse_experience_details');
    }
  } else {
    issues.push('no_experience');
  }

  // Education details (0-3)
  if (parsed.education.length > 0) {
    const hasDetailedEducation = parsed.education.some(
      edu => edu.degree && edu.institution
    );
    score += hasDetailedEducation ? 3 : 2;
  } else {
    score += 0;
    issues.push('no_education');
  }

  // Skills section (0-2)
  if (parsed.skills.length > 0) {
    score += 2;
  } else {
    issues.push('no_skills_section');
  }

  return Math.min(15, score);
}

// ==================== Export ====================

export { calculateSignalQualityScore as default };
