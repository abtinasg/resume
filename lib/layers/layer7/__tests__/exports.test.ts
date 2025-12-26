/**
 * Layer 7 - Learning Engine Foundation
 * Exports Tests
 */

import {
  exportUserActivity,
  exportMetrics,
  exportAll,
  exportApplicationsCSV,
  exportMetricsCSV,
  exportEventsCSV,
  generateWeeklySummary,
  generateMonthlySummary,
  generateTextSummary,
} from '../exports';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    interactionEvent: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    application: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    resumeVersion: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    strategyHistory: {
      findMany: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

describe('Layer 7 Exports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(0);
    (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.application.count as jest.Mock).mockResolvedValue(0);
    (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.strategyHistory.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
      currentStrategyMode: 'IMPROVE_RESUME_FIRST',
    });
  });

  describe('JSON Exporter', () => {
    describe('exportUserActivity', () => {
      it('should export user activity as JSON', async () => {
        const mockEvents = [
          {
            id: 'event1',
            userId: 'user123',
            eventType: 'APPLICATION_SUBMITTED',
            context: { jobId: 'job1' },
            metadata: null,
            timestamp: new Date('2024-01-15'),
          },
        ];

        (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        const result = await exportUserActivity('user123', {
          lookbackDays: 30,
        });

        expect(result.format).toBe('json');
        expect(result.recordCount).toBe(1);
        expect(typeof result.data).toBe('string');

        const parsed = JSON.parse(result.data);
        expect(parsed.userId).toBe('user123');
        expect(parsed.eventCount).toBe(1);
      });

      it('should respect prettyPrint option', async () => {
        (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

        const prettyResult = await exportUserActivity('user123', {
          prettyPrint: true,
        });

        const compactResult = await exportUserActivity('user123', {
          prettyPrint: false,
        });

        // Pretty print should have newlines
        expect(prettyResult.data.includes('\n')).toBe(true);
        // Compact should not
        expect(compactResult.data.includes('\n')).toBe(false);
      });

      it('should throw error for invalid user ID', async () => {
        await expect(exportUserActivity('')).rejects.toThrow(AnalyticsError);
      });
    });

    describe('exportMetrics', () => {
      it('should export metrics as JSON', async () => {
        const result = await exportMetrics('user123', { lookbackDays: 30 });

        expect(result.format).toBe('json');

        const parsed = JSON.parse(result.data);
        expect(parsed.metrics).toBeDefined();
        expect(parsed.metrics.applications).toBeDefined();
        expect(parsed.metrics.resume).toBeDefined();
        expect(parsed.metrics.strategy).toBeDefined();
      });
    });

    describe('exportAll', () => {
      it('should export all data including summary', async () => {
        const result = await exportAll('user123', { lookbackDays: 30 });

        expect(result.format).toBe('json');

        const parsed = JSON.parse(result.data);
        expect(parsed.summary).toBeDefined();
        expect(parsed.metrics).toBeDefined();
      });
    });
  });

  describe('CSV Exporter', () => {
    describe('exportApplicationsCSV', () => {
      it('should export application events as CSV', async () => {
        const mockEvents = [
          {
            id: 'event1',
            userId: 'user123',
            eventType: 'application_submitted',
            context: { jobId: 'job1', status: 'submitted' },
            metadata: null,
            timestamp: new Date('2024-01-15'),
          },
        ];

        (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        const result = await exportApplicationsCSV('user123', {
          lookbackDays: 30,
        });

        expect(result.format).toBe('csv');
        expect(result.data).toContain('event_id');
        expect(result.data).toContain('event_type');
      });

      it('should handle empty data', async () => {
        (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

        const result = await exportApplicationsCSV('user123');

        expect(result.format).toBe('csv');
        expect(result.recordCount).toBe(0);
      });
    });

    describe('exportMetricsCSV', () => {
      it('should export metrics as CSV rows', async () => {
        const result = await exportMetricsCSV('user123', { lookbackDays: 30 });

        expect(result.format).toBe('csv');
        expect(result.data).toContain('category');
        expect(result.data).toContain('metric');
        expect(result.data).toContain('value');
        expect(result.data).toContain('applications');
        expect(result.data).toContain('resume');
      });
    });

    describe('exportEventsCSV', () => {
      it('should export events as CSV', async () => {
        const mockEvents = [
          {
            id: 'event1',
            userId: 'user123',
            eventType: 'RESUME_SCORED',
            context: { score: 85 },
            metadata: null,
            timestamp: new Date('2024-01-15'),
          },
        ];

        (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

        const result = await exportEventsCSV('user123', { lookbackDays: 30 });

        expect(result.format).toBe('csv');
        expect(result.recordCount).toBe(1);
      });
    });
  });

  describe('Report Generator', () => {
    describe('generateWeeklySummary', () => {
      it('should generate weekly summary report', async () => {
        const report = await generateWeeklySummary('user123');

        expect(report.userId).toBe('user123');
        expect(report.weekStart).toBeInstanceOf(Date);
        expect(report.weekEnd).toBeInstanceOf(Date);
        expect(report.summary).toBeDefined();
        expect(report.highlights).toBeInstanceOf(Array);
        expect(report.concerns).toBeInstanceOf(Array);
        expect(report.metrics).toBeDefined();
      });

      it('should include markdown formatting in summary', async () => {
        const report = await generateWeeklySummary('user123');

        expect(report.summary).toContain('#');
        expect(report.summary).toContain('Key Metrics');
      });

      it('should handle week offset', async () => {
        const currentWeek = await generateWeeklySummary('user123', 0);
        const lastWeek = await generateWeeklySummary('user123', 1);

        expect(currentWeek.weekStart.getTime()).toBeGreaterThan(
          lastWeek.weekStart.getTime()
        );
      });
    });

    describe('generateMonthlySummary', () => {
      it('should generate monthly summary report', async () => {
        const report = await generateMonthlySummary('user123');

        expect(report.userId).toBe('user123');
        expect(report.monthStart).toBeInstanceOf(Date);
        expect(report.monthEnd).toBeInstanceOf(Date);
        expect(report.summary).toBeDefined();
        expect(report.trends).toBeDefined();
        expect(report.trends.applicationTrend).toBeDefined();
        expect(report.trends.scoreTrend).toBeDefined();
      });

      it('should include trend indicators', async () => {
        const report = await generateMonthlySummary('user123');

        expect(['increasing', 'decreasing', 'stable']).toContain(
          report.trends.applicationTrend
        );
      });
    });

    describe('generateTextSummary', () => {
      it('should generate plain text summary', async () => {
        const summary = await generateTextSummary('user123', 7);

        expect(typeof summary).toBe('string');
        expect(summary).toContain('Summary');
        expect(summary).toContain('Applications');
        expect(summary).toContain('Interview Rate');
      });

      it('should respect days parameter', async () => {
        const summary = await generateTextSummary('user123', 30);

        expect(summary).toContain('30 days');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw AnalyticsError for invalid user in JSON export', async () => {
      await expect(exportUserActivity('')).rejects.toThrow(AnalyticsError);
      await expect(exportUserActivity('')).rejects.toMatchObject({
        code: AnalyticsErrorCode.INVALID_USER_ID,
      });
    });

    it('should throw AnalyticsError for invalid user in CSV export', async () => {
      await expect(exportMetricsCSV('')).rejects.toThrow(AnalyticsError);
    });

    it('should throw AnalyticsError for invalid user in report generation', async () => {
      await expect(generateWeeklySummary('')).rejects.toThrow(AnalyticsError);
    });
  });
});
