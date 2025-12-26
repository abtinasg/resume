/**
 * Layer 8 - AI Coach Interface
 * Integration Tests
 *
 * End-to-end tests for the Coach facade.
 */

import { describe, test, expect } from '@jest/globals';
import { StrategyMode, ActionType, SeniorityLevel } from '../../shared/types';
import type { CoachRequest, CoachContext, CoachResponse } from '../types';

// Import main facade functions
import {
  generateResponse,
  explainDecision,
  formatMessage,
  greet,
  help,
} from '../coach';

// Import config
import { getConfig, getDefaultTone } from '../config';

// ==================== Response Generation Tests ====================

describe('Response Generation', () => {
  test('generateResponse returns valid CoachResponse', () => {
    const request: CoachRequest = {
      type: 'greeting',
      context: {
        userName: 'John',
      },
    };
    
    const response = generateResponse(request);
    
    expect(response).toHaveProperty('message');
    expect(response).toHaveProperty('tone');
    expect(response).toHaveProperty('format');
    expect(response).toHaveProperty('type');
    expect(response).toHaveProperty('metadata');
    expect(response.message).toContain('John');
  });

  test('generateResponse handles greeting with full context', () => {
    const request: CoachRequest = {
      type: 'greeting',
      context: {
        userName: 'Sarah',
        strategyMode: StrategyMode.APPLY_MODE,
        resumeScore: 82,
      },
    };
    
    const response = generateResponse(request);
    
    expect(response.message).toContain('Sarah');
    expect(response.message).toContain('82');
  });

  test('generateResponse handles strategy_explanation', () => {
    const request: CoachRequest = {
      type: 'strategy_explanation',
      context: {
        strategyMode: StrategyMode.IMPROVE_RESUME_FIRST,
        resumeScore: 65,
        strategyAnalysis: {
          recommended_mode: StrategyMode.IMPROVE_RESUME_FIRST,
          overall_fit_score: 65,
        },
      },
    };
    
    const response = generateResponse(request);
    
    expect(response.type).toBe('strategy_explanation');
    expect(response.message).toContain('Improve');
  });

  test('generateResponse handles progress_update', () => {
    const request: CoachRequest = {
      type: 'progress_update',
      context: {
        pipelineState: {
          total_applications: 10,
          interview_requests: 2,
          interview_rate: 0.2,
        },
        weeklyTarget: 12,
        applicationsThisWeek: 8,
      },
    };
    
    const response = generateResponse(request);
    
    expect(response.type).toBe('progress_update');
    expect(response.message).toContain('Progress');
  });

  test('generateResponse handles encouragement', () => {
    const request: CoachRequest = {
      type: 'encouragement',
      context: {
        toneContext: {
          userSignals: { progressing: true },
        },
      },
    };
    
    const response = generateResponse(request);
    
    expect(response.type).toBe('encouragement');
  });

  test('generateResponse handles help', () => {
    const request: CoachRequest = {
      type: 'help',
      context: {},
    };
    
    const response = generateResponse(request);
    
    expect(response.type).toBe('help');
    expect(response.message).toContain('career coach');
  });

  test('generateResponse uses specified tone', () => {
    const request: CoachRequest = {
      type: 'greeting',
      tone: 'encouraging',
      context: {},
    };
    
    const response = generateResponse(request);
    
    expect(response.tone).toBe('encouraging');
  });

  test('generateResponse uses specified format', () => {
    const request: CoachRequest = {
      type: 'greeting',
      format: 'text',
      context: {},
    };
    
    const response = generateResponse(request);
    
    expect(response.format).toBe('text');
  });

  test('generateResponse includes metadata', () => {
    const request: CoachRequest = {
      type: 'greeting',
      context: { userName: 'Test' },
    };
    
    const response = generateResponse(request);
    
    expect(response.metadata.templateId).toBeDefined();
    expect(response.metadata.generatedAt).toBeDefined();
    expect(response.metadata.wordCount).toBeGreaterThan(0);
    expect(response.metadata.characterCount).toBeGreaterThan(0);
  });
});

// ==================== Decision Explanation Tests ====================

describe('Decision Explanation', () => {
  test('explainDecision handles strategy type', () => {
    const context: CoachContext = {
      strategyAnalysis: {
        recommended_mode: StrategyMode.IMPROVE_RESUME_FIRST,
        overall_fit_score: 68,
      },
      resumeScore: 68,
    };
    
    const explanation = explainDecision('strategy', context);
    
    expect(explanation).toContain('Improve');
    expect(explanation).toBeDefined();
  });

  test('explainDecision handles action type', () => {
    const context: CoachContext = {
      task: {
        task_id: 'task-1',
        action_type: ActionType.APPLY_TO_JOB,
        title: 'Apply to Software Engineer at Google',
        description: 'Submit application',
        execution: 'user_only',
        payload: { company: 'Google' },
        priority: 80,
        estimated_minutes: 20,
        why_now: 'Strong match',
      },
    };
    
    const explanation = explainDecision('action', context);
    
    expect(explanation).toContain('Google');
  });

  test('explainDecision handles score type', () => {
    const context: CoachContext = {
      resumeScore: 75,
    };
    
    const explanation = explainDecision('score', context);
    
    expect(explanation).toContain('75');
  });

  test('explainDecision handles unknown type gracefully', () => {
    const explanation = explainDecision('unknown_type' as 'strategy', {});
    
    expect(explanation).toBeDefined();
  });

  test('explainDecision applies tone', () => {
    const context: CoachContext = {
      strategyMode: StrategyMode.APPLY_MODE,
      resumeScore: 80,
    };
    
    const explanation = explainDecision('strategy', context, 'encouraging');
    
    expect(explanation).toBeDefined();
  });
});

// ==================== Convenience Function Tests ====================

describe('Convenience Functions', () => {
  test('greet returns greeting message', () => {
    const message = greet({ userName: 'Alex' });
    
    expect(message).toContain('Alex');
    expect(typeof message).toBe('string');
  });

  test('greet handles empty context', () => {
    const message = greet({});
    
    expect(message).toContain('Welcome');
  });

  test('help returns help message', () => {
    const message = help();
    
    expect(message).toContain('career coach');
    expect(message).toContain('resume');
  });

  test('formatMessage applies tone and format', () => {
    const content = 'Your score is great!';
    const formatted = formatMessage(content, 'professional', 'text');
    
    expect(formatted).toContain('great');
    expect(typeof formatted).toBe('string');
  });
});

// ==================== Configuration Tests ====================

describe('Configuration', () => {
  test('getConfig returns valid configuration', () => {
    const config = getConfig();
    
    expect(config).toHaveProperty('version');
    expect(config).toHaveProperty('tones');
    expect(config).toHaveProperty('default_tone');
    expect(config).toHaveProperty('thresholds');
  });

  test('getDefaultTone returns valid tone', () => {
    const tone = getDefaultTone();
    
    expect(['professional', 'empathetic', 'encouraging', 'direct']).toContain(tone);
  });

  test('config has all required tones', () => {
    const config = getConfig();
    
    expect(config.tones).toHaveProperty('professional');
    expect(config.tones).toHaveProperty('empathetic');
    expect(config.tones).toHaveProperty('encouraging');
    expect(config.tones).toHaveProperty('direct');
  });

  test('config has valid thresholds', () => {
    const config = getConfig();
    
    expect(config.thresholds.apply_mode_score).toBeGreaterThan(0);
    expect(config.thresholds.apply_mode_score).toBeLessThanOrEqual(100);
    expect(config.thresholds.low_interview_rate).toBeGreaterThan(0);
    expect(config.thresholds.low_interview_rate).toBeLessThan(1);
  });
});

// ==================== Error Handling Tests ====================

describe('Error Handling', () => {
  test('generateResponse handles missing context gracefully', () => {
    const request: CoachRequest = {
      type: 'strategy_explanation',
      context: {},
    };
    
    // Should not throw
    const response = generateResponse(request);
    
    expect(response).toBeDefined();
    expect(response.message).toBeDefined();
  });

  test('explainDecision handles missing data gracefully', () => {
    const explanation = explainDecision('job_ranking', {});
    
    expect(explanation).toBeDefined();
    expect(typeof explanation).toBe('string');
  });
});

// ==================== Tone Auto-Detection Tests ====================

describe('Tone Auto-Detection in Responses', () => {
  test('auto-detects empathetic tone after rejection', () => {
    const request: CoachRequest = {
      type: 'encouragement',
      context: {
        toneContext: {
          recentEvents: { rejection: true },
        },
      },
    };
    
    const response = generateResponse(request);
    
    expect(response.tone).toBe('empathetic');
  });

  test('auto-detects encouraging tone when progressing', () => {
    const request: CoachRequest = {
      type: 'encouragement',
      context: {
        toneContext: {
          userSignals: { progressing: true },
        },
      },
    };
    
    const response = generateResponse(request);
    
    expect(response.tone).toBe('encouraging');
  });
});

// ==================== Output Format Tests ====================

describe('Output Formats', () => {
  test('markdown format includes markdown syntax', () => {
    const request: CoachRequest = {
      type: 'help',
      format: 'markdown',
      context: {},
    };
    
    const response = generateResponse(request);
    
    // Should have markdown formatting (bold, headers, etc.)
    expect(response.message).toMatch(/\*\*|##|\-/);
  });

  test('text format strips markdown', () => {
    const request: CoachRequest = {
      type: 'help',
      format: 'text',
      context: {},
    };
    
    const response = generateResponse(request);
    
    // Should not have markdown asterisks (may have hyphens for lists)
    expect(response.message).not.toMatch(/\*\*/);
  });
});
