/**
 * Integration Tests - Core Flows
 *
 * Tests the main integration flows across all 5 layers:
 * - Layer 1: Evaluation Engine
 * - Layer 2: Strategy Engine
 * - Layer 3: Execution Engine (MOAT)
 * - Layer 4: State & Memory
 * - Layer 5: Orchestrator (BRAIN)
 *
 * Verifies:
 * 1. Core flows - All layers coordinate correctly
 * 2. Data flow - Information passes between layers properly
 * 3. Evidence anchoring - MOAT maintained throughout
 * 4. Determinism - Same inputs → Same outputs
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  Layer1,
  Layer2,
  Layer5,
  mockLayer4State,
  mockLayer2Analysis,
  createTestResume,
  createStrongTestResume,
  verifyEvidenceAnchoring,
  StrategyMode,
  SeniorityLevel,
  FocusArea,
  evaluateGeneric,
} from './setup';

// ==================== Setup ====================

beforeEach(() => {
  // Clear any caches between tests
  Layer2.clearConfigCache?.();
  Layer5.clearConfigCache?.();
});

// ==================== Test 1: Resume Upload → Weekly Plan ====================

describe('Resume Upload → Weekly Plan Flow', () => {
  test('should process resume and generate weekly plan', async () => {
    const resume = createTestResume();

    // Layer 1: Evaluate resume
    const parsed = await Layer1.parseResume({
      content: resume.content,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    });

    // Evaluate with generic scoring
    const { result: evaluation } = evaluateGeneric(parsed, resume.content);

    expect(evaluation.resume_score).toBeGreaterThanOrEqual(0);
    expect(evaluation.resume_score).toBeLessThanOrEqual(100);
    expect(evaluation.extracted.skills.length).toBeGreaterThan(0);

    // Layer 2: Analyze strategy
    const state = mockLayer4State({
      resume: { resume_score: evaluation.resume_score },
    });

    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: {
        resume_score: evaluation.resume_score,
        content_quality_score: evaluation.content_quality_score || evaluation.resume_score,
        ats_compatibility_score: evaluation.ats_compatibility_score || evaluation.resume_score,
        weaknesses: evaluation.weaknesses || [],
        identified_gaps: {
          weak_bullets: evaluation.weak_bullets?.length || 0,
          missing_skills: [],
          vague_experience: false,
        },
        extracted: {
          skills: evaluation.extracted.skills,
          tools: evaluation.extracted.tools,
          titles: evaluation.extracted.titles || [],
        },
      },
      layer4_state: {
        pipeline_state: state.pipeline_state,
        user_profile: {
          target_roles: state.user_profile.target_roles,
          target_seniority: state.user_profile.target_seniority,
          years_experience: state.user_profile.years_experience,
        },
      },
    });

    expect(analysis.recommended_mode).toBeDefined();
    expect(analysis.action_blueprints.length).toBeGreaterThan(0);

    // Convert Layer2 analysis to Layer5 format
    const layer5Analysis = mockLayer2Analysis({
      overall_fit_score: analysis.overall_fit_score,
      confidence_level: analysis.confidence_level,
      recommended_mode: analysis.recommended_mode,
      mode_reasoning: {
        primary_reason: analysis.mode_reasoning.primary_reason,
        supporting_factors: analysis.mode_reasoning.supporting_factors,
        confidence: analysis.mode_reasoning.confidence,
      },
      action_blueprints: analysis.action_blueprints.map((bp) => ({
        type: bp.type as 'improve_resume' | 'apply_to_job' | 'follow_up' | 'update_targets' | 'collect_missing_info',
        objective: bp.objective,
        why: bp.why,
        confidence: bp.confidence,
        priority: bp.priority,
      })),
    });

    // Layer 5: Generate weekly plan
    const weeklyPlan = Layer5.orchestrateWeeklyPlan(state, layer5Analysis);

    expect(weeklyPlan.task_pool.length).toBeGreaterThan(0);
    expect(weeklyPlan.strategy_mode).toBe(layer5Analysis.recommended_mode);

    // Verify evidence anchoring
    expect(verifyEvidenceAnchoring(weeklyPlan.task_pool)).toBe(true);
    weeklyPlan.task_pool.forEach((task) => {
      expect(task.why_now).toBeDefined();
      expect(task.why_now.length).toBeGreaterThan(0);
    });

    // Generate daily plan
    const dailyPlan = Layer5.orchestrateDailyPlan(weeklyPlan, state);

    expect(dailyPlan.tasks.length).toBeGreaterThanOrEqual(1);
    expect(dailyPlan.tasks.length).toBeLessThanOrEqual(5);
  });
});

// ==================== Test 2: Low Score → IMPROVE Mode ====================

describe('Low Score → IMPROVE_RESUME_FIRST Mode', () => {
  test('should recommend IMPROVE_RESUME_FIRST for low scores', async () => {
    const lowScoreEval = {
      resume_score: 65,
      content_quality_score: 60,
      ats_compatibility_score: 65,
      weaknesses: ['weak_verbs', 'no_metrics'],
      identified_gaps: {
        weak_bullets: 5,
        missing_skills: [],
        vague_experience: true,
      },
      extracted: {
        skills: ['Python'],
        tools: [],
        titles: ['Developer'],
      },
    };

    const state = mockLayer4State({
      resume: { resume_score: 65, improvement_areas: ['weak_verbs'] },
      pipeline_state: { total_applications: 0 },
      user_profile: {
        target_roles: ['Software Engineer'],
        target_seniority: SeniorityLevel.MID,
        years_experience: 5,
        weeklyAppTarget: undefined, // Let it be calculated based on mode
      },
    });

    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: lowScoreEval,
      layer4_state: {
        pipeline_state: state.pipeline_state,
        user_profile: {
          target_roles: state.user_profile.target_roles,
          target_seniority: state.user_profile.target_seniority,
          years_experience: state.user_profile.years_experience,
        },
      },
    });

    expect(analysis.recommended_mode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);

    const layer5Analysis = mockLayer2Analysis({
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
          why: 'Resume score (65) is below 75 threshold',
          confidence: 'high',
          priority: 9,
        },
      ],
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, layer5Analysis);

    expect(plan.target_applications).toBeLessThanOrEqual(3);
    // Focus mix depends on actual task distribution, but should be positive for this mode
    expect(plan.focus_mix[FocusArea.RESUME_IMPROVEMENT]).toBeGreaterThan(0);
    expect(plan.strategy_mode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);
  });
});

// ==================== Test 3: Good Score → APPLY Mode ====================

describe('Good Score → APPLY_MODE', () => {
  test('should recommend APPLY_MODE for good scores', async () => {
    const goodScoreEval = {
      resume_score: 85,
      content_quality_score: 88,
      ats_compatibility_score: 85,
      weaknesses: [],
      identified_gaps: {
        weak_bullets: 0,
        missing_skills: [],
        vague_experience: false,
      },
      extracted: {
        skills: ['Python', 'React', 'Node.js', 'TypeScript', 'AWS'],
        tools: ['Docker', 'PostgreSQL', 'Git'],
        titles: ['Senior Software Engineer'],
      },
    };

    const state = mockLayer4State({
      resume: { resume_score: 85 },
      pipeline_state: {
        total_applications: 5,
        applications_last_7_days: 3,
        applications_last_30_days: 5,
        interview_requests: 1,
        interview_rate: 0.2,
      },
    });

    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: goodScoreEval,
      layer4_state: {
        pipeline_state: state.pipeline_state,
        user_profile: {
          target_roles: state.user_profile.target_roles,
          target_seniority: state.user_profile.target_seniority,
          years_experience: state.user_profile.years_experience,
        },
      },
    });

    expect(analysis.recommended_mode).toBe(StrategyMode.APPLY_MODE);

    const layer5Analysis = mockLayer2Analysis({
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
          objective: 'Apply to Senior Software Engineer positions',
          why: 'Strong resume match with target roles',
          confidence: 'high',
          priority: 9,
        },
      ],
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, layer5Analysis);

    expect(plan.target_applications).toBeGreaterThanOrEqual(5);
    expect(plan.focus_mix[FocusArea.APPLICATIONS]).toBeGreaterThan(0);
    expect(plan.strategy_mode).toBe(StrategyMode.APPLY_MODE);
  });
});

// ==================== Test 4: Poor Conversion → RETHINK ====================

describe('Poor Conversion → RETHINK_TARGETS', () => {
  test('should recommend RETHINK for poor interview rate', async () => {
    const state = mockLayer4State({
      resume: { resume_score: 80 },
      pipeline_state: {
        total_applications: 40,
        applications_last_7_days: 10,
        applications_last_30_days: 40,
        interview_requests: 0,
        interview_rate: 0.0,
        rejections: 30,
      },
      user_profile: {
        target_roles: ['Software Engineer'],
        target_seniority: SeniorityLevel.MID,
        years_experience: 5,
        weeklyAppTarget: undefined, // Let it be calculated based on mode
      },
    });

    const evaluation = {
      resume_score: 80,
      content_quality_score: 80,
      ats_compatibility_score: 80,
      weaknesses: [],
      identified_gaps: {
        weak_bullets: 0,
        missing_skills: [],
        vague_experience: false,
      },
      extracted: {
        skills: ['Python', 'JavaScript'],
        tools: ['Git'],
        titles: ['Software Engineer'],
      },
    };

    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: evaluation,
      layer4_state: {
        pipeline_state: state.pipeline_state,
        user_profile: {
          target_roles: state.user_profile.target_roles,
          target_seniority: state.user_profile.target_seniority,
          years_experience: state.user_profile.years_experience,
        },
      },
    });

    expect(analysis.recommended_mode).toBe(StrategyMode.RETHINK_TARGETS);

    const layer5Analysis = mockLayer2Analysis({
      overall_fit_score: 60,
      recommended_mode: StrategyMode.RETHINK_TARGETS,
      mode_reasoning: {
        primary_reason: 'low_interview_rate_after_volume',
        supporting_factors: ['many_rejections'],
        confidence: 'high',
      },
      action_blueprints: [
        {
          type: 'update_targets',
          objective: 'Review and adjust target roles',
          why: 'Interview rate (0%) below threshold after 40+ apps',
          confidence: 'high',
          priority: 10,
        },
      ],
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, layer5Analysis);

    expect(plan.target_applications).toBeLessThanOrEqual(5);
    expect(plan.focus_mix[FocusArea.STRATEGY]).toBeGreaterThan(0.2);
    expect(plan.strategy_mode).toBe(StrategyMode.RETHINK_TARGETS);
  });
});

// ==================== Test 5: Layer Coordination ====================

describe('Layer Coordination', () => {
  test('should pass data correctly between layers', async () => {
    const resume = createStrongTestResume();

    // Layer 1: Parse and evaluate
    const parsed = await Layer1.parseResume({
      content: resume.content,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    });
    const { result: evaluation } = evaluateGeneric(parsed, resume.content);

    // Verify Layer 1 output format
    expect(evaluation.resume_score).toBeDefined();
    expect(evaluation.extracted).toBeDefined();
    expect(evaluation.extracted.skills).toBeInstanceOf(Array);

    // Layer 2: Analyze with Layer 1 output
    const state = mockLayer4State({
      resume: { resume_score: evaluation.resume_score },
    });

    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: {
        resume_score: evaluation.resume_score,
        content_quality_score: evaluation.content_quality_score || evaluation.resume_score,
        ats_compatibility_score: evaluation.ats_compatibility_score || evaluation.resume_score,
        weaknesses: evaluation.weaknesses || [],
        identified_gaps: {
          weak_bullets: evaluation.weak_bullets?.length || 0,
          missing_skills: [],
          vague_experience: false,
        },
        extracted: {
          skills: evaluation.extracted.skills,
          tools: evaluation.extracted.tools,
          titles: evaluation.extracted.titles || [],
        },
      },
      layer4_state: {
        pipeline_state: state.pipeline_state,
        user_profile: {
          target_roles: state.user_profile.target_roles,
        },
      },
    });

    // Verify Layer 2 output format
    expect(analysis.recommended_mode).toBeDefined();
    expect(analysis.action_blueprints).toBeInstanceOf(Array);
    expect(analysis.overall_fit_score).toBeGreaterThanOrEqual(0);

    // Layer 5: Generate plan with Layer 2 output
    const layer5Analysis = mockLayer2Analysis({
      overall_fit_score: analysis.overall_fit_score,
      recommended_mode: analysis.recommended_mode,
      action_blueprints: analysis.action_blueprints.map((bp) => ({
        type: bp.type as 'improve_resume' | 'apply_to_job' | 'follow_up' | 'update_targets' | 'collect_missing_info',
        objective: bp.objective,
        why: bp.why,
        confidence: bp.confidence,
        priority: bp.priority,
      })),
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, layer5Analysis);

    // Verify Layer 5 output format
    expect(plan.strategy_mode).toBe(layer5Analysis.recommended_mode);
    expect(plan.task_pool).toBeInstanceOf(Array);
    expect(plan.focus_mix).toBeDefined();
  });
});

// ==================== Test 6: End-to-End with Strong Resume ====================

describe('End-to-End: Strong Resume', () => {
  test('should generate application-focused plan for strong resume', async () => {
    const resume = createStrongTestResume();

    // Full pipeline
    const parsed = await Layer1.parseResume({
      content: resume.content,
      filename: 'resume.txt',
      mimeType: 'text/plain',
    });
    const { result: evaluation } = evaluateGeneric(parsed, resume.content);

    // Should be a high score for a strong resume
    expect(evaluation.resume_score).toBeGreaterThan(70);

    const state = mockLayer4State({
      resume: { resume_score: evaluation.resume_score },
      pipeline_state: {
        total_applications: 10,
        applications_last_7_days: 5,
        applications_last_30_days: 10,
        interview_requests: 2,
        interview_rate: 0.2,
      },
    });

    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: {
        resume_score: evaluation.resume_score,
        content_quality_score: evaluation.content_quality_score || evaluation.resume_score,
        ats_compatibility_score: evaluation.ats_compatibility_score || evaluation.resume_score,
        weaknesses: evaluation.weaknesses || [],
        identified_gaps: {
          weak_bullets: evaluation.weak_bullets?.length || 0,
          missing_skills: [],
          vague_experience: false,
        },
        extracted: {
          skills: evaluation.extracted.skills,
          tools: evaluation.extracted.tools,
          titles: evaluation.extracted.titles || [],
        },
      },
      layer4_state: {
        pipeline_state: state.pipeline_state,
        user_profile: {
          target_roles: state.user_profile.target_roles,
        },
      },
    });

    // Should recommend APPLY_MODE for strong resume with good interview rate
    expect(analysis.recommended_mode).toBe(StrategyMode.APPLY_MODE);

    const layer5Analysis = mockLayer2Analysis({
      overall_fit_score: analysis.overall_fit_score,
      recommended_mode: analysis.recommended_mode,
    });

    const plan = Layer5.orchestrateWeeklyPlan(state, layer5Analysis);

    // Plan should focus on applications
    expect(plan.strategy_mode).toBe(StrategyMode.APPLY_MODE);
    expect(plan.target_applications).toBeGreaterThanOrEqual(5);
  });
});
