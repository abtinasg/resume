/**
 * Layer 2 - Strategy Engine
 * String Canonicalization
 *
 * Provides deterministic string normalization for matching skills,
 * tools, and other terms. Pure functions for testability.
 *
 * Based on: Layer_2_Strategy_Engine_v2.1.md Section 3.1
 */

import { getSynonyms } from '../config';
import { shouldPreserveSpecialChars } from '../constants';

// ==================== Cached Data ====================

let synonymMapCache: Record<string, string> | null = null;

// ==================== Helper Functions ====================

/**
 * Get the synonym map (cached)
 */
function getSynonymMap(): Record<string, string> {
  if (synonymMapCache === null) {
    synonymMapCache = getSynonyms();
  }
  return synonymMapCache;
}

/**
 * Collapse multiple whitespace characters into single space
 */
function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ');
}

/**
 * Remove leading and trailing punctuation, but preserve special cases
 * like C#, C++, etc.
 */
function removeSurroundingPunctuation(text: string): string {
  // Check if the term should preserve special characters
  if (shouldPreserveSpecialChars(text)) {
    return text;
  }

  // Remove common punctuation from start and end
  // But preserve # and + for special cases
  let result = text;
  
  // Remove leading punctuation (except special chars)
  result = result.replace(/^[^\w#+-]+/, '');
  
  // Remove trailing punctuation (except special chars)
  result = result.replace(/[^\w#+-]+$/, '');
  
  return result;
}

/**
 * Normalize special symbols while preserving meaningful ones
 */
function normalizeSymbols(text: string): string {
  // Keep special programming language symbols
  // C#, C++, F#, .NET should be preserved
  
  // Convert common variations
  let result = text;
  
  // Normalize dots in framework names
  result = result.replace(/\.js$/i, '.js');
  result = result.replace(/\.net$/i, '.net');
  
  return result;
}

// ==================== Main Canonicalization Function ====================

/**
 * Canonicalize a term for matching
 *
 * Rules (from spec Section 3.1):
 * 1. Lowercase
 * 2. Trim whitespace
 * 3. Collapse multiple spaces
 * 4. Remove surrounding punctuation
 * 5. Normalize common symbols
 * 6. Apply synonym mappings
 *
 * @param term - The term to canonicalize
 * @returns Canonicalized term
 *
 * @example
 * canonicalize('  TypeScript ') // 'typescript'
 * canonicalize('JS') // 'javascript'
 * canonicalize('C#') // 'c#'
 * canonicalize('React.js') // 'react'
 * canonicalize('k8s') // 'kubernetes'
 */
export function canonicalize(term: string): string {
  if (!term || typeof term !== 'string') {
    return '';
  }

  // Step 1: Lowercase and trim
  let result = term.toLowerCase().trim();

  // Step 2: Collapse whitespace
  result = collapseWhitespace(result);

  // Step 3: Remove surrounding punctuation
  result = removeSurroundingPunctuation(result);

  // Step 4: Normalize symbols
  result = normalizeSymbols(result);

  // Step 5: Apply synonym mapping
  const synonymMap = getSynonymMap();
  if (synonymMap[result]) {
    result = synonymMap[result];
  }

  return result;
}

/**
 * Canonicalize an array of terms
 *
 * @param terms - Array of terms to canonicalize
 * @returns Array of canonicalized terms (deduplicated)
 */
export function canonicalizeAll(terms: string[]): string[] {
  if (!Array.isArray(terms)) {
    return [];
  }

  const canonicalized = terms.map(canonicalize).filter(Boolean);
  
  // Remove duplicates while preserving order
  return [...new Set(canonicalized)];
}

/**
 * Check if two terms are equivalent after canonicalization
 *
 * @param term1 - First term
 * @param term2 - Second term
 * @returns True if terms are equivalent
 */
export function areEquivalent(term1: string, term2: string): boolean {
  return canonicalize(term1) === canonicalize(term2);
}

/**
 * Find matching terms between two lists after canonicalization
 *
 * @param list1 - First list of terms
 * @param list2 - Second list of terms
 * @returns Object with matched and unmatched terms
 */
export function findMatches(
  list1: string[],
  list2: string[]
): {
  matched: string[];
  unmatchedFromList1: string[];
  unmatchedFromList2: string[];
} {
  const canonical1 = canonicalizeAll(list1);
  const canonical2 = new Set(canonicalizeAll(list2));

  const matched: string[] = [];
  const unmatchedFromList1: string[] = [];

  for (const term of canonical1) {
    if (canonical2.has(term)) {
      matched.push(term);
    } else {
      unmatchedFromList1.push(term);
    }
  }

  // Find terms in list2 not in list1
  const canonical1Set = new Set(canonical1);
  const unmatchedFromList2 = canonicalizeAll(list2).filter(
    (term) => !canonical1Set.has(term)
  );

  return {
    matched,
    unmatchedFromList1,
    unmatchedFromList2,
  };
}

/**
 * Calculate match percentage between two lists
 *
 * @param haveList - Terms the user has
 * @param needList - Terms that are needed/required
 * @returns Match percentage (0-100)
 */
export function calculateMatchPercentage(
  haveList: string[],
  needList: string[]
): number {
  if (needList.length === 0) {
    return 100; // Nothing needed, perfect match
  }

  const { matched } = findMatches(haveList, needList);
  const percentage = (matched.length / needList.length) * 100;
  
  return Math.round(percentage);
}

// ==================== Cache Management ====================

/**
 * Clear the synonym cache
 * Useful for testing
 */
export function clearCanonicalizationCache(): void {
  synonymMapCache = null;
}
