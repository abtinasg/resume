/**
 * Layer 8 - AI Coach Interface
 * Tone Module Exports
 */

// Tone detector exports
export {
  detectTone,
  scoreTones,
  getToneRecommendation,
  analyzePipelineForTone,
  getToneForEvent,
} from './tone-detector';

// Tone adapter exports
export {
  adaptTone,
  addEmojiPrefix,
  getScoreEmoji,
  getProgressEmoji,
  adjustSentenceStyle,
  formatWithTone,
  getOpeningPhrase,
  getClosingPhrase,
} from './tone-adapter';
