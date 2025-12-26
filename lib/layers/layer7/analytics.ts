/**
 * Layer 7 - Learning Engine Foundation
 * Main Analytics Facade
 *
 * Public API that combines all functionality into a clean, simple interface.
 * This is the primary entry point for Layer 7 analytics.
 *
 * Note: This is Foundation ONLY - No ML/AI in MVP.
 */

import { AnalyticsError, AnalyticsErrorCode } from './errors';
import {
  calculateApplicationMetrics,
  calculateResumeMetrics,
  calculateStrategyMetrics,
  getCurrentResumeScore,
} from './metrics';
import { getEventsByUser, getTotalEventCount, getEventCountsRecord } from './queries';
import { exportUserActivity, exportMetrics, exportAll } from './exports/json-exporter';
import { exportMetricsCSV, exportEventsCSV } from './exports/csv-exporter';
import { generateWeeklySummary, generateMonthlySummary, generateTextSummary } from './exports/report-generator';
import { validateUserId, getDateRangeFromOptions } from './utils';
import type {
  AggregatedMetrics,
  UserActivitySummary,
  ExportResult,
  ExportFormat,
  DateRange,
  PeriodOptions,
  WeeklySummaryReport,
  MonthlySummaryReport,
} from './types';

// ==================== Main API Functions ====================

/**
 * Get all metrics for a user
 *
 * This is the primary entry point for getting user metrics.
 * Returns aggregated application, resume, and strategy metrics.
 *
 * @param userId - User ID to get metrics for
 * @param options - Period options (date range or lookback days)
 * @returns Aggregated metrics object
 *
 * @example
 * ```ts
 * import { getMetrics } from '@/lib/layers/layer7';
 *
 * const metrics = await getMetrics('user_123', { lookbackDays: 30 });
 * console.log(metrics.applications.totalApplications);
 * console.log(metrics.resume.improvementPercentage);
 * console.log(metrics.strategy.outcomesPerMode);
 * ```
 */
export async function getMetrics(
  userId: string,
  options: PeriodOptions = {}
): Promise<AggregatedMetrics> {
  validateUserId(userId);

  const dateRange = getDateRangeFromOptions(options);

  try {
    const [applicationMetrics, resumeMetrics, strategyMetrics] = await Promise.all([
      calculateApplicationMetrics(userId, { dateRange }),
      calculateResumeMetrics(userId, { dateRange }),
      calculateStrategyMetrics(userId, { dateRange }),
    ]);

    return {
      applications: applicationMetrics,
      resume: resumeMetrics,
      strategy: strategyMetrics,
      period: dateRange,
      calculatedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.METRICS_CALCULATION_FAILED, error);
  }
}

/**
 * Get user activity summary
 *
 * Returns a comprehensive summary of user activity including
 * all metrics and event counts.
 *
 * @param userId - User ID
 * @param days - Number of days to look back
 * @returns User activity summary
 *
 * @example
 * ```ts
 * const summary = await getActivitySummary('user_123', 30);
 * console.log(summary.totalEvents);
 * console.log(summary.applicationMetrics.interviewRate);
 * ```
 */
export async function getActivitySummary(
  userId: string,
  days: number = 30
): Promise<UserActivitySummary> {
  validateUserId(userId);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const dateRange: DateRange = { start, end };

  try {
    const [
      applicationMetrics,
      resumeMetrics,
      strategyMetrics,
      totalEvents,
      eventsByType,
    ] = await Promise.all([
      calculateApplicationMetrics(userId, { dateRange }),
      calculateResumeMetrics(userId, { dateRange }),
      calculateStrategyMetrics(userId, { dateRange }),
      getTotalEventCount(userId, dateRange),
      getEventCountsRecord(userId, dateRange),
    ]);

    return {
      userId,
      period: dateRange,
      totalEvents,
      eventsByType,
      applicationMetrics,
      resumeMetrics,
      strategyMetrics,
      generatedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.METRICS_CALCULATION_FAILED, error);
  }
}

/**
 * Export data in specified format
 *
 * Unified export function that handles both JSON and CSV formats.
 *
 * @param userId - User ID
 * @param format - Export format ('json' or 'csv')
 * @param options - Export options
 * @returns Export result with data string
 *
 * @example
 * ```ts
 * // Export as JSON
 * const jsonData = await exportData('user_123', 'json', {
 *   lookbackDays: 30
 * });
 *
 * // Export as CSV
 * const csvData = await exportData('user_123', 'csv', {
 *   lookbackDays: 90
 * });
 * ```
 */
export async function exportData(
  userId: string,
  format: ExportFormat = 'json',
  options: {
    lookbackDays?: number;
    dateRange?: DateRange;
    includeRawEvents?: boolean;
    prettyPrint?: boolean;
  } = {}
): Promise<ExportResult> {
  validateUserId(userId);

  try {
    if (format === 'csv') {
      // For CSV, export metrics by default
      return await exportMetricsCSV(userId, {
        format: 'csv',
        ...options,
      });
    }

    // For JSON, export everything
    return await exportAll(userId, {
      format: 'json',
      ...options,
    });
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.EXPORT_FAILED, error);
  }
}

/**
 * Get weekly report
 *
 * @param userId - User ID
 * @param weekOffset - Week offset (0 = current, 1 = last week)
 * @returns Weekly summary report
 */
export async function getWeeklyReport(
  userId: string,
  weekOffset: number = 0
): Promise<WeeklySummaryReport> {
  return generateWeeklySummary(userId, weekOffset);
}

/**
 * Get monthly report
 *
 * @param userId - User ID
 * @param monthOffset - Month offset (0 = current, 1 = last month)
 * @returns Monthly summary report
 */
export async function getMonthlyReport(
  userId: string,
  monthOffset: number = 0
): Promise<MonthlySummaryReport> {
  return generateMonthlySummary(userId, monthOffset);
}

/**
 * Get quick text summary
 *
 * @param userId - User ID
 * @param days - Number of days to summarize
 * @returns Plain text summary
 */
export async function getQuickSummary(userId: string, days: number = 7): Promise<string> {
  return generateTextSummary(userId, days);
}

/**
 * Get current resume score
 *
 * Simple helper to get just the current score.
 *
 * @param userId - User ID
 * @returns Current resume score or null
 */
export async function getResumeScore(userId: string): Promise<number | null> {
  validateUserId(userId);
  return getCurrentResumeScore(userId);
}

// ==================== Analytics Service Class ====================

/**
 * Analytics Service Class
 *
 * Object-oriented wrapper for all analytics functionality.
 * Useful when you need to perform multiple operations for the same user.
 */
export class AnalyticsService {
  private readonly userId: string;

  constructor(userId: string) {
    validateUserId(userId);
    this.userId = userId;
  }

  /**
   * Get all metrics
   */
  async getMetrics(options?: PeriodOptions): Promise<AggregatedMetrics> {
    return getMetrics(this.userId, options);
  }

  /**
   * Get activity summary
   */
  async getActivitySummary(days?: number): Promise<UserActivitySummary> {
    return getActivitySummary(this.userId, days);
  }

  /**
   * Export data
   */
  async exportData(
    format?: ExportFormat,
    options?: { lookbackDays?: number; dateRange?: DateRange }
  ): Promise<ExportResult> {
    return exportData(this.userId, format, options);
  }

  /**
   * Get weekly report
   */
  async getWeeklyReport(weekOffset?: number): Promise<WeeklySummaryReport> {
    return getWeeklyReport(this.userId, weekOffset);
  }

  /**
   * Get monthly report
   */
  async getMonthlyReport(monthOffset?: number): Promise<MonthlySummaryReport> {
    return getMonthlyReport(this.userId, monthOffset);
  }

  /**
   * Get quick summary
   */
  async getQuickSummary(days?: number): Promise<string> {
    return getQuickSummary(this.userId, days);
  }

  /**
   * Get current resume score
   */
  async getResumeScore(): Promise<number | null> {
    return getResumeScore(this.userId);
  }
}

/**
 * Create an analytics service for a user
 *
 * @param userId - User ID
 * @returns Analytics service instance
 *
 * @example
 * ```ts
 * const analytics = createAnalyticsService('user_123');
 * const metrics = await analytics.getMetrics({ lookbackDays: 30 });
 * const report = await analytics.getWeeklyReport();
 * ```
 */
export function createAnalyticsService(userId: string): AnalyticsService {
  return new AnalyticsService(userId);
}
