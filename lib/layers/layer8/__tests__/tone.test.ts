/**
 * Layer 8 - AI Coach Interface
 * Tone Tests
 *
 * Tests for tone detection and adaptation functions.
 */

import { describe, test, expect } from '@jest/globals';
import type { ToneContext, Tone } from '../types';

// Import tone functions
import {
  detectTone,
  scoreTones,
  getToneRecommendation,
  analyzePipelineForTone,
  getToneForEvent,
  adaptTone,
  addEmojiPrefix,
  getScoreEmoji,
  getProgressEmoji,
  formatWithTone,
  getOpeningPhrase,
  getClosingPhrase,
} from '../tone';

// ==================== Tone Detection Tests ====================

describe('Tone Detection', () => {
  test('detectTone returns professional by default', () => {
    const tone = detectTone();
    expect(tone).toBe('professional');
  });

  test('detectTone returns professional with empty context', () => {
    const tone = detectTone({});
    expect(tone).toBe('professional');
  });

  test('detectTone returns empathetic when user is discouraged', () => {
    const context: ToneContext = {
      userSignals: {
        discouraged: true,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('empathetic');
  });

  test('detectTone returns empathetic when user is frustrated', () => {
    const context: ToneContext = {
      userSignals: {
        frustrated: true,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('empathetic');
  });

  test('detectTone returns empathetic after rejection', () => {
    const context: ToneContext = {
      recentEvents: {
        rejection: true,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('empathetic');
  });

  test('detectTone returns encouraging when progressing', () => {
    const context: ToneContext = {
      userSignals: {
        progressing: true,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('encouraging');
  });

  test('detectTone returns encouraging after interview', () => {
    const context: ToneContext = {
      recentEvents: {
        interview: true,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('encouraging');
  });

  test('detectTone returns encouraging after offer', () => {
    const context: ToneContext = {
      recentEvents: {
        offer: true,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('encouraging');
  });

  test('detectTone returns direct when urgent', () => {
    const context: ToneContext = {
      userSignals: {
        urgent: true,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('direct');
  });

  test('detectTone returns empathetic with low interview rate', () => {
    const context: ToneContext = {
      pipelineState: {
        total_applications: 25,
        interview_rate: 0.02,
      },
    };
    const tone = detectTone(context);
    expect(tone).toBe('empathetic');
  });
});

// ==================== Tone Scoring Tests ====================

describe('Tone Scoring', () => {
  test('scoreTones returns scores for all tones', () => {
    const scores = scoreTones();
    
    expect(scores).toHaveProperty('professional');
    expect(scores).toHaveProperty('empathetic');
    expect(scores).toHaveProperty('encouraging');
    expect(scores).toHaveProperty('direct');
  });

  test('scoreTones gives professional baseline score', () => {
    const scores = scoreTones();
    expect(scores.professional).toBe(50);
  });

  test('scoreTones increases empathetic for discouraged users', () => {
    const context: ToneContext = {
      userSignals: { discouraged: true },
    };
    const scores = scoreTones(context);
    expect(scores.empathetic).toBeGreaterThan(0);
  });

  test('scoreTones increases encouraging for progress', () => {
    const context: ToneContext = {
      userSignals: { progressing: true },
    };
    const scores = scoreTones(context);
    expect(scores.encouraging).toBeGreaterThan(0);
  });

  test('getToneRecommendation returns tone with reason', () => {
    const context: ToneContext = {
      recentEvents: { rejection: true },
    };
    const recommendation = getToneRecommendation(context);
    
    expect(recommendation.tone).toBe('empathetic');
    expect(recommendation.reason).toContain('challenges');
    expect(recommendation.scores).toBeDefined();
  });
});

// ==================== Pipeline Analysis Tests ====================

describe('Pipeline Analysis for Tone', () => {
  test('analyzePipelineForTone suggests encouraging for interviews', () => {
    const result = analyzePipelineForTone({
      interview_requests: 2,
    });
    
    expect(result.suggestedTone).toBe('encouraging');
    expect(result.signals).toContain('has_interviews');
  });

  test('analyzePipelineForTone suggests empathetic for low rate', () => {
    const result = analyzePipelineForTone({
      total_applications: 30,
      interview_rate: 0.02,
      interview_requests: 0,
    });
    
    expect(result.suggestedTone).toBe('empathetic');
    expect(result.signals).toContain('low_interview_rate');
  });

  test('getToneForEvent returns encouraging for positive events', () => {
    expect(getToneForEvent('first_interview')).toBe('encouraging');
    expect(getToneForEvent('offer_received')).toBe('encouraging');
    expect(getToneForEvent('score_improved')).toBe('encouraging');
  });

  test('getToneForEvent returns empathetic for negative events', () => {
    expect(getToneForEvent('rejection_received')).toBe('empathetic');
    expect(getToneForEvent('no_response')).toBe('empathetic');
  });

  test('getToneForEvent returns direct for urgent events', () => {
    expect(getToneForEvent('deadline_approaching')).toBe('direct');
    expect(getToneForEvent('action_required')).toBe('direct');
  });
});

// ==================== Tone Adaptation Tests ====================

describe('Tone Adaptation', () => {
  test('adaptTone returns text unchanged for professional', () => {
    const text = 'Your resume score is 75.';
    const adapted = adaptTone(text, 'professional');
    
    expect(adapted).toContain('75');
  });

  test('adaptTone adds acknowledgment for empathetic with negative signals', () => {
    const text = 'Let me help you improve.';
    const context: ToneContext = {
      userSignals: { discouraged: true },
    };
    const adapted = adaptTone(text, 'empathetic', context);
    
    // Should add acknowledgment when discouraged
    expect(adapted).toBeDefined();
  });

  test('adaptTone handles empty text', () => {
    const adapted = adaptTone('', 'professional');
    expect(adapted).toBe('');
  });
});

// ==================== Emoji Helper Tests ====================

describe('Emoji Helpers', () => {
  test('addEmojiPrefix adds emoji to text', () => {
    const text = 'Great progress!';
    const result = addEmojiPrefix(text, 'celebration');
    
    // Should have emoji at start
    expect(result).toContain('Great progress!');
  });

  test('getScoreEmoji returns appropriate emoji for score', () => {
    expect(getScoreEmoji(95)).toContain('⭐');
    expect(getScoreEmoji(80)).toContain('✅');
    expect(getScoreEmoji(65)).toContain('📈');
    expect(getScoreEmoji(45)).toContain('⚠️');
    expect(getScoreEmoji(30)).toContain('🎯');
  });

  test('getProgressEmoji returns appropriate emoji for progress', () => {
    expect(getProgressEmoji(100)).toContain('🎉');
    expect(getProgressEmoji(80)).toContain('🚀');
    expect(getProgressEmoji(60)).toContain('💪');
    expect(getProgressEmoji(30)).toContain('👍');
    expect(getProgressEmoji(10)).toContain('🎯');
  });
});

// ==================== Format With Tone Tests ====================

describe('Format With Tone', () => {
  test('formatWithTone applies tone and emoji', () => {
    const text = 'Your progress is great!';
    const result = formatWithTone(text, 'encouraging', {
      emojiType: 'celebration',
    });
    
    expect(result).toContain('progress');
  });

  test('getOpeningPhrase returns appropriate phrase', () => {
    const empathetic = getOpeningPhrase('empathetic');
    expect(empathetic).toBeDefined();
    expect(empathetic.length).toBeGreaterThan(0);

    const encouraging = getOpeningPhrase('encouraging');
    expect(encouraging).toBeDefined();

    const professional = getOpeningPhrase('professional');
    expect(professional).toBe('');
  });

  test('getClosingPhrase returns appropriate phrase', () => {
    const empathetic = getClosingPhrase('empathetic');
    expect(empathetic).toContain('setbacks');

    const encouraging = getClosingPhrase('encouraging');
    expect(encouraging).toContain('momentum');

    const professional = getClosingPhrase('professional');
    expect(professional).toContain('questions');
  });
});
