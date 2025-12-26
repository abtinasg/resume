/**
 * Layer 7 - Learning Engine Foundation
 * Metrics Tests
 */

import {
  calculateApplicationMetrics,
  calculateResumeMetrics,
  calculateStrategyMetrics,
  getCurrentResumeScore,
  getScoreHistory,
  calculateScoreChange,
  getApplicationCountByStatus,
  calculateWeeklyApplicationRate,
  getCurrentStrategyMode,
  getModeTransitionCount,
} from '../metrics';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { StrategyMode } from '../../shared/types';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    application: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    resumeVersion: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    interactionEvent: {
      count: jest.fn(),
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

describe('Layer 7 Metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateApplicationMetrics', () => {
    it('should calculate metrics correctly with applications', async () => {
      const mockApplications = [
        {
          id: 'app1',
          status: 'submitted',
          appliedAt: new Date('2024-01-10'),
          createdAt: new Date('2024-01-10'),
          interviewScheduledAt: new Date('2024-01-15'),
          offerReceivedAt: null,
          rejectedAt: null,
        },
        {
          id: 'app2',
          status: 'submitted',
          appliedAt: new Date('2024-01-11'),
          createdAt: new Date('2024-01-11'),
          interviewScheduledAt: null,
          offerReceivedAt: null,
          rejectedAt: new Date('2024-01-18'),
        },
        {
          id: 'app3',
          status: 'submitted',
          appliedAt: new Date('2024-01-12'),
          createdAt: new Date('2024-01-12'),
          interviewScheduledAt: new Date('2024-01-20'),
          offerReceivedAt: new Date('2024-01-25'),
          rejectedAt: null,
        },
      ];

      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);

      const metrics = await calculateApplicationMetrics('user123', { lookbackDays: 30 });

      expect(metrics.totalApplications).toBe(3);
      expect(metrics.interviewsReceived).toBe(2);
      expect(metrics.offersReceived).toBe(1);
      expect(metrics.rejectionCount).toBe(1);
      expect(metrics.interviewRate).toBeCloseTo(2 / 3);
      expect(metrics.offerRate).toBeCloseTo(1 / 2);
      expect(metrics.overallConversionRate).toBeCloseTo(1 / 3);
    });

    it('should handle zero applications', async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

      const metrics = await calculateApplicationMetrics('user123', { lookbackDays: 30 });

      expect(metrics.totalApplications).toBe(0);
      expect(metrics.interviewRate).toBe(0);
      expect(metrics.offerRate).toBe(0);
      expect(metrics.avgDaysToResponse).toBeNull();
    });

    it('should throw error for invalid user ID', async () => {
      await expect(calculateApplicationMetrics('')).rejects.toThrow(AnalyticsError);
      await expect(calculateApplicationMetrics('')).rejects.toMatchObject({
        code: AnalyticsErrorCode.INVALID_USER_ID,
      });
    });

    it('should calculate average days to response', async () => {
      const mockApplications = [
        {
          id: 'app1',
          status: 'submitted',
          appliedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          interviewScheduledAt: new Date('2024-01-06'), // 5 days
          offerReceivedAt: null,
          rejectedAt: null,
        },
        {
          id: 'app2',
          status: 'submitted',
          appliedAt: new Date('2024-01-01'),
          createdAt: new Date('2024-01-01'),
          interviewScheduledAt: null,
          offerReceivedAt: null,
          rejectedAt: new Date('2024-01-11'), // 10 days
        },
      ];

      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);

      const metrics = await calculateApplicationMetrics('user123', { lookbackDays: 30 });

      expect(metrics.avgDaysToResponse).toBeCloseTo(7.5); // (5 + 10) / 2
    });
  });

  describe('calculateResumeMetrics', () => {
    it('should calculate resume improvement metrics', async () => {
      const mockResumes = [
        {
          id: 'r1',
          overallScore: 60,
          createdAt: new Date('2024-01-01'),
          versionNumber: 1,
        },
        {
          id: 'r2',
          overallScore: 70,
          createdAt: new Date('2024-01-10'),
          versionNumber: 2,
        },
        {
          id: 'r3',
          overallScore: 75,
          createdAt: new Date('2024-01-15'),
          versionNumber: 3,
        },
      ];

      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue(mockResumes);
      (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(3);

      const metrics = await calculateResumeMetrics('user123', { lookbackDays: 30 });

      expect(metrics.initialScore).toBe(60);
      expect(metrics.currentScore).toBe(75);
      expect(metrics.improvementPercentage).toBeCloseTo(25); // (75-60)/60 * 100
      expect(metrics.rewritesApplied).toBe(3);
      expect(metrics.scoreHistory).toHaveLength(3);
    });

    it('should handle no resume versions', async () => {
      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(0);
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(null);

      const metrics = await calculateResumeMetrics('user123', { lookbackDays: 30 });

      expect(metrics.initialScore).toBeNull();
      expect(metrics.currentScore).toBeNull();
      expect(metrics.improvementPercentage).toBeNull();
      expect(metrics.rewritesApplied).toBe(0);
    });

    it('should get current score from master resume if no versions in period', async () => {
      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.interactionEvent.count as jest.Mock).mockResolvedValue(0);
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue({
        overallScore: 80,
      });

      const metrics = await calculateResumeMetrics('user123', { lookbackDays: 30 });

      expect(metrics.currentScore).toBe(80);
    });
  });

  describe('getCurrentResumeScore', () => {
    it('should return current score from master resume', async () => {
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue({
        overallScore: 85,
      });

      const score = await getCurrentResumeScore('user123');

      expect(score).toBe(85);
    });

    it('should return null if no master resume', async () => {
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(null);

      const score = await getCurrentResumeScore('user123');

      expect(score).toBeNull();
    });
  });

  describe('getScoreHistory', () => {
    it('should return score history in chronological order', async () => {
      const mockResumes = [
        { id: 'r3', overallScore: 80, createdAt: new Date('2024-01-03') },
        { id: 'r2', overallScore: 70, createdAt: new Date('2024-01-02') },
        { id: 'r1', overallScore: 60, createdAt: new Date('2024-01-01') },
      ];

      (prisma.resumeVersion.findMany as jest.Mock).mockResolvedValue(mockResumes);

      const history = await getScoreHistory('user123');

      // Should be reversed to chronological order
      expect(history[0].score).toBe(60);
      expect(history[2].score).toBe(80);
    });
  });

  describe('calculateScoreChange', () => {
    it('should calculate score change over period', async () => {
      (prisma.resumeVersion.findFirst as jest.Mock)
        .mockResolvedValueOnce({ overallScore: 60 }) // earliest
        .mockResolvedValueOnce({ overallScore: 75 }); // latest

      const change = await calculateScoreChange('user123', 30);

      expect(change).toBe(15);
    });

    it('should return null if no scores in period', async () => {
      (prisma.resumeVersion.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const change = await calculateScoreChange('user123', 30);

      expect(change).toBeNull();
    });
  });

  describe('calculateStrategyMetrics', () => {
    it('should calculate outcomes per mode', async () => {
      const mockHistory = [
        {
          id: 'sh1',
          strategyMode: 'APPLY_MODE',
          activatedAt: new Date('2024-01-01'),
          deactivatedAt: new Date('2024-01-15'),
          reason: 'User ready to apply',
        },
      ];

      const mockApplications = [
        {
          id: 'app1',
          status: 'submitted',
          interviewScheduledAt: new Date('2024-01-10'),
          offerReceivedAt: null,
          createdAt: new Date('2024-01-05'),
          metadata: { strategyMode: 'APPLY_MODE' },
        },
        {
          id: 'app2',
          status: 'submitted',
          interviewScheduledAt: null,
          offerReceivedAt: null,
          createdAt: new Date('2024-01-06'),
          metadata: { strategyMode: 'APPLY_MODE' },
        },
      ];

      (prisma.strategyHistory.findMany as jest.Mock).mockResolvedValue(mockHistory);
      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApplications);
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        currentStrategyMode: 'APPLY_MODE',
      });

      const metrics = await calculateStrategyMetrics('user123', { lookbackDays: 30 });

      const applyModeOutcome = metrics.outcomesPerMode.find(o => o.mode === 'APPLY_MODE');
      expect(applyModeOutcome?.applicationsCount).toBe(2);
      expect(applyModeOutcome?.interviewsCount).toBe(1);
      expect(applyModeOutcome?.interviewRate).toBe(0.5);
    });

    it('should track mode transitions', async () => {
      const mockHistory = [
        {
          id: 'sh1',
          strategyMode: 'IMPROVE_RESUME_FIRST',
          activatedAt: new Date('2024-01-01'),
          deactivatedAt: new Date('2024-01-10'),
          reason: 'Initial mode',
        },
        {
          id: 'sh2',
          strategyMode: 'APPLY_MODE',
          activatedAt: new Date('2024-01-10'),
          deactivatedAt: null,
          reason: 'Ready to apply',
        },
      ];

      (prisma.strategyHistory.findMany as jest.Mock).mockResolvedValue(mockHistory);
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        currentStrategyMode: 'APPLY_MODE',
      });

      const metrics = await calculateStrategyMetrics('user123', { lookbackDays: 30 });

      expect(metrics.modeTransitions).toHaveLength(1);
      expect(metrics.modeTransitions[0].from).toBe('IMPROVE_RESUME_FIRST');
      expect(metrics.modeTransitions[0].to).toBe('APPLY_MODE');
    });
  });

  describe('getCurrentStrategyMode', () => {
    it('should return current mode from profile', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue({
        currentStrategyMode: 'APPLY_MODE',
      });

      const mode = await getCurrentStrategyMode('user123');

      expect(mode).toBe(StrategyMode.APPLY_MODE);
    });

    it('should return null if no profile', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const mode = await getCurrentStrategyMode('user123');

      expect(mode).toBeNull();
    });
  });

  describe('getModeTransitionCount', () => {
    it('should count mode transitions', async () => {
      // 3 strategy history entries = 2 transitions
      (prisma.strategyHistory.count as jest.Mock).mockResolvedValue(3);

      const count = await getModeTransitionCount('user123');

      expect(count).toBe(2);
    });

    it('should return 0 if only one entry', async () => {
      (prisma.strategyHistory.count as jest.Mock).mockResolvedValue(1);

      const count = await getModeTransitionCount('user123');

      expect(count).toBe(0);
    });
  });

  describe('getApplicationCountByStatus', () => {
    it('should count applications with specific status', async () => {
      (prisma.application.count as jest.Mock).mockResolvedValue(5);

      const count = await getApplicationCountByStatus('user123', 'submitted');

      expect(count).toBe(5);
      expect(prisma.application.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'submitted',
          }),
        })
      );
    });
  });

  describe('calculateWeeklyApplicationRate', () => {
    it('should calculate average applications per week', async () => {
      // 12 applications over 4 weeks = 3 per week
      (prisma.application.count as jest.Mock).mockResolvedValue(12);

      const rate = await calculateWeeklyApplicationRate('user123', 4);

      expect(rate).toBe(3);
    });
  });
});
