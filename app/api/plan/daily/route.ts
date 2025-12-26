import { NextRequest, NextResponse } from 'next/server';
import { Layer2, Layer5, SeniorityLevel } from '@/lib/layers';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }
    
    // Mock Layer4 state (in production, get from Layer 4)
    const mockState: Parameters<typeof Layer5.orchestrateWeeklyPlan>[0] = {
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
    
    // Mock Layer1 evaluation for Layer2
    const mockLayer1Evaluation = {
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
    
    // Mock Layer4 state for Layer2
    const mockLayer4State = {
      pipeline_state: mockState.pipeline_state,
      user_profile: {
        target_roles: mockState.user_profile.target_roles,
        target_seniority: mockState.user_profile.target_seniority,
        weekly_target: mockState.user_profile.weeklyAppTarget,
      },
    };
    
    // Get strategy analysis
    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: mockLayer1Evaluation,
      layer4_state: mockLayer4State,
    });
    
    const weeklyPlan = Layer5.orchestrateWeeklyPlan(mockState, analysis);
    const dailyPlan = Layer5.orchestrateDailyPlan(weeklyPlan, mockState);
    
    return NextResponse.json({
      success: true,
      plan: {
        date: dailyPlan.date,
        tasks: dailyPlan.tasks,
        total_time_minutes: dailyPlan.total_estimated_minutes,
        focus_area: dailyPlan.focus_area,
      },
    });
  } catch (error) {
    console.error('Daily plan error:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily plan' },
      { status: 500 }
    );
  }
}
