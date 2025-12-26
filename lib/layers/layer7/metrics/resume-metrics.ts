/**
 * Layer 7 - Learning Engine Foundation
 * Resume Metrics Calculator
 *
 * Track resume improvement over time by analyzing score changes
 * and rewrite events from Layer 4.
 */

import prisma from '@/lib/prisma';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { getDefaultLookbackDays } from '../config';
import type { ResumeMetrics, DateRange, PeriodOptions, ScoreHistoryEntry } from '../types';

// ==================== Helper Functions ====================

/**
 * Get date range from period options
 */
function getDateRange(options: PeriodOptions): DateRange {
  if (options.dateRange) {
    return options.dateRange;
  }

  const days = options.lookbackDays ?? getDefaultLookbackDays();
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  return { start, end };
}

/**
 * Validate user ID
 */
function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new AnalyticsError(AnalyticsErrorCode.INVALID_USER_ID);
  }
}

/**
 * Calculate improvement percentage
 */
function calculateImprovementPercentage(
  initial: number | null,
  current: number | null
): number | null {
  if (initial === null || current === null || initial === 0) {
    return null;
  }
  return ((current - initial) / initial) * 100;
}

// ==================== Main Metrics Function ====================

/**
 * Calculate resume metrics for a user
 *
 * @param userId - User ID to calculate metrics for
 * @param options - Period options (date range or lookback days)
 * @returns Resume metrics object
 *
 * @example
 * ```ts
 * const metrics = await calculateResumeMetrics('user_123', {
 *   lookbackDays: 30
 * });
 * console.log(metrics.improvementPercentage); // 15.5
 * ```
 */
export async function calculateResumeMetrics(
  userId: string,
  options: PeriodOptions = {}
): Promise<ResumeMetrics> {
  validateUserId(userId);

  const period = getDateRange(options);

  try {
    // Get all resume versions in the period, ordered by creation date
    const resumes = await prisma.resumeVersion.findMany({
      where: {
        userId,
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        overallScore: true,
        createdAt: true,
        versionNumber: true,
      },
    });

    // Count rewrite events (resume updates from Layer 4 events)
    const rewriteEvents = await prisma.interactionEvent.count({
      where: {
        userId,
        eventType: 'RESUME_SCORED',
        timestamp: {
          gte: period.start,
          lte: period.end,
        },
      },
    });

    // Build score history
    const scoreHistory: ScoreHistoryEntry[] = resumes
      .filter(r => r.overallScore !== null)
      .map(r => ({
        date: r.createdAt,
        score: r.overallScore as number,
        eventId: r.id,
      }));

    // Determine initial and current scores
    let initialScore: number | null = null;
    let currentScore: number | null = null;

    if (scoreHistory.length > 0) {
      initialScore = scoreHistory[0].score;
      currentScore = scoreHistory[scoreHistory.length - 1].score;
    } else {
      // If no resumes in period, try to get the current master resume
      const masterResume = await prisma.resumeVersion.findFirst({
        where: {
          userId,
          isMaster: true,
        },
        select: {
          overallScore: true,
        },
      });

      if (masterResume?.overallScore) {
        currentScore = masterResume.overallScore;
      }
    }

    const improvementPercentage = calculateImprovementPercentage(initialScore, currentScore);

    return {
      initialScore,
      currentScore,
      improvementPercentage,
      rewritesApplied: rewriteEvents,
      scoreHistory,
      period,
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.METRICS_CALCULATION_FAILED, error);
  }
}

/**
 * Get current resume score for a user
 *
 * @param userId - User ID
 * @returns Current resume score or null if no resume
 */
export async function getCurrentResumeScore(userId: string): Promise<number | null> {
  validateUserId(userId);

  try {
    const resume = await prisma.resumeVersion.findFirst({
      where: {
        userId,
        isMaster: true,
      },
      select: {
        overallScore: true,
      },
    });

    return resume?.overallScore ?? null;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Get resume score history for a user
 *
 * @param userId - User ID
 * @param limit - Maximum entries to return
 * @returns Array of score history entries
 */
export async function getScoreHistory(
  userId: string,
  limit: number = 50
): Promise<ScoreHistoryEntry[]> {
  validateUserId(userId);

  try {
    const resumes = await prisma.resumeVersion.findMany({
      where: {
        userId,
        overallScore: { not: null },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        overallScore: true,
        createdAt: true,
      },
    });

    return resumes
      .filter(r => r.overallScore !== null)
      .map(r => ({
        date: r.createdAt,
        score: r.overallScore as number,
        eventId: r.id,
      }))
      .reverse(); // Return in chronological order
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Calculate score improvement over a period
 *
 * @param userId - User ID
 * @param days - Number of days to analyze
 * @returns Score change (positive = improvement)
 */
export async function calculateScoreChange(
  userId: string,
  days: number = 30
): Promise<number | null> {
  validateUserId(userId);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  try {
    // Get earliest score in period
    const earliest = await prisma.resumeVersion.findFirst({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
        overallScore: { not: null },
      },
      orderBy: { createdAt: 'asc' },
      select: { overallScore: true },
    });

    // Get latest score
    const latest = await prisma.resumeVersion.findFirst({
      where: {
        userId,
        createdAt: { gte: start, lte: end },
        overallScore: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { overallScore: true },
    });

    if (!earliest?.overallScore || !latest?.overallScore) {
      return null;
    }

    return latest.overallScore - earliest.overallScore;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.METRICS_CALCULATION_FAILED, error);
  }
}
