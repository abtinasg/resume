/**
 * Layer 7 - Learning Engine Foundation
 * Type Definitions
 *
 * Purpose: Analytics-specific types for querying events, calculating metrics,
 * and exporting data. This is the foundation layer for future ML capabilities.
 *
 * Note: This is Foundation ONLY - No ML/AI in MVP.
 * Uses event data from Layer 4 for analytics.
 */

import { LayerEventType, StrategyMode } from '../shared/types';

// ==================== Period Types ====================

/**
 * Time bucket for metric aggregation
 */
export type MetricsPeriod = 'daily' | 'weekly' | 'monthly';

/**
 * Date range for queries
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Period options for queries
 */
export interface PeriodOptions {
  period?: MetricsPeriod;
  dateRange?: DateRange;
  lookbackDays?: number;
}

// ==================== Application Metrics ====================

/**
 * Application outcome metrics
 * Calculated from Layer 4 application events
 */
export interface ApplicationMetrics {
  /** Total number of applications in period */
  totalApplications: number;
  /** Number of interview requests received */
  interviewsReceived: number;
  /** Number of offers received */
  offersReceived: number;
  /** Number of rejections */
  rejectionCount: number;
  /** Number of ghosted applications (no response after 30+ days) */
  ghostedCount: number;
  /** Average days to receive any response */
  avgDaysToResponse: number | null;
  /** Conversion rate: interviews / applications */
  interviewRate: number;
  /** Conversion rate: offers / interviews */
  offerRate: number;
  /** Conversion rate: offers / applications */
  overallConversionRate: number;
  /** Period this metric covers */
  period: DateRange;
}

// ==================== Resume Metrics ====================

/**
 * Score history entry
 */
export interface ScoreHistoryEntry {
  date: Date;
  score: number;
  eventId?: string;
}

/**
 * Resume improvement metrics
 * Tracks score changes over time
 */
export interface ResumeMetrics {
  /** First recorded score in period */
  initialScore: number | null;
  /** Most recent score */
  currentScore: number | null;
  /** Improvement percentage ((current - initial) / initial * 100) */
  improvementPercentage: number | null;
  /** Number of rewrites applied */
  rewritesApplied: number;
  /** Score history over time */
  scoreHistory: ScoreHistoryEntry[];
  /** Period this metric covers */
  period: DateRange;
}

// ==================== Strategy Metrics ====================

/**
 * Outcomes per strategy mode
 */
export interface ModeOutcome {
  mode: StrategyMode;
  applicationsCount: number;
  interviewsCount: number;
  offersCount: number;
  interviewRate: number;
  avgTimeInModeDays: number | null;
}

/**
 * Mode transition record
 */
export interface ModeTransition {
  from: StrategyMode;
  to: StrategyMode;
  changedAt: Date;
  reason: string;
}

/**
 * Strategy effectiveness metrics
 */
export interface StrategyMetrics {
  /** Outcomes for each strategy mode */
  outcomesPerMode: ModeOutcome[];
  /** Average time spent in each mode (days) */
  avgTimeInMode: Record<StrategyMode, number | null>;
  /** Recent mode transitions */
  modeTransitions: ModeTransition[];
  /** Simple effectiveness score per mode (0-100) */
  effectivenessScores: Record<StrategyMode, number | null>;
  /** Period this metric covers */
  period: DateRange;
}

// ==================== User Activity Summary ====================

/**
 * User activity summary for a given period
 */
export interface UserActivitySummary {
  userId: string;
  /** Period covered */
  period: DateRange;
  /** Total events logged */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<string, number>;
  /** Application metrics for the period */
  applicationMetrics: ApplicationMetrics;
  /** Resume metrics for the period */
  resumeMetrics: ResumeMetrics;
  /** Strategy metrics for the period */
  strategyMetrics: StrategyMetrics;
  /** When this summary was generated */
  generatedAt: Date;
}

// ==================== Export Types ====================

/**
 * Supported export formats
 */
export type ExportFormat = 'json' | 'csv';

/**
 * Export options
 */
export interface ExportOptions {
  /** Format for export */
  format: ExportFormat;
  /** Date range to include */
  dateRange?: DateRange;
  /** Number of days to look back (alternative to dateRange) */
  lookbackDays?: number;
  /** Include all data or just summary */
  includeRawEvents?: boolean;
  /** Pretty print JSON output */
  prettyPrint?: boolean;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Exported data as string */
  data: string;
  /** Format of the export */
  format: ExportFormat;
  /** Number of records exported */
  recordCount: number;
  /** When the export was generated */
  generatedAt: Date;
  /** Period covered */
  period: DateRange;
}

// ==================== Query Types ====================

/**
 * Options for querying events
 */
export interface EventQueryOptions {
  /** Event types to filter by */
  eventTypes?: LayerEventType[];
  /** Date range */
  dateRange?: DateRange;
  /** Number of days to look back */
  lookbackDays?: number;
  /** Maximum number of events to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  orderBy?: 'asc' | 'desc';
}

/**
 * Event count by type
 */
export interface EventCountByType {
  eventType: string;
  count: number;
}

/**
 * Event count by date bucket
 */
export interface EventCountByDate {
  date: Date;
  bucket: MetricsPeriod;
  count: number;
}

/**
 * Events grouped by strategy mode
 */
export interface EventsByStrategy {
  mode: StrategyMode;
  eventCount: number;
  events: string[]; // Event IDs
}

// ==================== Aggregation Types ====================

/**
 * Time series data point
 */
export interface TimeSeriesPoint {
  date: Date;
  value: number;
  label?: string;
}

/**
 * Aggregated metrics result
 */
export interface AggregatedMetrics {
  /** All metrics combined */
  applications: ApplicationMetrics;
  resume: ResumeMetrics;
  strategy: StrategyMetrics;
  /** Period covered */
  period: DateRange;
  /** When these metrics were calculated */
  calculatedAt: Date;
}

// ==================== Report Types ====================

/**
 * Weekly summary report
 */
export interface WeeklySummaryReport {
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  /** Summary text (markdown format) */
  summary: string;
  /** Key highlights */
  highlights: string[];
  /** Areas needing attention */
  concerns: string[];
  /** Metrics for the week */
  metrics: {
    applicationsSubmitted: number;
    interviewsReceived: number;
    currentResumeScore: number | null;
    targetsMet: boolean;
  };
  generatedAt: Date;
}

/**
 * Monthly summary report
 */
export interface MonthlySummaryReport {
  userId: string;
  monthStart: Date;
  monthEnd: Date;
  /** Summary text (markdown format) */
  summary: string;
  /** Key highlights */
  highlights: string[];
  /** Progress trends */
  trends: {
    applicationTrend: 'increasing' | 'decreasing' | 'stable';
    scoreTrend: 'improving' | 'declining' | 'stable';
    interviewRateTrend: 'improving' | 'declining' | 'stable';
  };
  /** Metrics for the month */
  metrics: ApplicationMetrics;
  generatedAt: Date;
}

// ==================== Config Types ====================

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  version: string;
  metrics: {
    defaultLookbackDays: number;
    aggregationBuckets: MetricsPeriod[];
  };
  exports: {
    maxEventsPerExport: number;
    defaultFormat: ExportFormat;
  };
}
