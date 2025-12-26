/**
 * Layer 7 - Learning Engine Foundation
 * JSON Exporter
 *
 * Export user activity and metrics to JSON format.
 */

import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { getMaxEventsPerExport, getDefaultLookbackDays } from '../config';
import { getEventsByUser } from '../queries';
import { calculateApplicationMetrics, calculateResumeMetrics, calculateStrategyMetrics } from '../metrics';
import type { ExportResult, ExportOptions, DateRange, AggregatedMetrics } from '../types';

// ==================== Helper Functions ====================

/**
 * Get date range from export options
 */
function getDateRange(options: ExportOptions): DateRange {
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

// ==================== Export Functions ====================

/**
 * Export user activity to JSON
 *
 * @param userId - User ID
 * @param options - Export options
 * @returns Export result with JSON data
 *
 * @example
 * ```ts
 * const result = await exportUserActivity('user_123', {
 *   format: 'json',
 *   lookbackDays: 30,
 *   includeRawEvents: true
 * });
 * console.log(result.data); // JSON string
 * ```
 */
export async function exportUserActivity(
  userId: string,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  validateUserId(userId);

  const dateRange = getDateRange({ format: 'json', ...options });
  const maxEvents = getMaxEventsPerExport();

  try {
    // Get events
    const events = await getEventsByUser(userId, {
      dateRange,
      limit: maxEvents,
    });

    if (events.length >= maxEvents) {
      throw new AnalyticsError(AnalyticsErrorCode.EXPORT_TOO_LARGE, {
        maxEvents,
        message: `Export limited to ${maxEvents} events. Reduce date range.`,
      });
    }

    // Build export object
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      period: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      eventCount: events.length,
      events: options.includeRawEvents !== false ? events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        timestamp: e.timestamp.toISOString(),
        context: e.context,
        metadata: e.metadata,
      })) : undefined,
    };

    // Format JSON
    const indent = options.prettyPrint !== false ? 2 : 0;
    const data = JSON.stringify(exportData, null, indent);

    return {
      data,
      format: 'json',
      recordCount: events.length,
      generatedAt: new Date(),
      period: dateRange,
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.EXPORT_FAILED, error);
  }
}

/**
 * Export calculated metrics to JSON
 *
 * @param userId - User ID
 * @param options - Export options
 * @returns Export result with metrics JSON
 *
 * @example
 * ```ts
 * const result = await exportMetrics('user_123', {
 *   format: 'json',
 *   lookbackDays: 30
 * });
 * const metrics = JSON.parse(result.data);
 * ```
 */
export async function exportMetrics(
  userId: string,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  validateUserId(userId);

  const dateRange = getDateRange({ format: 'json', ...options });

  try {
    // Calculate all metrics
    const [applicationMetrics, resumeMetrics, strategyMetrics] = await Promise.all([
      calculateApplicationMetrics(userId, { dateRange }),
      calculateResumeMetrics(userId, { dateRange }),
      calculateStrategyMetrics(userId, { dateRange }),
    ]);

    const aggregatedMetrics: AggregatedMetrics = {
      applications: applicationMetrics,
      resume: resumeMetrics,
      strategy: strategyMetrics,
      period: dateRange,
      calculatedAt: new Date(),
    };

    // Build export object
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      period: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      metrics: {
        applications: {
          ...applicationMetrics,
          period: {
            start: applicationMetrics.period.start.toISOString(),
            end: applicationMetrics.period.end.toISOString(),
          },
        },
        resume: {
          ...resumeMetrics,
          scoreHistory: resumeMetrics.scoreHistory.map(entry => ({
            ...entry,
            date: entry.date.toISOString(),
          })),
          period: {
            start: resumeMetrics.period.start.toISOString(),
            end: resumeMetrics.period.end.toISOString(),
          },
        },
        strategy: {
          ...strategyMetrics,
          modeTransitions: strategyMetrics.modeTransitions.map(t => ({
            ...t,
            changedAt: t.changedAt.toISOString(),
          })),
          period: {
            start: strategyMetrics.period.start.toISOString(),
            end: strategyMetrics.period.end.toISOString(),
          },
        },
      },
    };

    // Format JSON
    const indent = options.prettyPrint !== false ? 2 : 0;
    const data = JSON.stringify(exportData, null, indent);

    return {
      data,
      format: 'json',
      recordCount: 1, // Single metrics object
      generatedAt: new Date(),
      period: dateRange,
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.EXPORT_FAILED, error);
  }
}

/**
 * Export both events and metrics combined
 *
 * @param userId - User ID
 * @param options - Export options
 * @returns Export result with complete data
 */
export async function exportAll(
  userId: string,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  validateUserId(userId);

  const dateRange = getDateRange({ format: 'json', ...options });
  const maxEvents = getMaxEventsPerExport();

  try {
    // Get everything in parallel
    const [events, applicationMetrics, resumeMetrics, strategyMetrics] = await Promise.all([
      getEventsByUser(userId, { dateRange, limit: maxEvents }),
      calculateApplicationMetrics(userId, { dateRange }),
      calculateResumeMetrics(userId, { dateRange }),
      calculateStrategyMetrics(userId, { dateRange }),
    ]);

    // Build comprehensive export
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      period: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
      summary: {
        totalEvents: events.length,
        totalApplications: applicationMetrics.totalApplications,
        currentScore: resumeMetrics.currentScore,
        interviewRate: applicationMetrics.interviewRate,
      },
      metrics: {
        applications: {
          ...applicationMetrics,
          period: {
            start: applicationMetrics.period.start.toISOString(),
            end: applicationMetrics.period.end.toISOString(),
          },
        },
        resume: {
          ...resumeMetrics,
          scoreHistory: resumeMetrics.scoreHistory.map(entry => ({
            ...entry,
            date: entry.date.toISOString(),
          })),
          period: {
            start: resumeMetrics.period.start.toISOString(),
            end: resumeMetrics.period.end.toISOString(),
          },
        },
        strategy: {
          ...strategyMetrics,
          modeTransitions: strategyMetrics.modeTransitions.map(t => ({
            ...t,
            changedAt: t.changedAt.toISOString(),
          })),
          period: {
            start: strategyMetrics.period.start.toISOString(),
            end: strategyMetrics.period.end.toISOString(),
          },
        },
      },
      events: options.includeRawEvents ? events.map(e => ({
        id: e.id,
        eventType: e.eventType,
        timestamp: e.timestamp.toISOString(),
        context: e.context,
        metadata: e.metadata,
      })) : undefined,
    };

    const indent = options.prettyPrint !== false ? 2 : 0;
    const data = JSON.stringify(exportData, null, indent);

    return {
      data,
      format: 'json',
      recordCount: events.length,
      generatedAt: new Date(),
      period: dateRange,
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.EXPORT_FAILED, error);
  }
}
