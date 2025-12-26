/**
 * Layer 8 - AI Coach Interface
 * Tone Adapter
 *
 * Adapts message content to match the target tone.
 * This is a template-based approach - modifies style, not content.
 */

import type { Tone, ToneSettings, ToneContext } from '../types';
import { getToneSettings, getEmoji, getAcknowledgmentPhrase } from '../config';

// ==================== Tone Adaptation ====================

/**
 * Adapt a message to the target tone
 * 
 * This modifies the style of the message (not the content):
 * - Adds/removes emoji
 * - Adjusts formality
 * - Adds acknowledgment phrases
 * - Adds positive reinforcement
 */
export function adaptTone(
  text: string,
  targetTone: Tone,
  context?: ToneContext
): string {
  if (!text) return '';

  const settings = getToneSettings(targetTone);
  let result = text;

  // Apply tone adaptations
  result = applyFormality(result, settings);
  result = applyEmojiUsage(result, settings, targetTone);
  result = addAcknowledgment(result, settings, context);
  result = addPositiveReinforcement(result, settings, context);

  return result;
}

/**
 * Apply formality adjustments
 */
function applyFormality(text: string, settings: ToneSettings): string {
  // High formality: no changes needed, this is the default
  if (settings.formality === 'high') {
    return text;
  }

  let result = text;

  // Medium formality: minor adjustments
  if (settings.formality === 'medium') {
    // Replace some formal phrases with less formal alternatives
    result = result.replace(/I recommend that you/g, 'I suggest you');
    result = result.replace(/It is advisable to/g, 'You should');
    result = result.replace(/We advise that/g, 'We suggest');
  }

  // Low formality: more casual tone
  if (settings.formality === 'low') {
    result = result.replace(/I recommend that you/g, "I'd say");
    result = result.replace(/It is advisable to/g, 'You might want to');
    result = result.replace(/We advise that/g, 'How about');
    result = result.replace(/Additionally/g, 'Also');
    result = result.replace(/However/g, 'But');
    result = result.replace(/Therefore/g, 'So');
    result = result.replace(/Furthermore/g, 'Plus');
  }

  return result;
}

/**
 * Apply emoji usage adjustments
 */
function applyEmojiUsage(
  text: string,
  settings: ToneSettings,
  tone: Tone
): string {
  // Remove emojis if emoji usage is none
  if (settings.emojiUsage === 'none') {
    return removeEmojis(text);
  }

  // For minimal/moderate, we might add contextual emojis
  // but we don't want to over-emoji
  
  return text;
}

/**
 * Remove emojis from text
 */
function removeEmojis(text: string): string {
  // Remove common emoji patterns using a simpler regex
  return text.replace(/[\u2600-\u27BF]|[\uD83C-\uDBFF\uDC00-\uDFFF]+/g, '').trim();
}

/**
 * Add acknowledgment phrase at the start if appropriate
 */
function addAcknowledgment(
  text: string,
  settings: ToneSettings,
  context?: ToneContext
): string {
  if (!settings.includeAcknowledgment) {
    return text;
  }

  // Only add acknowledgment for empathetic tone when there are negative signals
  const hasNegativeSignals = context?.userSignals?.discouraged ||
    context?.userSignals?.frustrated ||
    context?.recentEvents?.rejection;

  if (!hasNegativeSignals) {
    return text;
  }

  // Get a random acknowledgment phrase
  const acknowledgment = getAcknowledgmentPhrase('understanding');
  if (!acknowledgment) {
    return text;
  }

  // Add acknowledgment at the start
  const firstSentence = text.split(/[.!?]/)[0];
  
  // Don't add if text already starts with acknowledgment
  if (text.toLowerCase().startsWith('i understand') ||
      text.toLowerCase().startsWith('i hear you') ||
      text.toLowerCase().startsWith('that makes sense')) {
    return text;
  }

  return `${acknowledgment}. ${text}`;
}

/**
 * Add positive reinforcement if appropriate
 */
function addPositiveReinforcement(
  text: string,
  settings: ToneSettings,
  context?: ToneContext
): string {
  if (!settings.positiveReinforcement) {
    return text;
  }

  // Only add for encouraging tone with positive signals
  const hasPositiveSignals = context?.userSignals?.progressing ||
    context?.recentEvents?.interview ||
    context?.recentEvents?.offer ||
    context?.recentEvents?.scoreImproved;

  if (!hasPositiveSignals) {
    return text;
  }

  // Don't add if text already has encouragement
  if (text.includes('great') ||
      text.includes('excellent') ||
      text.includes('fantastic') ||
      text.includes('keep it up') ||
      text.includes('well done')) {
    return text;
  }

  // Add encouraging phrase
  const encouragement = getAcknowledgmentPhrase('encouragement');
  if (encouragement) {
    return `${text}\n\n${encouragement}!`;
  }

  return text;
}

// ==================== Emoji Helpers ====================

/**
 * Add emoji prefix based on message type
 */
export function addEmojiPrefix(text: string, type: string): string {
  const emoji = getEmoji(type);
  if (!emoji) return text;
  return `${emoji} ${text}`;
}

/**
 * Get appropriate emoji for a score level
 */
export function getScoreEmoji(score: number): string {
  if (score >= 90) return getEmoji('star') || '⭐';
  if (score >= 75) return getEmoji('success') || '✅';
  if (score >= 60) return getEmoji('chart') || '📈';
  if (score >= 40) return getEmoji('warning') || '⚠️';
  return getEmoji('target') || '🎯';
}

/**
 * Get emoji for a progress percentage
 */
export function getProgressEmoji(percentage: number): string {
  if (percentage >= 100) return getEmoji('celebration') || '🎉';
  if (percentage >= 75) return getEmoji('rocket') || '🚀';
  if (percentage >= 50) return getEmoji('muscle') || '💪';
  if (percentage >= 25) return getEmoji('thumbsup') || '👍';
  return getEmoji('target') || '🎯';
}

// ==================== Sentence Style ====================

/**
 * Adjust sentence style
 */
export function adjustSentenceStyle(
  text: string,
  style: 'complete' | 'concise' | 'casual'
): string {
  if (style === 'complete') {
    // No changes for complete sentences
    return text;
  }

  if (style === 'concise') {
    // Remove filler words and shorten sentences
    return text
      .replace(/In order to/g, 'To')
      .replace(/at this point in time/gi, 'now')
      .replace(/due to the fact that/gi, 'because')
      .replace(/in the event that/gi, 'if')
      .replace(/for the purpose of/gi, 'to')
      .replace(/with regard to/gi, 'about')
      .replace(/in spite of the fact that/gi, 'although');
  }

  if (style === 'casual') {
    return text
      .replace(/It is important to note that/gi, 'Note that')
      .replace(/Please be advised that/gi, '')
      .replace(/As you may know/gi, '')
      .replace(/I would like to inform you that/gi, '');
  }

  return text;
}

// ==================== Composite Functions ====================

/**
 * Format a message for a specific tone and add appropriate emoji
 */
export function formatWithTone(
  text: string,
  tone: Tone,
  options?: {
    emojiType?: string;
    context?: ToneContext;
  }
): string {
  let result = text;

  // Adapt tone
  result = adaptTone(result, tone, options?.context);

  // Add emoji if specified and tone allows
  if (options?.emojiType) {
    const settings = getToneSettings(tone);
    if (settings.emojiUsage !== 'none') {
      result = addEmojiPrefix(result, options.emojiType);
    }
  }

  return result;
}

/**
 * Get the appropriate opening phrase for a tone
 */
export function getOpeningPhrase(tone: Tone, context?: ToneContext): string {
  switch (tone) {
    case 'empathetic':
      if (context?.userSignals?.frustrated) {
        return "I can hear the frustration — and honestly, it's valid.";
      }
      if (context?.recentEvents?.rejection) {
        return "I know rejections are tough. Let's look at the bigger picture.";
      }
      return "I understand. Let me help.";

    case 'encouraging':
      if (context?.recentEvents?.interview) {
        return "This is exciting news!";
      }
      if (context?.recentEvents?.offer) {
        return "Congratulations! This is a huge milestone.";
      }
      if (context?.userSignals?.progressing) {
        return "You're making great progress!";
      }
      return "Great work so far!";

    case 'direct':
      return "Here's what you need to know:";

    case 'professional':
    default:
      return '';
  }
}

/**
 * Get the appropriate closing phrase for a tone
 */
export function getClosingPhrase(tone: Tone): string {
  switch (tone) {
    case 'empathetic':
      return "Remember, setbacks are part of the process. You've got this.";

    case 'encouraging':
      return "Keep up the momentum!";

    case 'direct':
      return '';

    case 'professional':
    default:
      return 'Let me know if you have any questions.';
  }
}
