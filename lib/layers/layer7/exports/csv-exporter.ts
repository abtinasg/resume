/**
 * Layer 7 - Learning Engine Foundation
 * CSV Exporter
 *
 * Export user activity and metrics to CSV format.
 * Uses native JavaScript for CSV generation (minimal dependencies).
 */

import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { getMaxEventsPerExport } from '../config';
import { getEventsByUser } from '../queries';
import { calculateApplicationMetrics, calculateResumeMetrics, calculateStrategyMetrics } from '../metrics';
import { validateUserId, getDateRangeFromOptions, formatDateISO } from '../utils';
import type { ExportResult, ExportOptions, DateRange } from '../types';

// ==================== CSV Utilities ====================

/**
 * Escape a value for CSV format
 * Handles commas, quotes, and newlines
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Check if escaping is needed
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Escape quotes by doubling them
    return '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  // Determine columns
  const cols = columns ?? Object.keys(data[0]);

  // Build header row
  const header = cols.map(escapeCSV).join(',');

  // Build data rows
  const rows = data.map(row => {
    return cols.map(col => escapeCSV(row[col])).join(',');
  });

  return [header, ...rows].join('\n');
}

// ==================== Export Functions ====================

/**
 * Export applications to CSV
 *
 * @param userId - User ID
 * @param options - Export options
 * @returns Export result with CSV data
 *
 * @example
 * ```ts
 * const result = await exportApplicationsCSV('user_123', {
 *   format: 'csv',
 *   lookbackDays: 30
 * });
 * // Write result.data to file or download
 * ```
 */
export async function exportApplicationsCSV(
  userId: string,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  validateUserId(userId);

  const dateRange = getDateRangeFromOptions({ format: 'csv', ...options });

  try {
    // Get application events
    const events = await getEventsByUser(userId, {
      dateRange,
      eventTypes: undefined, // Get all events
      limit: getMaxEventsPerExport(),
    });

    // Filter to application-related events
    const applicationEvents = events.filter(e =>
      e.eventType.includes('application') ||
      e.eventType.includes('interview') ||
      e.eventType.includes('offer')
    );

    // Map events to CSV rows
    const rows = applicationEvents.map(event => {
      const context = event.context || {};
      return {
        event_id: event.id,
        event_type: event.eventType,
        timestamp: formatDateISO(event.timestamp),
        job_id: context.jobId || '',
        application_id: context.applicationId || '',
        status: context.status || '',
        job_title: context.jobTitle || '',
        company: context.company || '',
      };
    });

    const columns = [
      'event_id',
      'event_type',
      'timestamp',
      'job_id',
      'application_id',
      'status',
      'job_title',
      'company',
    ];

    const data = arrayToCSV(rows, columns);

    return {
      data,
      format: 'csv',
      recordCount: rows.length,
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
 * Export metrics to CSV
 *
 * @param userId - User ID
 * @param options - Export options
 * @returns Export result with metrics CSV
 */
export async function exportMetricsCSV(
  userId: string,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  validateUserId(userId);

  const dateRange = getDateRangeFromOptions({ format: 'csv', ...options });

  try {
    // Calculate all metrics
    const [applicationMetrics, resumeMetrics, strategyMetrics] = await Promise.all([
      calculateApplicationMetrics(userId, { dateRange }),
      calculateResumeMetrics(userId, { dateRange }),
      calculateStrategyMetrics(userId, { dateRange }),
    ]);

    // Build metrics rows (one row per metric category)
    const rows = [
      {
        category: 'applications',
        metric: 'total_applications',
        value: applicationMetrics.totalApplications,
        unit: 'count',
      },
      {
        category: 'applications',
        metric: 'interviews_received',
        value: applicationMetrics.interviewsReceived,
        unit: 'count',
      },
      {
        category: 'applications',
        metric: 'offers_received',
        value: applicationMetrics.offersReceived,
        unit: 'count',
      },
      {
        category: 'applications',
        metric: 'rejection_count',
        value: applicationMetrics.rejectionCount,
        unit: 'count',
      },
      {
        category: 'applications',
        metric: 'interview_rate',
        value: (applicationMetrics.interviewRate * 100).toFixed(2),
        unit: 'percent',
      },
      {
        category: 'applications',
        metric: 'offer_rate',
        value: (applicationMetrics.offerRate * 100).toFixed(2),
        unit: 'percent',
      },
      {
        category: 'applications',
        metric: 'avg_days_to_response',
        value: applicationMetrics.avgDaysToResponse?.toFixed(1) || '',
        unit: 'days',
      },
      {
        category: 'resume',
        metric: 'initial_score',
        value: resumeMetrics.initialScore || '',
        unit: 'score',
      },
      {
        category: 'resume',
        metric: 'current_score',
        value: resumeMetrics.currentScore || '',
        unit: 'score',
      },
      {
        category: 'resume',
        metric: 'improvement_percentage',
        value: resumeMetrics.improvementPercentage?.toFixed(1) || '',
        unit: 'percent',
      },
      {
        category: 'resume',
        metric: 'rewrites_applied',
        value: resumeMetrics.rewritesApplied,
        unit: 'count',
      },
    ];

    // Add strategy metrics per mode
    for (const outcome of strategyMetrics.outcomesPerMode) {
      rows.push({
        category: 'strategy',
        metric: `${outcome.mode.toLowerCase()}_applications`,
        value: outcome.applicationsCount,
        unit: 'count',
      });
      rows.push({
        category: 'strategy',
        metric: `${outcome.mode.toLowerCase()}_interview_rate`,
        value: (outcome.interviewRate * 100).toFixed(2),
        unit: 'percent',
      });
    }

    const columns = ['category', 'metric', 'value', 'unit'];
    const data = arrayToCSV(rows, columns);

    return {
      data,
      format: 'csv',
      recordCount: rows.length,
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
 * Export events to CSV
 *
 * @param userId - User ID
 * @param options - Export options
 * @returns Export result with events CSV
 */
export async function exportEventsCSV(
  userId: string,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  validateUserId(userId);

  const dateRange = getDateRangeFromOptions({ format: 'csv', ...options });
  const maxEvents = getMaxEventsPerExport();

  try {
    const events = await getEventsByUser(userId, {
      dateRange,
      limit: maxEvents,
    });

    if (events.length >= maxEvents) {
      throw new AnalyticsError(AnalyticsErrorCode.EXPORT_TOO_LARGE, {
        maxEvents,
        message: `Export limited to ${maxEvents} events.`,
      });
    }

    // Map events to CSV rows
    const rows = events.map(event => ({
      event_id: event.id,
      event_type: event.eventType,
      timestamp: formatDateISO(event.timestamp),
      context_summary: JSON.stringify(event.context).slice(0, 200), // Truncate for CSV
    }));

    const columns = ['event_id', 'event_type', 'timestamp', 'context_summary'];
    const data = arrayToCSV(rows, columns);

    return {
      data,
      format: 'csv',
      recordCount: rows.length,
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
 * Export score history to CSV
 *
 * @param userId - User ID
 * @param options - Export options
 * @returns Export result with score history CSV
 */
export async function exportScoreHistoryCSV(
  userId: string,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  validateUserId(userId);

  const dateRange = getDateRangeFromOptions({ format: 'csv', ...options });

  try {
    const resumeMetrics = await calculateResumeMetrics(userId, { dateRange });

    const rows = resumeMetrics.scoreHistory.map(entry => ({
      date: formatDateISO(entry.date),
      score: entry.score,
      version_id: entry.eventId || '',
    }));

    const columns = ['date', 'score', 'version_id'];
    const data = arrayToCSV(rows, columns);

    return {
      data,
      format: 'csv',
      recordCount: rows.length,
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
