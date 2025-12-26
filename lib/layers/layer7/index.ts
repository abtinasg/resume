/**
 * Layer 7 - Learning Engine Foundation
 * Public API Exports
 *
 * This module exports the primary analytics functions and types
 * for use by other layers and external consumers.
 *
 * Usage:
 * ```ts
 * import { getMetrics, exportData } from '@/lib/layers/layer7';
 *
 * const metrics = await getMetrics('user_123', { lookbackDays: 30 });
 * console.log(metrics.applications.totalApplications);
 * console.log(metrics.resume.improvementPercentage);
 * ```
 */

// ==================== Main Analytics Functions ====================

export {
  getMetrics,
  getActivitySummary,
  exportData,
  getWeeklyReport,
  getMonthlyReport,
  getQuickSummary,
  getResumeScore,
  AnalyticsService,
  createAnalyticsService,
} from './analytics';

// ==================== Query Functions ====================

export {
  getEventsByUser,
  getEventsByType,
  getEventsByDateRange,
  getRecentEvents,
  countEventsByUser,
  countEventsByType,
  countEventsByDate,
  groupEventsByStrategy,
  getTotalEventCount,
  getEventCountsRecord,
  type MappedEvent,
} from './queries';

// ==================== Metrics Functions ====================

export {
  calculateApplicationMetrics,
  calculateResumeMetrics,
  calculateStrategyMetrics,
  getCurrentResumeScore,
  getScoreHistory,
  calculateScoreChange,
  getApplicationCountByStatus,
  calculateWeeklyApplicationRate,
  getCurrentStrategyMode,
  getModeTransitionCount,
} from './metrics';

// ==================== Export Functions ====================

export {
  exportUserActivity,
  exportMetrics,
  exportAll,
  exportApplicationsCSV,
  exportMetricsCSV,
  exportEventsCSV,
  exportScoreHistoryCSV,
  generateWeeklySummary,
  generateMonthlySummary,
  generateTextSummary,
} from './exports';

// ==================== Config Functions ====================

export {
  loadConfig,
  getConfigValue,
  getDefaultLookbackDays,
  getMaxEventsPerExport,
  getDefaultExportFormat,
} from './config';

// ==================== Error Handling ====================

export {
  AnalyticsError,
  AnalyticsErrorCode,
  ERROR_MESSAGES,
  createError,
  isAnalyticsError,
  getUserFriendlyError,
} from './errors';

// ==================== Types ====================

export type {
  // Period types
  MetricsPeriod,
  DateRange,
  PeriodOptions,

  // Metrics types
  ApplicationMetrics,
  ResumeMetrics,
  StrategyMetrics,
  ScoreHistoryEntry,
  ModeOutcome,
  ModeTransition,
  AggregatedMetrics,

  // Activity types
  UserActivitySummary,

  // Export types
  ExportFormat,
  ExportOptions,
  ExportResult,

  // Query types
  EventQueryOptions,
  EventCountByType,
  EventCountByDate,
  EventsByStrategy,
  TimeSeriesPoint,

  // Report types
  WeeklySummaryReport,
  MonthlySummaryReport,

  // Config types
  AnalyticsConfig,
} from './types';
