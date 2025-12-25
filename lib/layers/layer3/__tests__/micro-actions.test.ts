/**
 * Layer 3 - Execution Engine
 * Micro-Actions Tests
 */

import {
  planMicroActions,
  getActionTypes,
  planHasAction,
  getVerbUpgradesFromPlan,
  getFluffTermsFromPlan,
  planRequiresTransformations,
} from '../planning';
import {
  findWeakVerbs,
  suggestVerbUpgrade,
  startsWithWeakVerb,
  isStrongVerb,
  hasPassiveVoice,
} from '../planning/verb-mapping';
import {
  detectMetrics,
  extractNumbers,
  hasMetric,
  findNewNumbers,
} from '../planning/metric-detection';
import {
  detectFluff,
  hasFluff,
  removeFluff,
} from '../planning/fluff-removal';
import { buildEvidenceLedger } from '../evidence';

describe('Verb Mapping', () => {
  describe('findWeakVerbs', () => {
    test('should find single weak verbs', () => {
      const found = findWeakVerbs('Helped build the API');
      expect(found.length).toBeGreaterThan(0);
      expect(found[0].verb.toLowerCase()).toBe('helped');
    });

    test('should find multi-word weak verbs', () => {
      const found = findWeakVerbs('Worked on the payment system');
      expect(found.length).toBeGreaterThan(0);
      expect(found[0].verb.toLowerCase()).toBe('worked on');
    });

    test('should find "was responsible for"', () => {
      const found = findWeakVerbs('Was responsible for database management');
      expect(found.length).toBeGreaterThan(0);
    });

    test('should not find weak verbs in strong bullet', () => {
      const found = findWeakVerbs('Developed REST API using Python');
      // "Developed" is not a weak verb
      expect(found.filter((f) => f.verb.toLowerCase() === 'developed').length).toBe(0);
    });
  });

  describe('suggestVerbUpgrade', () => {
    test('should suggest upgrade for "helped"', () => {
      const upgrade = suggestVerbUpgrade('helped', 'team project');
      expect(upgrade).toBeDefined();
      expect(upgrade).not.toBe('helped');
    });

    test('should suggest upgrade for "worked on"', () => {
      const upgrade = suggestVerbUpgrade('worked on', 'software development');
      expect(upgrade).toBeDefined();
      expect(['developed', 'built', 'engineered', 'designed', 'implemented']).toContain(upgrade);
    });

    test('should return null for unknown verb', () => {
      const upgrade = suggestVerbUpgrade('unknownverb');
      expect(upgrade).toBeNull();
    });
  });

  describe('startsWithWeakVerb', () => {
    test('should detect weak verb at start', () => {
      expect(startsWithWeakVerb('Helped with the project')).toBe(true);
      expect(startsWithWeakVerb('Worked on backend systems')).toBe(true);
    });

    test('should not flag strong verb at start', () => {
      expect(startsWithWeakVerb('Developed REST API')).toBe(false);
      expect(startsWithWeakVerb('Led team of engineers')).toBe(false);
    });
  });

  describe('isStrongVerb', () => {
    test('should recognize strong verbs', () => {
      expect(isStrongVerb('developed')).toBe(true);
      expect(isStrongVerb('led')).toBe(true);
      expect(isStrongVerb('architected')).toBe(true);
    });

    test('should not recognize weak verbs as strong', () => {
      expect(isStrongVerb('helped')).toBe(false);
      expect(isStrongVerb('worked')).toBe(false);
    });
  });

  describe('hasPassiveVoice', () => {
    test('should detect passive voice', () => {
      expect(hasPassiveVoice('Was responsible for managing')).toBe(true);
      expect(hasPassiveVoice('Was given the task')).toBe(true);
    });

    test('should not flag active voice', () => {
      expect(hasPassiveVoice('Managed the team')).toBe(false);
    });
  });
});

describe('Metric Detection', () => {
  describe('detectMetrics', () => {
    test('should detect percentages', () => {
      const metrics = detectMetrics('Improved performance by 40%');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].text).toBe('40%');
    });

    test('should detect dollar amounts', () => {
      const metrics = detectMetrics('Saved $500K in costs');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].text).toContain('$');
    });

    test('should detect multipliers', () => {
      const metrics = detectMetrics('Achieved 10x improvement');
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].text).toBe('10x');
    });

    test('should detect user counts', () => {
      const metrics = detectMetrics('Serving 1M+ users');
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('extractNumbers', () => {
    test('should extract various number formats', () => {
      const numbers = extractNumbers('Reduced costs by 40%, saved $50K, 10x faster');
      expect(numbers.has('40%')).toBe(true);
      expect(numbers.has('$50K')).toBe(true);
      expect(numbers.has('10x')).toBe(true);
    });
  });

  describe('hasMetric', () => {
    test('should return true for text with metrics', () => {
      expect(hasMetric('Improved by 40%')).toBe(true);
      expect(hasMetric('Saved $1M')).toBe(true);
    });

    test('should return false for text without metrics', () => {
      expect(hasMetric('Improved performance')).toBe(false);
    });
  });

  describe('findNewNumbers', () => {
    test('should find new numbers not in evidence', () => {
      const newNumbers = findNewNumbers(
        'Improved by 50%',
        'Improved performance',
        []
      );
      expect(newNumbers).toContain('50%');
    });

    test('should not flag numbers from original', () => {
      const newNumbers = findNewNumbers(
        'Improved by 40%',
        'Improved by 40%',
        []
      );
      expect(newNumbers.length).toBe(0);
    });

    test('should not flag numbers from evidence', () => {
      const newNumbers = findNewNumbers(
        'Improved by 40%',
        'Improved performance',
        ['Previously achieved 40% improvement']
      );
      expect(newNumbers.length).toBe(0);
    });
  });
});

describe('Fluff Removal', () => {
  describe('detectFluff', () => {
    test('should detect fillers', () => {
      const fluff = detectFluff('Worked on various projects');
      expect(fluff.length).toBeGreaterThan(0);
      expect(fluff.some((f) => f.phrase.toLowerCase() === 'various')).toBe(true);
    });

    test('should detect vague phrases', () => {
      const fluff = detectFluff('Was responsible for team management');
      expect(fluff.some((f) => f.type === 'vague_phrase')).toBe(true);
    });
  });

  describe('hasFluff', () => {
    test('should return true for text with fluff', () => {
      expect(hasFluff('Worked on various tasks')).toBe(true);
    });

    test('should return false for clean text', () => {
      expect(hasFluff('Developed REST API')).toBe(false);
    });
  });

  describe('removeFluff', () => {
    test('should remove fluff words', () => {
      const result = removeFluff('Worked on various projects');
      expect(result.cleaned).not.toContain('various');
      expect(result.removed).toContain('various');
    });

    test('should clean up extra spaces', () => {
      const result = removeFluff('Did various tasks and things');
      expect(result.cleaned).not.toContain('  ');
    });
  });
});

describe('Micro-Actions Planning', () => {
  describe('planMicroActions', () => {
    test('should plan verb upgrade for weak verb', () => {
      const evidence = buildEvidenceLedger({
        bullet: 'Helped build payment system',
      });

      const plan = planMicroActions({
        original: 'Helped build payment system',
        evidence,
        issues: ['weak_verb'],
      });

      expect(planHasAction(plan, 'verb_upgrade')).toBe(true);
    });

    test('should plan fluff removal when detected', () => {
      const evidence = buildEvidenceLedger({
        bullet: 'Worked on various projects',
      });

      const plan = planMicroActions({
        original: 'Worked on various projects',
        evidence,
      });

      expect(planHasAction(plan, 'remove_fluff')).toBe(true);
    });

    test('should plan add_how for no_metric issue', () => {
      const evidence = buildEvidenceLedger({
        bullet: 'Improved performance',
      });

      const plan = planMicroActions({
        original: 'Improved performance',
        evidence,
        issues: ['no_metric'],
      });

      expect(planHasAction(plan, 'add_how')).toBe(true);
    });

    test('should not plan actions for strong bullet', () => {
      const evidence = buildEvidenceLedger({
        bullet: 'Developed REST API serving 1M+ requests, reducing latency by 40%',
      });

      const plan = planMicroActions({
        original: 'Developed REST API serving 1M+ requests, reducing latency by 40%',
        evidence,
        issues: [],
      });

      // May have few or no transformations for strong bullet
      expect(plan.transformations.length).toBeLessThanOrEqual(2);
    });

    test('should set forbid_new_numbers constraint by default', () => {
      const evidence = buildEvidenceLedger({
        bullet: 'Test bullet',
      });

      const plan = planMicroActions({
        original: 'Test bullet',
        evidence,
      });

      expect(plan.constraints.forbid_new_numbers).toBe(true);
      expect(plan.constraints.forbid_new_companies).toBe(true);
    });
  });

  describe('Plan Utilities', () => {
    test('getActionTypes should return all action types', () => {
      const plan = {
        goal: 'impact' as const,
        issues: ['weak_verb'],
        transformations: [
          { type: 'verb_upgrade' as const, data: { from: 'helped', to: 'developed' } },
          { type: 'remove_fluff' as const, data: { terms: ['various'] } },
        ],
        constraints: { max_length: 200, forbid_new_numbers: true, forbid_new_tools: false, forbid_new_companies: true },
      };

      const types = getActionTypes(plan);
      expect(types).toContain('verb_upgrade');
      expect(types).toContain('remove_fluff');
    });

    test('getVerbUpgradesFromPlan should extract verb upgrades', () => {
      const plan = {
        goal: 'impact' as const,
        issues: [],
        transformations: [
          { type: 'verb_upgrade' as const, data: { from: 'helped', to: 'developed' } },
        ],
        constraints: { max_length: 200, forbid_new_numbers: true, forbid_new_tools: false, forbid_new_companies: true },
      };

      const upgrades = getVerbUpgradesFromPlan(plan);
      expect(upgrades.length).toBe(1);
      expect(upgrades[0].from).toBe('helped');
      expect(upgrades[0].to).toBe('developed');
    });

    test('planRequiresTransformations should be true when transformations exist', () => {
      const plan = {
        goal: 'impact' as const,
        issues: [],
        transformations: [{ type: 'verb_upgrade' as const, data: { from: 'a', to: 'b' } }],
        constraints: { max_length: 200, forbid_new_numbers: true, forbid_new_tools: false, forbid_new_companies: true },
      };

      expect(planRequiresTransformations(plan)).toBe(true);
    });
  });
});
