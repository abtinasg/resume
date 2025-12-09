import { prisma } from '../db';
import { EventType } from '@prisma/client';

// Re-export Prisma's EventType for convenience
export { EventType };

export interface JourneyMetrics {
  applicationsCreated: number;
  applicationsSubmitted: number;
  interviewsScheduled: number;
  offersReceived: number;
  conversionRate: number;
}

export interface AcceptanceMetrics {
  totalSuggestions: number;
  accepted: number;
  edited: number;
  rejected: number;
  acceptanceRate: number;
  editRate: number;
}

export interface ModeChange {
  timestamp: Date;
  fromMode: string | null;
  toMode: string;
  reason: string;
  metrics: any;
}

export class EventLogger {
  async log(params: {
    userId: string;
    eventType: EventType;
    context: any;
    metadata?: any;
  }) {
    return prisma.interactionEvent.create({
      data: {
        userId: params.userId,
        eventType: params.eventType,
        context: params.context,
        metadata: params.metadata || {},
      },
    });
  }

  async getUserEvents(userId: string, limit = 100) {
    return prisma.interactionEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getEventsByType(userId: string, eventType: EventType) {
    return prisma.interactionEvent.findMany({
      where: { userId, eventType },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getRecentEvents(userId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getEventStats(userId: string, since?: Date) {
    const where = {
      userId,
      ...(since && { timestamp: { gte: since } }),
    };

    const grouped = await prisma.interactionEvent.groupBy({
      by: ['eventType'],
      where,
      _count: true,
    });

    return grouped.reduce((acc, item) => {
      acc[item.eventType] = item._count;
      return acc;
    }, {} as Record);
  }

  async getApplicationJourney(userId: string, days = 30): Promise<JourneyMetrics> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: { gte: since },
        eventType: {
          in: [
            'APPLICATION_CREATED',
            'APPLICATION_SUBMITTED',
            'INTERVIEW_SCHEDULED',
            'OFFER_RECEIVED',
          ],
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const counts = events.reduce((acc, e) => {
      acc[e.eventType] = (acc[e.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      applicationsCreated: counts.APPLICATION_CREATED || 0,
      applicationsSubmitted: counts.APPLICATION_SUBMITTED || 0,
      interviewsScheduled: counts.INTERVIEW_SCHEDULED || 0,
      offersReceived: counts.OFFER_RECEIVED || 0,
      conversionRate:
        counts.APPLICATION_SUBMITTED > 0
          ? ((counts.INTERVIEW_SCHEDULED || 0) / counts.APPLICATION_SUBMITTED) * 100
          : 0,
    };
  }

  async getRewriteAcceptanceRate(userId: string, days = 30): Promise<AcceptanceMetrics> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        timestamp: { gte: since },
        eventType: {
          in: ['SUGGESTION_ACCEPTED', 'SUGGESTION_REJECTED', 'SUGGESTION_EDITED'],
        },
      },
    });

    const accepted = events.filter(e => e.eventType === 'SUGGESTION_ACCEPTED').length;
    const edited = events.filter(e => e.eventType === 'SUGGESTION_EDITED').length;
    const rejected = events.filter(e => e.eventType === 'SUGGESTION_REJECTED').length;
    const total = events.length;

    return {
      totalSuggestions: total,
      accepted,
      edited,
      rejected,
      acceptanceRate: total > 0 ? (accepted / total) * 100 : 0,
      editRate: total > 0 ? (edited / total) * 100 : 0,
    };
  }

  async getStrategyModeTimeline(userId: string): Promise<ModeChange[]> {
    const events = await prisma.interactionEvent.findMany({
      where: {
        userId,
        eventType: 'STRATEGY_MODE_CHANGED',
      },
      orderBy: { timestamp: 'asc' },
    });

    return events.map(e => ({
      timestamp: e.timestamp,
      fromMode: (e.context as any).fromMode || null,
      toMode: (e.context as any).toMode,
      reason: (e.context as any).reason || '',
      metrics: e.metadata || {},
    }));
  }
}

export const eventLogger = new EventLogger();
