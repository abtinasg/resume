/**
 * Layer 7 - Learning Engine Foundation
 * Event Query Helpers
 *
 * Query Layer 4 events with clean interfaces for analytics.
 * These are the foundational queries that wrap Prisma calls.
 */

import prisma from '@/lib/prisma';
import type { InteractionEvent, EventType as PrismaEventType } from '@prisma/client';
import { LayerEventType } from '../../shared/types';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { getDefaultLookbackDays } from '../config';
import type { EventQueryOptions, DateRange } from '../types';

// ==================== Constants ====================

/**
 * Maximum number of events to return in a single query
 */
const MAX_QUERY_LIMIT = 10000;

/**
 * Default query limit
 */
const DEFAULT_QUERY_LIMIT = 100;

// ==================== Helper Functions ====================

/**
 * Calculate date range from lookback days
 */
function calculateDateRange(lookbackDays?: number): DateRange {
  const days = lookbackDays ?? getDefaultLookbackDays();
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

/**
 * Map LayerEventType to Prisma EventType
 * Note: Not all Layer event types are in the Prisma enum
 */
function mapEventTypeToPrisma(eventType: LayerEventType): string {
  const mapping: Record<LayerEventType, string> = {
    [LayerEventType.RESUME_UPLOADED]: 'RESUME_UPLOADED',
    [LayerEventType.RESUME_EDITED]: 'RESUME_UPLOADED', // Mapped to closest
    [LayerEventType.RESUME_SCORED]: 'RESUME_SCORED',
    [LayerEventType.RESUME_REWRITE_APPLIED]: 'RESUME_SCORED',
    [LayerEventType.APPLICATION_CREATED]: 'APPLICATION_CREATED',
    [LayerEventType.APPLICATION_SUBMITTED]: 'APPLICATION_SUBMITTED',
    [LayerEventType.APPLICATION_STATUS_CHANGED]: 'APPLICATION_UPDATED',
    [LayerEventType.APPLICATION_OUTCOME_REPORTED]: 'APPLICATION_UPDATED',
    [LayerEventType.FOLLOW_UP_SENT]: 'APPLICATION_UPDATED',
    [LayerEventType.STRATEGY_MODE_CHANGED]: 'STRATEGY_MODE_CHANGED',
    [LayerEventType.WEEKLY_TARGET_MET]: 'STRATEGY_MODE_CHANGED',
    [LayerEventType.WEEKLY_TARGET_MISSED]: 'STRATEGY_MODE_CHANGED',
    [LayerEventType.STATE_WENT_STALE]: 'SUGGESTION_GENERATED',
    [LayerEventType.STATE_REFRESHED]: 'SUGGESTION_GENERATED',
    [LayerEventType.WEEKLY_PLAN_GENERATED]: 'SUGGESTION_GENERATED',
    [LayerEventType.DAILY_PLAN_GENERATED]: 'SUGGESTION_GENERATED',
    [LayerEventType.TASK_COMPLETED]: 'SUGGESTION_ACCEPTED',
    [LayerEventType.TASK_FAILED]: 'SUGGESTION_REJECTED',
    [LayerEventType.TASK_SKIPPED]: 'SUGGESTION_REJECTED',
    [LayerEventType.PLAN_DEVIATION]: 'SUGGESTION_REJECTED',
    [LayerEventType.FIRST_APPLICATION]: 'APPLICATION_SUBMITTED',
    [LayerEventType.FIRST_INTERVIEW]: 'INTERVIEW_SCHEDULED',
    [LayerEventType.FIRST_OFFER]: 'OFFER_RECEIVED',
  };
  return mapping[eventType] || 'SUGGESTION_GENERATED';
}

/**
 * Map Prisma EventType to LayerEventType (lowercase)
 */
function mapPrismaToLayerEventType(prismaType: string): string {
  return prismaType.toLowerCase();
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
 * Validate date range
 */
function validateDateRange(dateRange?: DateRange): void {
  if (dateRange && dateRange.end < dateRange.start) {
    throw new AnalyticsError(AnalyticsErrorCode.INVALID_DATE_RANGE, {
      start: dateRange.start,
      end: dateRange.end,
    });
  }
}

// ==================== Event Type ====================

/**
 * Mapped event from database
 */
export interface MappedEvent {
  id: string;
  userId: string;
  eventType: string;
  context: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

/**
 * Map database event to our interface
 */
function mapEvent(event: InteractionEvent): MappedEvent {
  return {
    id: event.id,
    userId: event.userId,
    eventType: mapPrismaToLayerEventType(event.eventType),
    context:
      typeof event.context === 'object' && event.context !== null
        ? (event.context as Record<string, unknown>)
        : {},
    metadata:
      typeof event.metadata === 'object' && event.metadata !== null
        ? (event.metadata as Record<string, unknown>)
        : null,
    timestamp: event.timestamp,
  };
}

// ==================== Query Functions ====================

/**
 * Get events by user ID
 *
 * @param userId - User ID to query events for
 * @param options - Query options (date range, limit, etc.)
 * @returns Array of mapped events
 */
export async function getEventsByUser(
  userId: string,
  options: EventQueryOptions = {}
): Promise<MappedEvent[]> {
  validateUserId(userId);

  const dateRange = options.dateRange ?? calculateDateRange(options.lookbackDays);
  validateDateRange(dateRange);

  const limit = Math.min(options.limit ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);

  try {
    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      orderBy: {
        timestamp: options.orderBy === 'asc' ? 'asc' : 'desc',
      },
      take: limit,
      skip: options.offset ?? 0,
    });

    return events.map(mapEvent);
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Get events by event type
 *
 * @param eventType - Event type to filter by (Prisma EventType string)
 * @param options - Query options
 * @returns Array of mapped events
 */
export async function getEventsByType(
  eventType: string,
  options: EventQueryOptions & { userId?: string } = {}
): Promise<MappedEvent[]> {
  const dateRange = options.dateRange ?? calculateDateRange(options.lookbackDays);
  validateDateRange(dateRange);

  const limit = Math.min(options.limit ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);

  try {
    const where: Record<string, unknown> = {
      eventType: eventType.toUpperCase() as PrismaEventType,
      timestamp: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    };

    if (options.userId) {
      validateUserId(options.userId);
      where.userId = options.userId;
    }

    const events = await prisma.interactionEvent.findMany({
      where,
      orderBy: {
        timestamp: options.orderBy === 'asc' ? 'asc' : 'desc',
      },
      take: limit,
      skip: options.offset ?? 0,
    });

    return events.map(mapEvent);
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Get events by date range
 *
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @param options - Additional query options
 * @returns Array of mapped events
 */
export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date,
  options: Omit<EventQueryOptions, 'dateRange' | 'lookbackDays'> & { userId?: string } = {}
): Promise<MappedEvent[]> {
  const dateRange = { start: startDate, end: endDate };
  validateDateRange(dateRange);

  const limit = Math.min(options.limit ?? DEFAULT_QUERY_LIMIT, MAX_QUERY_LIMIT);

  try {
    const where: Record<string, unknown> = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (options.userId) {
      validateUserId(options.userId);
      where.userId = options.userId;
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      const prismaTypes = options.eventTypes.map(mapEventTypeToPrisma);
      where.eventType = { in: prismaTypes };
    }

    const events = await prisma.interactionEvent.findMany({
      where,
      orderBy: {
        timestamp: options.orderBy === 'asc' ? 'asc' : 'desc',
      },
      take: limit,
      skip: options.offset ?? 0,
    });

    return events.map(mapEvent);
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Get recent events for a user
 *
 * @param userId - User ID
 * @param days - Number of days to look back
 * @param limit - Maximum number of events to return
 * @returns Array of mapped events
 */
export async function getRecentEvents(
  userId: string,
  days: number = 7,
  limit: number = 50
): Promise<MappedEvent[]> {
  validateUserId(userId);

  const dateRange = calculateDateRange(days);

  try {
    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: Math.min(limit, MAX_QUERY_LIMIT),
    });

    return events.map(mapEvent);
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Count events by user
 *
 * @param userId - User ID
 * @param options - Query options
 * @returns Event count
 */
export async function countEventsByUser(
  userId: string,
  options: EventQueryOptions = {}
): Promise<number> {
  validateUserId(userId);

  const dateRange = options.dateRange ?? calculateDateRange(options.lookbackDays);
  validateDateRange(dateRange);

  try {
    const count = await prisma.interactionEvent.count({
      where: {
        userId,
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      },
    });

    return count;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}
