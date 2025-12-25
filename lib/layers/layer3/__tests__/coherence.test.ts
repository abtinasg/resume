/**
 * Layer 3 - Execution Engine
 * Coherence Tests
 */

import {
  detectBulletTense,
  detectDominantTense,
  convertToTense,
  unifyTense,
  hasConsistentTense,
  getInconsistentBullets,
} from '../coherence/tense-unifier';
import {
  unifyBulletFormatting,
  unifyFormatting,
  removeTrailingPunctuation,
  makeATSSafe,
  standardizeNumbers,
  applyFullFormatting,
} from '../coherence/format-unifier';

describe('Tense Unifier', () => {
  describe('detectBulletTense', () => {
    test('should detect past tense', () => {
      expect(detectBulletTense('Developed REST API')).toBe('past');
      expect(detectBulletTense('Led team of engineers')).toBe('past');
      expect(detectBulletTense('Built payment system')).toBe('past');
    });

    test('should detect present tense', () => {
      expect(detectBulletTense('Lead team of engineers')).toBe('present');
      expect(detectBulletTense('Develop REST APIs')).toBe('present');
      expect(detectBulletTense('Build and maintain systems')).toBe('present');
    });

    test('should return null for ambiguous text', () => {
      const result = detectBulletTense('System');
      expect(result).toBeNull();
    });
  });

  describe('detectDominantTense', () => {
    test('should detect dominant past tense', () => {
      const result = detectDominantTense([
        'Developed API',
        'Led team',
        'Built system',
      ]);
      expect(result.tense).toBe('past');
      expect(result.pastCount).toBe(3);
      expect(result.presentCount).toBe(0);
    });

    test('should detect dominant present tense', () => {
      const result = detectDominantTense([
        'Develop APIs',
        'Lead team',
        'Build systems',
      ]);
      expect(result.tense).toBe('present');
    });

    test('should have high confidence when unanimous', () => {
      const result = detectDominantTense([
        'Developed API',
        'Led team',
        'Built system',
      ]);
      expect(result.confidence).toBe('high');
    });

    test('should have lower confidence when mixed', () => {
      const result = detectDominantTense([
        'Developed API',
        'Lead team', // present
        'Built system',
      ]);
      expect(result.confidence).toBe('medium');
    });
  });

  describe('convertToTense', () => {
    test('should convert to past tense', () => {
      expect(convertToTense('Lead team', 'past')).toBe('Led team');
      expect(convertToTense('Build system', 'past')).toBe('Built system');
      expect(convertToTense('Develop API', 'past')).toBe('Developed API');
    });

    test('should convert to present tense', () => {
      expect(convertToTense('Led team', 'present')).toBe('Lead team');
      expect(convertToTense('Built system', 'present')).toBe('Build system');
      expect(convertToTense('Developed API', 'present')).toBe('Develop API');
    });

    test('should not change if already correct tense', () => {
      expect(convertToTense('Developed API', 'past')).toBe('Developed API');
    });
  });

  describe('unifyTense', () => {
    test('should unify all bullets to past tense', () => {
      const bullets = ['Lead team', 'Develop API', 'Build systems'];
      const unified = unifyTense(bullets, 'past');

      expect(unified[0]).toBe('Led team');
      expect(unified[1]).toBe('Developed API');
      expect(unified[2]).toBe('Built systems');
    });

    test('should unify all bullets to present tense', () => {
      const bullets = ['Led team', 'Developed API'];
      const unified = unifyTense(bullets, 'present');

      expect(unified[0]).toBe('Lead team');
      expect(unified[1]).toBe('Develop API');
    });
  });

  describe('hasConsistentTense', () => {
    test('should return true for consistent tense', () => {
      expect(hasConsistentTense([
        'Developed API',
        'Led team',
        'Built system',
      ])).toBe(true);
    });

    test('should return false for mixed tense', () => {
      expect(hasConsistentTense([
        'Developed API',
        'Lead team', // present
        'Built system',
      ])).toBe(false);
    });
  });

  describe('getInconsistentBullets', () => {
    test('should identify inconsistent bullets', () => {
      const inconsistent = getInconsistentBullets([
        'Developed API',
        'Lead team',
        'Built system',
      ]);

      expect(inconsistent.length).toBe(1);
      expect(inconsistent[0].index).toBe(1);
      expect(inconsistent[0].tense).toBe('present');
    });
  });
});

describe('Format Unifier', () => {
  describe('unifyBulletFormatting', () => {
    test('should trim whitespace', () => {
      expect(unifyBulletFormatting('  Developed API  ')).toBe('Developed API');
    });

    test('should remove extra spaces', () => {
      expect(unifyBulletFormatting('Developed   REST    API')).toBe('Developed REST API');
    });

    test('should capitalize first letter', () => {
      expect(unifyBulletFormatting('developed API')).toBe('Developed API');
    });

    test('should remove trailing period', () => {
      expect(unifyBulletFormatting('Developed API.')).toBe('Developed API');
    });

    test('should remove bullet points', () => {
      expect(unifyBulletFormatting('• Developed API')).toBe('Developed API');
      expect(unifyBulletFormatting('- Developed API')).toBe('Developed API');
    });
  });

  describe('unifyFormatting', () => {
    test('should format all bullets', () => {
      const bullets = [
        '  developed api.  ',
        'LED TEAM',
        '• built system',
      ];
      const unified = unifyFormatting(bullets);

      expect(unified[0]).toBe('Developed api');
      expect(unified[1]).toBe('LED TEAM');
      expect(unified[2]).toBe('Built system');
    });
  });

  describe('removeTrailingPunctuation', () => {
    test('should remove periods', () => {
      expect(removeTrailingPunctuation('Developed API.')).toBe('Developed API');
    });

    test('should remove question marks', () => {
      expect(removeTrailingPunctuation('Developed API?')).toBe('Developed API');
    });

    test('should not remove mid-text punctuation', () => {
      expect(removeTrailingPunctuation('Built API. Deployed it')).toBe('Built API. Deployed it');
    });
  });

  describe('makeATSSafe', () => {
    test('should convert smart quotes', () => {
      const result = makeATSSafe('Used \u201Csmart quotes\u201D');
      expect(result).toBe('Used "smart quotes"');
    });

    test('should convert em dashes', () => {
      const result = makeATSSafe('Task \u2014 completed');
      expect(result).toBe('Task - completed');
    });

    test('should remove trademark symbols', () => {
      const result = makeATSSafe('Used React\u2122');
      expect(result).toBe('Used React');
    });
  });

  describe('standardizeNumbers', () => {
    test('should standardize percentage format', () => {
      expect(standardizeNumbers('Improved by 40 %')).toBe('Improved by 40%');
    });

    test('should standardize dollar format', () => {
      expect(standardizeNumbers('Saved $ 50 K')).toBe('Saved $50K');
    });

    test('should standardize multiplier format', () => {
      expect(standardizeNumbers('Achieved 10 x improvement')).toBe('Achieved 10x improvement');
    });
  });

  describe('applyFullFormatting', () => {
    test('should apply all formatting fixes', () => {
      const result = applyFullFormatting('  • developed api by 40 %.  ');
      expect(result).toBe('Developed api by 40%');
    });
  });
});

describe('Section Coherence', () => {
  test('should unify tense across section', () => {
    const bullets = [
      'Developed API',
      'Lead team',
      'Built system',
    ];

    // Detect dominant and unify
    const { tense, bullets: unified } = require('../coherence/tense-unifier').unifyToDominant(bullets);

    expect(tense).toBe('past');
    expect(unified.every((b: string) => detectBulletTense(b) === 'past' || detectBulletTense(b) === null)).toBe(true);
  });

  test('should apply consistent formatting', () => {
    const bullets = [
      '  developed api.  ',
      '• Led team',
      'built SYSTEM  ',
    ];

    const formatted = unifyFormatting(bullets);

    // All should be trimmed, capitalized, no bullets, no trailing punctuation
    formatted.forEach((b) => {
      expect(b).not.toMatch(/^\s/);
      expect(b).not.toMatch(/\s$/);
      expect(b).not.toMatch(/^[•\-]/);
      expect(b).not.toMatch(/\.$/);
    });
  });
});
