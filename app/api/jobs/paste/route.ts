import { NextRequest, NextResponse } from 'next/server';
import { Layer6 } from '@/lib/layers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_description, metadata, user_id, resume_version_id, resume_text } = body;

    if (!job_description) {
      return NextResponse.json(
        { error: 'Missing job_description' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Validate job description length
    if (job_description.length < 50) {
      return NextResponse.json(
        { error: 'Job description must be at least 50 characters' },
        { status: 400 }
      );
    }

    if (job_description.length > 50000) {
      return NextResponse.json(
        { error: 'Job description must be at most 50000 characters' },
        { status: 400 }
      );
    }

    // Build the job paste request
    const jobPasteRequest = {
      user_id,
      resume_version_id: resume_version_id || 'default',
      job_description,
      metadata: metadata || {},
    };

    // Use provided resume text or mock resume for ranking
    const resumeContent = resume_text || 'Software engineer with experience in JavaScript and Python.';

    // Call Layer 6 to parse and rank the job
    const result = await Layer6.parseAndRankJob(
      jobPasteRequest,
      resumeContent,
      {} // user preferences
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error?.message || 'Failed to parse and rank job' 
        },
        { status: 400 }
      );
    }

    const rankedJob = result.data;

    return NextResponse.json({
      success: true,
      job: {
        job_id: rankedJob.job.job_id,
        job_title: rankedJob.job.job_title,
        company: rankedJob.job.company,
        location: rankedJob.job.location,
        fit_score: rankedJob.fit_score,
        category: rankedJob.category,
        category_reasoning: rankedJob.category_reasoning,
        should_apply: rankedJob.should_apply,
        application_priority: rankedJob.application_priority,
        score_breakdown: rankedJob.score_breakdown,
        flags: rankedJob.flags,
        quick_insights: rankedJob.quick_insights,
        career_capital: rankedJob.career_capital,
        scam_detection: rankedJob.scam_detection,
        requirements: rankedJob.job.requirements,
        responsibilities: rankedJob.job.responsibilities,
        work_arrangement: rankedJob.job.work_arrangement,
        salary_range: rankedJob.job.salary_range,
        metadata: rankedJob.job.metadata,
      },
    });
  } catch (error) {
    console.error('Job paste error:', error);
    return NextResponse.json(
      { error: 'Failed to process job description' },
      { status: 500 }
    );
  }
}
