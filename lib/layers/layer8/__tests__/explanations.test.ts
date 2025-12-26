/**
 * Layer 8 - AI Coach Interface
 * Explanations Tests
 *
 * Tests for explanation generation functions.
 */

import { describe, test, expect } from '@jest/globals';
import { StrategyMode, ActionType, SeniorityLevel } from '../../shared/types';
import type { StrategyAnalysisResult } from '../../layer2/types';
import type { Task } from '../../layer5/types';
import type { RankedJob, JobCategory } from '../../layer6/types';
import type { EvaluationResult, WeakBullet } from '../../layer1/types';

// Import explanations
import {
  explainFromAnalysis,
  generateBriefSummary,
  explainTask,
  explainDailyPlan,
  explainRankedJob,
  explainJobList,
  explainEvaluation,
  explainWeakBullet,
  explainWeakBullets,
  explainScoreChange,
} from '../explanations';

// ==================== Strategy Explanation Tests ====================

describe('Strategy Explainer', () => {
  const mockAnalysis: Partial<StrategyAnalysisResult> = {
    analysis_version: '2.1',
    overall_fit_score: 72,
    confidence_level: 'medium',
    recommended_mode: StrategyMode.IMPROVE_RESUME_FIRST,
    mode_reasoning: {
      primary_reason: 'resume_below_threshold',
      supporting_factors: ['weak_bullets_high'],
      confidence: 'medium',
    },
    key_insights: [
      'Your resume score is below the competitive threshold',
      'Focus on adding quantified metrics',
    ],
    priority_actions: [
      'Improve weak bullets in experience section',
      'Add more skills to skills section',
    ],
  };

  test('explainFromAnalysis generates comprehensive explanation', () => {
    const explanation = explainFromAnalysis(mockAnalysis);
    
    expect(explanation).toContain('Improve Resume First');
    expect(explanation).toContain('72');
    expect(explanation).toBeDefined();
    expect(explanation.length).toBeGreaterThan(100);
  });

  test('explainFromAnalysis includes key insights', () => {
    const explanation = explainFromAnalysis(mockAnalysis);
    
    expect(explanation).toContain('Key Insights');
    expect(explanation).toContain('competitive threshold');
  });

  test('generateBriefSummary returns concise summary', () => {
    const summary = generateBriefSummary(mockAnalysis);
    
    expect(summary).toContain('Improve');
    expect(summary.length).toBeLessThan(500);
  });

  test('explainFromAnalysis handles APPLY_MODE', () => {
    const applyAnalysis: Partial<StrategyAnalysisResult> = {
      ...mockAnalysis,
      overall_fit_score: 82,
      recommended_mode: StrategyMode.APPLY_MODE,
    };
    
    const explanation = explainFromAnalysis(applyAnalysis);
    expect(explanation).toContain('Apply Mode');
  });
});

// ==================== Action Explanation Tests ====================

describe('Action Explainer', () => {
  const mockTask: Task = {
    task_id: 'task-1',
    action_type: ActionType.APPLY_TO_JOB,
    title: 'Apply to Senior Engineer at Google',
    description: 'Submit application for the Senior Engineer role',
    execution: 'user_only',
    payload: {
      job_title: 'Senior Engineer',
      company: 'Google',
      match_score: 85,
    },
    priority: 80,
    estimated_minutes: 20,
    why_now: 'Strong skill match and deadline approaching',
    evidence_refs: ['layer6.rankedJobs[0]', 'layer2.action_blueprints[0]'],
  };

  test('explainTask generates task explanation', () => {
    const explanation = explainTask(mockTask);
    
    expect(explanation).toContain('Apply');
    expect(explanation).toContain('Google');
    expect(explanation).toContain('Strong skill match');
  });

  test('explainTask includes evidence refs', () => {
    const explanation = explainTask(mockTask);
    
    expect(explanation).toContain('Based on');
  });

  test('explainDailyPlan explains multiple tasks', () => {
    const tasks: Task[] = [
      mockTask,
      {
        ...mockTask,
        task_id: 'task-2',
        action_type: ActionType.FOLLOW_UP,
        title: 'Follow up with Amazon',
        payload: {
          company: 'Amazon',
          days_since_application: 8,
        },
        why_now: 'Been 8 days since application',
      },
    ];
    
    const explanation = explainDailyPlan(tasks);
    
    expect(explanation).toContain('2 Tasks');
    expect(explanation).toContain('Google');
    expect(explanation).toContain('Amazon');
  });

  test('explainDailyPlan handles empty task list', () => {
    const explanation = explainDailyPlan([]);
    expect(explanation).toContain('No tasks');
  });
});

// ==================== Job Explanation Tests ====================

describe('Job Explainer', () => {
  const mockRankedJob: RankedJob = {
    job: {
      job_id: 'job-1',
      canonical_id: 'google-senior-engineer',
      job_title: 'Senior Software Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      raw_text: 'We are looking for...',
      requirements: {
        required_skills: [],
        preferred_skills: [],
        required_tools: [],
        preferred_tools: [],
        seniority_expected: SeniorityLevel.SENIOR,
        domain_keywords: [],
        extraction_confidence: 0.9,
        extraction_method: 'llm',
      },
      responsibilities: [],
      metadata: {
        parse_quality: 'high',
        parse_confidence: 90,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    fit_score: 78,
    fit_analysis: null,
    category: 'target',
    category_reasoning: 'Strong match based on skills and experience',
    rank: 1,
    priority_score: 85,
    score_breakdown: {
      fit_component: 78,
      preference_component: 80,
      freshness_component: 90,
      category_component: 85,
      urgency_component: 70,
      penalties: [],
      raw_score: 85,
      final_score: 85,
    },
    flags: {
      dream_job: false,
      applied: false,
      rejected: false,
      expired: false,
      new: true,
      scam_risk: false,
    },
    should_apply: true,
    application_priority: 'high',
    quick_insights: [
      'Strong skill match',
      'Good salary range',
      'Remote-friendly',
    ],
    green_flags: ['Great company culture', 'Growth opportunities'],
    red_flags: [],
    career_capital: {
      score: 85,
      brand_score: 95,
      skill_growth_score: 80,
      network_score: 90,
      comp_score: 85,
      breakdown: {
        brand: 'Top-tier company',
        skill_growth: 'Good learning opportunities',
        network: 'Strong alumni network',
        comp: 'Competitive compensation',
      },
    },
    scam_detection: {
      risk_level: 'none',
      red_flags: [],
      red_flag_count: 0,
    },
  };

  test('explainRankedJob generates target job explanation', () => {
    const explanation = explainRankedJob(mockRankedJob);
    
    expect(explanation).toContain('Target');
    expect(explanation).toContain('Google');
    expect(explanation).toContain('78');
  });

  test('explainRankedJob includes green flags', () => {
    const explanation = explainRankedJob(mockRankedJob);
    
    expect(explanation).toContain('Good Fit');
    expect(explanation).toContain('Great company culture');
  });

  test('explainJobList summarizes job categories', () => {
    const jobs: RankedJob[] = [
      mockRankedJob,
      { ...mockRankedJob, category: 'reach' as JobCategory, fit_score: 65 },
      { ...mockRankedJob, category: 'safety' as JobCategory, fit_score: 88 },
    ];
    
    const explanation = explainJobList(jobs);
    
    expect(explanation).toContain('Target');
    expect(explanation).toContain('Reach');
    expect(explanation).toContain('Safety');
  });
});

// ==================== Score Explanation Tests ====================

describe('Score Explainer', () => {
  const mockEvaluation: EvaluationResult = {
    resume_score: 72,
    overall_score: 72,
    level: 'Solid',
    content_quality_score: 70,
    ats_compatibility_score: 75,
    format_quality_score: 78,
    impact_score: 68,
    dimensions: {
      skill_capital: { score: 75, breakdown: {}, issues: [] },
      execution_impact: { score: 68, breakdown: {}, issues: ['no_metrics'] },
      learning_adaptivity: { score: 70, breakdown: {}, issues: [] },
      signal_quality: { score: 78, breakdown: {}, issues: [] },
    },
    weaknesses: ['no_metrics', 'weak_verbs'],
    extracted: {
      skills: ['JavaScript', 'TypeScript'],
      tools: ['React', 'Node.js'],
      titles: ['Software Engineer'],
      companies: ['TechCorp'],
    },
    identified_gaps: {
      missing_skills: false,
      missing_metrics: true,
      weak_action_verbs: true,
      generic_descriptions: false,
      poor_formatting: false,
      no_education: false,
      spelling_errors: false,
    },
    feedback: {
      strengths: ['Good technical skills', 'Clear formatting'],
      critical_gaps: ['Add quantified metrics', 'Use stronger action verbs'],
      quick_wins: [
        { action: 'Add metrics to bullets', estimated_impact: '+5 points', effort: '30 min', priority: 1 },
      ],
      recommendations: ['Focus on quantifying achievements'],
    },
    flags: {
      no_skills_listed: false,
      possible_spam: false,
      no_experience: false,
      generic_descriptions: false,
      no_metrics: true,
      stagnant: false,
      parsing_failed: false,
      too_short: false,
    },
    summary: 'Solid resume with room for improvement in metrics',
    meta: {
      processing_time_ms: 1500,
      timestamp: new Date().toISOString(),
      version: '2.1',
      parse_quality: 'high',
    },
  };

  test('explainEvaluation generates comprehensive explanation', () => {
    const explanation = explainEvaluation(mockEvaluation);
    
    expect(explanation).toContain('72');
    expect(explanation).toContain('Solid');
    expect(explanation).toContain('Score Breakdown');
  });

  test('explainEvaluation includes strengths and gaps', () => {
    const explanation = explainEvaluation(mockEvaluation);
    
    expect(explanation).toContain('Strengths');
    expect(explanation).toContain('Improve');
  });

  test('explainWeakBullet explains bullet issues', () => {
    const weakBullet: WeakBullet = {
      bullet: 'Worked on various projects and helped the team',
      issues: ['weak_verb', 'vague'],
      location: {
        company: 'TechCorp',
        title: 'Software Engineer',
        index: 0,
      },
    };
    
    const explanation = explainWeakBullet(weakBullet);
    
    expect(explanation).toContain('Worked on various projects');
    expect(explanation).toContain('TechCorp');
    expect(explanation).toContain('weak');
  });

  test('explainWeakBullets summarizes multiple bullets', () => {
    const bullets: WeakBullet[] = [
      {
        bullet: 'Worked on projects',
        issues: ['weak_verb', 'vague'],
        location: { company: 'A', title: 'Engineer', index: 0 },
      },
      {
        bullet: 'Helped with tasks',
        issues: ['weak_verb', 'no_metric'],
        location: { company: 'B', title: 'Developer', index: 1 },
      },
    ];
    
    const explanation = explainWeakBullets(bullets);
    
    expect(explanation).toContain('2 Bullets');
  });

  test('explainScoreChange explains improvement', () => {
    const explanation = explainScoreChange(65, 78);
    
    expect(explanation).toContain('Improved');
    expect(explanation).toContain('65');
    expect(explanation).toContain('78');
    expect(explanation).toContain('+13');
  });

  test('explainScoreChange handles decrease', () => {
    const explanation = explainScoreChange(78, 72);
    
    expect(explanation).toContain('-6');
    expect(explanation).toContain('review');
  });
});
