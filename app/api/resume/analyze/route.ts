import { NextRequest, NextResponse } from 'next/server';
import { Layer1, Layer2 } from '@/lib/layers';

export async function POST(request: NextRequest) {
  try {
    const { resumeContent, userId } = await request.json();
    
    if (!resumeContent || !userId) {
      return NextResponse.json(
        { error: 'Missing resumeContent or userId' },
        { status: 400 }
      );
    }
    
    // Layer 1: Evaluate
    const evaluation = await Layer1.evaluate({
      resume: { 
        content: resumeContent,
        filename: 'upload.txt',
        mimeType: 'text/plain',
      },
    });
    
    // Build Layer1Evaluation shape expected by Layer2
    const layer1Evaluation = {
      resume_score: evaluation.resume_score,
      content_quality_score: evaluation.content_quality_score,
      ats_compatibility_score: evaluation.ats_compatibility_score,
      weaknesses: evaluation.weaknesses,
      identified_gaps: {
        weak_bullets: evaluation.weak_bullets?.length ?? 0,
        missing_skills: evaluation.identified_gaps.missing_skills ? ['skills'] : [],
        vague_experience: evaluation.identified_gaps.generic_descriptions,
      },
      extracted: {
        skills: evaluation.extracted.skills,
        tools: evaluation.extracted.tools,
        titles: evaluation.extracted.titles,
        industries: evaluation.extracted.industries,
      },
    };
    
    // Mock state (in production, get from Layer 4)
    const mockState = {
      pipeline_state: {
        total_applications: 0,
        applications_last_7_days: 0,
        applications_last_30_days: 0,
        interview_requests: 0,
        interview_rate: 0,
        offers: 0,
        rejections: 0,
      },
      user_profile: { target_roles: ['Software Engineer'] },
    };
    
    // Layer 2: Strategy
    const analysis = await Layer2.analyzeStrategy({
      layer1_evaluation: layer1Evaluation,
      layer4_state: mockState,
    });
    
    return NextResponse.json({
      success: true,
      evaluation: {
        resume_score: evaluation.resume_score,
        level: evaluation.level,
        dimensions: evaluation.dimensions,
        weak_bullets: evaluation.weak_bullets?.slice(0, 5),
        strengths: evaluation.feedback?.strengths?.slice(0, 3),
      },
      strategy: {
        recommended_mode: analysis.recommended_mode,
        overall_fit_score: analysis.overall_fit_score,
        priority_actions: analysis.priority_actions?.slice(0, 5),
        key_insights: analysis.key_insights?.slice(0, 3),
      },
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}
