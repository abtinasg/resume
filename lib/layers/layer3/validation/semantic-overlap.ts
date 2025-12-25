/**
 * Layer 3 - Execution Engine
 * Semantic Overlap
 *
 * Checks semantic overlap between improved spans and evidence.
 * Simple MVP version using word overlap.
 */

import { getThresholds } from '../config';

// ==================== Constants ====================

/**
 * Common stop words to exclude from overlap calculation
 */
const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'as',
  'is',
  'was',
  'are',
  'were',
  'been',
  'be',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'must',
  'that',
  'which',
  'who',
  'whom',
  'this',
  'these',
  'those',
  'it',
  'its',
  'my',
  'your',
  'our',
  'their',
  'his',
  'her',
]);

// ==================== Core Functions ====================

/**
 * Verify semantic overlap between a span and evidence texts
 * Returns true if sufficient overlap exists
 *
 * @param span - The phrase to check
 * @param evidenceTexts - Array of evidence text strings
 * @param threshold - Minimum overlap ratio (default from config)
 */
export function verifySemanticOverlap(
  span: string,
  evidenceTexts: string[],
  threshold?: number
): boolean {
  const config = getThresholds();
  const overlapThreshold = threshold ?? config.evidence_overlap_threshold;

  // Get significant words from span
  const spanWords = getSignificantWords(span);

  if (spanWords.size === 0) {
    // If span has no significant words, consider it valid
    // (likely just function words)
    return true;
  }

  // Check overlap with each evidence text
  for (const evidenceText of evidenceTexts) {
    const evidenceWords = getSignificantWords(evidenceText);

    // Calculate overlap
    const overlap = setIntersection(spanWords, evidenceWords);
    const overlapRatio = overlap.size / spanWords.size;

    if (overlapRatio >= overlapThreshold) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate overlap ratio between span and evidence
 * Returns the best overlap ratio across all evidence texts
 */
export function calculateOverlapRatio(
  span: string,
  evidenceTexts: string[]
): number {
  const spanWords = getSignificantWords(span);

  if (spanWords.size === 0) {
    return 1.0; // No significant words = full overlap
  }

  let maxRatio = 0;

  for (const evidenceText of evidenceTexts) {
    const evidenceWords = getSignificantWords(evidenceText);
    const overlap = setIntersection(spanWords, evidenceWords);
    const ratio = overlap.size / spanWords.size;

    if (ratio > maxRatio) {
      maxRatio = ratio;
    }
  }

  return maxRatio;
}

/**
 * Get detailed overlap analysis
 */
export function analyzeOverlap(
  span: string,
  evidenceTexts: string[]
): {
  spanWords: string[];
  matchedWords: string[];
  unmatchedWords: string[];
  overlapRatio: number;
  hasOverlap: boolean;
} {
  const spanWords = getSignificantWords(span);
  const allEvidenceWords = new Set<string>();

  for (const evidenceText of evidenceTexts) {
    const words = getSignificantWords(evidenceText);
    for (const word of words) {
      allEvidenceWords.add(word);
    }
  }

  const matchedWords = setIntersection(spanWords, allEvidenceWords);
  const unmatchedWords = setDifference(spanWords, allEvidenceWords);
  const overlapRatio = spanWords.size > 0 ? matchedWords.size / spanWords.size : 1.0;

  const config = getThresholds();

  return {
    spanWords: Array.from(spanWords),
    matchedWords: Array.from(matchedWords),
    unmatchedWords: Array.from(unmatchedWords),
    overlapRatio,
    hasOverlap: overlapRatio >= config.evidence_overlap_threshold,
  };
}

// ==================== Word Processing ====================

/**
 * Extract significant words from text (excluding stop words)
 */
export function getSignificantWords(text: string): Set<string> {
  // Tokenize and normalize
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .filter((word) => !STOP_WORDS.has(word));

  return new Set(words);
}

/**
 * Tokenize text into words
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/**
 * Get word stems (simple suffix removal)
 * This is a very basic stemmer for MVP
 */
export function stem(word: string): string {
  // Remove common suffixes
  const suffixes = ['ing', 'ed', 'es', 's', 'er', 'est', 'ly', 'ment', 'tion', 'ness'];

  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      return word.slice(0, -suffix.length);
    }
  }

  return word;
}

/**
 * Get stemmed significant words
 */
export function getStemmedWords(text: string): Set<string> {
  const words = getSignificantWords(text);
  return new Set(Array.from(words).map(stem));
}

// ==================== Set Operations ====================

/**
 * Set intersection
 */
function setIntersection<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set(Array.from(a).filter((x) => b.has(x)));
}

/**
 * Set difference (a - b)
 */
function setDifference<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set(Array.from(a).filter((x) => !b.has(x)));
}

/**
 * Set union
 */
export function setUnion<T>(a: Set<T>, b: Set<T>): Set<T> {
  return new Set([...a, ...b]);
}

// ==================== Similarity Measures ====================

/**
 * Calculate Jaccard similarity between two texts
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = getSignificantWords(text1);
  const words2 = getSignificantWords(text2);

  if (words1.size === 0 && words2.size === 0) {
    return 1.0;
  }

  const intersection = setIntersection(words1, words2);
  const union = setUnion(words1, words2);

  return intersection.size / union.size;
}

/**
 * Calculate overlap coefficient (Szymkiewicz–Simpson)
 * overlap(A,B) = |A ∩ B| / min(|A|, |B|)
 */
export function overlapCoefficient(text1: string, text2: string): number {
  const words1 = getSignificantWords(text1);
  const words2 = getSignificantWords(text2);

  if (words1.size === 0 || words2.size === 0) {
    return 0;
  }

  const intersection = setIntersection(words1, words2);
  const minSize = Math.min(words1.size, words2.size);

  return intersection.size / minSize;
}

/**
 * Check if span is a substring or near-match of evidence
 */
export function isSubstringMatch(span: string, evidenceTexts: string[]): boolean {
  const spanLower = span.toLowerCase().trim();

  for (const evidence of evidenceTexts) {
    const evidenceLower = evidence.toLowerCase();

    // Direct substring match
    if (evidenceLower.includes(spanLower)) {
      return true;
    }

    // Check if span is contained in evidence with fuzzy matching
    const spanWords = spanLower.split(/\s+/);
    let allFound = true;

    for (const word of spanWords) {
      if (!evidenceLower.includes(word)) {
        allFound = false;
        break;
      }
    }

    if (allFound && spanWords.length > 1) {
      return true;
    }
  }

  return false;
}
