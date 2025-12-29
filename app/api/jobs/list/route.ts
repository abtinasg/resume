import { NextRequest, NextResponse } from 'next/server';
import { Layer6 } from '@/lib/layers';
import type { JobFilters, ParsedJob } from '@/lib/layers/layer6/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const user_id = searchParams.get('user_id');
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Parse query parameters for filtering
    const category = searchParams.get('category') as JobFilters['category'];
    const min_fit_score = searchParams.get('min_fit_score');
    const location = searchParams.get('location');
    const only_should_apply = searchParams.get('only_should_apply');
    const status = searchParams.get('status') as JobFilters['status'];
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Validate category if provided
    if (category && !['reach', 'target', 'safety', 'avoid'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: reach, target, safety, avoid' },
        { status: 400 }
      );
    }

    // Build filters object
    const filters: JobFilters = {};
    if (category) filters.category = category;
    if (min_fit_score) {
      const score = parseInt(min_fit_score, 10);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'min_fit_score must be a number between 0 and 100' },
          { status: 400 }
        );
      }
      filters.min_fit_score = score;
    }
    if (location) filters.location = location;
    if (only_should_apply === 'true') filters.only_should_apply = true;
    if (status) {
      if (!['discovered', 'saved', 'applied', 'archived'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: discovered, saved, applied, archived' },
          { status: 400 }
        );
      }
      filters.status = status;
    }

    // For MVP, use mock jobs data since we don't have database integration
    // In production, this would fetch from Layer 4 / database
    const mockJobs: ParsedJob[] = [];
    
    // Use mock resume text for ranking
    const resumeText = 'Software engineer with experience in JavaScript and Python.';

    // Call Layer 6 to get ranked jobs
    const result = await Layer6.getRankedJobs(
      mockJobs,
      resumeText,
      {}, // user preferences
      filters,
      [], // applied job IDs
      []  // rejected job IDs
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error?.message || 'Failed to get ranked jobs' 
        },
        { status: 400 }
      );
    }

    const jobList = result.data;

    // Apply pagination
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    // Paginate the results (apply to all categories)
    const paginateJobs = (jobs: typeof jobList.jobs) => ({
      reach: jobs.reach.slice(offsetNum, offsetNum + limitNum),
      target: jobs.target.slice(offsetNum, offsetNum + limitNum),
      safety: jobs.safety.slice(offsetNum, offsetNum + limitNum),
      avoid: jobs.avoid.slice(offsetNum, offsetNum + limitNum),
    });

    return NextResponse.json({
      success: true,
      jobs: paginateJobs(jobList.jobs),
      top_recommendations: jobList.top_recommendations.slice(0, 5),
      summary: jobList.summary,
      insights: jobList.insights,
    });
  } catch (error) {
    console.error('Job list error:', error);
    return NextResponse.json(
      { error: 'Failed to get job list' },
      { status: 500 }
    );
  }
}
