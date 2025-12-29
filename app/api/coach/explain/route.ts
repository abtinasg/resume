import { NextRequest, NextResponse } from 'next/server';
import { Layer8 } from '@/lib/layers';
import type { ExplanationType, Tone, CoachContext } from '@/lib/layers/layer8/types';

// Validation constants - these should match the ExplanationType and Tone types
const VALID_EXPLANATION_TYPES: ExplanationType[] = ['strategy', 'action', 'job_ranking', 'score', 'gap', 'plan', 'progress'];
const VALID_TONES: Tone[] = ['professional', 'empathetic', 'encouraging', 'direct'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { explanation_type, context_id, user_id, tone } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    if (!explanation_type) {
      return NextResponse.json(
        { error: 'Missing explanation_type' },
        { status: 400 }
      );
    }

    // Validate explanation type
    if (!VALID_EXPLANATION_TYPES.includes(explanation_type)) {
      return NextResponse.json(
        { 
          error: `Invalid explanation_type. Must be one of: ${VALID_EXPLANATION_TYPES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate tone if provided
    if (tone && !VALID_TONES.includes(tone)) {
      return NextResponse.json(
        { 
          error: `Invalid tone. Must be one of: ${VALID_TONES.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Build context from request body
    const context: CoachContext = {
      userName: body.user_name,
      strategyMode: body.strategy_mode,
      resumeScore: body.resume_score,
      targetRoles: body.target_roles,
      pipelineState: body.pipeline_state,
      strategyAnalysis: body.strategy_analysis,
      evaluation: body.evaluation,
      rankedJob: body.ranked_job,
      task: body.task,
      weakBullet: body.weak_bullet,
      weeklyPlan: body.weekly_plan,
      dailyPlan: body.daily_plan,
    };

    // Generate explanation
    const explanation = Layer8.explainDecision(
      explanation_type as ExplanationType,
      context,
      tone as Tone | undefined
    );

    return NextResponse.json({
      success: true,
      explanation,
      tone_used: tone || 'professional',
      format: 'markdown',
    });
  } catch (error) {
    console.error('Coach explain error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
