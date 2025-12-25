/**
 * Layer 3 - Execution Engine
 * Evidence Map Types and Utilities
 *
 * Evidence maps track the relationship between improved text and source evidence.
 * This is the core of evidence-anchored validation.
 */

import { EvidenceMap, EvidenceMapItem, EvidenceLedger } from '../types';

// ==================== Evidence Map Creation ====================

/**
 * Create an empty evidence map
 */
export function createEvidenceMap(): EvidenceMap {
  return [];
}

/**
 * Add an item to the evidence map
 */
export function addEvidenceMapItem(
  map: EvidenceMap,
  improvedSpan: string,
  evidenceIds: string[]
): EvidenceMap {
  return [
    ...map,
    {
      improved_span: improvedSpan,
      evidence_ids: evidenceIds,
    },
  ];
}

/**
 * Create an evidence map item
 */
export function createEvidenceMapItem(
  improvedSpan: string,
  evidenceIds: string[]
): EvidenceMapItem {
  return {
    improved_span: improvedSpan,
    evidence_ids: evidenceIds,
  };
}

// ==================== Evidence Map Utilities ====================

/**
 * Get all evidence IDs referenced in the map
 */
export function getAllReferencedEvidenceIds(map: EvidenceMap): Set<string> {
  const ids = new Set<string>();

  for (const item of map) {
    for (const id of item.evidence_ids) {
      ids.add(id);
    }
  }

  return ids;
}

/**
 * Get all mapped spans
 */
export function getAllMappedSpans(map: EvidenceMap): Set<string> {
  return new Set(map.map((item) => item.improved_span));
}

/**
 * Check if a span is mapped in the evidence map
 */
export function isSpanMapped(map: EvidenceMap, span: string): boolean {
  const spanLower = span.toLowerCase();
  return map.some((item) => item.improved_span.toLowerCase().includes(spanLower));
}

/**
 * Find evidence IDs for a span (partial match)
 */
export function findEvidenceIdsForSpan(map: EvidenceMap, span: string): string[] {
  const spanLower = span.toLowerCase();
  const ids: string[] = [];

  for (const item of map) {
    if (item.improved_span.toLowerCase().includes(spanLower)) {
      ids.push(...item.evidence_ids);
    }
  }

  return [...new Set(ids)];
}

// ==================== Evidence Map Validation ====================

/**
 * Check if all evidence IDs in the map exist in the ledger
 */
export function validateEvidenceIdsExist(
  map: EvidenceMap,
  ledger: EvidenceLedger
): { valid: boolean; invalidIds: string[] } {
  const validIds = new Set(ledger.items.map((item) => item.id));
  const invalidIds: string[] = [];

  for (const item of map) {
    for (const id of item.evidence_ids) {
      if (!validIds.has(id)) {
        invalidIds.push(id);
      }
    }
  }

  return {
    valid: invalidIds.length === 0,
    invalidIds,
  };
}

/**
 * Check if all spans in the map exist in the improved text
 */
export function validateSpansExist(
  map: EvidenceMap,
  improvedText: string
): { valid: boolean; missingSpans: string[] } {
  const missingSpans: string[] = [];

  for (const item of map) {
    if (!improvedText.includes(item.improved_span)) {
      missingSpans.push(item.improved_span);
    }
  }

  return {
    valid: missingSpans.length === 0,
    missingSpans,
  };
}

// ==================== Evidence Map Merging ====================

/**
 * Merge multiple evidence maps into one
 */
export function mergeEvidenceMaps(...maps: EvidenceMap[]): EvidenceMap {
  const merged: EvidenceMapItem[] = [];
  const seenSpans = new Map<string, Set<string>>();

  for (const map of maps) {
    for (const item of map) {
      const existingIds = seenSpans.get(item.improved_span);

      if (existingIds) {
        // Merge evidence IDs for the same span
        for (const id of item.evidence_ids) {
          existingIds.add(id);
        }
      } else {
        seenSpans.set(item.improved_span, new Set(item.evidence_ids));
      }
    }
  }

  // Convert back to array format
  for (const [span, ids] of seenSpans) {
    merged.push({
      improved_span: span,
      evidence_ids: [...ids],
    });
  }

  return merged;
}

// ==================== Evidence Coverage Analysis ====================

/**
 * Calculate evidence coverage statistics
 */
export function calculateEvidenceCoverage(
  map: EvidenceMap,
  ledger: EvidenceLedger
): {
  totalEvidenceItems: number;
  usedEvidenceItems: number;
  coveragePercentage: number;
  unusedEvidenceIds: string[];
} {
  const allIds = new Set(ledger.items.map((item) => item.id));
  const usedIds = getAllReferencedEvidenceIds(map);
  const unusedIds: string[] = [];

  for (const id of allIds) {
    if (!usedIds.has(id)) {
      unusedIds.push(id);
    }
  }

  return {
    totalEvidenceItems: allIds.size,
    usedEvidenceItems: usedIds.size,
    coveragePercentage: allIds.size > 0 ? (usedIds.size / allIds.size) * 100 : 0,
    unusedEvidenceIds: unusedIds,
  };
}

// ==================== Evidence Map Formatting ====================

/**
 * Format evidence map for display/logging
 */
export function formatEvidenceMap(
  map: EvidenceMap,
  ledger?: EvidenceLedger
): string {
  const lines: string[] = [];

  for (const item of map) {
    let line = `"${item.improved_span}" → [${item.evidence_ids.join(', ')}]`;

    // Add evidence text if ledger is provided
    if (ledger) {
      const evidenceTexts: string[] = [];
      for (const id of item.evidence_ids) {
        const evidence = ledger.items.find((e) => e.id === id);
        if (evidence) {
          evidenceTexts.push(`(${evidence.text.substring(0, 30)}...)`);
        }
      }
      if (evidenceTexts.length > 0) {
        line += ` ${evidenceTexts.join(' ')}`;
      }
    }

    lines.push(line);
  }

  return lines.join('\n');
}

/**
 * Convert evidence map to JSON-serializable format
 */
export function evidenceMapToJSON(map: EvidenceMap): object {
  return map.map((item) => ({
    span: item.improved_span,
    evidence: item.evidence_ids,
  }));
}

/**
 * Parse evidence map from LLM response format
 */
export function parseEvidenceMapFromLLM(
  llmEvidenceMap: Array<{ improved_span: string; evidence_ids: string[] }>
): EvidenceMap {
  return llmEvidenceMap.map((item) => ({
    improved_span: item.improved_span,
    evidence_ids: item.evidence_ids,
  }));
}
