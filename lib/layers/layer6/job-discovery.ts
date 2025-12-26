/**
 * Layer 6 - Job Discovery & Matching Module
 * Main Facade
 *
 * Provides the primary public API for job discovery and matching.
 */

import type {
  JobPasteRequest,
  ParsedJob,
  RankedJob,
  JobListResult,
  JobComparisonResult,
  JobFilters,
  UserPreferences,
  Layer6ParseRankOutput,
  Layer6JobListOutput,
  Layer6ComparisonOutput,
} from './types';
import { JobPasteRequestSchema } from './types';
import { parseJobDescription, parseJobDescriptionWithFallback, checkDuplicate } from './parsing';
import { rankJob, rankJobs, generateJobListResult } from './ranking';
import { compareJobs } from './comparison';
import { JobDiscoveryError, JobDiscoveryErrorCode, logError } from './errors';
import { getPerformanceTargets } from './config';

// ==================== Validation ====================

/**
 * Validate job paste request
 */
function validateJobPasteRequest(request: JobPasteRequest): JobPasteRequest {
  const result = JobPasteRequestSchema.safeParse(request);

  if (!result.success) {
    throw new JobDiscoveryError(JobDiscoveryErrorCode.VALIDATION_ERROR, {
      errors: result.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  return result.data;
}

// ==================== Performance Logging ====================

/**
 * Log performance metrics
 */
function logPerformance(operation: string, actualMs: number, targetMs: number): void {
  const status = actualMs <= targetMs ? '✓' : '⚠️';
  console.log(`[Layer6][Performance] ${status} ${operation}: ${actualMs}ms (target: ${targetMs}ms)`);
}

// ==================== Main API ====================

/**
 * Parse and rank a single job
 *
 * @param request - Job paste request with JD text and metadata
 * @param resumeText - Resume text to evaluate against
 * @param userPreferences - User preferences for matching
 * @returns Ranked job with fit analysis and categorization
 *
 * @example
 * ```typescript
 * const result = await parseAndRankJob({
 *   user_id: 'user_123',
 *   resume_version_id: 'resume_v1',
 *   job_description: jobDescriptionText,
 *   metadata: {
 *     job_title: 'Senior Software Engineer',
 *     company: 'Google',
 *   },
 * }, resumeText, userPreferences);
 *
 * console.log(`Fit: ${result.fit_score}/100`);
 * console.log(`Category: ${result.category}`);
 * console.log(`Should apply: ${result.should_apply}`);
 * ```
 */
export async function parseAndRankJob(
  request: JobPasteRequest,
  resumeText: string,
  userPreferences: UserPreferences = {},
  existingCanonicalIds: string[] = []
): Promise<Layer6ParseRankOutput> {
  const startTime = Date.now();
  const targets = getPerformanceTargets();

  try {
    // Validate request
    const validatedRequest = validateJobPasteRequest(request);

    // Parse job description
    const parsedJob = parseJobDescriptionWithFallback(validatedRequest);

    // Check for duplicates
    const { isDuplicate, existingId } = checkDuplicate(
      parsedJob.canonical_id,
      existingCanonicalIds
    );

    if (isDuplicate) {
      throw new JobDiscoveryError(JobDiscoveryErrorCode.DUPLICATE_JOB, {
        existingJobId: existingId,
        canonicalId: parsedJob.canonical_id,
      });
    }

    // Rank the job
    const rankedJob = await rankJob(parsedJob, resumeText, userPreferences);

    // Log performance
    const processingTime = Date.now() - startTime;
    logPerformance('parseAndRankJob', processingTime, targets.parse_single_job_ms);

    return {
      success: true,
      data: rankedJob,
      metadata: {
        layerId: 6,
        layerName: 'Job Discovery',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    if (error instanceof JobDiscoveryError) {
      logError(error, 'parseAndRankJob');
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        metadata: {
          layerId: 6,
          layerName: 'Job Discovery',
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Wrap unexpected errors
    const wrappedError = new JobDiscoveryError(
      JobDiscoveryErrorCode.INTERNAL_ERROR,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
    logError(wrappedError, 'parseAndRankJob');

    return {
      success: false,
      error: {
        code: wrappedError.code,
        message: wrappedError.message,
        details: wrappedError.details,
      },
      metadata: {
        layerId: 6,
        layerName: 'Job Discovery',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Get ranked job list with categories
 *
 * @param jobs - Array of parsed jobs to rank
 * @param resumeText - Resume text to evaluate against
 * @param userPreferences - User preferences for matching
 * @param filters - Optional filters to apply
 * @returns Categorized and ranked job list
 *
 * @example
 * ```typescript
 * const result = await getRankedJobs(
 *   parsedJobs,
 *   resumeText,
 *   { work_arrangement: ['remote'] },
 *   { category: 'target', only_should_apply: true }
 * );
 *
 * console.log(`Target jobs: ${result.jobs.target.length}`);
 * console.log(`Top recommendation: ${result.top_recommendations[0]?.job.job_title}`);
 * ```
 */
export async function getRankedJobs(
  jobs: ParsedJob[],
  resumeText: string,
  userPreferences: UserPreferences = {},
  filters: JobFilters = {},
  appliedJobIds: string[] = [],
  rejectedJobIds: string[] = []
): Promise<Layer6JobListOutput> {
  const startTime = Date.now();
  const targets = getPerformanceTargets();

  try {
    // Generate job list result
    let result = await generateJobListResult(
      jobs,
      resumeText,
      userPreferences,
      appliedJobIds,
      rejectedJobIds
    );

    // Apply filters
    if (filters.category) {
      // Filter to specific category
      const filteredJobs = result.jobs[filters.category];
      result = {
        ...result,
        jobs: {
          reach: filters.category === 'reach' ? filteredJobs : [],
          target: filters.category === 'target' ? filteredJobs : [],
          safety: filters.category === 'safety' ? filteredJobs : [],
          avoid: filters.category === 'avoid' ? filteredJobs : [],
        },
      };
    }

    if (filters.min_fit_score !== undefined) {
      const filterByFit = (jobList: RankedJob[]) =>
        jobList.filter(j => j.fit_score >= (filters.min_fit_score || 0));
      
      result.jobs = {
        reach: filterByFit(result.jobs.reach),
        target: filterByFit(result.jobs.target),
        safety: filterByFit(result.jobs.safety),
        avoid: filterByFit(result.jobs.avoid),
      };
    }

    if (filters.only_should_apply) {
      const filterShouldApply = (jobList: RankedJob[]) =>
        jobList.filter(j => j.should_apply);
      
      result.jobs = {
        reach: filterShouldApply(result.jobs.reach),
        target: filterShouldApply(result.jobs.target),
        safety: filterShouldApply(result.jobs.safety),
        avoid: filterShouldApply(result.jobs.avoid),
      };
    }

    if (!filters.include_expired) {
      const filterExpired = (jobList: RankedJob[]) =>
        jobList.filter(j => !j.flags.expired);
      
      result.jobs = {
        reach: filterExpired(result.jobs.reach),
        target: filterExpired(result.jobs.target),
        safety: filterExpired(result.jobs.safety),
        avoid: filterExpired(result.jobs.avoid),
      };
    }

    if (!filters.include_rejected) {
      const filterRejected = (jobList: RankedJob[]) =>
        jobList.filter(j => !j.flags.rejected);
      
      result.jobs = {
        reach: filterRejected(result.jobs.reach),
        target: filterRejected(result.jobs.target),
        safety: filterRejected(result.jobs.safety),
        avoid: filterRejected(result.jobs.avoid),
      };
    }

    // Log performance
    const processingTime = Date.now() - startTime;
    const expectedTime = Math.ceil(jobs.length / 10) * targets.rank_10_jobs_ms;
    logPerformance('getRankedJobs', processingTime, expectedTime);

    return {
      success: true,
      data: result,
      metadata: {
        layerId: 6,
        layerName: 'Job Discovery',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    if (error instanceof JobDiscoveryError) {
      logError(error, 'getRankedJobs');
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        metadata: {
          layerId: 6,
          layerName: 'Job Discovery',
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const wrappedError = new JobDiscoveryError(
      JobDiscoveryErrorCode.RANKING_FAILED,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
    logError(wrappedError, 'getRankedJobs');

    return {
      success: false,
      error: {
        code: wrappedError.code,
        message: wrappedError.message,
        details: wrappedError.details,
      },
      metadata: {
        layerId: 6,
        layerName: 'Job Discovery',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Compare multiple jobs side-by-side
 *
 * @param rankedJobs - Array of ranked jobs to compare (2-5 jobs)
 * @param userSkills - User's skills for coverage calculation
 * @returns Comparison result with insights
 *
 * @example
 * ```typescript
 * const comparison = await compareJobsSideBySide(
 *   [rankedJob1, rankedJob2, rankedJob3],
 *   userSkills
 * );
 *
 * console.log(`Best fit: ${comparison.best_fit}`);
 * console.log(`Easiest to get: ${comparison.easiest_to_get}`);
 * console.log(`Common requirements: ${comparison.comparison.skills_overlap.common_requirements}`);
 * ```
 */
export async function compareJobsSideBySide(
  rankedJobs: RankedJob[],
  userSkills: string[] = []
): Promise<Layer6ComparisonOutput> {
  const startTime = Date.now();
  const targets = getPerformanceTargets();

  try {
    if (rankedJobs.length < 2) {
      throw new JobDiscoveryError(JobDiscoveryErrorCode.COMPARISON_FAILED, {
        reason: 'Need at least 2 jobs to compare',
        providedCount: rankedJobs.length,
      });
    }

    const result = compareJobs(rankedJobs, userSkills);

    // Log performance
    const processingTime = Date.now() - startTime;
    logPerformance('compareJobs', processingTime, targets.compare_5_jobs_ms);

    return {
      success: true,
      data: result,
      metadata: {
        layerId: 6,
        layerName: 'Job Discovery',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    if (error instanceof JobDiscoveryError) {
      logError(error, 'compareJobs');
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        metadata: {
          layerId: 6,
          layerName: 'Job Discovery',
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const wrappedError = new JobDiscoveryError(
      JobDiscoveryErrorCode.COMPARISON_FAILED,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
    logError(wrappedError, 'compareJobs');

    return {
      success: false,
      error: {
        code: wrappedError.code,
        message: wrappedError.message,
        details: wrappedError.details,
      },
      metadata: {
        layerId: 6,
        layerName: 'Job Discovery',
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// ==================== Convenience Functions ====================

/**
 * Quick parse job (returns just parsed job without ranking)
 */
export function quickParseJob(request: JobPasteRequest): ParsedJob {
  const validatedRequest = validateJobPasteRequest(request);
  return parseJobDescriptionWithFallback(validatedRequest);
}

/**
 * Parse job description text only (without full request)
 */
export function parseJobText(
  jobDescription: string,
  metadata?: JobPasteRequest['metadata']
): ParsedJob {
  return parseJobDescriptionWithFallback({
    user_id: 'anonymous',
    resume_version_id: 'none',
    job_description: jobDescription,
    metadata,
  });
}
