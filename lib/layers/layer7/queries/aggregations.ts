/**
 * Layer 7 - Learning Engine Foundation
 * Aggregation Functions
 *
 * Simple aggregation functions for grouping and counting events.
 * Uses basic reduce/groupBy operations on event data.
 */

import prisma from '@/lib/prisma';
import { StrategyMode, isValidStrategyMode } from '../../shared/types';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { validateUserId, calculateDateRange } from '../utils';
import type {
  DateRange,
  MetricsPeriod,
  EventCountByType,
  EventCountByDate,
  EventsByStrategy,
} from '../types';

// ==================== Helper Functions ====================

/**
 * Get the start of a time bucket for a given date
 */
function getBucketStart(date: Date, bucket: MetricsPeriod): Date {
  const d = new Date(date);
  
  switch (bucket) {
    case 'daily':
      d.setHours(0, 0, 0, 0);
      return d;
    case 'weekly':
      // Start of week (Sunday)
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - dayOfWeek);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'monthly':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    default:
      return d;
  }
}

/**
 * Format date as bucket key string
 */
function formatBucketKey(date: Date, bucket: MetricsPeriod): string {
  const bucketStart = getBucketStart(date, bucket);
  return bucketStart.toISOString().split('T')[0];
}

// ==================== Aggregation Functions ====================

/**
 * Count events by type for a user
 *
 * @param userId - User ID
 * @param dateRange - Date range to query
 * @returns Array of event counts by type
 */
export async function countEventsByType(
  userId: string,
  dateRange?: DateRange
): Promise<EventCountByType[]> {
  validateUserId(userId);

  const range = dateRange ?? calculateDateRange();

  try {
    // Prisma doesn't support groupBy with raw enum values well,
    // so we fetch and aggregate in JS
    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        eventType: true,
      },
    });

    // Group and count
    const counts = new Map<string, number>();
    for (const event of events) {
      const type = event.eventType;
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    // Convert to array
    const result: EventCountByType[] = [];
    for (const [eventType, count] of counts) {
      result.push({ eventType, count });
    }

    // Sort by count descending
    result.sort((a, b) => b.count - a.count);

    return result;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Count events by date bucket (time series)
 *
 * @param userId - User ID
 * @param dateRange - Date range to query
 * @param bucket - Time bucket (daily, weekly, monthly)
 * @returns Array of event counts by date bucket
 */
export async function countEventsByDate(
  userId: string,
  dateRange?: DateRange,
  bucket: MetricsPeriod = 'daily'
): Promise<EventCountByDate[]> {
  validateUserId(userId);

  const range = dateRange ?? calculateDateRange();

  try {
    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        timestamp: true,
      },
    });

    // Group by bucket
    const buckets = new Map<string, number>();
    for (const event of events) {
      const key = formatBucketKey(event.timestamp, bucket);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    // Convert to array with proper dates
    const result: EventCountByDate[] = [];
    for (const [dateKey, count] of buckets) {
      result.push({
        date: new Date(dateKey),
        bucket,
        count,
      });
    }

    // Sort by date ascending
    result.sort((a, b) => a.date.getTime() - b.date.getTime());

    return result;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Group events by strategy mode
 *
 * @param userId - User ID
 * @param dateRange - Date range to query
 * @returns Array of events grouped by strategy mode
 */
export async function groupEventsByStrategy(
  userId: string,
  dateRange?: DateRange
): Promise<EventsByStrategy[]> {
  validateUserId(userId);

  const range = dateRange ?? calculateDateRange();

  try {
    // Get events with context
    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: range.start,
          lte: range.end,
        },
      },
      select: {
        id: true,
        context: true,
      },
    });

    // Group by strategy mode from context
    const groups = new Map<StrategyMode, string[]>();

    // Initialize all modes
    for (const mode of Object.values(StrategyMode)) {
      groups.set(mode, []);
    }

    for (const event of events) {
      const context = event.context as Record<string, unknown> | null;
      const modeFromContext = context?.strategyMode as string | undefined;
      
      if (modeFromContext && isValidStrategyMode(modeFromContext)) {
        const modeArray = groups.get(modeFromContext as StrategyMode);
        if (modeArray) {
          modeArray.push(event.id);
        }
      }
    }

    // Convert to result array
    const result: EventsByStrategy[] = [];
    for (const [mode, eventIds] of groups) {
      result.push({
        mode,
        eventCount: eventIds.length,
        events: eventIds,
      });
    }

    return result;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Get total event count for a user
 *
 * @param userId - User ID
 * @param dateRange - Optional date range
 * @returns Total event count
 */
export async function getTotalEventCount(
  userId: string,
  dateRange?: DateRange
): Promise<number> {
  validateUserId(userId);

  const range = dateRange ?? calculateDateRange();

  try {
    const count = await prisma.interactionEvent.count({
      where: {
        userId,
        timestamp: {
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
 * Get event counts as a record by type
 *
 * @param userId - User ID
 * @param dateRange - Date range
 * @returns Record mapping event type to count
 */
export async function getEventCountsRecord(
  userId: string,
  dateRange?: DateRange
): Promise<Record<string, number>> {
  const counts = await countEventsByType(userId, dateRange);
  
  const record: Record<string, number> = {};
  for (const item of counts) {
    record[item.eventType] = item.count;
  }
  
  return record;
}
