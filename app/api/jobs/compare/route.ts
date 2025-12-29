import { NextRequest, NextResponse } from 'next/server';
import { Layer6 } from '@/lib/layers';
import type { RankedJob, ParsedJob } from '@/lib/layers/layer6/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_ids, user_id, jobs } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // For comparison, we need either job_ids (to fetch from DB) or jobs array directly
    // In MVP, we accept jobs array directly since we don't have DB integration
    if (!jobs || !Array.isArray(jobs)) {
      if (!job_ids || !Array.isArray(job_ids)) {
        return NextResponse.json(
          { error: 'Missing jobs array or job_ids for comparison' },
          { status: 400 }
        );
      }
    }

    // Validate number of jobs (2-5)
    const jobsToCompare = jobs || [];
    if (jobsToCompare.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 jobs are required for comparison' },
        { status: 400 }
      );
    }

    if (jobsToCompare.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 jobs allowed for comparison' },
        { status: 400 }
      );
    }

    // Convert jobs to RankedJob format if needed
    // For MVP, we assume jobs are already in RankedJob format
    const rankedJobs: RankedJob[] = jobsToCompare;

    // Extract user skills from the request or use defaults
    const userSkills = body.user_skills || [];

    // Call Layer 6 to compare jobs
    const result = await Layer6.compareJobsSideBySide(rankedJobs, userSkills);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error?.message || 'Failed to compare jobs' 
        },
        { status: 400 }
      );
    }

    const comparison = result.data;

    return NextResponse.json({
      success: true,
      comparison: {
        jobs: comparison.jobs.map(job => ({
          job_id: job.job.job_id,
          job_title: job.job.job_title,
          company: job.job.company,
          location: job.job.location,
          fit_score: job.fit_score,
          category: job.category,
          should_apply: job.should_apply,
          career_capital: job.career_capital,
        })),
        comparison: comparison.comparison,
        best_fit: comparison.best_fit,
        easiest_to_get: comparison.easiest_to_get,
        best_for_growth: comparison.best_for_growth,
        best_for_brand: comparison.best_for_brand,
        best_for_compensation: comparison.best_for_compensation,
        insights: comparison.insights,
      },
    });
  } catch (error) {
    console.error('Job comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to compare jobs' },
      { status: 500 }
    );
  }
}
