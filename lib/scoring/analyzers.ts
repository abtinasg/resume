/**
 * PRO Resume Scoring System - Analyzer Helpers
 *
 * This module contains helper functions for analyzing resume text:
 * - Bullet point detection and analysis
 * - Action verb categorization
 * - Keyword extraction
 * - Format issue detection
 * - Text statistics
 */

import {
  BulletPoint,
  ResumeTextAnalysis,
  FormatIssue,
} from './types';
import {
  ACTION_VERBS,
  QUANTIFICATION_INDICATORS,
  STANDARD_SECTION_HEADERS,
} from './keywords';

// ==================== Text Preprocessing ====================

/**
 * Normalize text for analysis (lowercase, trim, remove extra spaces)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Remove common stop words from text
 */
export function removeStopWords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'have', 'this', 'but', 'they', 'his',
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Extract all words from text (normalized, no stop words)
 */
export function extractWords(text: string): string[] {
  const words = removeStopWords(text);
  // Remove special characters but keep letters, numbers, and some symbols
  return words.map(word => word.replace(/[^\w\s-]/g, '')).filter(w => w.length > 0);
}

// ==================== Bullet Point Detection ====================

/**
 * Detect and extract bullet points from resume text
 * Supports various bullet point formats: -, •, *, ○, ●, ►, etc.
 */
export function detectBulletPoints(text: string): string[] {
  const lines = text.split('\n');
  const bulletPoints: string[] = [];

  // Common bullet point indicators
  const bulletRegex = /^[\s]*[-•*○●►▪▸‣⦿⦾⁃]\s+(.+)$/;
  const numberedRegex = /^[\s]*\d+[\.)]\s+(.+)$/;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines or very short lines
    if (trimmedLine.length < 10) continue;

    // Check for bullet point
    const bulletMatch = trimmedLine.match(bulletRegex);
    if (bulletMatch) {
      bulletPoints.push(bulletMatch[1].trim());
      continue;
    }

    // Check for numbered list
    const numberedMatch = trimmedLine.match(numberedRegex);
    if (numberedMatch) {
      bulletPoints.push(numberedMatch[1].trim());
      continue;
    }

    // If line starts with action verb, consider it a bullet
    const firstWord = trimmedLine.split(/\s+/)[0];
    if (firstWord && isActionVerb(firstWord)) {
      bulletPoints.push(trimmedLine);
    }
  }

  return bulletPoints;
}

/**
 * Analyze a single bullet point
 */
export function analyzeBulletPoint(bullet: string): BulletPoint {
  const words = bullet.split(/\s+/);
  const firstWord = words[0]?.replace(/[^\w]/g, '') || '';

  return {
    text: bullet,
    isQuantified: isQuantified(bullet),
    firstWord,
    verbCategory: categorizeActionVerb(firstWord),
    wordCount: words.length,
  };
}

/**
 * Analyze all bullet points in resume
 */
export function analyzeBulletPoints(bullets: string[]): BulletPoint[] {
  return bullets.map(bullet => analyzeBulletPoint(bullet));
}

// ==================== Quantification Detection ====================

/**
 * Check if a bullet point contains quantification (numbers, %, $, metrics)
 */
export function isQuantified(text: string): boolean {
  // Check for percentage
  if (/%|percent/i.test(text)) return true;

  // Check for currency
  if(/\$|€|£|¥|USD|EUR|GBP/i.test(text)) return true;

  // Check for numbers with magnitude (1M, 10K, 5B, 2.5M, etc.)
  if (/\d+\.?\d*[KMB]\b/i.test(text)) return true;

  // Check for numbers followed by scale indicators
  const scalePattern = /\d+\.?\d*\s*(million|billion|thousand|hundred)/i;
  if (scalePattern.test(text)) return true;

  // Check for comparison numbers (2x, 3x, 10x, etc.)
  if (/\d+x\b/i.test(text)) return true;

  // Check for standalone numbers (with context)
  // Must have number AND one of these words nearby
  const hasNumber = /\d+/.test(text);
  if (hasNumber) {
    const contextWords = [
      'increased', 'decreased', 'reduced', 'improved', 'grew',
      'scaled', 'users', 'customers', 'projects', 'teams',
      'revenue', 'sales', 'cost', 'time', 'performance',
    ];
    const lowerText = text.toLowerCase();
    if (contextWords.some(word => lowerText.includes(word))) {
      return true;
    }
  }

  return false;
}

/**
 * Count quantified bullet points
 */
export function countQuantifiedBullets(bullets: string[]): number {
  return bullets.filter(bullet => isQuantified(bullet)).length;
}

/**
 * Calculate quantification ratio
 */
export function calculateQuantificationRatio(bullets: string[]): number {
  if (bullets.length === 0) return 0;
  const quantified = countQuantifiedBullets(bullets);
  return quantified / bullets.length;
}

// ==================== Action Verb Analysis ====================

/**
 * Check if a word is an action verb (any category)
 */
export function isActionVerb(word: string): boolean {
  const normalized = word.toLowerCase().replace(/[^\w\s]/g, '');
  const allVerbs = [
    ...ACTION_VERBS.strong,
    ...ACTION_VERBS.medium,
    ...ACTION_VERBS.weak,
  ].map(v => v.toLowerCase());

  return allVerbs.includes(normalized);
}

/**
 * Categorize a single action verb
 */
export function categorizeActionVerb(word: string): 'strong' | 'medium' | 'weak' | undefined {
  const normalized = word.toLowerCase().replace(/[^\w\s]/g, '');

  if (ACTION_VERBS.strong.some(v => v.toLowerCase() === normalized)) {
    return 'strong';
  }
  if (ACTION_VERBS.medium.some(v => v.toLowerCase() === normalized)) {
    return 'medium';
  }
  if (ACTION_VERBS.weak.some(v => v.toLowerCase() === normalized)) {
    return 'weak';
  }

  // Check for weak phrases
  const weakPhrases = ACTION_VERBS.weak.map(v => v.toLowerCase());
  const lowerWord = word.toLowerCase();
  if (weakPhrases.some(phrase => lowerWord.includes(phrase.replace(/\s+/g, '')))) {
    return 'weak';
  }

  return undefined;
}

/**
 * Categorize all action verbs in bullet points
 */
export function categorizeActionVerbs(bullets: string[]): {
  strong: string[];
  medium: string[];
  weak: string[];
  uncategorized: string[];
} {
  const result = {
    strong: [] as string[],
    medium: [] as string[],
    weak: [] as string[],
    uncategorized: [] as string[],
  };

  for (const bullet of bullets) {
    const firstWord = bullet.split(/\s+/)[0]?.replace(/[^\w]/g, '') || '';
    if (!firstWord) continue;

    const category = categorizeActionVerb(firstWord);
    if (category) {
      result[category].push(firstWord);
    } else {
      result.uncategorized.push(firstWord);
    }
  }

  return result;
}

// ==================== Keyword Extraction ====================

/**
 * Extract keywords from resume text
 * Returns normalized words (no stop words, lowercase)
 */
export function extractKeywords(text: string): string[] {
  return extractWords(text);
}

/**
 * Find matching keywords from a list
 */
export function findMatchingKeywords(
  resumeText: string,
  expectedKeywords: string[]
): {
  found: string[];
  missing: string[];
  frequency: Record<string, number>;
} {
  const normalizedText = normalizeText(resumeText);
  const words = extractWords(resumeText);

  const found: string[] = [];
  const missing: string[] = [];
  const frequency: Record<string, number> = {};

  for (const keyword of expectedKeywords) {
    const normalizedKeyword = keyword.toLowerCase();

    // Escape special regex characters in the keyword
    const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Check if keyword exists in text (as whole word or phrase)
    const keywordPattern = new RegExp(`\\b${escapedKeyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
    const isFound = keywordPattern.test(normalizedText);

    if (isFound) {
      found.push(keyword);

      // Count frequency
      const matches = normalizedText.match(keywordPattern);
      frequency[keyword] = matches ? matches.length : 1;
    } else {
      missing.push(keyword);
    }
  }

  return { found, missing, frequency };
}

// ==================== Section Detection ====================

/**
 * Detect resume sections based on headers
 */
export function detectSections(text: string): {
  found: string[];
  standard: string[];
  nonStandard: string[];
} {
  const lines = text.split('\n');
  const foundSections: string[] = [];
  const standardSections: string[] = [];
  const nonStandardSections: string[] = [];

  // Look for section headers (usually all caps or title case, standalone lines)
  const sectionRegex = /^([A-Z][A-Za-z\s&]+)$/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 3 || trimmedLine.length > 50) continue;

    const match = trimmedLine.match(sectionRegex);
    if (match) {
      const section = match[1];
      foundSections.push(section);

      // Check if standard
      const isStandard = STANDARD_SECTION_HEADERS.some(
        header => header.toLowerCase() === section.toLowerCase()
      );

      if (isStandard) {
        standardSections.push(section);
      } else {
        nonStandardSections.push(section);
      }
    }
  }

  return {
    found: foundSections,
    standard: standardSections,
    nonStandard: nonStandardSections,
  };
}

// ==================== Format Issue Detection ====================

/**
 * Detect format issues that hurt ATS compatibility
 */
export function detectFormatIssues(text: string): FormatIssue[] {
  const issues: FormatIssue[] = [];

  // Check for tables (multiple consecutive tabs/pipes)
  if (/\t{2,}/.test(text) || /\|.*\|.*\|/.test(text)) {
    issues.push({
      severity: 'error',
      issue: 'Tables detected',
      penalty: 20,
      fix: 'Convert tables to bullet points or plain text',
    });
  }

  // Check for multiple columns (heuristic: lots of tabs)
  const tabCount = (text.match(/\t/g) || []).length;
  if (tabCount > 20) {
    issues.push({
      severity: 'warning',
      issue: 'Multiple columns detected (high tab usage)',
      penalty: 15,
      fix: 'Use single-column layout',
    });
  }

  // Check for special bullets
  const specialBullets = /[★☆■□▲△◆◇]/g;
  if (specialBullets.test(text)) {
    issues.push({
      severity: 'warning',
      issue: 'Special bullet characters detected',
      penalty: 10,
      fix: 'Use standard bullets (-, •, or *)',
    });
  }

  // Check for very long lines (might indicate formatting issues)
  const lines = text.split('\n');
  const longLines = lines.filter(line => line.length > 200);
  if (longLines.length > 3) {
    issues.push({
      severity: 'info',
      issue: 'Very long text lines detected',
      penalty: 5,
      fix: 'Ensure proper line breaks',
    });
  }

  // Check for excessive use of special characters
  const specialChars = text.match(/[^\w\s\-.,;:!()?'"]/g) || [];
  if (specialChars.length > text.length * 0.05) {
    issues.push({
      severity: 'warning',
      issue: 'Excessive special characters',
      penalty: 10,
      fix: 'Remove decorative characters',
    });
  }

  return issues;
}

// ==================== Text Statistics ====================

/**
 * Count total words in text
 */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate page count from text
 * Assumes ~500 words per page
 */
export function estimatePageCount(text: string): number {
  const wordCount = countWords(text);
  const estimatedPages = Math.ceil(wordCount / 500);
  return Math.max(1, Math.min(estimatedPages, 10)); // Cap at 10 pages
}

/**
 * Estimate years of experience from text
 * Looks for year patterns and job tenure indicators
 */
export function estimateYearsOfExperience(text: string): number {
  // Look for year ranges (e.g., "2018 - 2020", "2018-2020", "2018 to 2020")
  const yearRangePattern = /(\d{4})\s*[-–—to]+\s*(\d{4}|present|current)/gi;
  const matches = text.matchAll(yearRangePattern);

  let totalYears = 0;
  const currentYear = new Date().getFullYear();

  for (const match of matches) {
    const startYear = parseInt(match[1]);
    const endYearStr = match[2].toLowerCase();
    const endYear = endYearStr === 'present' || endYearStr === 'current'
      ? currentYear
      : parseInt(endYearStr);

    if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear) {
      totalYears += (endYear - startYear);
    }
  }

  // If no years found, estimate based on number of jobs
  if (totalYears === 0) {
    const bullets = detectBulletPoints(text);
    // Rough estimate: 2 years per 5 bullet points
    totalYears = Math.floor(bullets.length / 5) * 2;
  }

  return Math.max(0, Math.min(totalYears, 40)); // Cap at 40 years
}

/**
 * Calculate average words per bullet point
 */
export function calculateAvgWordsPerBullet(bullets: string[]): number {
  if (bullets.length === 0) return 0;

  const totalWords = bullets.reduce((sum, bullet) => {
    return sum + bullet.split(/\s+/).length;
  }, 0);

  return Math.round(totalWords / bullets.length);
}

// ==================== Comprehensive Text Analysis ====================

/**
 * Perform comprehensive analysis of resume text
 * Returns all statistics and extracted data
 */
export function analyzeResumeText(text: string): ResumeTextAnalysis {
  const bullets = detectBulletPoints(text);
  const bulletPoints = analyzeBulletPoints(bullets);
  const words = extractWords(text);
  const sections = detectSections(text);

  return {
    totalWords: countWords(text),
    totalBullets: bullets.length,
    bulletPoints,
    words,
    sections: sections.found,
    pageCount: estimatePageCount(text),
    yearsExperience: estimateYearsOfExperience(text),
  };
}

/**
 * Validate resume text has minimum content
 */
export function validateResumeText(text: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!text || text.trim().length === 0) {
    errors.push('Resume text is empty');
  }

  if (text.length < 100) {
    errors.push('Resume text is too short (minimum 100 characters)');
  }

  const words = countWords(text);
  if (words < 50) {
    errors.push('Resume contains too few words (minimum 50 words)');
  }

  const bullets = detectBulletPoints(text);
  if (bullets.length < 3) {
    errors.push('Resume should contain at least 3 bullet points');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
