import { NextRequest, NextResponse } from 'next/server';
import { Layer2, Layer5 } from '@/lib/layers';
import { 
  createMockLayer4State,
  createMockLayer1Evaluation,
  createMockLayer4StateForLayer2
} from '../_shared/mockData';

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
    const mockState = createMockLayer4State();
    
    // Mock Layer1 evaluation for Layer2
    const mockLayer1Evaluation = createMockLayer1Evaluation();
    
    // Mock Layer4 state for Layer2
    const mockLayer4State = createMockLayer4StateForLayer2(mockState);
    
    // Get strategy analysis
    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: mockLayer1Evaluation,
      layer4_state: mockLayer4State,
    });
    
    // Generate weekly plan
    const weeklyPlan = Layer5.orchestrateWeeklyPlan(mockState, analysis);
    
    return NextResponse.json({
      success: true,
      plan: {
        plan_id: weeklyPlan.plan_id,
        week_start: weeklyPlan.week_start,
        week_end: weeklyPlan.week_end,
        strategy_mode: weeklyPlan.strategy_mode,
        target_applications: weeklyPlan.target_applications,
        focus_mix: weeklyPlan.focus_mix,
        tasks: weeklyPlan.task_pool.slice(0, 15),
      },
    });
  } catch (error) {
    console.error('Weekly plan error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
