/**
 * Layer 3 - Execution Engine
 * Coherence System Exports
 */

export {
  detectBulletTense,
  detectDominantTense,
  convertToTense,
  unifyTense,
  unifyToDominant,
  hasConsistentTense,
  getInconsistentBullets,
  type Tense,
  type TenseDetectionResult,
} from './tense-unifier';

export {
  unifyBulletFormatting,
  unifyFormatting,
  endsWithPunctuation,
  removeTrailingPunctuation,
  addTrailingPeriod,
  unifyPunctuation,
  capitalizeFirst,
  startsWithCapital,
  unifyCapitalization,
  normalizeWhitespace,
  removeLeadingWhitespace,
  makeATSSafe,
  makeAllATSSafe,
  isTooShort,
  isTooLong,
  getTooLongBullets,
  standardizeNumbers,
  standardizeAllNumbers,
  applyFullFormatting,
  applyFullFormattingToAll,
} from './format-unifier';

export {
  rewriteSectionCoherent,
  rewriteSectionSync,
  getAlternativeStart,
  hasVariedStarts,
} from './section-processor';
