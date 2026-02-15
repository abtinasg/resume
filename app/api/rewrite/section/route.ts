import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { rewriteSection } from '@/lib/layers/layer3';
import type { SectionRewriteRequest, SectionType } from '@/lib/layers/layer3';

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
    const { bullets, sectionTitle, targetRole, context } = body;

    if (!bullets || !Array.isArray(bullets)) {
      return NextResponse.json(
        { success: false, error: 'bullets array is required' },
        { status: 400 }
      );
    }

    if (!sectionTitle) {
      return NextResponse.json(
        { success: false, error: 'sectionTitle is required' },
        { status: 400 }
      );
    }

    // Map sectionTitle to SectionType
    const sectionTypeMap: Record<string, SectionType> = {
      experience: 'experience',
      summary: 'summary',
      skills: 'skills',
      headline: 'headline',
      projects: 'projects',
    };
    const sectionType = sectionTypeMap[sectionTitle.toLowerCase()] || 'experience';

    // Build Layer 3 evidence-anchored rewrite request
    const rewriteRequest: SectionRewriteRequest = {
      type: 'section',
      bullets,
      section_type: sectionType,
      target_role: targetRole,
      role: context?.role,
      company: context?.company,
      layer1: context?.skills || context?.tools
        ? {
            extracted: {
              skills: context.skills,
              tools: context.tools,
            },
          }
        : undefined,
    };

    const result = await rewriteSection(rewriteRequest);

    return NextResponse.json({
      success: true,
      data: {
        original_bullets: result.original_bullets,
        improved_bullets: result.improved_bullets,
        estimated_aggregate_gain: result.estimated_aggregate_gain,
        validation_summary: result.validation_summary,
        per_bullet_details: result.per_bullet_details,
        section_notes: result.section_notes,
        confidence: result.confidence,
      },
    });
  } catch (error) {
    console.error('Section rewrite error:', error);

    const errorMessage = (error as Error).message;

    if (
      errorMessage.includes('Section') ||
      errorMessage.includes('Maximum') ||
      errorMessage.includes('at least one') ||
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
