import { prisma } from '../db';
import { EventType } from '@prisma/client';

// Re-export Prisma's EventType for convenience
export { EventType };

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
}

export const eventLogger = new EventLogger();
