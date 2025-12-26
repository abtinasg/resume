/**
 * Layer 7 - Learning Engine Foundation
 * Application Metrics Calculator
 *
 * Calculate application outcome metrics from Layer 4 data.
 * Tracks applications, interviews, offers, and conversion rates.
 */

import prisma from '@/lib/prisma';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { validateUserId, getDateRangeFromOptions, daysBetween, calculateAverage } from '../utils';
import type { ApplicationMetrics, DateRange, PeriodOptions } from '../types';

// ==================== Constants ====================

/**
 * Days after which an application with no response is considered ghosted
 */
const GHOSTED_THRESHOLD_DAYS = 30;

// ==================== Main Metrics Function ====================

/**
 * Calculate application metrics for a user
 *
 * @param userId - User ID to calculate metrics for
 * @param options - Period options (date range or lookback days)
 * @returns Application metrics object
 *
 * @example
 * ```ts
 * const metrics = await calculateApplicationMetrics('user_123', {
 *   lookbackDays: 30
 * });
 * console.log(metrics.interviewRate); // 0.15
 * ```
 */
export async function calculateApplicationMetrics(
  userId: string,
  options: PeriodOptions = {}
): Promise<ApplicationMetrics> {
  validateUserId(userId);

  const period = getDateRangeFromOptions(options);

  try {
    // Get all applications in the period
    const applications = await prisma.application.findMany({
      where: {
        userId,
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      select: {
        id: true,
        status: true,
        appliedAt: true,
        interviewScheduledAt: true,
        offerReceivedAt: true,
        rejectedAt: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const totalApplications = applications.length;
    let interviewsReceived = 0;
    let offersReceived = 0;
    let rejectionCount = 0;
    let ghostedCount = 0;
    const responseDays: number[] = [];
    const now = new Date();

    for (const app of applications) {
      // Count interviews (scheduled or completed)
      if (app.interviewScheduledAt) {
        interviewsReceived++;

        // Calculate days to interview from application date
        const appDate = app.appliedAt ?? app.createdAt;
        if (appDate) {
          responseDays.push(daysBetween(appDate, app.interviewScheduledAt));
        }
      }

      // Count offers
      if (app.offerReceivedAt) {
        offersReceived++;
      }

      // Count rejections
      if (app.rejectedAt) {
        rejectionCount++;

        // Calculate days to rejection
        const appDate = app.appliedAt ?? app.createdAt;
        if (appDate) {
          responseDays.push(daysBetween(appDate, app.rejectedAt));
        }
      }

      // Check for ghosted (submitted but no response after threshold)
      if (
        app.status === 'submitted' &&
        !app.interviewScheduledAt &&
        !app.offerReceivedAt &&
        !app.rejectedAt
      ) {
        const appDate = app.appliedAt ?? app.createdAt;
        if (appDate && daysBetween(appDate, now) >= GHOSTED_THRESHOLD_DAYS) {
          ghostedCount++;
        }
      }
    }

    // Calculate rates (avoid division by zero)
    const interviewRate = totalApplications > 0 ? interviewsReceived / totalApplications : 0;
    const offerRate = interviewsReceived > 0 ? offersReceived / interviewsReceived : 0;
    const overallConversionRate = totalApplications > 0 ? offersReceived / totalApplications : 0;
    const avgDaysToResponse = calculateAverage(responseDays);

    return {
      totalApplications,
      interviewsReceived,
      offersReceived,
      rejectionCount,
      ghostedCount,
      avgDaysToResponse,
      interviewRate,
      offerRate,
      overallConversionRate,
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
 * Get application count for a specific status
 *
 * @param userId - User ID
 * @param status - Application status to count
 * @param dateRange - Optional date range
 * @returns Count of applications with that status
 */
export async function getApplicationCountByStatus(
  userId: string,
  status: string,
  dateRange?: DateRange
): Promise<number> {
  validateUserId(userId);

  const range = dateRange ?? getDateRangeFromOptions({});

  try {
    const count = await prisma.application.count({
      where: {
        userId,
        status,
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    });

    return count;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Calculate weekly application rate
 *
 * @param userId - User ID
 * @param weeks - Number of weeks to look back
 * @returns Average applications per week
 */
export async function calculateWeeklyApplicationRate(
  userId: string,
  weeks: number = 4
): Promise<number> {
  validateUserId(userId);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - weeks * 7);

  try {
    const count = await prisma.application.count({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    return count / weeks;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.METRICS_CALCULATION_FAILED, error);
  }
}
