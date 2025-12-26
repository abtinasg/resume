/**
 * Layer 7 - Learning Engine Foundation
 * Integration Tests
 */

import {
  getMetrics,
  getActivitySummary,
  exportData,
  getWeeklyReport,
  getMonthlyReport,
  getQuickSummary,
  getResumeScore,
  AnalyticsService,
  createAnalyticsService,
} from '../analytics';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { loadConfig, getDefaultLookbackDays } from '../config';

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
      count: jest.fn(),
    },
    userProfile: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

describe('Layer 7 Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up comprehensive mock responses
    (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'event1',
        userId: 'user123',
        eventType: 'APPLICATION_SUBMITTED',
        context: { jobId: 'job1', strategyMode: 'APPLY_MODE' },
        metadata: null,
        timestamp: new Date('2024-01-15'),
      },
      {
        id: 'event2',
        userId: 'user123',
        eventType: 'RESUME_SCORED',
        context: { score: 80 },
        metadata: null,
        timestamp: new Date('2024-01-14'),
      },
    ]);
    (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(2);

    (prisma.application.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'app1',
        status: 'submitted',
        appliedAt: new Date('2024-01-10'),
        createdAt: new Date('2024-01-10'),
        interviewScheduledAt: new Date('2024-01-15'),
        offerReceivedAt: null,
        rejectedAt: null,
        metadata: { strategyMode: 'APPLY_MODE' },
      },
      {
        id: 'app2',
        status: 'submitted',
        appliedAt: new Date('2024-01-11'),
        createdAt: new Date('2024-01-11'),
        interviewScheduledAt: null,
        offerReceivedAt: null,
        rejectedAt: new Date('2024-01-18'),
        metadata: null,
      },
    ]);
    (prisma.application.count as jest.Mock).mockResolvedValue(2);

    (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'r1',
        overallScore: 70,
        createdAt: new Date('2024-01-01'),
        versionNumber: 1,
      },
      {
        id: 'r2',
        overallScore: 80,
        createdAt: new Date('2024-01-10'),
        versionNumber: 2,
      },
    ]);
    (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue({
      overallScore: 80,
    });

    (prisma.strategyHistory.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'sh1',
        strategyMode: 'APPLY_MODE',
        activatedAt: new Date('2024-01-01'),
        deactivatedAt: null,
        reason: 'Ready to apply',
      },
    ]);
    (prisma.strategyHistory.count as jest.Mock).mockResolvedValue(1);

    (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
      currentStrategyMode: 'APPLY_MODE',
    });
  });

  describe('Analytics Facade', () => {
    describe('getMetrics', () => {
      it('should return aggregated metrics from all sources', async () => {
        const metrics = await getMetrics('user123', { lookbackDays: 30 });

        expect(metrics).toBeDefined();
        expect(metrics.applications).toBeDefined();
        expect(metrics.resume).toBeDefined();
        expect(metrics.strategy).toBeDefined();
        expect(metrics.period).toBeDefined();
        expect(metrics.calculatedAt).toBeInstanceOf(Date);
      });

      it('should calculate correct application metrics', async () => {
        const metrics = await getMetrics('user123', { lookbackDays: 30 });

        expect(metrics.applications.totalApplications).toBe(2);
        expect(metrics.applications.interviewsReceived).toBe(1);
        expect(metrics.applications.rejectionCount).toBe(1);
      });

      it('should calculate correct resume metrics', async () => {
        const metrics = await getMetrics('user123', { lookbackDays: 30 });

        expect(metrics.resume.initialScore).toBe(70);
        expect(metrics.resume.currentScore).toBe(80);
        expect(metrics.resume.scoreHistory).toHaveLength(2);
      });

      it('should throw error for invalid user', async () => {
        await expect(getMetrics('')).rejects.toThrow(AnalyticsError);
        await expect(getMetrics('')).rejects.toMatchObject({
          code: AnalyticsErrorCode.INVALID_USER_ID,
        });
      });
    });

    describe('getActivitySummary', () => {
      it('should return comprehensive activity summary', async () => {
        const summary = await getActivitySummary('user123', 30);

        expect(summary.userId).toBe('user123');
        expect(summary.totalEvents).toBeDefined();
        expect(summary.eventsByType).toBeDefined();
        expect(summary.applicationMetrics).toBeDefined();
        expect(summary.resumeMetrics).toBeDefined();
        expect(summary.strategyMetrics).toBeDefined();
        expect(summary.generatedAt).toBeInstanceOf(Date);
      });
    });

    describe('exportData', () => {
      it('should export as JSON by default', async () => {
        const result = await exportData('user123', 'json');

        expect(result.format).toBe('json');
        expect(typeof result.data).toBe('string');
        
        const parsed = JSON.parse(result.data);
        expect(parsed.userId).toBe('user123');
      });

      it('should export as CSV when specified', async () => {
        const result = await exportData('user123', 'csv');

        expect(result.format).toBe('csv');
        expect(result.data).toContain('category');
        expect(result.data).toContain('metric');
      });
    });

    describe('getWeeklyReport', () => {
      it('should return a weekly report', async () => {
        const report = await getWeeklyReport('user123');

        expect(report.userId).toBe('user123');
        expect(report.weekStart).toBeInstanceOf(Date);
        expect(report.weekEnd).toBeInstanceOf(Date);
        expect(report.summary).toBeDefined();
      });
    });

    describe('getMonthlyReport', () => {
      it('should return a monthly report', async () => {
        const report = await getMonthlyReport('user123');

        expect(report.userId).toBe('user123');
        expect(report.monthStart).toBeInstanceOf(Date);
        expect(report.monthEnd).toBeInstanceOf(Date);
        expect(report.summary).toBeDefined();
        expect(report.trends).toBeDefined();
      });
    });

    describe('getQuickSummary', () => {
      it('should return a quick text summary', async () => {
        const summary = await getQuickSummary('user123', 7);

        expect(typeof summary).toBe('string');
        expect(summary).toContain('Summary');
      });
    });

    describe('getResumeScore', () => {
      it('should return current resume score', async () => {
        const score = await getResumeScore('user123');

        expect(score).toBe(80);
      });
    });
  });

  describe('AnalyticsService Class', () => {
    it('should create service with valid user ID', () => {
      const service = createAnalyticsService('user123');
      expect(service).toBeInstanceOf(AnalyticsService);
    });

    it('should throw for invalid user ID', () => {
      expect(() => createAnalyticsService('')).toThrow(AnalyticsError);
    });

    it('should get metrics through service', async () => {
      const service = createAnalyticsService('user123');
      const metrics = await service.getMetrics({ lookbackDays: 30 });

      expect(metrics.applications).toBeDefined();
    });

    it('should get activity summary through service', async () => {
      const service = createAnalyticsService('user123');
      const summary = await service.getActivitySummary(30);

      expect(summary.userId).toBe('user123');
    });

    it('should export data through service', async () => {
      const service = createAnalyticsService('user123');
      const result = await service.exportData('json');

      expect(result.format).toBe('json');
    });

    it('should get reports through service', async () => {
      const service = createAnalyticsService('user123');
      
      const weekly = await service.getWeeklyReport();
      expect(weekly.summary).toBeDefined();

      const monthly = await service.getMonthlyReport();
      expect(monthly.summary).toBeDefined();
    });

    it('should get resume score through service', async () => {
      const service = createAnalyticsService('user123');
      const score = await service.getResumeScore();

      expect(score).toBe(80);
    });
  });

  describe('Configuration', () => {
    it('should load config successfully', () => {
      const config = loadConfig();

      expect(config).toBeDefined();
      expect(config.version).toBe('1.0');
      expect(config.metrics.defaultLookbackDays).toBe(30);
      expect(config.exports.maxEventsPerExport).toBe(10000);
    });

    it('should return default lookback days', () => {
      const days = getDefaultLookbackDays();

      expect(days).toBe(30);
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full analytics workflow', async () => {
      // Step 1: Get metrics
      const metrics = await getMetrics('user123', { lookbackDays: 30 });
      expect(metrics.applications.totalApplications).toBeGreaterThanOrEqual(0);

      // Step 2: Get activity summary
      const summary = await getActivitySummary('user123', 30);
      expect(summary.totalEvents).toBeGreaterThanOrEqual(0);

      // Step 3: Generate reports
      const weeklyReport = await getWeeklyReport('user123');
      expect(weeklyReport.summary).toBeDefined();

      const monthlyReport = await getMonthlyReport('user123');
      expect(monthlyReport.summary).toBeDefined();

      // Step 4: Export data
      const jsonExport = await exportData('user123', 'json', {
        lookbackDays: 30,
      });
      expect(jsonExport.format).toBe('json');

      const csvExport = await exportData('user123', 'csv', {
        lookbackDays: 30,
      });
      expect(csvExport.format).toBe('csv');

      // Step 5: Get quick summary
      const quickSummary = await getQuickSummary('user123', 7);
      expect(quickSummary).toContain('Summary');
    });

    it('should handle user with no data gracefully', async () => {
      // Reset mocks to return empty data
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(0);
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);
      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.strategyHistory.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await getMetrics('user123', { lookbackDays: 30 });

      expect(metrics.applications.totalApplications).toBe(0);
      expect(metrics.applications.interviewRate).toBe(0);
      expect(metrics.resume.currentScore).toBeNull();
    });
  });
});
