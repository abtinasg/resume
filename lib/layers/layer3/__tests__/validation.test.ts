/**
 * Layer 3 - Execution Engine
 * Validation Tests
 *
 * Tests for evidence validation - THE CRITICAL COMPONENT
 */

import {
  validateRewrite,
  validateEvidenceMap,
  getCriticalErrors,
  getWarnings,
  formatValidationResult,
  hasFabricationErrors,
  extractTechTerms,
} from '../validation/evidence-validator';
import {
  verifySemanticOverlap,
  calculateOverlapRatio,
  analyzeOverlap,
  getSignificantWords,
  jaccardSimilarity,
} from '../validation/semantic-overlap';
import { buildEvidenceLedger } from '../evidence';
import { ValidationCode, EvidenceMap, EvidenceLedger, EvidenceItem } from '../types';

describe('Evidence Validator', () => {
  describe('validateRewrite - No Fabrication', () => {
    test('should pass validation when no fabrication', () => {
      const original = 'Developed REST API';
      const improved = 'Developed REST API using Python';
      const ledger = buildEvidenceLedger({
        bullet: original,
        layer1: {
          extracted: {
            skills: ['Python', 'REST'],
            tools: [],
          },
        },
      });
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Developed REST API using Python', evidence_ids: ['E1', 'E_skills'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      expect(result.passed).toBe(true);
    });

    test('should FAIL when new number is added', () => {
      const original = 'Improved system performance';
      const improved = 'Improved system performance by 50%';
      const ledger = buildEvidenceLedger({
        bullet: original,
      });
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Improved system performance by 50%', evidence_ids: ['E1'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      expect(result.passed).toBe(false);
      expect(result.items.some((i) => i.code === ValidationCode.NEW_NUMBER_ADDED)).toBe(true);
    });

    test('should PASS when number exists in original', () => {
      const original = 'Reduced costs by 40%';
      const improved = 'Achieved 40% reduction in costs';
      const ledger = buildEvidenceLedger({
        bullet: original,
      });
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Achieved 40% reduction in costs', evidence_ids: ['E1'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      // Should pass because 40% was in original
      expect(result.items.filter((i) => i.code === ValidationCode.NEW_NUMBER_ADDED).length).toBe(0);
    });

    test('should FAIL when new tool is added not in evidence', () => {
      const original = 'Built backend system';
      const improved = 'Built backend system using Kubernetes';
      const ledger = buildEvidenceLedger({
        bullet: original,
        layer1: {
          extracted: {
            skills: ['Python'],
            tools: ['Docker'],
          },
        },
      });
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Built backend system using Kubernetes', evidence_ids: ['E1'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      expect(result.passed).toBe(false);
      expect(result.items.some((i) => i.code === ValidationCode.NEW_TOOL_ADDED)).toBe(true);
    });

    test('should PASS when tool exists in evidence', () => {
      const original = 'Built backend system';
      const improved = 'Built backend system using Docker';
      const ledger = buildEvidenceLedger({
        bullet: original,
        layer1: {
          extracted: {
            skills: ['Python'],
            tools: ['Docker'],
          },
        },
      });
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Built backend system using Docker', evidence_ids: ['E1', 'E_tools'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      // Should pass because Docker is in evidence
      expect(result.items.filter((i) => i.code === ValidationCode.NEW_TOOL_ADDED).length).toBe(0);
    });

    test('should detect scale claims not in evidence', () => {
      const original = 'Built system';
      const improved = 'Built massive enterprise-grade system';
      const ledger = buildEvidenceLedger({
        bullet: original,
      });
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Built massive enterprise-grade system', evidence_ids: ['E1'] },
      ];

      const result = validateRewrite(original, improved, ledger, evidenceMap);
      // Should flag "massive" and "enterprise-grade" as new scale claims
      expect(result.items.some((i) => i.code === ValidationCode.NEW_IMPLIED_METRIC)).toBe(true);
    });
  });

  describe('validateEvidenceMap', () => {
    const sampleLedger: EvidenceLedger = {
      items: [
        { id: 'E1', type: 'bullet', scope: 'bullet_only', source: 'bullet', text: 'Original text' },
        { id: 'E_skills', type: 'skills', scope: 'resume', source: 'resume', text: 'Python, Java' },
      ],
      scope: 'section',
      allow_resume_enrichment: true,
    };

    test('should pass when all evidence IDs exist', () => {
      const improved = 'Improved text using Python';
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Improved text using Python', evidence_ids: ['E1', 'E_skills'] },
      ];

      const warnings = validateEvidenceMap(improved, evidenceMap, sampleLedger);
      const invalidIdErrors = warnings.filter((w) => w.code === ValidationCode.INVALID_EVIDENCE_ID);
      expect(invalidIdErrors.length).toBe(0);
    });

    test('should FAIL when evidence ID does not exist', () => {
      const improved = 'Improved text';
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Improved text', evidence_ids: ['E999'] },
      ];

      const warnings = validateEvidenceMap(improved, evidenceMap, sampleLedger);
      expect(warnings.some((w) => w.code === ValidationCode.INVALID_EVIDENCE_ID)).toBe(true);
    });

    test('should FAIL when span not found in improved text', () => {
      const improved = 'Improved text';
      const evidenceMap: EvidenceMap = [
        { improved_span: 'Non-existent span', evidence_ids: ['E1'] },
      ];

      const warnings = validateEvidenceMap(improved, evidenceMap, sampleLedger);
      expect(warnings.some((w) => w.code === ValidationCode.SPAN_NOT_FOUND)).toBe(true);
    });
  });

  describe('getCriticalErrors', () => {
    test('should return only critical errors', () => {
      const result = {
        passed: false,
        items: [
          { code: ValidationCode.NEW_NUMBER_ADDED, severity: 'critical' as const, message: 'test' },
          { code: ValidationCode.LENGTH_EXPLOSION, severity: 'warning' as const, message: 'test' },
        ],
      };

      const critical = getCriticalErrors(result);
      expect(critical.length).toBe(1);
      expect(critical[0].code).toBe(ValidationCode.NEW_NUMBER_ADDED);
    });
  });

  describe('hasFabricationErrors', () => {
    test('should return true for fabrication errors', () => {
      const result = {
        passed: false,
        items: [
          { code: ValidationCode.NEW_NUMBER_ADDED, severity: 'critical' as const, message: 'test' },
        ],
      };

      expect(hasFabricationErrors(result)).toBe(true);
    });

    test('should return false for non-fabrication errors', () => {
      const result = {
        passed: false,
        items: [
          { code: ValidationCode.LENGTH_EXPLOSION, severity: 'warning' as const, message: 'test' },
        ],
      };

      expect(hasFabricationErrors(result)).toBe(false);
    });
  });

  describe('extractTechTerms', () => {
    test('should extract tech tools from text', () => {
      const { tools } = extractTechTerms('Built API using Python and Docker');
      expect(tools).toContain('python');
      expect(tools).toContain('docker');
    });

    test('should not find tools that are not in text', () => {
      const { tools } = extractTechTerms('Built simple application');
      expect(tools.length).toBe(0);
    });
  });
});

describe('Semantic Overlap', () => {
  describe('verifySemanticOverlap', () => {
    test('should verify overlap when words match', () => {
      const result = verifySemanticOverlap(
        'Developed REST API',
        ['Built REST API using Python']
      );
      expect(result).toBe(true);
    });

    test('should fail when no word overlap', () => {
      const result = verifySemanticOverlap(
        'Managed team of engineers',
        ['Built Python backend']
      );
      expect(result).toBe(false);
    });

    test('should handle empty span', () => {
      const result = verifySemanticOverlap('', ['some evidence']);
      expect(result).toBe(true); // No significant words = valid
    });
  });

  describe('calculateOverlapRatio', () => {
    test('should calculate overlap ratio', () => {
      const ratio = calculateOverlapRatio(
        'Developed REST API',
        ['Built REST API using Python']
      );
      expect(ratio).toBeGreaterThan(0);
    });

    test('should return 0 for no overlap', () => {
      const ratio = calculateOverlapRatio(
        'Managed team',
        ['Built software']
      );
      expect(ratio).toBeLessThan(0.5);
    });
  });

  describe('analyzeOverlap', () => {
    test('should provide detailed overlap analysis', () => {
      const analysis = analyzeOverlap(
        'Developed REST API',
        ['Built REST API system']
      );

      expect(analysis.spanWords).toContain('developed');
      expect(analysis.spanWords).toContain('rest');
      expect(analysis.spanWords).toContain('api');
      expect(analysis.matchedWords.length).toBeGreaterThan(0);
    });
  });

  describe('getSignificantWords', () => {
    test('should extract significant words', () => {
      const words = getSignificantWords('The quick brown fox');
      expect(words.has('quick')).toBe(true);
      expect(words.has('brown')).toBe(true);
      expect(words.has('the')).toBe(false); // Stop word
    });

    test('should handle punctuation', () => {
      const words = getSignificantWords('Developed API, managed team.');
      expect(words.has('developed')).toBe(true);
      expect(words.has('api')).toBe(true);
    });
  });

  describe('jaccardSimilarity', () => {
    test('should calculate Jaccard similarity', () => {
      const similarity = jaccardSimilarity(
        'Developed REST API',
        'Built REST API system'
      );
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    test('should return 1 for identical texts', () => {
      const similarity = jaccardSimilarity(
        'Developed REST API',
        'Developed REST API'
      );
      expect(similarity).toBe(1);
    });
  });
});

describe('Fabrication Test Cases', () => {
  // These tests ensure the MOAT functionality works correctly
  
  test('CRITICAL: Cannot add "50%" when original has no percentage', () => {
    const original = 'Improved system performance';
    const improved = 'Improved system performance by 50%';
    const ledger = buildEvidenceLedger({ bullet: original });
    const evidenceMap: EvidenceMap = [
      { improved_span: improved, evidence_ids: ['E1'] },
    ];

    const result = validateRewrite(original, improved, ledger, evidenceMap);
    expect(hasFabricationErrors(result)).toBe(true);
  });

  test('CRITICAL: Cannot add team size when original has no numbers', () => {
    const original = 'Led engineering team';
    const improved = 'Led team of 10 engineers';
    const ledger = buildEvidenceLedger({ bullet: original });
    const evidenceMap: EvidenceMap = [
      { improved_span: improved, evidence_ids: ['E1'] },
    ];

    const result = validateRewrite(original, improved, ledger, evidenceMap);
    expect(hasFabricationErrors(result)).toBe(true);
  });

  test('CRITICAL: Cannot add technology not in evidence', () => {
    const original = 'Built API';
    const improved = 'Built API using GraphQL and Kubernetes';
    const ledger = buildEvidenceLedger({
      bullet: original,
      layer1: {
        extracted: {
          skills: ['Python'],
          tools: ['Docker'],
        },
      },
    });
    const evidenceMap: EvidenceMap = [
      { improved_span: improved, evidence_ids: ['E1'] },
    ];

    const result = validateRewrite(original, improved, ledger, evidenceMap);
    expect(hasFabricationErrors(result)).toBe(true);
  });

  test('ALLOWED: Can keep existing metric from original', () => {
    const original = 'Reduced latency by 40%';
    const improved = 'Achieved 40% reduction in latency through optimization';
    const ledger = buildEvidenceLedger({ bullet: original });
    const evidenceMap: EvidenceMap = [
      { improved_span: improved, evidence_ids: ['E1'] },
    ];

    const result = validateRewrite(original, improved, ledger, evidenceMap);
    const newNumberErrors = result.items.filter(
      (i) => i.code === ValidationCode.NEW_NUMBER_ADDED
    );
    expect(newNumberErrors.length).toBe(0);
  });

  test('ALLOWED: Can add technology from evidence', () => {
    const original = 'Built backend system';
    const improved = 'Built backend system using Python';
    const ledger = buildEvidenceLedger({
      bullet: original,
      layer1: {
        extracted: {
          skills: ['Python'],
          tools: ['Docker'],
        },
      },
    });
    const evidenceMap: EvidenceMap = [
      { improved_span: 'using Python', evidence_ids: ['E_skills'] },
      { improved_span: improved, evidence_ids: ['E1', 'E_skills'] },
    ];

    const result = validateRewrite(original, improved, ledger, evidenceMap);
    const newToolErrors = result.items.filter(
      (i) => i.code === ValidationCode.NEW_TOOL_ADDED
    );
    expect(newToolErrors.length).toBe(0);
  });
});
