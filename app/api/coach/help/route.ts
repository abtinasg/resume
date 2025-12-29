import { NextRequest, NextResponse } from 'next/server';
import { Layer8 } from '@/lib/layers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    // Generate help message based on topic
    let helpMessage: string;
    let relatedTopics: string[] = [];

    switch (topic) {
      case 'overview':
        helpMessage = Layer8.explainHowItWorks();
        relatedTopics = ['strategy_modes', 'scoring', 'commands'];
        break;

      case 'strategy_modes':
        helpMessage = Layer8.explainStrategyModes();
        relatedTopics = ['overview', 'scoring'];
        break;

      case 'scoring':
        helpMessage = Layer8.explainScoring();
        relatedTopics = ['strategy_modes', 'job_matching'];
        break;

      case 'commands':
        helpMessage = Layer8.listAvailableCommands();
        relatedTopics = ['overview'];
        break;

      case 'job_matching':
        helpMessage = Layer8.explainJobMatching();
        relatedTopics = ['scoring', 'strategy_modes'];
        break;

      case 'resume_improvement':
        helpMessage = Layer8.explainResumeImprovementProcess();
        relatedTopics = ['scoring', 'strategy_modes'];
        break;

      case 'interview_rate':
        helpMessage = Layer8.explainInterviewRate();
        relatedTopics = ['scoring', 'strategy_modes'];
        break;

      case 'weekly_targets':
        helpMessage = Layer8.explainWeeklyTargets();
        relatedTopics = ['strategy_modes', 'overview'];
        break;

      default:
        // Return general help if no topic or unknown topic
        helpMessage = Layer8.explainHowItWorks();
        relatedTopics = ['strategy_modes', 'scoring', 'commands', 'job_matching'];
        break;
    }

    return NextResponse.json({
      success: true,
      help_message: helpMessage,
      format: 'markdown',
      related_topics: relatedTopics,
      topic: topic || 'general',
    });
  } catch (error) {
    console.error('Coach help error:', error);
    return NextResponse.json(
      { error: 'Failed to get help message' },
      { status: 500 }
    );
  }
}
