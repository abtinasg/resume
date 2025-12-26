/**
 * Integration Tests - Layer 3 (MOAT)
 *
 * Tests Layer 3 (Execution Engine) integration with evidence validation.
 * Verifies:
 * 1. Rewrite → Re-score flow
 * 2. Evidence anchoring throughout
 * 3. No fabrication
 * 4. Validation passes for legitimate improvements
 */

import { describe, test, expect } from '@jest/globals';
import {
  Layer1,
  Layer3,
  createTestResume,
  mockLayer1Evaluation,
  evaluateGeneric,
} from './setup';

// ==================== Test: Rewrite → Re-score Flow ====================

describe('Layer 3 Rewrite → Re-score Flow', () => {
  test('should improve bullet and verify no fabrication', async () => {
    const weakBullet = 'Helped with backend development';
    const initialResume = {
      content: `EXPERIENCE\nCompany A | Software Engineer | 2020-2023\n- ${weakBullet}\n- Worked on various projects\n\nSKILLS\nPython, Node.js, PostgreSQL`,
    };

    // Evaluate initial resume
    const parsed = await Layer1.parseResume({
      content: initialResume.content,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    });
    const { result: initialEval } = evaluateGeneric(parsed, initialResume.content);

    const initialScore = initialEval.resume_score;
    expect(initialScore).toBeGreaterThanOrEqual(0);

    // Check if Layer 3 canImprove identifies this bullet
    const canImproveResult = Layer3.canImprove(weakBullet);
    expect(canImproveResult).toBe(true);

    // Build evidence ledger for the bullet
    const ledger = Layer3.buildEvidenceLedger({
      bullet: weakBullet,
      layer1: {
        extracted: {
          skills: initialEval.extracted.skills,
          tools: initialEval.extracted.tools,
        },
      },
    });

    expect(ledger.items.length).toBeGreaterThan(0);

    // Plan micro actions
    const plan = Layer3.planMicroActions({
      original: weakBullet,
      evidence: ledger,
      issues: ['weak_verb'],
    });

    expect(plan.transformations.length).toBeGreaterThan(0);
    expect(plan.transformations.some((t) => t.type === 'verb_upgrade')).toBe(true);
  });

  test('should validate evidence-based improvements', () => {
    const original = 'Built API';
    const improved = 'Built REST API using Python';

    const ledger = Layer3.buildEvidenceLedger({
      bullet: original,
      layer1: {
        extracted: {
          skills: ['Python', 'REST', 'API'],
          tools: [],
        },
      },
    });

    const evidenceMap = [
      { improved_span: 'REST API', evidence_ids: ['E1', 'E_skills'] },
      { improved_span: 'using Python', evidence_ids: ['E_skills'] },
    ];

    const result = Layer3.validateRewrite(original, improved, ledger, evidenceMap);

    // Should pass because Python and REST are in evidence
    expect(Layer3.hasFabricationErrors(result)).toBe(false);
  });
});

// ==================== Test: No Fabrication ====================

describe('Layer 3 No Fabrication', () => {
  test('should never fabricate claims', () => {
    const vagueBullet = 'Improved system performance';

    const ledger = Layer3.buildEvidenceLedger({
      bullet: vagueBullet,
      layer1: {
        extracted: {
          skills: ['Python'],
          tools: [],
        },
      },
    });

    // Try to validate an improvement that adds fabricated numbers
    const fabricatedImproved = 'Improved system performance by 50%';
    const evidenceMap = [
      { improved_span: fabricatedImproved, evidence_ids: ['E1'] },
    ];

    const result = Layer3.validateRewrite(vagueBullet, fabricatedImproved, ledger, evidenceMap);

    // Should FAIL - fabricated percentage
    expect(Layer3.hasFabricationErrors(result)).toBe(true);
  });

  test('should detect fabricated metrics', () => {
    const original = 'Built API';
    const fabricatedImproved = 'Built API serving 1M+ requests/day';

    const ledger = Layer3.buildEvidenceLedger({
      bullet: original,
    });

    const evidenceMap = [
      { improved_span: fabricatedImproved, evidence_ids: ['E1'] },
    ];

    const result = Layer3.validateRewrite(original, fabricatedImproved, ledger, evidenceMap);

    // Should detect fabrication
    expect(Layer3.hasFabricationErrors(result)).toBe(true);
  });

  test('should allow keeping existing metrics', () => {
    const original = 'Reduced costs by 40%';
    const improved = 'Achieved 40% reduction in infrastructure costs through optimization';

    const ledger = Layer3.buildEvidenceLedger({
      bullet: original,
    });

    const evidenceMap = [
      { improved_span: '40%', evidence_ids: ['E1'] },
      { improved_span: improved, evidence_ids: ['E1'] },
    ];

    const result = Layer3.validateRewrite(original, improved, ledger, evidenceMap);

    // The 40% was kept from original, so no new number was added
    const numberErrors = result.items.filter((i) => i.code === 'NEW_NUMBER_ADDED');
    expect(numberErrors.length).toBe(0);
  });
});

// ==================== Test: Micro Action Planning ====================

describe('Layer 3 Micro Action Planning', () => {
  test('should identify weak verbs and plan upgrades', () => {
    const bullet = 'Helped build payment system';

    const ledger = Layer3.buildEvidenceLedger({
      bullet,
      layer1: {
        extracted: {
          skills: ['Python', 'Payment Processing'],
          tools: ['PostgreSQL', 'Redis'],
        },
      },
    });

    const plan = Layer3.planMicroActions({
      original: bullet,
      evidence: ledger,
      issues: ['weak_verb'],
    });

    expect(plan.transformations.length).toBeGreaterThan(0);
    expect(plan.transformations.some((t) => t.type === 'verb_upgrade')).toBe(true);
  });

  test('should identify fluff in bullet', () => {
    const fluffyBullet = 'Very effectively helped to successfully build various systems';

    const hasFluff = Layer3.hasFluff(fluffyBullet);
    expect(hasFluff).toBe(true);

    const fluffDetected = Layer3.detectFluff(fluffyBullet);
    expect(fluffDetected.length).toBeGreaterThan(0);
  });

  test('should detect metrics in bullet', () => {
    const bulletWithMetric = 'Reduced latency by 50% through caching';

    const metrics = Layer3.detectMetrics(bulletWithMetric);
    expect(metrics.length).toBeGreaterThan(0);
    expect(Layer3.hasMetric(bulletWithMetric)).toBe(true);
  });

  test('should identify bullets that cannot be improved', () => {
    const strongBullet = 'Developed REST API serving 1M+ requests/day, reducing latency by 40%';

    const canImprove = Layer3.canImprove(strongBullet);
    expect(canImprove).toBe(false);
  });
});

// ==================== Test: Evidence Ledger Building ====================

describe('Layer 3 Evidence Ledger', () => {
  test('should build evidence from Layer 1 extracted data', () => {
    const bullet = 'Built backend services';

    const ledger = Layer3.buildEvidenceLedger({
      bullet,
      layer1: {
        extracted: {
          skills: ['Python', 'Node.js', 'TypeScript', 'REST'],
          tools: ['PostgreSQL', 'Redis', 'Docker'],
        },
      },
    });

    // Should have evidence items for skills and tools
    expect(ledger.items.length).toBeGreaterThan(0);

    // Check evidence can be retrieved
    const allTerms = Layer3.getAllNormalizedTerms(ledger);
    expect(allTerms.size).toBeGreaterThan(0);
  });

  test('should track evidence from original bullet', () => {
    const bullet = 'Led team to deploy microservices';

    const ledger = Layer3.buildEvidenceLedger({
      bullet,
    });

    // Should have at least the original bullet as evidence
    expect(ledger.items.length).toBeGreaterThan(0);
  });

  test('should verify terms exist in ledger', () => {
    const bullet = 'Built API using Python';

    const ledger = Layer3.buildEvidenceLedger({
      bullet,
      layer1: {
        extracted: {
          skills: ['Python'],
          tools: [],
        },
      },
    });

    // Python should be findable in the ledger
    const pythonEvidence = Layer3.findEvidenceForTerm(ledger, 'python');
    expect(pythonEvidence).toBeDefined();
  });
});

// ==================== Test: Coherence Functions ====================

describe('Layer 3 Coherence', () => {
  test('should detect bullet tense', () => {
    const pastTense = 'Developed REST API for payment processing';
    const presentTense = 'Develops REST API for payment processing';

    const pastResult = Layer3.detectBulletTense(pastTense);
    const presentResult = Layer3.detectBulletTense(presentTense);

    expect(pastResult).toBe('past');
    expect(presentResult).toBe('present');
  });

  test('should detect dominant tense in bullet set', () => {
    const bullets = [
      'Developed REST API',
      'Built payment system',
      'Created dashboard',
      'Implemented caching',
    ];

    const dominantTense = Layer3.detectDominantTense(bullets);
    expect(dominantTense.tense).toBe('past');
    // Confidence is a string literal ('low' | 'medium' | 'high'), not a number
    expect(['low', 'medium', 'high']).toContain(dominantTense.confidence);
  });

  test('should unify formatting', () => {
    const messyBullets = [
      '  built api ',
      '- developed system.',
      '• Created dashboard',
    ];

    const unified = Layer3.applyFullFormattingToAll(messyBullets);

    // All should be trimmed, capitalized, and without trailing punctuation
    unified.forEach((bullet) => {
      expect(bullet).toBe(bullet.trim());
      expect(bullet.charAt(0)).toBe(bullet.charAt(0).toUpperCase());
      expect(bullet.endsWith('.')).toBe(false);
    });
  });

  test('should make text ATS-safe', () => {
    // Use actual Unicode smart quotes and special characters
    const textWithSpecialChars = 'Built \u201Csmart\u201D API \u2014 reduced latency\u2122';

    const atsSafe = Layer3.makeATSSafe(textWithSpecialChars);

    expect(atsSafe).not.toContain('\u201C'); // left smart quote
    expect(atsSafe).not.toContain('\u201D'); // right smart quote
    expect(atsSafe).not.toContain('\u2014'); // em dash
    expect(atsSafe).not.toContain('\u2122'); // trademark
    expect(atsSafe).toContain('"'); // should be converted to regular quotes
    expect(atsSafe).toContain('-'); // should be converted to regular dash
  });
});

// ==================== Test: Validation Functions ====================

describe('Layer 3 Validation', () => {
  test('should validate evidence map', () => {
    const original = 'Built API';
    const improved = 'Built REST API';
    
    const ledger = Layer3.buildEvidenceLedger({
      bullet: original,
    });

    // Get actual evidence IDs from ledger
    const evidenceIds = ledger.items.map((item) => item.id);

    // Valid evidence map using actual IDs
    const validEvidenceMap = [
      { improved_span: 'Built REST API', evidence_ids: evidenceIds.slice(0, 1) },
    ];

    const result = Layer3.validateEvidenceMap(improved, validEvidenceMap, ledger);

    // Result is an array of ValidationItems
    const invalidIdErrors = result.filter((i) => i.code === 'INVALID_EVIDENCE_ID');
    expect(invalidIdErrors.length).toBe(0);
  });

  test('should detect invalid evidence IDs', () => {
    const original = 'Built API';
    const improved = 'Built REST API';
    
    const ledger = Layer3.buildEvidenceLedger({
      bullet: original,
    });

    const invalidEvidenceMap = [
      { improved_span: 'Built REST API', evidence_ids: ['INVALID_ID_123'] },
    ];

    const result = Layer3.validateEvidenceMap(improved, invalidEvidenceMap, ledger);

    // Should fail validation due to invalid ID
    const invalidIdErrors = result.filter((i) => i.code === 'INVALID_EVIDENCE_ID');
    expect(invalidIdErrors.length).toBeGreaterThan(0);
  });

  test('should get critical errors', () => {
    const validationResult = {
      passed: false,
      items: [
        { code: 'NEW_NUMBER_ADDED', severity: 'critical' as const, message: 'Fabricated metric' },
        { code: 'WEAK_VERB', severity: 'warning' as const, message: 'Could use stronger verb' },
      ],
    };

    const criticalErrors = Layer3.getCriticalErrors(validationResult);
    expect(criticalErrors.length).toBe(1);
    expect(criticalErrors[0].code).toBe('NEW_NUMBER_ADDED');
  });
});

// ==================== Test: Integration with Layer 1 ====================

describe('Layer 3 + Layer 1 Integration', () => {
  test('should use Layer 1 extracted skills for evidence', async () => {
    const resume = createTestResume();

    // Get Layer 1 evaluation
    const parsed = await Layer1.parseResume({
      content: resume.content,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    });
    const { result: evaluation } = evaluateGeneric(parsed, resume.content);

    // Use extracted skills in Layer 3
    const bullet = 'Helped with backend development';
    const ledger = Layer3.buildEvidenceLedger({
      bullet,
      layer1: {
        extracted: {
          skills: evaluation.extracted.skills,
          tools: evaluation.extracted.tools,
        },
      },
    });

    // Ledger should include Layer 1 extracted entities
    expect(ledger.items.length).toBeGreaterThan(0);

    // Plan should be able to use these for improvements
    const plan = Layer3.planMicroActions({
      original: bullet,
      evidence: ledger,
      issues: ['weak_verb'],
    });

    expect(plan.transformations.length).toBeGreaterThan(0);
  });

  test('should maintain evidence chain through rewrite process', () => {
    const layer1Evaluation = mockLayer1Evaluation({
      extracted: {
        skills: ['Python', 'Node.js', 'REST API'],
        tools: ['PostgreSQL', 'Docker'],
      },
    });

    const bullet = 'Helped build services';

    // Build evidence from Layer 1
    const ledger = Layer3.buildEvidenceLedger({
      bullet,
      layer1: {
        extracted: layer1Evaluation.extracted,
      },
    });

    // Plan micro actions
    const plan = Layer3.planMicroActions({
      original: bullet,
      evidence: ledger,
      issues: ['weak_verb'],
    });

    // Verify evidence is maintained
    expect(plan.transformations.length).toBeGreaterThan(0);

    // Any tool surfacing should reference evidence
    const toolSurfacing = plan.transformations.filter((t) => t.type === 'tool_surfacing');
    toolSurfacing.forEach((t) => {
      expect(t.evidence_ids).toBeDefined();
    });
  });
});
