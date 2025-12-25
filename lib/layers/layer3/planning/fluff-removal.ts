/**
 * Layer 3 - Execution Engine
 * Fluff Removal
 *
 * Detects and suggests removal of filler words, weak descriptors,
 * redundant phrases, and other "fluff" that weakens resume content.
 */

import { loadFluffPhrases } from '../config';

// ==================== Types ====================

/**
 * Detected fluff phrase
 */
export interface DetectedFluff {
  /** The matched phrase */
  phrase: string;
  /** Type of fluff */
  type: FluffType;
  /** Position in text */
  position: number;
  /** Suggested replacement (if any) */
  replacement?: string;
}

/**
 * Types of fluff we detect
 */
export type FluffType =
  | 'filler'
  | 'weak_descriptor'
  | 'redundant_phrase'
  | 'vague_phrase'
  | 'hype_word'
  | 'unnecessary_adverb'
  | 'cliche';

// ==================== Detection Functions ====================

/**
 * Detect all fluff in text
 */
export function detectFluff(text: string): DetectedFluff[] {
  const fluff: DetectedFluff[] = [];
  const config = loadFluffPhrases();

  // Check each category
  fluff.push(...detectFluffByType(text, config.fillers, 'filler'));
  fluff.push(...detectFluffByType(text, config.weak_descriptors, 'weak_descriptor'));
  fluff.push(...detectFluffByType(text, config.redundant_phrases, 'redundant_phrase'));
  fluff.push(...detectFluffByType(text, config.vague_phrases, 'vague_phrase'));
  fluff.push(...detectFluffByType(text, config.hype_words, 'hype_word'));
  fluff.push(...detectFluffByType(text, config.unnecessary_adverbs, 'unnecessary_adverb'));
  fluff.push(...detectFluffByType(text, config.cliches, 'cliche'));

  // Sort by position and remove overlaps
  return deduplicateFluff(fluff.sort((a, b) => a.position - b.position));
}

/**
 * Detect fluff of a specific type
 */
function detectFluffByType(
  text: string,
  phrases: string[],
  type: FluffType
): DetectedFluff[] {
  const found: DetectedFluff[] = [];
  const textLower = text.toLowerCase();

  // Sort by length (longest first) to match longer phrases first
  const sortedPhrases = [...phrases].sort((a, b) => b.length - a.length);

  for (const phrase of sortedPhrases) {
    const phraseLower = phrase.toLowerCase();
    let position = 0;

    while (true) {
      const index = textLower.indexOf(phraseLower, position);
      if (index === -1) break;

      // Check word boundaries
      const beforeOk = index === 0 || /\W/.test(text[index - 1]);
      const afterOk =
        index + phrase.length >= text.length ||
        /\W/.test(text[index + phrase.length]);

      if (beforeOk && afterOk) {
        found.push({
          phrase: text.substring(index, index + phrase.length),
          type,
          position: index,
          replacement: getFluffReplacement(phrase, type),
        });
      }

      position = index + 1;
    }
  }

  return found;
}

/**
 * Remove overlapping fluff detections
 */
function deduplicateFluff(fluff: DetectedFluff[]): DetectedFluff[] {
  const result: DetectedFluff[] = [];

  for (const item of fluff) {
    // Check if this overlaps with any already added
    const overlaps = result.some(
      (existing) =>
        (item.position >= existing.position &&
          item.position < existing.position + existing.phrase.length) ||
        (existing.position >= item.position &&
          existing.position < item.position + item.phrase.length)
    );

    if (!overlaps) {
      result.push(item);
    }
  }

  return result;
}

// ==================== Replacement Suggestions ====================

/**
 * Get suggested replacement for fluff
 */
function getFluffReplacement(phrase: string, type: FluffType): string | undefined {
  const phraseLower = phrase.toLowerCase();

  // Redundant phrase replacements
  const redundantReplacements: Record<string, string> = {
    'in order to': 'to',
    'due to the fact that': 'because',
    'for the purpose of': 'for',
    'with the aim of': 'to',
    'with the goal of': 'to',
    'for the reason that': 'because',
    'at this point in time': 'now',
    'at the present time': 'now',
    'in the event that': 'if',
    'with regard to': 'regarding',
    'with respect to': 'regarding',
    'on a daily basis': 'daily',
    'on a regular basis': 'regularly',
    'first and foremost': 'first',
    'each and every': 'each',
    'end result': 'result',
    'future plans': 'plans',
    'past history': 'history',
    'collaborate together': 'collaborate',
    'combine together': 'combine',
    'continue on': 'continue',
    'cooperate together': 'cooperate',
    'gather together': 'gather',
    'merge together': 'merge',
    'plan ahead': 'plan',
    'refer back': 'refer',
    'repeat again': 'repeat',
    'return back': 'return',
    'revert back': 'revert',
  };

  if (type === 'redundant_phrase' && phraseLower in redundantReplacements) {
    return redundantReplacements[phraseLower];
  }

  // Vague phrase replacement - remove completely
  if (type === 'vague_phrase') {
    return ''; // Remove
  }

  // Fillers - usually just remove
  if (type === 'filler') {
    return ''; // Remove
  }

  // Weak descriptors - remove
  if (type === 'weak_descriptor') {
    return ''; // Remove
  }

  // Unnecessary adverbs - remove
  if (type === 'unnecessary_adverb') {
    return ''; // Remove
  }

  return undefined;
}

// ==================== Fluff Checking Functions ====================

/**
 * Check if text contains any fluff
 */
export function hasFluff(text: string): boolean {
  const detected = detectFluff(text);
  return detected.length > 0;
}

/**
 * Check if text contains specific type of fluff
 */
export function hasFluffType(text: string, type: FluffType): boolean {
  const detected = detectFluff(text);
  return detected.some((f) => f.type === type);
}

/**
 * Count fluff instances in text
 */
export function countFluff(text: string): number {
  return detectFluff(text).length;
}

// ==================== Fluff Removal ====================

/**
 * Remove detected fluff from text
 * Returns cleaned text and list of removed items
 */
export function removeFluff(text: string): {
  cleaned: string;
  removed: string[];
} {
  const detected = detectFluff(text);
  const removed: string[] = [];

  // Sort by position descending to remove from end first
  const sortedDetected = [...detected].sort((a, b) => b.position - a.position);

  let cleaned = text;

  for (const item of sortedDetected) {
    const before = cleaned.substring(0, item.position);
    const after = cleaned.substring(item.position + item.phrase.length);
    const replacement = item.replacement ?? '';

    cleaned = before + replacement + after;
    removed.push(item.phrase);
  }

  // Clean up extra spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return { cleaned, removed };
}

/**
 * Get fluff removal suggestions
 * Returns list of phrases to remove and why
 */
export function getFluffRemovalSuggestions(
  text: string
): Array<{ phrase: string; reason: string; suggestion: string }> {
  const detected = detectFluff(text);

  return detected.map((item) => ({
    phrase: item.phrase,
    reason: getFluffReason(item.type),
    suggestion: item.replacement
      ? `Replace with "${item.replacement}"`
      : 'Remove this phrase',
  }));
}

/**
 * Get human-readable reason for fluff type
 */
function getFluffReason(type: FluffType): string {
  const reasons: Record<FluffType, string> = {
    filler: 'Vague filler word that adds no meaning',
    weak_descriptor: 'Weak descriptor that doesn\'t add value',
    redundant_phrase: 'Redundant phrase that can be simplified',
    vague_phrase: 'Vague phrase that obscures your actual contribution',
    hype_word: 'Overused buzzword that may seem insincere',
    unnecessary_adverb: 'Adverb that weakens rather than strengthens',
    cliche: 'Cliché phrase that lacks impact',
  };

  return reasons[type];
}

// ==================== Specific Fluff Detection ====================

/**
 * Detect filler words only
 */
export function detectFillers(text: string): DetectedFluff[] {
  const config = loadFluffPhrases();
  return detectFluffByType(text, config.fillers, 'filler');
}

/**
 * Detect vague phrases only
 */
export function detectVaguePhrases(text: string): DetectedFluff[] {
  const config = loadFluffPhrases();
  return detectFluffByType(text, config.vague_phrases, 'vague_phrase');
}

/**
 * Detect hype words only
 */
export function detectHypeWords(text: string): DetectedFluff[] {
  const config = loadFluffPhrases();
  return detectFluffByType(text, config.hype_words, 'hype_word');
}

/**
 * Detect clichés only
 */
export function detectCliches(text: string): DetectedFluff[] {
  const config = loadFluffPhrases();
  return detectFluffByType(text, config.cliches, 'cliche');
}
