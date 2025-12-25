/**
 * Layer 3 - Execution Engine
 * Evidence Ledger Tests
 */

import {
  buildEvidenceLedger,
  buildSectionEvidenceLedger,
  buildSummaryEvidenceLedger,
  getEvidenceById,
  getEvidenceByType,
  getAllNormalizedTerms,
  termExistsInLedger,
  findEvidenceForTerm,
  allowResumeEnrichmentInBullet,
} from '../evidence';
import { SAMPLE_EVIDENCE, SAMPLE_LAYER1_SIGNALS } from './fixtures/scenarios';

describe('Evidence Ledger Builder', () => {
  describe('buildEvidenceLedger', () => {
    test('should create ledger with bullet evidence', () => {
      const ledger = buildEvidenceLedger({
        bullet: 'Developed REST API for payment processing',
      });

      expect(ledger.items.length).toBe(1);
      expect(ledger.items[0].id).toBe('E1');
      expect(ledger.items[0].type).toBe('bullet');
      expect(ledger.items[0].text).toBe('Developed REST API for payment processing');
    });

    test('should include section bullets when scope is section', () => {
      const ledger = buildEvidenceLedger({
        bullet: 'Main bullet',
        sectionBullets: ['Other bullet 1', 'Other bullet 2'],
        scope: 'section',
      });

      expect(ledger.items.length).toBe(3);
      expect(ledger.items[0].type).toBe('bullet');
      expect(ledger.items[1].type).toBe('section');
      expect(ledger.items[2].type).toBe('section');
    });

    test('should not duplicate main bullet in section bullets', () => {
      const ledger = buildEvidenceLedger({
        bullet: 'Main bullet',
        sectionBullets: ['Main bullet', 'Other bullet'],
        scope: 'section',
      });

      // Main bullet + 1 other (not duplicated)
      expect(ledger.items.length).toBe(2);
    });

    test('should include skills and tools from Layer 1', () => {
      const ledger = buildEvidenceLedger({
        bullet: 'Test bullet',
        scope: 'section',
        allowResumeEnrichment: true,
        layer1: SAMPLE_LAYER1_SIGNALS,
      });

      const skillsEvidence = ledger.items.find((e) => e.type === 'skills');
      const toolsEvidence = ledger.items.find((e) => e.type === 'tools');

      expect(skillsEvidence).toBeDefined();
      expect(toolsEvidence).toBeDefined();
      expect(skillsEvidence?.text).toContain('Python');
      expect(toolsEvidence?.text).toContain('Docker');
    });

    test('should respect allowResumeEnrichment = false', () => {
      const ledger = buildEvidenceLedger({
        bullet: 'Test bullet',
        scope: 'section',
        allowResumeEnrichment: false,
        layer1: SAMPLE_LAYER1_SIGNALS,
      });

      const skillsEvidence = ledger.items.find((e) => e.type === 'skills');
      expect(skillsEvidence).toBeUndefined();
    });

    test('should use precomputed evidence when provided', () => {
      const ledger = buildEvidenceLedger({
        bullet: 'Test bullet',
        precomputedEvidence: SAMPLE_EVIDENCE,
      });

      expect(ledger.items).toEqual(SAMPLE_EVIDENCE);
    });
  });

  describe('buildSectionEvidenceLedger', () => {
    test('should create ledger from multiple bullets', () => {
      const ledger = buildSectionEvidenceLedger(
        ['Bullet 1', 'Bullet 2', 'Bullet 3'],
        {}
      );

      expect(ledger.items.length).toBe(3);
      expect(ledger.items.every((e) => e.type === 'section')).toBe(true);
    });

    test('should include Layer 1 extracted data', () => {
      const ledger = buildSectionEvidenceLedger(
        ['Bullet 1'],
        { layer1: SAMPLE_LAYER1_SIGNALS }
      );

      expect(ledger.items.some((e) => e.type === 'skills')).toBe(true);
      expect(ledger.items.some((e) => e.type === 'tools')).toBe(true);
    });
  });

  describe('buildSummaryEvidenceLedger', () => {
    test('should create ledger for summary', () => {
      const ledger = buildSummaryEvidenceLedger('Professional summary text', {
        layer1: SAMPLE_LAYER1_SIGNALS,
      });

      expect(ledger.items.length).toBeGreaterThan(1);
      expect(ledger.items[0].text).toBe('Professional summary text');
      expect(ledger.scope).toBe('resume');
    });

    test('should allow resume-level enrichment by default', () => {
      const ledger = buildSummaryEvidenceLedger('Summary', {
        layer1: SAMPLE_LAYER1_SIGNALS,
      });

      expect(ledger.allow_resume_enrichment).toBe(true);
    });
  });
});

describe('Evidence Ledger Utilities', () => {
  const ledger = {
    items: SAMPLE_EVIDENCE,
    scope: 'section' as const,
    allow_resume_enrichment: true,
  };

  describe('getEvidenceById', () => {
    test('should find evidence by ID', () => {
      const evidence = getEvidenceById(ledger, 'E1');
      expect(evidence).toBeDefined();
      expect(evidence?.id).toBe('E1');
    });

    test('should return undefined for non-existent ID', () => {
      const evidence = getEvidenceById(ledger, 'E999');
      expect(evidence).toBeUndefined();
    });
  });

  describe('getEvidenceByType', () => {
    test('should filter by type', () => {
      const skills = getEvidenceByType(ledger, 'skills');
      expect(skills.length).toBe(1);
      expect(skills[0].type).toBe('skills');
    });
  });

  describe('getAllNormalizedTerms', () => {
    test('should get all normalized terms', () => {
      const terms = getAllNormalizedTerms(ledger);
      expect(terms.has('python')).toBe(true);
      expect(terms.has('api')).toBe(true);
    });
  });

  describe('termExistsInLedger', () => {
    test('should find existing terms', () => {
      expect(termExistsInLedger(ledger, 'python')).toBe(true);
      expect(termExistsInLedger(ledger, 'Python')).toBe(true); // Case insensitive
    });

    test('should not find non-existent terms', () => {
      expect(termExistsInLedger(ledger, 'Ruby')).toBe(false);
      expect(termExistsInLedger(ledger, 'Golang')).toBe(false);
    });
  });

  describe('findEvidenceForTerm', () => {
    test('should find evidence IDs for a term', () => {
      const ids = findEvidenceForTerm(ledger, 'python');
      expect(ids).toContain('E_skills');
    });
  });
});

describe('allowResumeEnrichmentInBullet', () => {
  test('should allow for summary section', () => {
    const result = allowResumeEnrichmentInBullet(
      { section_type: 'summary' },
      'Python',
      []
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('summary_or_skills_section');
  });

  test('should allow for skills section', () => {
    const result = allowResumeEnrichmentInBullet(
      { section_type: 'skills' },
      'Python',
      []
    );
    expect(result.allowed).toBe(true);
  });

  test('should allow for experience if tool found in same role', () => {
    const result = allowResumeEnrichmentInBullet(
      { section_type: 'experience', role: 'Developer' },
      'Python',
      ['Built API using Python and Flask']
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('tool_used_in_same_role');
  });

  test('should not allow for experience if tool not in same role', () => {
    const result = allowResumeEnrichmentInBullet(
      { section_type: 'experience', role: 'Developer' },
      'Java',
      ['Built API using Python and Flask']
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('needs_user_confirmation');
  });

  test('should not allow without context', () => {
    const result = allowResumeEnrichmentInBullet(undefined, 'Python', []);
    expect(result.allowed).toBe(false);
  });
});
