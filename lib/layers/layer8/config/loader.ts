/**
 * Layer 8 - AI Coach Interface
 * Configuration Loader
 *
 * Loads and validates Coach configuration from JSON file.
 */

import type { CoachConfig, Tone, ToneConfig, ToneSettings } from '../types';
import { CoachError, CoachErrorCode } from '../errors';

// ==================== Default Configuration ====================

const defaultConfig: CoachConfig = {
  version: '1.0',
  tones: {
    professional: {
      formality: 'high',
      emoji_usage: 'minimal',
      sentence_style: 'complete',
      acknowledgment_phrases: [],
      positive_reinforcement: false,
    },
    empathetic: {
      formality: 'medium',
      emoji_usage: 'minimal',
      sentence_style: 'complete',
      acknowledgment_phrases: [
        'I understand',
        'That makes sense',
        'I hear you',
        "It's completely normal to feel that way",
      ],
      positive_reinforcement: true,
    },
    encouraging: {
      formality: 'medium',
      emoji_usage: 'moderate',
      sentence_style: 'complete',
      acknowledgment_phrases: [
        'Great job',
        "You're making progress",
        'Keep it up',
      ],
      positive_reinforcement: true,
    },
    direct: {
      formality: 'medium',
      emoji_usage: 'none',
      sentence_style: 'concise',
      acknowledgment_phrases: [],
      positive_reinforcement: false,
    },
  },
  default_tone: 'professional',
  thresholds: {
    apply_mode_score: 75,
    low_interview_rate: 0.05,
    application_volume_test: 20,
  },
  messages: {
    max_length: 2000,
    include_emojis: true,
  },
};

// Emoji map for quick access
const emojiMap: Record<string, string> = {
  success: '✅',
  warning: '⚠️',
  error: '❌',
  info: 'ℹ️',
  celebration: '🎉',
  rocket: '🚀',
  star: '⭐',
  target: '🎯',
  chart: '📈',
  lightbulb: '💡',
  clock: '⏰',
  check: '✓',
  thumbsup: '👍',
  thinking: '🤔',
  muscle: '💪',
};

// Acknowledgment phrases by category
const acknowledgmentPhrases: Record<string, string[]> = {
  understanding: [
    'I understand',
    'That makes sense',
    'I hear you',
    "I can see where you're coming from",
  ],
  validation: [
    "That's a valid concern",
    'Your feelings are understandable',
    "It's completely normal to feel that way",
  ],
  encouragement: [
    "You've got this",
    'Keep going',
    "You're making great progress",
    'Every step counts',
  ],
};

// ==================== Cached Configuration ====================

let cachedConfig: CoachConfig | null = null;

// ==================== Configuration Loading ====================

/**
 * Load and validate Coach configuration
 */
export function loadCoachConfig(): CoachConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // Use the default configuration
    const config = defaultConfig;
    
    // Validate required fields
    if (!config.version) {
      throw new CoachError(CoachErrorCode.CONFIG_INVALID, {
        message: 'Missing version in config',
      });
    }

    if (!config.tones) {
      throw new CoachError(CoachErrorCode.CONFIG_INVALID, {
        message: 'Missing tones in config',
      });
    }

    if (!config.default_tone) {
      throw new CoachError(CoachErrorCode.CONFIG_INVALID, {
        message: 'Missing default_tone in config',
      });
    }

    // Validate that default_tone exists in tones
    if (!config.tones[config.default_tone]) {
      throw new CoachError(CoachErrorCode.CONFIG_INVALID, {
        message: `Default tone "${config.default_tone}" not found in tones`,
      });
    }

    cachedConfig = config;
    return config;
  } catch (error) {
    if (error instanceof CoachError) {
      throw error;
    }
    throw new CoachError(
      CoachErrorCode.CONFIG_LOAD_FAILED,
      { message: 'Failed to load Coach configuration' },
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Get the current configuration (loads if not already loaded)
 */
export function getConfig(): CoachConfig {
  return loadCoachConfig();
}

/**
 * Get the default tone
 */
export function getDefaultTone(): Tone {
  const config = getConfig();
  return config.default_tone;
}

/**
 * Get tone configuration for a specific tone
 */
export function getToneConfig(tone: Tone): ToneConfig {
  const config = getConfig();
  const toneConfig = config.tones[tone];

  if (!toneConfig) {
    throw new CoachError(CoachErrorCode.INVALID_TONE, {
      providedTone: tone,
      availableTones: Object.keys(config.tones),
    });
  }

  return toneConfig;
}

/**
 * Convert ToneConfig to ToneSettings
 */
export function getToneSettings(tone: Tone): ToneSettings {
  const toneConfig = getToneConfig(tone);

  return {
    formality: toneConfig.formality,
    emojiUsage: toneConfig.emoji_usage === 'none' ? 'none' :
                toneConfig.emoji_usage === 'minimal' ? 'minimal' : 'moderate',
    sentenceStyle: toneConfig.sentence_style || 'complete',
    includeAcknowledgment: (toneConfig.acknowledgment_phrases?.length ?? 0) > 0,
    positiveReinforcement: toneConfig.positive_reinforcement ?? false,
  };
}

/**
 * Get thresholds from configuration
 */
export function getThresholds(): CoachConfig['thresholds'] {
  const config = getConfig();
  return config.thresholds;
}

/**
 * Get message settings from configuration
 */
export function getMessageSettings(): CoachConfig['messages'] {
  const config = getConfig();
  return config.messages;
}

/**
 * Get emoji for a specific type
 */
export function getEmoji(type: string): string {
  return emojiMap[type] || '';
}

/**
 * Get a random acknowledgment phrase for a category
 */
export function getAcknowledgmentPhrase(
  category: 'understanding' | 'validation' | 'encouragement'
): string {
  const phrases = acknowledgmentPhrases[category] || [];
  
  if (phrases.length === 0) {
    return '';
  }

  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Clear the cached configuration (useful for testing)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

/**
 * Check if a tone is supported
 */
export function isToneSupported(tone: string): tone is Tone {
  const config = getConfig();
  return tone in config.tones;
}

/**
 * Get all available tones
 */
export function getAvailableTones(): Tone[] {
  const config = getConfig();
  return Object.keys(config.tones) as Tone[];
}

// ==================== Exports ====================

export default {
  loadCoachConfig,
  getConfig,
  getDefaultTone,
  getToneConfig,
  getToneSettings,
  getThresholds,
  getMessageSettings,
  getEmoji,
  getAcknowledgmentPhrase,
  clearConfigCache,
  isToneSupported,
  getAvailableTones,
};
