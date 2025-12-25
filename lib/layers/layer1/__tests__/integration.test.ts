/**
 * Layer 1 - Evaluation Engine
 * Integration Tests
 *
 * Tests for the complete evaluation pipeline including
 * parsing, scoring, caching, and error handling.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  EXCEPTIONAL_SENIOR_SWE,
  STRONG_MID_LEVEL_PM,
  POOR_MINIMAL,
  JOB_SENIOR_SWE,
} from './fixtures/resumes';
import { parseResume } from '../parser';
import { evaluateGeneric } from '../scoring/generic';
import { evaluateFit } from '../scoring/fit';
import {
  generateContentHash,
  getCachedScore,
  setCachedScore,
  clearCache,
  getCacheStats,
} from '../cache';
import {
  EvaluationError,
  EvaluationErrorCode,
  isEvaluationError,
  getUserFriendlyError,
} from '../errors';
import type { ResumeInput } from '../types';

// ==================== Parser Integration Tests ====================

describe('Parser Integration', () => {
  test('should parse text resume successfully', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);

    expect(parsed.personal.name).toBeDefined();
    expect(parsed.experiences.length).toBeGreaterThan(0);
    expect(parsed.skills.length).toBeGreaterThan(0);
  });

  test('should extract personal info correctly', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);

    expect(parsed.personal.email).toMatch(/@/);
    expect(parsed.personal.phone).toBeDefined();
    expect(parsed.personal.linkedin).toBeDefined();
  });

  test('should extract experience entries', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);

    expect(parsed.experiences.length).toBeGreaterThanOrEqual(2);
    expect(parsed.experiences[0].title).toBeDefined();
    expect(parsed.experiences[0].company).toBeDefined();
    expect(parsed.experiences[0].bullets.length).toBeGreaterThan(0);
  });

  test('should extract skills correctly', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);

    expect(parsed.skills.length).toBeGreaterThan(5);
  });

  test('should calculate metadata', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);

    expect(parsed.metadata.word_count).toBeGreaterThan(200);
    expect(parsed.metadata.page_count).toBeGreaterThanOrEqual(1);
    expect(parsed.metadata.parse_quality).toBeDefined();
  });
});

// ==================== Full Pipeline Tests ====================

describe('Full Evaluation Pipeline', () => {
  test('should complete generic evaluation pipeline', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);
    const { result } = evaluateGeneric(parsed, EXCEPTIONAL_SENIOR_SWE.resume_text);

    // Check all required fields
    expect(result.resume_score).toBeDefined();
    expect(result.overall_score).toBeDefined();
    expect(result.level).toBeDefined();
    expect(result.dimensions).toBeDefined();
    expect(result.weaknesses).toBeDefined();
    expect(result.extracted).toBeDefined();
    expect(result.feedback).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.meta).toBeDefined();
    expect(result.meta.version).toBe('2.1');
  });

  test('should complete fit evaluation pipeline', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);
    const result = evaluateFit(
      parsed,
      EXCEPTIONAL_SENIOR_SWE.resume_text,
      JOB_SENIOR_SWE
    );

    // Check all required fit fields
    expect(result.fit_score).toBeDefined();
    expect(result.fit_dimensions).toBeDefined();
    expect(result.gaps).toBeDefined();
    expect(result.recommendation).toBeDefined();
    expect(result.recommendation_reasoning).toBeDefined();
    expect(result.tailoring_hints).toBeDefined();
    expect(result.priority_improvements).toBeDefined();
    expect(result.fit_meta).toBeDefined();

    // Should also include generic fields
    expect(result.resume_score).toBeDefined();
    expect(result.dimensions).toBeDefined();
  });

  test('should handle poor quality resume gracefully', async () => {
    const input: ResumeInput = {
      content: POOR_MINIMAL.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);
    const { result } = evaluateGeneric(parsed, POOR_MINIMAL.resume_text);

    // Should still produce valid result
    expect(result.resume_score).toBeGreaterThanOrEqual(0);
    expect(result.resume_score).toBeLessThanOrEqual(100);
    expect(result.weaknesses.length).toBeGreaterThan(0);
    expect(result.feedback.critical_gaps.length).toBeGreaterThan(0);
  });
});

// ==================== Cache Tests ====================

describe('Caching System', () => {
  beforeEach(() => {
    clearCache();
  });

  test('should generate consistent content hash', () => {
    const content = 'Test resume content';
    const hash1 = generateContentHash(content);
    const hash2 = generateContentHash(content);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(32);
  });

  test('should generate different hash for different content', () => {
    const hash1 = generateContentHash('Resume content 1');
    const hash2 = generateContentHash('Resume content 2');

    expect(hash1).not.toBe(hash2);
  });

  test('should cache and retrieve scores', () => {
    const hash = 'test-hash-123';
    const mockResult = {
      resume_score: 85,
      overall_score: 85,
      level: 'Strong' as const,
    } as any;

    setCachedScore(hash, mockResult);
    const cached = getCachedScore(hash);

    expect(cached).toBeDefined();
    expect(cached?.resume_score).toBe(85);
  });

  test('should return null for cache miss', () => {
    const cached = getCachedScore('nonexistent-hash');
    expect(cached).toBeNull();
  });

  test('should track cache stats', () => {
    const hash = 'stats-test-hash';
    const mockResult = { resume_score: 75 } as any;

    setCachedScore(hash, mockResult);

    // Miss
    getCachedScore('nonexistent');

    // Hit
    getCachedScore(hash);

    const stats = getCacheStats();
    expect(stats.hits).toBeGreaterThanOrEqual(1);
    expect(stats.misses).toBeGreaterThanOrEqual(1);
    expect(stats.size).toBeGreaterThanOrEqual(1);
  });

  test('should clear cache', () => {
    const hash = 'clear-test-hash';
    setCachedScore(hash, { resume_score: 80 } as any);

    clearCache();

    const cached = getCachedScore(hash);
    expect(cached).toBeNull();

    const stats = getCacheStats();
    expect(stats.size).toBe(0);
  });
});

// ==================== Error Handling Tests ====================

describe('Error Handling', () => {
  test('should create evaluation error correctly', () => {
    const error = new EvaluationError(EvaluationErrorCode.PARSING_FAILED, {
      reason: 'Test failure',
    });

    expect(error.code).toBe(EvaluationErrorCode.PARSING_FAILED);
    expect(error.title).toBeDefined();
    expect(error.suggestion).toBeDefined();
    expect(error.message).toBeDefined();
  });

  test('should identify evaluation errors', () => {
    const evalError = new EvaluationError(EvaluationErrorCode.INVALID_FORMAT);
    const regularError = new Error('Regular error');

    expect(isEvaluationError(evalError)).toBe(true);
    expect(isEvaluationError(regularError)).toBe(false);
  });

  test('should get user-friendly error info', () => {
    const error = new EvaluationError(EvaluationErrorCode.NO_CONTENT);
    const friendly = getUserFriendlyError(error);

    expect(friendly.code).toBe(EvaluationErrorCode.NO_CONTENT);
    expect(friendly.title).toBeDefined();
    expect(friendly.message).toBeDefined();
    expect(friendly.suggestion).toBeDefined();
  });

  test('should handle unknown errors gracefully', () => {
    const unknownError = { weird: 'object' };
    const friendly = getUserFriendlyError(unknownError);

    expect(friendly.code).toBe(EvaluationErrorCode.INTERNAL_ERROR);
    expect(friendly.title).toBeDefined();
  });

  test('should convert error to JSON', () => {
    const error = new EvaluationError(EvaluationErrorCode.VALIDATION_ERROR, {
      field: 'resume',
    });

    const json = error.toJSON();

    expect(json.code).toBe(EvaluationErrorCode.VALIDATION_ERROR);
    expect(json.details).toEqual({ field: 'resume' });
    expect(json.stack).toBeDefined();
  });
});

// ==================== Performance Tests ====================

describe('Performance', () => {
  test('should complete generic evaluation in under 2 seconds', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const startTime = Date.now();
    const parsed = await parseResume(input);
    evaluateGeneric(parsed, EXCEPTIONAL_SENIOR_SWE.resume_text);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });

  test('should complete fit evaluation in under 3 seconds', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const startTime = Date.now();
    const parsed = await parseResume(input);
    evaluateFit(parsed, EXCEPTIONAL_SENIOR_SWE.resume_text, JOB_SENIOR_SWE);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(3000);
  });

  test('should parse resume in under 500ms', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const startTime = Date.now();
    await parseResume(input);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(500);
  });
});

// ==================== Score Consistency Tests ====================

describe('Score Consistency', () => {
  test('should produce consistent scores for same input', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);
    const { result: result1 } = evaluateGeneric(parsed, EXCEPTIONAL_SENIOR_SWE.resume_text);
    const { result: result2 } = evaluateGeneric(parsed, EXCEPTIONAL_SENIOR_SWE.resume_text);

    expect(result1.resume_score).toBe(result2.resume_score);
    expect(result1.dimensions.skill_capital.score).toBe(result2.dimensions.skill_capital.score);
    expect(result1.dimensions.execution_impact.score).toBe(result2.dimensions.execution_impact.score);
  });

  test('should score exceptional resume higher than poor resume', async () => {
    const exceptionalInput: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };
    const poorInput: ResumeInput = {
      content: POOR_MINIMAL.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsedExceptional = await parseResume(exceptionalInput);
    const parsedPoor = await parseResume(poorInput);

    const { result: exceptionalResult } = evaluateGeneric(parsedExceptional, EXCEPTIONAL_SENIOR_SWE.resume_text);
    const { result: poorResult } = evaluateGeneric(parsedPoor, POOR_MINIMAL.resume_text);

    expect(exceptionalResult.resume_score).toBeGreaterThan(poorResult.resume_score);
    expect(exceptionalResult.resume_score - poorResult.resume_score).toBeGreaterThan(30);
  });
});

// ==================== Layer Integration Tests ====================

describe('Layer Integration', () => {
  test('should provide data compatible with Layer 2', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);
    const { result } = evaluateGeneric(parsed, EXCEPTIONAL_SENIOR_SWE.resume_text);

    // Layer 2 expects these fields
    expect(result.content_quality_score).toBeDefined();
    expect(result.ats_compatibility_score).toBeDefined();
    expect(result.format_quality_score).toBeDefined();
    expect(result.impact_score).toBeDefined();
    expect(result.weak_bullets).toBeDefined();
  });

  test('should provide data compatible with Layer 4', async () => {
    const input: ResumeInput = {
      content: EXCEPTIONAL_SENIOR_SWE.resume_text,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    };

    const parsed = await parseResume(input);
    const { result } = evaluateGeneric(parsed, EXCEPTIONAL_SENIOR_SWE.resume_text);

    // Layer 4 expects these fields for database storage
    expect(result.overall_score).toBeDefined();
    expect(result.dimensions.skill_capital.score).toBeDefined();
    expect(result.dimensions.execution_impact.score).toBeDefined();
    expect(result.dimensions.learning_adaptivity.score).toBeDefined();
    expect(result.dimensions.signal_quality.score).toBeDefined();
    expect(result.weaknesses).toBeInstanceOf(Array);
    expect(result.extracted.skills).toBeInstanceOf(Array);
  });
});
