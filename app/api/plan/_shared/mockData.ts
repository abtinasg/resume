import { SeniorityLevel } from '@/lib/layers';
import type { Layer5 } from '@/lib/layers';

/**
 * Creates mock Layer4 state for planning endpoints
 * In production, this would fetch from Layer 4
 */
export function createMockLayer4State(): Parameters<typeof Layer5.orchestrateWeeklyPlan>[0] {
  return {
    pipeline_state: {
      total_applications: 5,
      applications_last_7_days: 2,
      applications_last_30_days: 5,
      interview_requests: 0,
      interview_rate: 0,
      offers: 0,
      rejections: 0,
    },
    user_profile: {
      target_roles: ['Software Engineer'],
      target_seniority: SeniorityLevel.MID,
      weeklyAppTarget: 10,
    },
    resume: { resume_score: 75 },
    freshness: { 
      is_stale: false,
      staleness_severity: 'none',
    },
    followups: { applications_needing_followup: [] },
    state_version: 1,
    computed_at: new Date().toISOString(),
  };
}

/**
 * Creates mock Layer1 evaluation for Layer2 analysis
 * In production, this would use actual evaluation data
 */
export function createMockLayer1Evaluation() {
  return {
    resume_score: 75,
    content_quality_score: 70,
    ats_compatibility_score: 80,
    weaknesses: [],
    identified_gaps: {
      weak_bullets: 2,
      missing_skills: [],
      vague_experience: false,
    },
    extracted: { 
      skills: ['Python', 'JavaScript'], 
      tools: ['Git'],
      titles: ['Software Engineer'],
    },
  };
}

/**
 * Creates mock Layer4 state for Layer2 analysis
 * @param mockState The Layer4 state for Layer5
 */
export function createMockLayer4StateForLayer2(mockState: ReturnType<typeof createMockLayer4State>) {
  return {
    pipeline_state: mockState.pipeline_state,
    user_profile: {
      target_roles: mockState.user_profile.target_roles,
      target_seniority: mockState.user_profile.target_seniority,
      weekly_target: mockState.user_profile.weeklyAppTarget,
    },
  };
}
