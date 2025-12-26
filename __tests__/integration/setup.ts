/**
 * Integration Testing Setup
 * Test utilities and helpers for cross-layer integration tests
 *
 * Provides:
 * - Test resume fixtures
 * - Mock state generators
 * - Layer imports
 */

import * as Layer1 from '@/lib/layers/layer1';
import * as Layer2 from '@/lib/layers/layer2';
import * as Layer3 from '@/lib/layers/layer3';
import * as Layer4 from '@/lib/layers/layer4';
import * as Layer5 from '@/lib/layers/layer5';
import {
  StrategyMode,
  SeniorityLevel,
  ActionType,
  FocusArea,
} from '@/lib/layers/shared/types';
import type {
  Layer4StateForLayer5,
  Layer2AnalysisForLayer5,
} from '@/lib/layers/layer5/types';

// Import evaluateGeneric from scoring module for integration tests
import { evaluateGeneric } from '@/lib/layers/layer1/scoring';

// ==================== Re-exports ====================

export {
  Layer1,
  Layer2,
  Layer3,
  Layer4,
  Layer5,
  StrategyMode,
  SeniorityLevel,
  ActionType,
  FocusArea,
  evaluateGeneric,
};

// ==================== Resume Test Fixtures ====================

/**
 * Create a test resume with sensible defaults
 * @param overrides Optional overrides for the resume
 */
export function createTestResume(overrides: { content?: string } = {}) {
  return {
    content: `John Doe
Senior Software Engineer

CONTACT
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe | github.com/johndoe

EXPERIENCE
TechCorp Inc. | Senior Software Engineer | 2020-2023
- Helped with backend development
- Worked on API integrations
- Was responsible for database optimization
- Participated in code reviews

StartupXYZ | Software Engineer | 2017-2020
- Built web applications
- Maintained existing codebase
- Collaborated with team members

EDUCATION
University of Technology | B.S. Computer Science | 2017

SKILLS
Python, JavaScript, Node.js, PostgreSQL, React, Docker, Git`,
    ...overrides,
  };
}

/**
 * Create a strong test resume with measurable impact
 */
export function createStrongTestResume() {
  return {
    content: `Jane Smith
Senior Software Engineer

CONTACT
jane.smith@email.com | (555) 987-6543 | linkedin.com/in/janesmith | github.com/janesmith

EXPERIENCE
MegaTech Corporation | Senior Software Engineer | 2020-2023
- Architected and deployed microservices architecture reducing latency by 45%
- Led team of 5 engineers to deliver payment processing system handling $50M annually
- Optimized database queries resulting in 3x performance improvement
- Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes

Tech Startup Inc. | Software Engineer | 2017-2020
- Developed REST APIs serving 1M+ requests/day with 99.9% uptime
- Reduced infrastructure costs by 30% through AWS optimization
- Mentored 3 junior developers on best practices

EDUCATION
Stanford University | M.S. Computer Science | 2017
MIT | B.S. Computer Science | 2015

SKILLS
Python, Go, TypeScript, React, Node.js, PostgreSQL, MongoDB, Redis, AWS, Kubernetes, Docker, Terraform, GraphQL`,
  };
}

/**
 * Create a poor test resume with weak content
 */
export function createPoorTestResume() {
  return {
    content: `John Doe
Developer

EXPERIENCE
Company | Developer | 2020-2023
- Did some coding
- Worked on projects
- Helped team

SKILLS
Python`,
  };
}

// ==================== Layer 4 State Mocks ====================

interface MockLayer4StateOverrides {
  pipeline_state?: Partial<Layer4StateForLayer5['pipeline_state']>;
  user_profile?: Partial<Layer4StateForLayer5['user_profile']>;
  current_strategy_mode?: StrategyMode | null;
  resume?: Partial<Layer4StateForLayer5['resume']>;
  freshness?: Partial<Layer4StateForLayer5['freshness']>;
  followups?: Partial<Layer4StateForLayer5['followups']>;
  state_version?: number;
  computed_at?: string;
  strategy_history?: Layer4StateForLayer5['strategy_history'];
}

/**
 * Create a mock Layer 4 state with sensible defaults
 * @param overrides Optional overrides for specific fields
 */
export function mockLayer4State(overrides: MockLayer4StateOverrides = {}): Layer4StateForLayer5 {
  const now = new Date().toISOString();

  return {
    pipeline_state: {
      total_applications: 0,
      applications_last_7_days: 0,
      applications_last_30_days: 0,
      interview_requests: 0,
      interview_rate: 0,
      offers: 0,
      rejections: 0,
      ...overrides.pipeline_state,
    },
    user_profile: {
      target_roles: ['Software Engineer'],
      target_seniority: SeniorityLevel.MID,
      years_experience: 5,
      weeklyAppTarget: 10,
      ...overrides.user_profile,
    },
    current_strategy_mode: overrides.current_strategy_mode ?? null,
    strategy_history: overrides.strategy_history ?? [],
    resume: {
      resume_score: 70,
      master_resume_id: 'resume_001',
      last_resume_update: now,
      improvement_areas: [],
      ...overrides.resume,
    },
    freshness: {
      is_stale: false,
      staleness_severity: 'none',
      last_resume_update: now,
      last_application: now,
      last_user_interaction: now,
      ...overrides.freshness,
    },
    followups: {
      applications_needing_followup: [],
      ...overrides.followups,
    },
    state_version: overrides.state_version ?? 1,
    computed_at: overrides.computed_at ?? now,
  };
}

// ==================== Layer 2 Analysis Mocks ====================

interface MockLayer2AnalysisOverrides {
  overall_fit_score?: number;
  confidence_level?: 'low' | 'medium' | 'high';
  gaps?: Partial<Layer2AnalysisForLayer5['gaps']>;
  recommended_mode?: StrategyMode;
  mode_reasoning?: Partial<Layer2AnalysisForLayer5['mode_reasoning']>;
  priority_actions?: string[];
  action_blueprints?: Layer2AnalysisForLayer5['action_blueprints'];
  key_insights?: string[];
}

/**
 * Create a mock Layer 2 analysis result with sensible defaults
 * @param overrides Optional overrides for specific fields
 */
export function mockLayer2Analysis(overrides: MockLayer2AnalysisOverrides = {}): Layer2AnalysisForLayer5 {
  return {
    overall_fit_score: overrides.overall_fit_score ?? 75,
    confidence_level: overrides.confidence_level ?? 'medium',
    gaps: {
      skills: {
        matched: ['TypeScript', 'React', 'Node.js'],
        critical_missing: [],
        match_percentage: 80,
        ...overrides.gaps?.skills,
      },
      tools: {
        matched: ['Git', 'Docker'],
        critical_missing: [],
        match_percentage: 75,
        ...overrides.gaps?.tools,
      },
      experience: {
        missing_types: [],
        coverage_score: 70,
        ...overrides.gaps?.experience,
      },
      seniority: {
        user_level: SeniorityLevel.MID,
        role_expected: SeniorityLevel.MID,
        alignment: 'aligned',
        ...overrides.gaps?.seniority,
      },
    },
    recommended_mode: overrides.recommended_mode ?? StrategyMode.APPLY_MODE,
    mode_reasoning: {
      primary_reason: 'healthy_state_default',
      supporting_factors: [],
      confidence: 'medium',
      ...overrides.mode_reasoning,
    },
    priority_actions: overrides.priority_actions ?? [
      'Apply to matching jobs',
      'Keep your resume updated',
    ],
    action_blueprints: overrides.action_blueprints ?? [
      {
        type: 'apply_to_job',
        objective: 'Apply to Software Engineer positions',
        why: 'Resume is ready and matches target roles',
        confidence: 'medium',
        priority: 8,
      },
    ],
    key_insights: overrides.key_insights ?? ['Strong technical skills', 'Good experience match'],
  };
}

// ==================== Layer 1 Evaluation Mocks ====================

interface MockLayer1EvaluationOverrides {
  resume_score?: number;
  content_quality_score?: number;
  ats_compatibility_score?: number;
  weaknesses?: string[];
  weak_bullets?: Array<{ text: string; bullet: string; issues: string[] }>;
  identified_gaps?: {
    weak_bullets?: number;
    missing_skills?: string[];
    vague_experience?: boolean;
  };
  extracted?: {
    skills?: string[];
    tools?: string[];
    titles?: string[];
    industries?: string[];
    bullets_sample?: string[];
  };
  ai_summary?: {
    seniority_level?: SeniorityLevel;
    seniority_confidence?: 'low' | 'medium' | 'high';
  };
}

/**
 * Create a mock Layer 1 evaluation result
 * @param overrides Optional overrides for specific fields
 */
export function mockLayer1Evaluation(overrides: MockLayer1EvaluationOverrides = {}) {
  return {
    resume_score: overrides.resume_score ?? 70,
    content_quality_score: overrides.content_quality_score ?? 70,
    ats_compatibility_score: overrides.ats_compatibility_score ?? 75,
    weaknesses: overrides.weaknesses ?? [],
    weak_bullets: overrides.weak_bullets ?? [],
    identified_gaps: {
      weak_bullets: overrides.identified_gaps?.weak_bullets ?? 0,
      missing_skills: overrides.identified_gaps?.missing_skills ?? [],
      vague_experience: overrides.identified_gaps?.vague_experience ?? false,
    },
    extracted: {
      skills: overrides.extracted?.skills ?? ['JavaScript', 'TypeScript', 'React', 'Node.js'],
      tools: overrides.extracted?.tools ?? ['Git', 'Docker'],
      titles: overrides.extracted?.titles ?? ['Software Engineer'],
      industries: overrides.extracted?.industries ?? ['technology'],
      bullets_sample: overrides.extracted?.bullets_sample ?? [],
    },
    ai_summary: {
      seniority_level: overrides.ai_summary?.seniority_level ?? SeniorityLevel.MID,
      seniority_confidence: overrides.ai_summary?.seniority_confidence ?? 'medium',
    },
  };
}

// ==================== Test Helpers ====================

/**
 * Check if all tasks in a plan have evidence anchoring
 */
export function verifyEvidenceAnchoring(tasks: Array<{ why_now: string }>) {
  for (const task of tasks) {
    if (!task.why_now || task.why_now.length === 0) {
      return false;
    }
  }
  return true;
}

/**
 * Count tasks by action type
 */
export function countTasksByType(
  tasks: Array<{ action_type: string }>,
  actionType: ActionType
): number {
  return tasks.filter((t) => t.action_type === actionType).length;
}

/**
 * Get high priority tasks (priority > 70)
 */
export function getHighPriorityTasks<T extends { priority: number }>(tasks: T[]): T[] {
  return tasks.filter((t) => t.priority > 70);
}

/**
 * Verify plan determinism - same inputs should produce structurally similar outputs
 */
export function verifyPlanDeterminism(
  plan1: { strategy_mode: string; target_applications: number; task_pool: unknown[] },
  plan2: { strategy_mode: string; target_applications: number; task_pool: unknown[] }
): boolean {
  return (
    plan1.strategy_mode === plan2.strategy_mode &&
    plan1.target_applications === plan2.target_applications &&
    plan1.task_pool.length === plan2.task_pool.length
  );
}
