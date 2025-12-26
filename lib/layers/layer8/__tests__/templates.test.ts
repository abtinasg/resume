/**
 * Layer 8 - AI Coach Interface
 * Templates Tests
 *
 * Tests for template functions and message generation.
 */

import { describe, test, expect } from '@jest/globals';
import { StrategyMode, ActionType, FocusArea } from '../../shared/types';
import type { CoachContext, StrategyExplanationContext, ActionExplanationContext, ProgressContext } from '../types';

// Import templates
import {
  generateWelcome,
  generateReturningGreeting,
  generateDailyCheckIn,
  explainImproveResumeFirst,
  explainApplyMode,
  explainRethinkTargets,
  explainStrategyDecision,
  explainAction,
  weeklyProgressSummary,
  celebrateFirstInterview,
  encourageAfterRejection,
  motivateToApply,
  explainHowItWorks,
  explainStrategyModes,
} from '../templates';

// ==================== Greeting Templates ====================

describe('Greeting Templates', () => {
  test('generateWelcome returns welcome message', () => {
    const context: CoachContext = {};
    const message = generateWelcome(context);
    
    expect(message).toContain('Welcome');
    expect(message).toContain('career coach');
  });

  test('generateWelcome includes user name when provided', () => {
    const context: CoachContext = { userName: 'Sarah' };
    const message = generateWelcome(context);
    
    expect(message).toContain('Sarah');
  });

  test('generateReturningGreeting includes strategy mode', () => {
    const context: CoachContext = {
      userName: 'John',
      strategyMode: StrategyMode.APPLY_MODE,
    };
    const message = generateReturningGreeting(context);
    
    expect(message).toContain('Welcome back');
    expect(message).toContain('John');
    expect(message).toContain('Application');
  });

  test('generateReturningGreeting includes resume score', () => {
    const context: CoachContext = {
      resumeScore: 78,
    };
    const message = generateReturningGreeting(context);
    
    expect(message).toContain('78');
    expect(message).toContain('100');
  });

  test('generateDailyCheckIn includes task count', () => {
    const context: CoachContext = {
      userName: 'Alice',
      dailyPlan: {
        plan_id: 'daily-1',
        date: '2024-01-15',
        tasks: [
          { task_id: '1', action_type: ActionType.APPLY_TO_JOB, title: 'Apply', description: '', execution: 'user_only' as const, payload: {}, priority: 80, estimated_minutes: 15, why_now: '' },
          { task_id: '2', action_type: ActionType.FOLLOW_UP, title: 'Follow up', description: '', execution: 'user_only' as const, payload: {}, priority: 60, estimated_minutes: 10, why_now: '' },
        ],
        focus_area: FocusArea.APPLICATIONS,
        total_estimated_minutes: 25,
        input_state_version: 1,
        generated_at: new Date().toISOString(),
      },
    };
    const message = generateDailyCheckIn(context);
    
    expect(message).toContain('2 tasks');
    expect(message).toContain('Alice');
  });
});

// ==================== Strategy Explanation Templates ====================

describe('Strategy Explanation Templates', () => {
  test('explainImproveResumeFirst explains low score', () => {
    const context: StrategyExplanationContext = {
      mode: StrategyMode.IMPROVE_RESUME_FIRST,
      resumeScore: 65,
      scoreThreshold: 75,
    };
    const message = explainImproveResumeFirst(context);
    
    expect(message).toContain('65');
    expect(message).toContain('75');
    expect(message).toContain('Improve Resume First');
  });

  test('explainApplyMode explains ready state', () => {
    const context: StrategyExplanationContext = {
      mode: StrategyMode.APPLY_MODE,
      resumeScore: 82,
      scoreThreshold: 75,
    };
    const message = explainApplyMode(context);
    
    expect(message).toContain('82');
    expect(message).toContain('Apply Mode');
    expect(message).toContain('competitive');
  });

  test('explainRethinkTargets explains strategy review', () => {
    const context: StrategyExplanationContext = {
      mode: StrategyMode.RETHINK_TARGETS,
      resumeScore: 78,
      pipelineState: {
        total_applications: 25,
        interview_requests: 0,
        interview_rate: 0,
      },
    };
    const message = explainRethinkTargets(context);
    
    expect(message).toContain('Rethink');
    expect(message).toContain('25 applications');
  });

  test('explainStrategyDecision routes to correct template', () => {
    // Test IMPROVE_RESUME_FIRST
    const improveContext: StrategyExplanationContext = {
      mode: StrategyMode.IMPROVE_RESUME_FIRST,
      resumeScore: 60,
    };
    const improveMessage = explainStrategyDecision(improveContext);
    expect(improveMessage).toContain('Improve Resume First');

    // Test APPLY_MODE
    const applyContext: StrategyExplanationContext = {
      mode: StrategyMode.APPLY_MODE,
      resumeScore: 80,
    };
    const applyMessage = explainStrategyDecision(applyContext);
    expect(applyMessage).toContain('Apply Mode');

    // Test RETHINK_TARGETS
    const rethinkContext: StrategyExplanationContext = {
      mode: StrategyMode.RETHINK_TARGETS,
      resumeScore: 75,
    };
    const rethinkMessage = explainStrategyDecision(rethinkContext);
    expect(rethinkMessage).toContain('Rethink');
  });
});

// ==================== Action Explanation Templates ====================

describe('Action Explanation Templates', () => {
  test('explainAction handles improve_resume action', () => {
    const context: ActionExplanationContext = {
      actionType: 'improve_resume',
      title: 'Improve bullet point',
      whyNow: 'This bullet lacks quantified metrics',
      payload: {
        issues: ['no_metric', 'weak_verb'],
      },
    };
    const message = explainAction(context);
    
    expect(message).toContain('Improve');
    expect(message).toContain('bullet');
  });

  test('explainAction handles apply_to_job action', () => {
    const context: ActionExplanationContext = {
      actionType: 'apply_to_job',
      title: 'Apply to Senior Engineer at TechCorp',
      whyNow: 'Strong skill match',
      payload: {
        job_title: 'Senior Engineer',
        company: 'TechCorp',
        match_score: 85,
      },
    };
    const message = explainAction(context);
    
    expect(message).toContain('Apply');
    expect(message).toContain('TechCorp');
    expect(message).toContain('85');
  });

  test('explainAction handles follow_up action', () => {
    const context: ActionExplanationContext = {
      actionType: 'follow_up',
      title: 'Follow up with Google',
      whyNow: '10 days since application',
      payload: {
        company: 'Google',
        days_since_application: 10,
        follow_up_count: 0,
      },
    };
    const message = explainAction(context);
    
    expect(message).toContain('Follow');
    expect(message).toContain('Google');
    expect(message).toContain('10');
  });
});

// ==================== Progress Update Templates ====================

describe('Progress Update Templates', () => {
  test('weeklyProgressSummary shows completion percentage', () => {
    const context: ProgressContext = {
      progressType: 'weekly',
      completionPercentage: 75,
      tasksCompleted: 6,
      totalTasks: 8,
      applicationsSubmitted: 5,
      applicationsTarget: 8,
    };
    const message = weeklyProgressSummary(context);
    
    expect(message).toContain('75%');
    expect(message).toContain('6');
    expect(message).toContain('8');
    expect(message).toContain('5');
  });

  test('weeklyProgressSummary shows encouragement at 100%', () => {
    const context: ProgressContext = {
      progressType: 'weekly',
      completionPercentage: 100,
    };
    const message = weeklyProgressSummary(context);
    
    expect(message).toContain('Excellent');
  });

  test('celebrateFirstInterview includes job details', () => {
    const context: CoachContext = {
      jobTitle: 'Senior Software Engineer',
      company: 'Google',
    };
    const message = celebrateFirstInterview(context);
    
    expect(message).toContain('Interview');
    expect(message).toContain('Senior Software Engineer');
    expect(message).toContain('Google');
    expect(message).toContain('Congratulations');
  });
});

// ==================== Encouragement Templates ====================

describe('Encouragement Templates', () => {
  test('encourageAfterRejection is empathetic', () => {
    const context: CoachContext = {
      company: 'TechCorp',
    };
    const message = encourageAfterRejection(context);
    
    expect(message).toContain('TechCorp');
    expect(message).toContain('tough');
    expect(message).toContain('normal');
  });

  test('motivateToApply encourages action', () => {
    const context: CoachContext = {
      weeklyTarget: 10,
      applicationsThisWeek: 3,
    };
    const message = motivateToApply(context);
    
    expect(message).toContain('Apply');
    expect(message).toContain('7'); // 10 - 3 = 7 remaining
  });
});

// ==================== Help Response Templates ====================

describe('Help Response Templates', () => {
  test('explainHowItWorks provides overview', () => {
    const message = explainHowItWorks();
    
    expect(message).toContain('career coach');
    expect(message).toContain('resume');
    expect(message).toContain('job');
  });

  test('explainStrategyModes explains all modes', () => {
    const message = explainStrategyModes();
    
    expect(message).toContain('Resume Improvement');
    expect(message).toContain('Apply');
    expect(message).toContain('Rethink');
  });
});
