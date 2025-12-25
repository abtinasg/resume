/**
 * Layer 2 - Strategy Engine
 * Test Fixtures
 *
 * Provides comprehensive test scenarios for strategy analysis validation.
 * Each scenario includes:
 * - Complete input data (Layer 1 + Layer 4)
 * - Expected strategy mode
 * - Expected gap analysis highlights
 * - Expected fit score range
 * - Expected action blueprints
 */

import type {
  StrategyAnalysisRequest,
  Layer1Evaluation,
  Layer4State,
  JobContext,
  GapAnalysis,
} from '../../types';
import { StrategyMode, SeniorityLevel } from '../../types';

// ==================== Scenario Type ====================

export interface TestScenario {
  name: string;
  description: string;
  request: StrategyAnalysisRequest;
  expected: {
    mode: StrategyMode;
    fit_score_range: { min: number; max: number };
    critical_gaps?: string[];
    has_blueprints: boolean;
    reasoning_contains?: string;
  };
}

// ==================== Helper: Create Base Layer 1 Evaluation ====================

function createBaseLayer1Evaluation(overrides: Partial<Layer1Evaluation>): Layer1Evaluation {
  const base: Layer1Evaluation = {
    resume_score: 70,
    content_quality_score: 70,
    ats_compatibility_score: 75,
    weaknesses: [],
    identified_gaps: {
      weak_bullets: 2,
      missing_skills: [],
      vague_experience: false,
    },
    extracted: {
      skills: ['javascript', 'typescript', 'react', 'node.js', 'sql'],
      tools: ['git', 'docker', 'aws', 'jira'],
      titles: ['Software Engineer'],
      industries: ['technology'],
    },
  };

  return { ...base, ...overrides };
}

// ==================== Helper: Create Base Layer 4 State ====================

function createBaseLayer4State(overrides: Partial<Layer4State>): Layer4State {
  const base: Layer4State = {
    pipeline_state: {
      total_applications: 0,
      applications_last_7_days: 0,
      applications_last_30_days: 0,
      interview_requests: 0,
      interview_rate: 0,
      offers: 0,
      rejections: 0,
    },
    user_profile: {
      target_roles: ['Software Engineer'],
      target_seniority: SeniorityLevel.MID,
      years_experience: 4,
      weekly_target: 8,
    },
  };

  return {
    ...base,
    ...overrides,
    pipeline_state: { ...base.pipeline_state, ...overrides.pipeline_state },
    user_profile: { ...base.user_profile, ...overrides.user_profile },
  };
}

// ==================== Scenario 1: Strong Resume, No Applications Yet ====================

export const SCENARIO_STRONG_RESUME_NO_APPS: TestScenario = {
  name: 'strong_resume_no_applications',
  description: 'User has a strong resume (85) but has not started applying yet',
  request: {
    layer1_evaluation: createBaseLayer1Evaluation({
      resume_score: 85,
      content_quality_score: 88,
      ats_compatibility_score: 85,
      weaknesses: [],
      extracted: {
        skills: ['typescript', 'react', 'node.js', 'python', 'aws', 'kubernetes', 'postgresql'],
        tools: ['docker', 'kubernetes', 'jenkins', 'git', 'jira', 'datadog'],
        titles: ['Senior Software Engineer', 'Software Engineer'],
        industries: ['technology', 'saas'],
        bullets_sample: [
          'Led migration of monolithic system to microservices, reducing latency by 50%',
          'Mentored team of 5 junior engineers on best practices',
          'Architected real-time analytics pipeline processing 1M events/day',
        ],
      },
      ai_summary: {
        seniority_level: SeniorityLevel.SENIOR,
        seniority_confidence: 'high',
      },
    }),
    layer4_state: createBaseLayer4State({
      pipeline_state: {
        total_applications: 0,
        applications_last_7_days: 0,
        applications_last_30_days: 0,
        interview_requests: 0,
        interview_rate: 0,
        offers: 0,
        rejections: 0,
      },
      user_profile: {
        target_roles: ['Senior Software Engineer', 'Staff Engineer'],
        target_seniority: SeniorityLevel.SENIOR,
        years_experience: 6,
      },
    }),
    job_context: {
      job_requirements: {
        required_skills: ['typescript', 'react', 'node.js', 'aws'],
        preferred_skills: ['kubernetes', 'python', 'graphql'],
        required_tools: ['docker', 'git'],
        preferred_tools: ['kubernetes', 'jenkins'],
        seniority_expected: SeniorityLevel.SENIOR,
        domain_keywords: ['saas', 'cloud', 'microservices'],
      },
    },
  },
  expected: {
    mode: StrategyMode.APPLY_MODE,
    fit_score_range: { min: 65, max: 100 }, // Relaxed range - depends on matching
    has_blueprints: true,
    reasoning_contains: 'healthy_state_default',
  },
};

// ==================== Scenario 2: Good Resume, Low Interview Rate ====================

export const SCENARIO_LOW_INTERVIEW_RATE: TestScenario = {
  name: 'good_resume_low_interview_rate',
  description: 'User has applied extensively but interview rate is below threshold',
  request: {
    layer1_evaluation: createBaseLayer1Evaluation({
      resume_score: 75,
      content_quality_score: 75,
      ats_compatibility_score: 78,
      weaknesses: ['few_skills_listed'],
      extracted: {
        skills: ['javascript', 'react', 'css', 'html'],
        tools: ['git', 'vscode'],
        titles: ['Frontend Developer'],
        industries: ['technology'],
      },
    }),
    layer4_state: createBaseLayer4State({
      pipeline_state: {
        total_applications: 45,
        applications_last_7_days: 8,
        applications_last_30_days: 40,
        interview_requests: 0,
        interview_rate: 0.01, // 1%, below 2% threshold
        offers: 0,
        rejections: 35,
      },
      user_profile: {
        target_roles: ['Senior Frontend Engineer'],
        target_seniority: SeniorityLevel.SENIOR,
        years_experience: 2,
      },
    }),
  },
  expected: {
    mode: StrategyMode.RETHINK_TARGETS,
    fit_score_range: { min: 20, max: 80 }, // Relaxed range - no job requirements
    critical_gaps: ['seniority_mismatch'],
    has_blueprints: true,
    reasoning_contains: 'low_interview_rate_after_volume',
  },
};

// ==================== Scenario 3: Excellent Resume, Ready to Apply ====================

export const SCENARIO_EXCELLENT_READY: TestScenario = {
  name: 'excellent_resume_ready_to_apply',
  description: 'Exceptional candidate ready to apply with high confidence',
  request: {
    layer1_evaluation: createBaseLayer1Evaluation({
      resume_score: 92,
      content_quality_score: 95,
      ats_compatibility_score: 90,
      weaknesses: [],
      extracted: {
        skills: [
          'typescript', 'python', 'go', 'rust', 'java',
          'react', 'vue', 'angular',
          'node.js', 'django', 'spring',
          'postgresql', 'mongodb', 'redis',
          'aws', 'gcp', 'kubernetes', 'terraform',
          'machine learning', 'system design', 'leadership',
        ],
        tools: [
          'docker', 'kubernetes', 'jenkins', 'github actions',
          'datadog', 'prometheus', 'grafana',
          'jira', 'confluence',
        ],
        titles: ['Principal Engineer', 'Staff Engineer', 'Senior Software Engineer'],
        industries: ['technology', 'fintech', 'saas'],
        bullets_sample: [
          'Architected and led development of real-time payment system processing $1B+ annually',
          'Built and led team of 15 engineers across 3 time zones',
          'Reduced infrastructure costs by 40% through strategic cloud optimization',
        ],
      },
      ai_summary: {
        seniority_level: SeniorityLevel.LEAD,
        seniority_confidence: 'high',
      },
    }),
    layer4_state: createBaseLayer4State({
      pipeline_state: {
        total_applications: 0,
        applications_last_7_days: 0,
        applications_last_30_days: 0,
        interview_requests: 0,
        interview_rate: 0,
        offers: 0,
        rejections: 0,
      },
      user_profile: {
        target_roles: ['Staff Engineer', 'Principal Engineer', 'Engineering Manager'],
        target_seniority: SeniorityLevel.LEAD,
        years_experience: 12,
      },
    }),
    job_context: {
      job_requirements: {
        required_skills: ['system design', 'leadership', 'typescript'],
        preferred_skills: ['python', 'go'],
        required_tools: ['kubernetes', 'aws'],
        preferred_tools: ['terraform'],
        seniority_expected: SeniorityLevel.LEAD,
      },
    },
  },
  expected: {
    mode: StrategyMode.APPLY_MODE,
    fit_score_range: { min: 60, max: 100 }, // Relaxed range based on algorithm
    has_blueprints: true,
    reasoning_contains: 'healthy_state_default',
  },
};

// ==================== Scenario 4: Mid Resume, High Interview Rate ====================

export const SCENARIO_MID_RESUME_HIGH_INTERVIEWS: TestScenario = {
  name: 'mid_resume_high_interview_rate',
  description: 'Resume is not perfect but strategy is working well',
  request: {
    layer1_evaluation: createBaseLayer1Evaluation({
      resume_score: 78, // Above threshold (75), so won't go to IMPROVE
      content_quality_score: 75,
      ats_compatibility_score: 80,
      weaknesses: ['weak_verbs'],
      extracted: {
        skills: ['javascript', 'react', 'node.js', 'sql', 'python'],
        tools: ['git', 'jira', 'docker'],
        titles: ['Software Engineer'],
        industries: ['technology'],
      },
    }),
    layer4_state: createBaseLayer4State({
      pipeline_state: {
        total_applications: 25,
        applications_last_7_days: 5,
        applications_last_30_days: 25,
        interview_requests: 3,
        interview_rate: 0.12, // 12%, well above threshold
        offers: 0,
        rejections: 10,
      },
      user_profile: {
        target_roles: ['Software Engineer'],
        target_seniority: SeniorityLevel.MID,
        years_experience: 3,
      },
    }),
  },
  expected: {
    mode: StrategyMode.APPLY_MODE, // Stay in apply mode because strategy is working
    fit_score_range: { min: 50, max: 85 },
    has_blueprints: true,
  },
};

// ==================== Scenario 5: Entry-Level Targeting Senior Roles ====================

export const SCENARIO_ENTRY_TARGETING_SENIOR: TestScenario = {
  name: 'entry_level_targeting_senior',
  description: 'Entry-level candidate targeting senior roles - seniority mismatch',
  request: {
    layer1_evaluation: createBaseLayer1Evaluation({
      resume_score: 62,
      content_quality_score: 60,
      ats_compatibility_score: 65,
      weaknesses: ['no_metrics', 'few_skills_listed'],
      extracted: {
        skills: ['python', 'javascript', 'html', 'css'],
        tools: ['git', 'vscode'],
        titles: ['Junior Developer', 'Intern'],
        industries: ['technology'],
        bullets_sample: [
          'Built web application using React',
          'Participated in code reviews',
          'Learned about agile methodology',
        ],
      },
      ai_summary: {
        seniority_level: SeniorityLevel.ENTRY,
        seniority_confidence: 'high',
      },
    }),
    layer4_state: createBaseLayer4State({
      pipeline_state: {
        total_applications: 20,
        applications_last_7_days: 5,
        applications_last_30_days: 20,
        interview_requests: 0,
        interview_rate: 0,
        offers: 0,
        rejections: 18,
      },
      user_profile: {
        target_roles: ['Senior Software Engineer', 'Tech Lead'],
        target_seniority: SeniorityLevel.SENIOR,
        years_experience: 1.5,
      },
    }),
    job_context: {
      job_requirements: {
        required_skills: ['system design', 'leadership', 'mentorship'],
        preferred_skills: ['architecture'],
        required_tools: ['kubernetes', 'terraform'],
        seniority_expected: SeniorityLevel.SENIOR,
      },
    },
  },
  expected: {
    mode: StrategyMode.IMPROVE_RESUME_FIRST, // Resume below threshold
    fit_score_range: { min: 0, max: 60 }, // Low because many critical missing skills
    critical_gaps: ['seniority_mismatch', 'critical_missing_skills'],
    has_blueprints: true,
    reasoning_contains: 'resume_below_threshold',
  },
};

// ==================== Scenario 6: Career Switcher (Industry Gap) ====================

export const SCENARIO_CAREER_SWITCHER: TestScenario = {
  name: 'career_switcher_industry_gap',
  description: 'Finance professional switching to tech - strong skills but industry gap',
  request: {
    layer1_evaluation: createBaseLayer1Evaluation({
      resume_score: 78,
      content_quality_score: 80,
      ats_compatibility_score: 75,
      weaknesses: [],
      extracted: {
        skills: ['python', 'sql', 'data analysis', 'excel', 'financial modeling', 'statistics'],
        tools: ['tableau', 'power bi', 'bloomberg', 'refinitiv'],
        titles: ['Senior Financial Analyst', 'Financial Analyst'],
        industries: ['finance', 'banking'],
        bullets_sample: [
          'Analyzed $500M portfolio performance using Python and SQL',
          'Built financial models used for $100M investment decisions',
          'Led team of 3 analysts in quarterly reporting',
        ],
      },
      ai_summary: {
        seniority_level: SeniorityLevel.MID,
        seniority_confidence: 'medium',
      },
    }),
    layer4_state: createBaseLayer4State({
      pipeline_state: {
        total_applications: 15,
        applications_last_7_days: 4,
        applications_last_30_days: 15,
        interview_requests: 1,
        interview_rate: 0.067,
        offers: 0,
        rejections: 8,
      },
      user_profile: {
        target_roles: ['Data Engineer', 'Data Scientist'],
        target_seniority: SeniorityLevel.MID,
        years_experience: 5,
      },
    }),
    job_context: {
      job_requirements: {
        required_skills: ['python', 'sql', 'data pipelines', 'spark'],
        preferred_skills: ['airflow', 'dbt', 'machine learning'],
        required_tools: ['aws', 'snowflake', 'databricks'],
        preferred_tools: ['kafka', 'terraform'],
        seniority_expected: SeniorityLevel.MID,
        domain_keywords: ['saas', 'tech', 'data engineering'],
      },
    },
  },
  expected: {
    mode: StrategyMode.APPLY_MODE, // Resume is good enough, keep trying
    fit_score_range: { min: 0, max: 70 }, // Can be very low due to critical missing skills/tools
    critical_gaps: ['industry_mismatch', 'critical_missing_tools'],
    has_blueprints: true,
  },
};

// ==================== All Scenarios ====================

export const ALL_SCENARIOS: TestScenario[] = [
  SCENARIO_STRONG_RESUME_NO_APPS,
  SCENARIO_LOW_INTERVIEW_RATE,
  SCENARIO_EXCELLENT_READY,
  SCENARIO_MID_RESUME_HIGH_INTERVIEWS,
  SCENARIO_ENTRY_TARGETING_SENIOR,
  SCENARIO_CAREER_SWITCHER,
];

// ==================== Minimal Request for Unit Tests ====================

export const MINIMAL_REQUEST: StrategyAnalysisRequest = {
  layer1_evaluation: {
    resume_score: 70,
    content_quality_score: 70,
    ats_compatibility_score: 70,
    weaknesses: [],
    identified_gaps: {
      weak_bullets: 0,
      missing_skills: [],
      vague_experience: false,
    },
    extracted: {
      skills: ['javascript'],
      tools: ['git'],
      titles: ['Developer'],
    },
  },
  layer4_state: {
    pipeline_state: {
      total_applications: 0,
      applications_last_7_days: 0,
      applications_last_30_days: 0,
      interview_requests: 0,
      interview_rate: 0,
      offers: 0,
      rejections: 0,
    },
    user_profile: {
      target_roles: ['Developer'],
    },
  },
};

// ==================== Edge Case Requests ====================

export const EDGE_CASE_NO_SKILLS: StrategyAnalysisRequest = {
  layer1_evaluation: {
    resume_score: 30,
    content_quality_score: 25,
    ats_compatibility_score: 40,
    weaknesses: ['no_skills_listed', 'too_short'],
    identified_gaps: {
      weak_bullets: 5,
      missing_skills: ['everything'],
      vague_experience: true,
    },
    extracted: {
      skills: [],
      tools: [],
      titles: [],
    },
  },
  layer4_state: {
    pipeline_state: {
      total_applications: 0,
      applications_last_7_days: 0,
      applications_last_30_days: 0,
      interview_requests: 0,
      interview_rate: 0,
      offers: 0,
      rejections: 0,
    },
    user_profile: {
      target_roles: ['Any'],
    },
  },
};

export const EDGE_CASE_PERFECT_MATCH: StrategyAnalysisRequest = {
  layer1_evaluation: {
    resume_score: 95,
    content_quality_score: 95,
    ats_compatibility_score: 95,
    weaknesses: [],
    identified_gaps: {
      weak_bullets: 0,
      missing_skills: [],
      vague_experience: false,
    },
    extracted: {
      skills: ['typescript', 'react', 'node.js', 'aws', 'kubernetes'],
      tools: ['docker', 'jenkins', 'github'],
      titles: ['Senior Software Engineer'],
      industries: ['technology'],
    },
  },
  layer4_state: {
    pipeline_state: {
      total_applications: 10,
      applications_last_7_days: 3,
      applications_last_30_days: 10,
      interview_requests: 3,
      interview_rate: 0.30,
      offers: 1,
      rejections: 2,
    },
    user_profile: {
      target_roles: ['Senior Software Engineer'],
      target_seniority: SeniorityLevel.SENIOR,
      years_experience: 7,
    },
  },
  job_context: {
    job_requirements: {
      required_skills: ['typescript', 'react', 'node.js'],
      required_tools: ['docker'],
      seniority_expected: SeniorityLevel.SENIOR,
    },
  },
};
