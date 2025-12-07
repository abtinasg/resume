import { prisma } from '../db';

export type EventType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_UPDATED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_COMPLETED'
  | 'OFFER_RECEIVED'
  | 'SUGGESTION_GENERATED'
  | 'SUGGESTION_ACCEPTED'
  | 'SUGGESTION_REJECTED'
  | 'STRATEGY_MODE_CHANGED'
  | 'JOB_DISCOVERED'
  | 'JOB_SCORED'
  | 'RESUME_UPLOADED'
  | 'RESUME_SCORED';

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
}

export const eventLogger = new EventLogger();
