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
