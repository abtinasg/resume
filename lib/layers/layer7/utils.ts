/**
 * Layer 7 - Learning Engine Foundation
 * Shared Utilities
 *
 * Common helper functions used across the analytics layer.
 */

import { AnalyticsError, AnalyticsErrorCode } from './errors';
import { getDefaultLookbackDays } from './config';
import type { DateRange } from './types';

// ==================== Validation ====================

/**
 * Validate user ID
 * @throws {AnalyticsError} If user ID is invalid or missing
 */
export function validateUserId(userId: string): void {
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    throw new AnalyticsError(AnalyticsErrorCode.INVALID_USER_ID);
  }
}

/**
 * Validate date range
 * @throws {AnalyticsError} If date range is invalid (end before start)
 */
export function validateDateRange(dateRange?: DateRange): void {
  if (dateRange && dateRange.end < dateRange.start) {
    throw new AnalyticsError(AnalyticsErrorCode.INVALID_DATE_RANGE, {
      start: dateRange.start,
      end: dateRange.end,
    });
  }
}

// ==================== Date Utilities ====================

/**
 * Calculate date range from lookback days
 */
export function calculateDateRange(lookbackDays?: number): DateRange {
  const days = lookbackDays ?? getDefaultLookbackDays();
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

/**
 * Get date range from options (date range or lookback days)
 */
export function getDateRangeFromOptions(
  options: { dateRange?: DateRange; lookbackDays?: number } = {}
): DateRange {
  if (options.dateRange) {
    return options.dateRange;
  }
  return calculateDateRange(options.lookbackDays);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date as ISO string (for exports)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString();
}

// ==================== Math Utilities ====================

/**
 * Calculate average from array, returns null if empty
 */
export function calculateAverage(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Calculate safe ratio (avoid division by zero)
 */
export function safeRatio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}
