import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { rewriteBullet } from '@/lib/layers/layer3';
import type { BulletRewriteRequest } from '@/lib/layers/layer3';

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
    const { bullet, targetRole, context } = body;

    if (!bullet) {
      return NextResponse.json(
        { success: false, error: 'bullet is required' },
        { status: 400 }
      );
    }

    // Build Layer 3 evidence-anchored rewrite request
    const rewriteRequest: BulletRewriteRequest = {
      type: 'bullet',
      bullet,
      target_role: targetRole,
      context: context?.section_type
        ? {
            section_type: context.section_type,
            role: context.role,
            company: context.company,
            index: context.index,
          }
        : undefined,
      layer1: context?.skills || context?.tools
        ? {
            extracted: {
              skills: context.skills,
              tools: context.tools,
            },
          }
        : undefined,
    };

    const result = await rewriteBullet(rewriteRequest);

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
    console.error('Bullet rewrite error:', error);

    const errorMessage = (error as Error).message;

    if (
      errorMessage.includes('empty') ||
      errorMessage.includes('too long') ||
      errorMessage.includes('Bullet') ||
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
