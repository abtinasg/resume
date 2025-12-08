import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { scoringService } from '@/lib/services/scoring-service';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request
    const body = await request.json();
    const { resumeId, targetRole } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, error: 'resumeId is required' },
        { status: 400 }
      );
    }

    // 3. Score resume
    const result = await scoringService.scoreAndPersistResume({
      userId: session.user.id,
      resumeId,
      targetRole: targetRole || undefined,
    });

    // 4. Format response
    const keywordGap = result.scoring.atsDetailedReport?.keywordGapAnalysis;

    return NextResponse.json({
      success: true,
      data: {
        resumeId: result.resumeId,
        overallScore: result.scoring.overallScore,
        grade: result.scoring.grade,
        atsPassProbability: result.scoring.atsPassProbability,
        componentScores: {
          contentQuality: result.scoring.componentScores.contentQuality.score,
          atsCompatibility: result.scoring.componentScores.atsCompatibility.score,
          formatStructure: result.scoring.componentScores.formatStructure.score,
          impactMetrics: result.scoring.componentScores.impactMetrics.score,
        },
        improvementAreas: result.scoring.improvementRoadmap?.toReach80
          ?.slice(0, 5)
          ?.map(a => ({
            action: a.action,
            impact: a.pointsGain,
            timeEstimate: a.time,
            priority: a.priority || 'medium',
          })) ?? [],
        keywordGaps: {
          missing: keywordGap?.mustHave?.missing?.slice(0, 10) ?? [],
          found: keywordGap?.mustHave?.foundKeywords?.slice(0, 10) ?? [],
        },
      },
    });

  } catch (error) {
    console.error('Scoring error:', error);

    const errorMessage = (error as Error).message;

    // Return 400 for user errors
    if (
      errorMessage.includes('empty') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('Unauthorized')
    ) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    // Return 500 for unexpected errors
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
