/**
 * Layer 7 - Learning Engine Foundation
 * Queries Tests
 */

import {
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
} from '../queries';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    interactionEvent: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

describe('Layer 7 Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventsByUser', () => {
    it('should return events for a valid user', async () => {
      const mockEvents = [
        {
          id: 'event1',
          userId: 'user123',
          eventType: 'APPLICATION_SUBMITTED',
          context: { jobId: 'job1' },
          metadata: null,
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'event2',
          userId: 'user123',
          eventType: 'RESUME_SCORED',
          context: { score: 85 },
          metadata: null,
          timestamp: new Date('2024-01-14'),
        },
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await getEventsByUser('user123', { lookbackDays: 30 });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event1');
      expect(result[0].eventType).toBe('application_submitted');
      expect(prisma.interactionEvent.findMany).toHaveBeenCalled();
    });

    it('should throw error for invalid user ID', async () => {
      await expect(getEventsByUser('')).rejects.toThrow(AnalyticsError);
      await expect(getEventsByUser('')).rejects.toMatchObject({
        code: AnalyticsErrorCode.INVALID_USER_ID,
      });
    });

    it('should respect limit option', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getEventsByUser('user123', { limit: 50 });

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should apply date range filter', async () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getEventsByUser('user123', { dateRange: { start, end } });

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: start,
              lte: end,
            },
          }),
        })
      );
    });
  });

  describe('getEventsByType', () => {
    it('should filter events by type', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getEventsByType('APPLICATION_SUBMITTED', { lookbackDays: 30 });

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eventType: 'APPLICATION_SUBMITTED',
          }),
        })
      );
    });

    it('should optionally filter by user ID', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getEventsByType('RESUME_SCORED', {
        userId: 'user123',
        lookbackDays: 30,
      });

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user123',
          }),
        })
      );
    });
  });

  describe('getEventsByDateRange', () => {
    it('should query events within date range', async () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-15');

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getEventsByDateRange(start, end);

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: start,
              lte: end,
            },
          }),
        })
      );
    });

    it('should throw for invalid date range', async () => {
      const start = new Date('2024-01-15');
      const end = new Date('2024-01-01'); // End before start

      await expect(getEventsByDateRange(start, end)).rejects.toThrow(AnalyticsError);
      await expect(getEventsByDateRange(start, end)).rejects.toMatchObject({
        code: AnalyticsErrorCode.INVALID_DATE_RANGE,
      });
    });
  });

  describe('getRecentEvents', () => {
    it('should return recent events with default limit', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getRecentEvents('user123', 7);

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50, // Default limit
          orderBy: { timestamp: 'desc' },
        })
      );
    });

    it('should respect custom limit', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await getRecentEvents('user123', 7, 25);

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
        })
      );
    });
  });

  describe('countEventsByUser', () => {
    it('should count events for a user', async () => {
      (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(42);

      const count = await countEventsByUser('user123', { lookbackDays: 30 });

      expect(count).toBe(42);
      expect(prisma.interactionEvent.count).toHaveBeenCalled();
    });
  });

  describe('countEventsByType', () => {
    it('should group and count events by type', async () => {
      const mockEvents = [
        { eventType: 'APPLICATION_SUBMITTED' },
        { eventType: 'APPLICATION_SUBMITTED' },
        { eventType: 'RESUME_SCORED' },
        { eventType: 'INTERVIEW_SCHEDULED' },
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const counts = await countEventsByType('user123');

      expect(counts).toHaveLength(3);
      expect(counts.find(c => c.eventType === 'APPLICATION_SUBMITTED')?.count).toBe(2);
      expect(counts.find(c => c.eventType === 'RESUME_SCORED')?.count).toBe(1);
    });

    it('should sort by count descending', async () => {
      const mockEvents = [
        { eventType: 'A' },
        { eventType: 'B' },
        { eventType: 'B' },
        { eventType: 'B' },
        { eventType: 'C' },
        { eventType: 'C' },
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const counts = await countEventsByType('user123');

      expect(counts[0].eventType).toBe('B');
      expect(counts[0].count).toBe(3);
      expect(counts[1].eventType).toBe('C');
      expect(counts[1].count).toBe(2);
    });
  });

  describe('countEventsByDate', () => {
    it('should bucket events by day', async () => {
      const mockEvents = [
        { timestamp: new Date('2024-01-15T10:00:00Z') },
        { timestamp: new Date('2024-01-15T14:00:00Z') },
        { timestamp: new Date('2024-01-16T09:00:00Z') },
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const counts = await countEventsByDate('user123', undefined, 'daily');

      expect(counts).toHaveLength(2);
      expect(counts[0].bucket).toBe('daily');
    });

    it('should bucket events by week', async () => {
      const mockEvents = [
        { timestamp: new Date('2024-01-15') },
        { timestamp: new Date('2024-01-16') },
        { timestamp: new Date('2024-01-22') },
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const counts = await countEventsByDate('user123', undefined, 'weekly');

      expect(counts.every(c => c.bucket === 'weekly')).toBe(true);
    });
  });

  describe('groupEventsByStrategy', () => {
    it('should group events by strategy mode from context', async () => {
      const mockEvents = [
        { id: 'e1', context: { strategyMode: 'APPLY_MODE' } },
        { id: 'e2', context: { strategyMode: 'APPLY_MODE' } },
        { id: 'e3', context: { strategyMode: 'IMPROVE_RESUME_FIRST' } },
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const groups = await groupEventsByStrategy('user123');

      const applyMode = groups.find(g => g.mode === 'APPLY_MODE');
      expect(applyMode?.eventCount).toBe(2);

      const improveMode = groups.find(g => g.mode === 'IMPROVE_RESUME_FIRST');
      expect(improveMode?.eventCount).toBe(1);
    });

    it('should include all modes even if empty', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      const groups = await groupEventsByStrategy('user123');

      expect(groups).toHaveLength(3); // All three modes
      expect(groups.every(g => g.eventCount === 0)).toBe(true);
    });
  });

  describe('getTotalEventCount', () => {
    it('should return total count', async () => {
      (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(100);

      const count = await getTotalEventCount('user123');

      expect(count).toBe(100);
    });
  });

  describe('getEventCountsRecord', () => {
    it('should return counts as a record', async () => {
      const mockEvents = [
        { eventType: 'A' },
        { eventType: 'A' },
        { eventType: 'B' },
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const record = await getEventCountsRecord('user123');

      expect(record).toEqual({
        A: 2,
        B: 1,
      });
    });
  });
});
