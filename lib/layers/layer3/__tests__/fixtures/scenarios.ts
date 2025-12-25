/**
 * Layer 3 - Execution Engine
 * Test Fixtures: Scenarios
 *
 * Test scenarios for evidence-anchored rewriting.
 * These scenarios test the core functionality and validate no fabrication.
 */

import {
  BulletRewriteRequest,
  SummaryRewriteRequest,
  SectionRewriteRequest,
  EvidenceItem,
  Layer1Signals,
} from '../../types';

// ==================== Scenario Interfaces ====================

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  request: BulletRewriteRequest | SummaryRewriteRequest | SectionRewriteRequest;
  expectedBehavior: {
    shouldPassValidation: boolean;
    expectedChanges?: {
      stronger_verb?: boolean;
      added_metric?: boolean;
      more_specific?: boolean;
      removed_fluff?: boolean;
      tailored_to_role?: boolean;
    };
    forbiddenInOutput?: string[];
    requiredInOutput?: string[];
  };
}

// ==================== Bullet Test Scenarios ====================

/**
 * Scenario 1: Metric Present (Keep It)
 * Original has a metric - should keep exact same value
 */
export const SCENARIO_METRIC_PRESENT: TestScenario = {
  id: 'metric-present',
  name: 'Metric Present - Keep It',
  description: 'When original has exact metric, output must keep same metric value',
  request: {
    type: 'bullet',
    bullet: 'Reduced server costs by 40% through optimization',
    target_role: 'DevOps Engineer',
    issues: ['weak_verb'],
    layer1: {
      extracted: {
        skills: ['AWS', 'Docker', 'Kubernetes'],
        tools: ['Terraform', 'Jenkins'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    expectedChanges: {
      stronger_verb: true,
    },
    requiredInOutput: ['40%'],
    forbiddenInOutput: ['35%', '45%', '50%', '30%'], // Must NOT change the metric
  },
};

/**
 * Scenario 2: Vague Metric (Add How, Not Number)
 * Original is vague - should add context/method, NOT fabricate numbers
 */
export const SCENARIO_VAGUE_METRIC: TestScenario = {
  id: 'vague-metric',
  name: 'Vague Metric - Add How, Not Number',
  description: 'When original is vague, add HOW it was done, not fabricated numbers',
  request: {
    type: 'bullet',
    bullet: 'Improved performance',
    target_role: 'Software Engineer',
    issues: ['no_metric', 'too_vague'],
    layer1: {
      extracted: {
        skills: ['Python', 'SQL', 'Redis'],
        tools: ['PostgreSQL', 'Docker'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    expectedChanges: {
      more_specific: true,
    },
    forbiddenInOutput: ['%', 'x faster', 'by 50', 'by 30', 'doubled', 'tripled'], // No fabricated metrics
  },
};

/**
 * Scenario 3: Weak Verb (Upgrade)
 * Original has weak verb - should upgrade to stronger verb
 */
export const SCENARIO_WEAK_VERB: TestScenario = {
  id: 'weak-verb',
  name: 'Weak Verb - Upgrade',
  description: 'Upgrade weak verb to strong action verb',
  request: {
    type: 'bullet',
    bullet: 'Helped build payment system',
    target_role: 'Backend Engineer',
    issues: ['weak_verb'],
    layer1: {
      extracted: {
        skills: ['Node.js', 'TypeScript', 'Stripe API'],
        tools: ['PostgreSQL', 'Redis'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    expectedChanges: {
      stronger_verb: true,
    },
    forbiddenInOutput: ['Helped'], // Original weak verb should be replaced
    requiredInOutput: ['payment'], // Must keep the subject matter
  },
};

/**
 * Scenario 4: Fluff Removal
 * Original has vague language - should make specific
 */
export const SCENARIO_FLUFF_REMOVAL: TestScenario = {
  id: 'fluff-removal',
  name: 'Fluff Removal',
  description: 'Remove vague phrases and make specific',
  request: {
    type: 'bullet',
    bullet: 'Worked on various projects and tasks',
    target_role: 'Software Engineer',
    issues: ['too_vague', 'weak_verb'],
    layer1: {
      extracted: {
        skills: ['React', 'TypeScript', 'GraphQL'],
        tools: ['Next.js', 'Apollo'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    expectedChanges: {
      removed_fluff: true,
      more_specific: true,
    },
    forbiddenInOutput: ['various', 'tasks', 'Worked on'], // Fluff should be removed
  },
};

/**
 * Scenario 5: Passive Voice (Make Active)
 * Original uses passive voice - should convert to active
 */
export const SCENARIO_PASSIVE_VOICE: TestScenario = {
  id: 'passive-voice',
  name: 'Passive Voice - Make Active',
  description: 'Convert passive voice to active voice',
  request: {
    type: 'bullet',
    bullet: 'Was responsible for managing team of 5 engineers',
    target_role: 'Engineering Manager',
    issues: ['weak_verb'],
    layer1: {
      extracted: {
        skills: ['Agile', 'Scrum', 'Technical Leadership'],
        tools: ['Jira', 'Confluence'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    expectedChanges: {
      stronger_verb: true,
    },
    requiredInOutput: ['5', 'engineer'], // Must keep the team size
    forbiddenInOutput: ['Was responsible'], // Passive phrase should be removed
  },
};

/**
 * Scenario 6: Missing Context (Add Detail)
 * Original is bare - add detail from evidence
 */
export const SCENARIO_ADD_CONTEXT: TestScenario = {
  id: 'add-context',
  name: 'Missing Context - Add Detail',
  description: 'Add specific details from evidence ledger',
  request: {
    type: 'bullet',
    bullet: 'Built system',
    target_role: 'Full Stack Developer',
    issues: ['too_vague', 'no_metric'],
    layer1: {
      extracted: {
        skills: ['React', 'Node.js', 'MongoDB', 'REST API'],
        tools: ['AWS', 'Docker'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    expectedChanges: {
      more_specific: true,
    },
    // Should add tools from evidence, not invent new ones
  },
};

/**
 * Scenario 7: Fabrication Attempt (Validation Fail)
 * This tests that fabrication is detected and rejected
 */
export const SCENARIO_FABRICATION_DETECTION: TestScenario = {
  id: 'fabrication-detection',
  name: 'Fabrication Attempt - Should Fail',
  description: 'LLM output with fabricated content should fail validation',
  request: {
    type: 'bullet',
    bullet: 'Led project',
    target_role: 'Project Manager',
    issues: ['too_vague'],
    layer1: {
      extracted: {
        skills: ['Project Management', 'Agile'],
        tools: ['Jira'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true, // After retry with fallback
    forbiddenInOutput: [
      '20 engineers', // Can't add team size not in evidence
      '3 offices', // Can't add office count not in evidence
      '$1M', // Can't add budget not in evidence
      '50%', // Can't add metrics not in evidence
    ],
  },
};

/**
 * Scenario 8: Already Strong Bullet
 * Original is already well-written - minimal changes
 */
export const SCENARIO_ALREADY_STRONG: TestScenario = {
  id: 'already-strong',
  name: 'Already Strong - Minimal Changes',
  description: 'Well-written bullet should have minimal or no changes',
  request: {
    type: 'bullet',
    bullet: 'Led development of REST API serving 1M+ requests/day, reducing latency by 40%',
    target_role: 'Senior Backend Engineer',
    layer1: {
      extracted: {
        skills: ['REST API', 'Performance Optimization'],
        tools: ['Node.js', 'Redis'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    requiredInOutput: ['1M+', '40%', 'latency'], // Must keep all metrics
  },
};

// ==================== Summary Test Scenarios ====================

/**
 * Summary Scenario: Professional Summary Rewrite
 */
export const SCENARIO_SUMMARY_REWRITE: TestScenario = {
  id: 'summary-rewrite',
  name: 'Professional Summary Rewrite',
  description: 'Rewrite professional summary using resume evidence',
  request: {
    type: 'summary',
    summary: 'Software engineer with experience in web development',
    target_role: 'Senior Full Stack Developer',
    layer1: {
      extracted: {
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
        tools: ['Docker', 'Kubernetes', 'Jenkins'],
        titles: ['Software Engineer', 'Full Stack Developer'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    expectedChanges: {
      tailored_to_role: true,
      more_specific: true,
    },
    // Should use skills from evidence, not invent new ones
    forbiddenInOutput: ['Java', 'C++', 'Ruby'], // Not in evidence
  },
};

// ==================== Section Test Scenarios ====================

/**
 * Section Scenario: Coherent Section Rewrite
 */
export const SCENARIO_SECTION_COHERENCE: TestScenario = {
  id: 'section-coherence',
  name: 'Section Coherence',
  description: 'Rewrite section with consistent tense and style',
  request: {
    type: 'section',
    bullets: [
      'Working on backend systems',
      'Helped with API development',
      'Was responsible for database optimization',
    ],
    section_type: 'experience',
    target_role: 'Backend Engineer',
    layer1: {
      weak_bullets: [
        { bullet: 'Working on backend systems', index: 0, issues: ['weak_verb', 'wrong_tense'] },
        { bullet: 'Helped with API development', index: 1, issues: ['weak_verb'] },
        { bullet: 'Was responsible for database optimization', index: 2, issues: ['weak_verb', 'passive_voice'] },
      ],
      extracted: {
        skills: ['Python', 'SQL', 'REST API'],
        tools: ['PostgreSQL', 'Redis', 'Docker'],
      },
    },
  },
  expectedBehavior: {
    shouldPassValidation: true,
    // All bullets should have consistent tense
  },
};

// ==================== Evidence Test Data ====================

/**
 * Sample evidence items for testing
 */
export const SAMPLE_EVIDENCE: EvidenceItem[] = [
  {
    id: 'E1',
    type: 'bullet',
    scope: 'bullet_only',
    source: 'bullet',
    text: 'Worked on API integrations',
    normalized_terms: ['api', 'integrations', 'worked'],
  },
  {
    id: 'E2',
    type: 'section',
    scope: 'section',
    source: 'section',
    text: 'Supported 5+ internal services',
    normalized_terms: ['supported', 'internal', 'services'],
  },
  {
    id: 'E_skills',
    type: 'skills',
    scope: 'resume',
    source: 'resume',
    text: 'Python, JavaScript, REST, Node.js',
    normalized_terms: ['python', 'javascript', 'rest', 'node.js'],
  },
  {
    id: 'E_tools',
    type: 'tools',
    scope: 'resume',
    source: 'resume',
    text: 'Docker, PostgreSQL, Redis',
    normalized_terms: ['docker', 'postgresql', 'redis'],
  },
];

/**
 * Sample Layer 1 signals for testing
 */
export const SAMPLE_LAYER1_SIGNALS: Layer1Signals = {
  weak_bullets: [
    {
      bullet: 'Worked on API integrations',
      index: 0,
      issues: ['weak_verb', 'no_metric'],
    },
    {
      bullet: 'Helped with database optimization',
      index: 1,
      issues: ['weak_verb'],
    },
  ],
  extracted: {
    skills: ['Python', 'JavaScript', 'REST', 'SQL'],
    tools: ['Docker', 'PostgreSQL', 'Redis', 'AWS'],
    titles: ['Software Engineer', 'Backend Developer'],
  },
};

// ==================== All Scenarios ====================

export const ALL_BULLET_SCENARIOS: TestScenario[] = [
  SCENARIO_METRIC_PRESENT,
  SCENARIO_VAGUE_METRIC,
  SCENARIO_WEAK_VERB,
  SCENARIO_FLUFF_REMOVAL,
  SCENARIO_PASSIVE_VOICE,
  SCENARIO_ADD_CONTEXT,
  SCENARIO_FABRICATION_DETECTION,
  SCENARIO_ALREADY_STRONG,
];

export const ALL_SCENARIOS: TestScenario[] = [
  ...ALL_BULLET_SCENARIOS,
  SCENARIO_SUMMARY_REWRITE,
  SCENARIO_SECTION_COHERENCE,
];
