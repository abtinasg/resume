/**
 * Layer 5 - Orchestrator
 * Test Fixtures
 *
 * Realistic test scenarios for testing the orchestrator.
 */

import { StrategyMode, SeniorityLevel, ActionType, FocusArea } from '../../types';
import type {
  Layer4StateForLayer5,
  Layer2AnalysisForLayer5,
  Task,
} from '../../types';

// ==================== Base States ====================

/**
 * Create a base state with sensible defaults
 */
export function createBaseState(
  overrides: Partial<Layer4StateForLayer5> = {}
): Layer4StateForLayer5 {
  return {
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
      years_experience: 5,
      weeklyAppTarget: 10,
      preferences: {},
    },
    current_strategy_mode: StrategyMode.APPLY_MODE,
    strategy_history: [],
    resume: {
      master_resume_id: 'resume_001',
      resume_score: 75,
      last_resume_update: new Date().toISOString(),
      improvement_areas: [],
    },
    freshness: {
      last_resume_update: new Date().toISOString(),
      last_application: new Date().toISOString(),
      last_user_interaction: new Date().toISOString(),
      is_stale: false,
      staleness_severity: 'none',
    },
    followups: {
      applications_needing_followup: [],
    },
    state_version: 1,
    computed_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a base analysis with sensible defaults
 */
export function createBaseAnalysis(
  overrides: Partial<Layer2AnalysisForLayer5> = {}
): Layer2AnalysisForLayer5 {
  return {
    overall_fit_score: 75,
    confidence_level: 'medium',
    gaps: {
      skills: {
        matched: ['TypeScript', 'React', 'Node.js'],
        critical_missing: [],
        match_percentage: 80,
      },
      tools: {
        matched: ['Git', 'Docker'],
        critical_missing: [],
        match_percentage: 75,
      },
      experience: {
        missing_types: [],
        coverage_score: 70,
      },
      seniority: {
        user_level: SeniorityLevel.MID,
        role_expected: SeniorityLevel.MID,
        alignment: 'aligned',
      },
    },
    recommended_mode: StrategyMode.APPLY_MODE,
    mode_reasoning: {
      primary_reason: 'healthy_state_default',
      supporting_factors: [],
      confidence: 'medium',
    },
    priority_actions: [
      'Apply to matching jobs',
      'Keep your resume updated',
    ],
    action_blueprints: [
      {
        type: 'apply_to_job',
        objective: 'Apply to Software Engineer positions',
        why: 'Resume is ready and matches target roles',
        confidence: 'medium',
        priority: 8,
      },
    ],
    key_insights: ['Strong technical skills', 'Good experience match'],
    ...overrides,
  };
}

// ==================== Scenario 1: IMPROVE_RESUME_FIRST Mode ====================

export const SCENARIO_IMPROVE_RESUME_FIRST = {
  name: 'IMPROVE_RESUME_FIRST Mode',
  description: 'Resume score below threshold, should focus on improvements',
  
  state: createBaseState({
    resume: {
      master_resume_id: 'resume_001',
      resume_score: 68, // Below 75 threshold
      last_resume_update: new Date().toISOString(),
      improvement_areas: ['weak_verbs', 'no_metrics'],
    },
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
      // No weeklyAppTarget - let it use mode-based calculation
    },
    current_strategy_mode: StrategyMode.IMPROVE_RESUME_FIRST,
  }),
  
  analysis: createBaseAnalysis({
    overall_fit_score: 65,
    recommended_mode: StrategyMode.IMPROVE_RESUME_FIRST,
    mode_reasoning: {
      primary_reason: 'resume_below_threshold',
      supporting_factors: ['weak_bullets_high'],
      confidence: 'high',
    },
    action_blueprints: [
      {
        type: 'improve_resume',
        objective: 'Improve weak bullet points',
        entities: { bullet_index: 0, section: 'experience' },
        constraints: { min_score_gain: 3 },
        why: 'Resume score (68) is below 75 threshold',
        confidence: 'high',
        priority: 9,
      },
      {
        type: 'improve_resume',
        objective: 'Add quantifiable metrics',
        entities: { bullet_index: 1, section: 'experience' },
        why: 'Bullets lack measurable impact',
        confidence: 'medium',
        priority: 8,
      },
    ],
  }),
  
  expected: {
    focus: 'resume_improvement',
    focus_percentage: 0.7,
    target_applications: 2,
    min_tasks: 5,
    should_have_improve_tasks: true,
    mode: StrategyMode.IMPROVE_RESUME_FIRST,
  },
};

// ==================== Scenario 2: APPLY_MODE - Active Applying ====================

export const SCENARIO_APPLY_MODE = {
  name: 'APPLY_MODE - Active Applying',
  description: 'Resume ready, actively applying to jobs',
  
  state: createBaseState({
    resume: {
      master_resume_id: 'resume_001',
      resume_score: 85,
      last_resume_update: new Date().toISOString(),
      improvement_areas: [],
    },
    pipeline_state: {
      total_applications: 15,
      applications_last_7_days: 5, // Target: 10
      applications_last_30_days: 15,
      interview_requests: 2,
      interview_rate: 0.13, // 13% > 2% threshold
      offers: 0,
      rejections: 3,
    },
    current_strategy_mode: StrategyMode.APPLY_MODE,
  }),
  
  analysis: createBaseAnalysis({
    overall_fit_score: 85,
    recommended_mode: StrategyMode.APPLY_MODE,
    mode_reasoning: {
      primary_reason: 'healthy_state_default',
      supporting_factors: [],
      confidence: 'high',
    },
    action_blueprints: [
      {
        type: 'apply_to_job',
        objective: 'Apply to Senior Software Engineer at TechCorp',
        entities: { job_id: 'job_001' },
        why: 'Strong match (85%) with current skills',
        confidence: 'high',
        priority: 9,
      },
      {
        type: 'apply_to_job',
        objective: 'Apply to Full Stack Developer at StartupXYZ',
        entities: { job_id: 'job_002' },
        why: 'Good alignment with target roles',
        confidence: 'medium',
        priority: 7,
      },
      {
        type: 'follow_up',
        objective: 'Follow up on TechCompany application',
        entities: { application_id: 'app_001' },
        why: 'Applied 8 days ago, no response',
        confidence: 'medium',
        priority: 6,
      },
    ],
  }),
  
  expected: {
    focus: 'applications',
    focus_percentage: 0.5,
    target_applications: 10,
    min_tasks: 3,
    should_have_apply_tasks: true,
    mode: StrategyMode.APPLY_MODE,
  },
};

// ==================== Scenario 3: RETHINK_TARGETS - Low Interview Rate ====================

export const SCENARIO_RETHINK_TARGETS = {
  name: 'RETHINK_TARGETS - Low Interview Rate',
  description: 'High application volume but poor conversion',
  
  state: createBaseState({
    resume: {
      master_resume_id: 'resume_001',
      resume_score: 82,
      last_resume_update: new Date().toISOString(),
      improvement_areas: ['seniority_mismatch'],
    },
    pipeline_state: {
      total_applications: 45,
      applications_last_7_days: 10,
      applications_last_30_days: 35, // Above 30 threshold
      interview_requests: 0,
      interview_rate: 0.01, // 1% < 2% threshold
      offers: 0,
      rejections: 15,
    },
    user_profile: {
      target_roles: ['Software Engineer'],
      // No weeklyAppTarget - let it use mode-based calculation
    },
    current_strategy_mode: StrategyMode.RETHINK_TARGETS,
  }),
  
  analysis: createBaseAnalysis({
    overall_fit_score: 60,
    recommended_mode: StrategyMode.RETHINK_TARGETS,
    mode_reasoning: {
      primary_reason: 'low_interview_rate_after_volume',
      supporting_factors: ['seniority_mismatch'],
      confidence: 'high',
    },
    action_blueprints: [
      {
        type: 'update_targets',
        objective: 'Review and adjust target roles',
        why: 'Interview rate (1%) below threshold after 35+ apps',
        confidence: 'high',
        priority: 10,
      },
      {
        type: 'improve_resume',
        objective: 'Re-evaluate resume positioning',
        why: 'May be targeting wrong seniority level',
        confidence: 'medium',
        priority: 8,
      },
    ],
  }),
  
  expected: {
    focus: 'strategy',
    focus_percentage: 0.4,
    target_applications: 3,
    min_tasks: 2,
    should_have_strategy_tasks: true,
    mode: StrategyMode.RETHINK_TARGETS,
  },
};

// ==================== Scenario 4: Stale State ====================

const tenDaysAgo = new Date();
tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

export const SCENARIO_STALE_STATE = {
  name: 'Stale State',
  description: 'Data is outdated, needs refresh',
  
  state: createBaseState({
    freshness: {
      last_resume_update: tenDaysAgo.toISOString(),
      last_application: tenDaysAgo.toISOString(),
      last_user_interaction: tenDaysAgo.toISOString(),
      is_stale: true,
      staleness_reason: 'no_recent_activity',
      staleness_severity: 'critical',
    },
    computed_at: tenDaysAgo.toISOString(),
  }),
  
  analysis: createBaseAnalysis({
    confidence_level: 'low',
  }),
  
  expected: {
    focus: 'strategy',
    target_applications: 0,
    min_tasks: 1,
    should_have_refresh_task: true,
    mode: StrategyMode.APPLY_MODE, // Uses existing
  },
};

// ==================== Scenario 5: Daily Plan Slicing ====================

export const SCENARIO_DAILY_PLANNING = {
  name: 'Daily Plan Slicing',
  description: 'Fresh week, testing daily plan generation',
  
  state: createBaseState({
    resume: {
      master_resume_id: 'resume_001',
      resume_score: 80,
      last_resume_update: new Date().toISOString(),
      improvement_areas: ['weak_verbs'],
    },
    pipeline_state: {
      total_applications: 8,
      applications_last_7_days: 3,
      applications_last_30_days: 8,
      interview_requests: 1,
      interview_rate: 0.125,
      offers: 0,
      rejections: 2,
    },
    current_strategy_mode: StrategyMode.APPLY_MODE,
  }),
  
  analysis: createBaseAnalysis({
    recommended_mode: StrategyMode.APPLY_MODE,
    action_blueprints: [
      {
        type: 'improve_resume',
        objective: 'Improve a weak bullet',
        entities: { bullet_index: 0 },
        why: 'Has weak action verb',
        confidence: 'high',
        priority: 7,
      },
      {
        type: 'apply_to_job',
        objective: 'Apply to position A',
        entities: { job_id: 'job_a' },
        why: 'Good match',
        confidence: 'medium',
        priority: 8,
      },
      {
        type: 'apply_to_job',
        objective: 'Apply to position B',
        entities: { job_id: 'job_b' },
        why: 'Good match',
        confidence: 'medium',
        priority: 7,
      },
      {
        type: 'follow_up',
        objective: 'Follow up on old application',
        entities: { application_id: 'app_old' },
        why: '9 days old',
        confidence: 'medium',
        priority: 6,
      },
    ],
  }),
  
  expected: {
    max_tasks_per_day: 5,
    time_budget: 120,
    has_high_priority: true,
  },
};

// ==================== Scenario 6: Action Execution ====================

export const SCENARIO_ACTION_EXECUTION = {
  name: 'Action Execution',
  description: 'Testing action execution flow',
  
  state: createBaseState({
    resume: {
      master_resume_id: 'resume_001',
      resume_score: 75,
      last_resume_update: new Date().toISOString(),
      improvement_areas: ['weak_verbs'],
    },
  }),
  
  task: {
    task_id: 'task_test_001',
    action_type: ActionType.IMPROVE_RESUME,
    title: 'Improve bullet: Helped with backend...',
    description: 'Enhance your resume bullet to be more impactful',
    execution: 'auto' as const,
    payload: {
      bullet: 'Helped with backend development',
      bullet_index: 0,
      section: 'experience',
      rewrite_type: 'bullet' as const,
    },
    priority: 80,
    estimated_minutes: 5,
    why_now: 'This bullet uses a weak action verb',
    evidence_refs: ['resume.bullet[0]', 'state.resume.score=75'],
    status: 'pending' as const,
  } as Task,
  
  expected: {
    calls_layer3: true,
    logs_event: true,
    returns_result: true,
  },
};

// ==================== Follow-up Scenarios ====================

const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

export const SCENARIO_WITH_FOLLOWUPS = {
  name: 'State with Follow-ups',
  description: 'Testing follow-up task generation',
  
  state: createBaseState({
    followups: {
      applications_needing_followup: [
        {
          application_id: 'app_001',
          job_title: 'Software Engineer',
          company: 'TechCorp',
          applied_at: sevenDaysAgo.toISOString(),
          days_since_application: 7,
          follow_up_count: 0,
          suggested_action: 'FOLLOW_UP',
          reason: 'Optimal follow-up window',
        },
        {
          application_id: 'app_002',
          job_title: 'Backend Developer',
          company: 'StartupXYZ',
          applied_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          days_since_application: 10,
          follow_up_count: 0,
          suggested_action: 'FOLLOW_UP',
          reason: 'Getting late for follow-up',
        },
      ],
    },
  }),
  
  analysis: createBaseAnalysis(),
  
  expected: {
    should_have_followup_tasks: true,
    min_followup_tasks: 2,
  },
};

// ==================== All Scenarios ====================

export const ALL_SCENARIOS = [
  SCENARIO_IMPROVE_RESUME_FIRST,
  SCENARIO_APPLY_MODE,
  SCENARIO_RETHINK_TARGETS,
  SCENARIO_STALE_STATE,
  SCENARIO_DAILY_PLANNING,
  SCENARIO_WITH_FOLLOWUPS,
];

// ==================== Helpers ====================

export function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    task_id: `task_${Date.now()}`,
    action_type: ActionType.IMPROVE_RESUME,
    title: 'Test Task',
    description: 'A test task for unit testing',
    execution: 'auto',
    payload: {},
    priority: 50,
    estimated_minutes: 10,
    why_now: 'Testing purposes',
    evidence_refs: [],
    status: 'pending',
    ...overrides,
  };
}
