/**
 * Layer 3 - Execution Engine
 * Metric Detection
 *
 * Detects metrics, numbers, and quantifiable claims in text.
 */

import { getMetricRegexPatterns, getImpliedMetricPhrases, getScaleClaimPhrases } from '../config';

// ==================== Types ====================

/**
 * Detected metric information
 */
export interface DetectedMetric {
  /** The matched text */
  text: string;
  /** Type of metric */
  type: MetricType;
  /** Position in text */
  position: number;
  /** Length of match */
  length: number;
  /** Numeric value (if extractable) */
  numericValue?: number;
}

/**
 * Types of metrics we detect
 */
export type MetricType =
  | 'percentage'
  | 'dollar_amount'
  | 'count'
  | 'multiplier'
  | 'time'
  | 'range'
  | 'ratio'
  | 'implied'
  | 'scale_claim';

// ==================== Core Detection ====================

/**
 * Detect all metrics in text
 */
export function detectMetrics(text: string): DetectedMetric[] {
  const metrics: DetectedMetric[] = [];
  const patterns = getMetricRegexPatterns();

  for (const pattern of patterns) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Avoid duplicate detections at same position
      const alreadyDetected = metrics.some(
        (m) => m.position === match.index || 
               (m.position <= match.index && m.position + m.length > match.index)
      );

      if (!alreadyDetected) {
        const metricType = inferMetricType(match[0]);
        metrics.push({
          text: match[0],
          type: metricType,
          position: match.index,
          length: match[0].length,
          numericValue: extractNumericValue(match[0]),
        });
      }
    }
  }

  // Sort by position
  return metrics.sort((a, b) => a.position - b.position);
}

/**
 * Detect implied metrics (words that suggest scale without numbers)
 */
export function detectImpliedMetrics(text: string): DetectedMetric[] {
  const metrics: DetectedMetric[] = [];
  const impliedPhrases = getImpliedMetricPhrases();
  const textLower = text.toLowerCase();

  for (const phrase of impliedPhrases) {
    const index = textLower.indexOf(phrase.toLowerCase());
    if (index !== -1) {
      metrics.push({
        text: phrase,
        type: 'implied',
        position: index,
        length: phrase.length,
      });
    }
  }

  return metrics;
}

/**
 * Detect scale claims that need evidence
 */
export function detectScaleClaims(text: string): DetectedMetric[] {
  const claims: DetectedMetric[] = [];
  const scaleClaimPhrases = getScaleClaimPhrases();
  const textLower = text.toLowerCase();

  for (const phrase of scaleClaimPhrases) {
    const index = textLower.indexOf(phrase.toLowerCase());
    if (index !== -1) {
      claims.push({
        text: phrase,
        type: 'scale_claim',
        position: index,
        length: phrase.length,
      });
    }
  }

  return claims;
}

// ==================== Number Extraction ====================

/**
 * Extract all numbers from text
 */
export function extractNumbers(text: string): Set<string> {
  const numbers = new Set<string>();

  // Match various number formats
  const patterns = [
    /\d+(\.\d+)?%/g,           // Percentages
    /\$[\d,]+(\.\d{1,2})?[KMB]?/gi, // Dollar amounts
    /\d+[KMBkmb]\b/g,          // Scale numbers (10K, 5M)
    /\d+(\.\d+)?x/gi,          // Multipliers
    /\b\d+\+?/g,               // Plain numbers (with optional +)
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        numbers.add(match);
      }
    }
  }

  return numbers;
}

/**
 * Extract all numbers from multiple text sources
 */
export function extractAllNumbers(texts: string[]): Set<string> {
  const allNumbers = new Set<string>();

  for (const text of texts) {
    const numbers = extractNumbers(text);
    for (const num of numbers) {
      allNumbers.add(num);
    }
  }

  return allNumbers;
}

/**
 * Extract numeric value from a metric string
 */
export function extractNumericValue(metricText: string): number | undefined {
  // Remove non-numeric characters except decimal point
  const cleaned = metricText.replace(/[^0-9.]/g, '');
  const value = parseFloat(cleaned);
  
  if (isNaN(value)) {
    return undefined;
  }

  // Handle suffixes
  const upperText = metricText.toUpperCase();
  if (upperText.includes('K')) {
    return value * 1000;
  }
  if (upperText.includes('M')) {
    return value * 1000000;
  }
  if (upperText.includes('B')) {
    return value * 1000000000;
  }

  return value;
}

// ==================== Metric Type Inference ====================

/**
 * Infer the type of metric from matched text
 */
function inferMetricType(text: string): MetricType {
  const textLower = text.toLowerCase();

  if (text.includes('%')) {
    return 'percentage';
  }

  if (text.includes('$')) {
    return 'dollar_amount';
  }

  if (/\d+x/i.test(text)) {
    return 'multiplier';
  }

  if (/\d+:\d+/.test(text)) {
    return 'ratio';
  }

  if (/\d+\s*[-–—to]\s*\d+/.test(text)) {
    return 'range';
  }

  if (/(hour|day|week|month|year|minute|second)/i.test(textLower)) {
    return 'time';
  }

  return 'count';
}

// ==================== Has Metric Checks ====================

/**
 * Check if text contains any explicit metrics
 */
export function hasMetric(text: string): boolean {
  const metrics = detectMetrics(text);
  return metrics.length > 0;
}

/**
 * Check if text contains implied metrics
 */
export function hasImpliedMetric(text: string): boolean {
  const implied = detectImpliedMetrics(text);
  return implied.length > 0;
}

/**
 * Check if text contains any quantifiable content
 */
export function hasQuantifiableContent(text: string): boolean {
  return hasMetric(text) || hasImpliedMetric(text);
}

// ==================== Comparison ====================

/**
 * Find new numbers in improved text that weren't in original or evidence
 */
export function findNewNumbers(
  improvedText: string,
  originalText: string,
  evidenceTexts: string[]
): string[] {
  const improvedNumbers = extractNumbers(improvedText);
  const originalNumbers = extractNumbers(originalText);
  const evidenceNumbers = extractAllNumbers(evidenceTexts);

  const newNumbers: string[] = [];

  for (const num of improvedNumbers) {
    // Normalize for comparison
    const numNormalized = normalizeNumber(num);
    
    let found = false;
    
    // Check original
    for (const origNum of originalNumbers) {
      if (normalizeNumber(origNum) === numNormalized) {
        found = true;
        break;
      }
    }
    
    // Check evidence
    if (!found) {
      for (const evNum of evidenceNumbers) {
        if (normalizeNumber(evNum) === numNormalized) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      newNumbers.push(num);
    }
  }

  return newNumbers;
}

/**
 * Normalize number for comparison
 * Handles different formats of the same value
 */
function normalizeNumber(numStr: string): string {
  // Extract numeric value
  const value = extractNumericValue(numStr);
  if (value === undefined) {
    return numStr.toLowerCase();
  }
  return value.toString();
}

/**
 * Find new scale claims in improved text
 */
export function findNewScaleClaims(
  improvedText: string,
  originalText: string,
  evidenceTexts: string[]
): string[] {
  const improvedClaims = detectScaleClaims(improvedText);
  const originalClaimsSet = new Set(
    detectScaleClaims(originalText).map((c) => c.text.toLowerCase())
  );
  const evidenceClaimsSet = new Set<string>();
  
  for (const evidence of evidenceTexts) {
    for (const claim of detectScaleClaims(evidence)) {
      evidenceClaimsSet.add(claim.text.toLowerCase());
    }
  }

  return improvedClaims
    .map((c) => c.text)
    .filter(
      (text) =>
        !originalClaimsSet.has(text.toLowerCase()) &&
        !evidenceClaimsSet.has(text.toLowerCase())
    );
}
