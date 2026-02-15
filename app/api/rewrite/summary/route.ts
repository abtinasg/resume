import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { rewriteSummary } from '@/lib/layers/layer3';
import type { SummaryRewriteRequest } from '@/lib/layers/layer3';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentSummary, targetRole, experience } = body;

    if (!currentSummary) {
      return NextResponse.json(
        { success: false, error: 'currentSummary is required' },
        { status: 400 }
      );
    }

    // Build Layer 3 evidence-anchored rewrite request
    const rewriteRequest: SummaryRewriteRequest = {
      type: 'summary',
      summary: currentSummary,
      target_role: targetRole,
      layer1: experience?.skills || experience?.tools
        ? {
            extracted: {
              skills: experience.skills,
              tools: experience.tools,
              titles: experience.titles,
            },
          }
        : undefined,
    };

    const result = await rewriteSummary(rewriteRequest);

    return NextResponse.json({
      success: true,
      data: {
        original: result.original,
        improved: result.improved,
        reasoning: result.reasoning,
        changes: result.changes,
        validation: result.validation,
        evidence_map: result.evidence_map,
        confidence: result.confidence,
        estimated_score_gain: result.estimated_score_gain,
      },
    });
  } catch (error) {
    console.error('Summary rewrite error:', error);

    const errorMessage = (error as Error).message;

    if (
      errorMessage.includes('Summary') ||
      errorMessage.includes('empty') ||
      errorMessage.includes('too long') ||
      errorMessage.includes('INVALID_INPUT')
    ) {
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
