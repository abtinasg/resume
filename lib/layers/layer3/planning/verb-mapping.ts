/**
 * Layer 3 - Execution Engine
 * Verb Mapping
 *
 * Detects weak verbs and suggests strong replacements.
 */

import { loadVerbMappings, getVerbUpgrades, getWeakVerbs } from '../config';

// ==================== Weak Verb Detection ====================

/**
 * Find weak verbs in text
 * Returns array of { verb, position } objects
 */
export function findWeakVerbs(text: string): Array<{ verb: string; position: number }> {
  const weakVerbs = getWeakVerbs();
  const found: Array<{ verb: string; position: number }> = [];
  const textLower = text.toLowerCase();

  // Sort by length (longest first) to match multi-word phrases first
  const sortedVerbs = weakVerbs.sort((a, b) => b.length - a.length);

  for (const verb of sortedVerbs) {
    // Create regex to find the verb (word boundary aware)
    // Handle multi-word phrases
    const escaped = verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    let match;
    while ((match = regex.exec(textLower)) !== null) {
      // Check if this position is already covered by a longer phrase
      const alreadyCovered = found.some(
        (f) => match.index >= f.position && match.index < f.position + f.verb.length
      );

      if (!alreadyCovered) {
        found.push({
          verb: match[0],
          position: match.index,
        });
      }
    }
  }

  // Sort by position
  return found.sort((a, b) => a.position - b.position);
}

/**
 * Get the first weak verb in text (most common use case)
 */
export function findFirstWeakVerb(text: string): string | null {
  const found = findWeakVerbs(text);
  return found.length > 0 ? found[0].verb : null;
}

/**
 * Check if text starts with a weak verb
 */
export function startsWithWeakVerb(text: string): boolean {
  const found = findWeakVerbs(text);
  return found.length > 0 && found[0].position === 0;
}

// ==================== Verb Upgrade Suggestions ====================

/**
 * Suggest strong verb upgrade
 * Returns best upgrade based on context
 */
export function suggestVerbUpgrade(
  weakVerb: string,
  context?: string
): string | null {
  const upgrades = getVerbUpgrades(weakVerb, context);
  return upgrades.length > 0 ? upgrades[0] : null;
}

/**
 * Suggest multiple verb upgrades
 * Returns array of suggestions
 */
export function suggestVerbUpgrades(
  weakVerb: string,
  context?: string,
  maxSuggestions = 3
): string[] {
  const upgrades = getVerbUpgrades(weakVerb, context);
  return upgrades.slice(0, maxSuggestions);
}

/**
 * Get the best verb for a given context
 */
export function getBestVerbForContext(
  weakVerb: string,
  context: string
): string {
  const mappings = loadVerbMappings();
  const mapping = mappings[weakVerb.toLowerCase()];

  if (!mapping) {
    return weakVerb; // Return original if no mapping
  }

  // Check context hints
  if (mapping.context_hints) {
    const contextLower = context.toLowerCase();
    for (const [hint, upgrade] of Object.entries(mapping.context_hints)) {
      if (contextLower.includes(hint)) {
        return upgrade;
      }
    }
  }

  // Return first upgrade as default
  return mapping.upgrades[0] || weakVerb;
}

// ==================== Common Weak Verb Patterns ====================

/**
 * Common weak verb patterns at the start of bullets
 */
const WEAK_START_PATTERNS = [
  /^(worked\s+on)\b/i,
  /^(helped\s+with)\b/i,
  /^(was\s+responsible\s+for)\b/i,
  /^(responsible\s+for)\b/i,
  /^(assisted\s+with)\b/i,
  /^(involved\s+in)\b/i,
  /^(participated\s+in)\b/i,
  /^(tasked\s+with)\b/i,
  /^(in\s+charge\s+of)\b/i,
];

/**
 * Check if text starts with a common weak pattern
 */
export function hasWeakStartPattern(text: string): {
  hasWeakStart: boolean;
  pattern: string | null;
} {
  for (const pattern of WEAK_START_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return {
        hasWeakStart: true,
        pattern: match[0],
      };
    }
  }
  return { hasWeakStart: false, pattern: null };
}

// ==================== Passive Voice Detection ====================

/**
 * Common passive voice indicators
 */
const PASSIVE_PATTERNS = [
  /\b(was|were)\s+\w+ed\b/i,
  /\b(was|were)\s+\w+en\b/i, // given, taken, etc.
  /\b(has|have|had)\s+been\s+\w+ed\b/i,
  /\b(has|have|had)\s+been\s+\w+en\b/i,
  /\b(is|are)\s+being\s+\w+ed\b/i,
  /\bwas\s+responsible\s+for\b/i, // Common passive pattern
  /\bwere\s+responsible\s+for\b/i,
];

/**
 * Check if text contains passive voice
 */
export function hasPassiveVoice(text: string): boolean {
  return PASSIVE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Find passive voice phrases in text
 */
export function findPassiveVoicePhrases(text: string): string[] {
  const phrases: string[] = [];

  for (const pattern of PASSIVE_PATTERNS) {
    const matches = text.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      phrases.push(...matches);
    }
  }

  return phrases;
}

// ==================== Action Verb Quality ====================

/**
 * Strong action verbs for reference
 */
const STRONG_VERBS = new Set([
  'achieved',
  'architected',
  'automated',
  'built',
  'championed',
  'consolidated',
  'created',
  'delivered',
  'designed',
  'developed',
  'directed',
  'drove',
  'enabled',
  'engineered',
  'established',
  'executed',
  'expanded',
  'founded',
  'generated',
  'grew',
  'implemented',
  'improved',
  'increased',
  'initiated',
  'innovated',
  'integrated',
  'launched',
  'led',
  'managed',
  'mentored',
  'migrated',
  'optimized',
  'orchestrated',
  'overhauled',
  'partnered',
  'pioneered',
  'produced',
  'reduced',
  'redesigned',
  'resolved',
  'revamped',
  'scaled',
  'secured',
  'simplified',
  'spearheaded',
  'streamlined',
  'strengthened',
  'succeeded',
  'transformed',
  'unified',
]);

/**
 * Check if a verb is considered strong
 */
export function isStrongVerb(verb: string): boolean {
  return STRONG_VERBS.has(verb.toLowerCase());
}

/**
 * Get the first verb from text
 */
export function extractFirstVerb(text: string): string | null {
  // Simple heuristic: first word that looks like a verb
  const words = text.split(/\s+/);
  if (words.length > 0) {
    // Remove punctuation
    return words[0].replace(/[^a-zA-Z]/g, '').toLowerCase() || null;
  }
  return null;
}

/**
 * Check if bullet starts with a strong verb
 */
export function startsWithStrongVerb(text: string): boolean {
  const firstVerb = extractFirstVerb(text);
  return firstVerb !== null && isStrongVerb(firstVerb);
}
