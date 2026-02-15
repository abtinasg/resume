/**
 * Layer 4 - State & Pipeline Layer
 * Queries Tests
 *
 * Comprehensive tests for all query functions in the Layer 4 state management module.
 */

import {
  getUserProfile,
  calculateUserMetrics,
  getCurrentResume,
  getUserStateSnapshot,
  queryApplications,
  getApplicationsNeedingFollowUp,
  queryEvents,
  updateStrategyMode,
  logEvent,
} from '../queries';

import {
  StrategyMode,
  LayerEventType,
  LayerApplicationStatus,
} from '../../shared/types';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    userProfile: { findUnique: jest.fn(), update: jest.fn() },
    resumeVersion: { findFirst: jest.fn(), findMany: jest.fn() },
    application: { findMany: jest.fn(), count: jest.fn() },
    interactionEvent: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    strategyHistory: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    user: { deleteMany: jest.fn() },
  },
}));

import prisma from '@/lib/prisma';

// ==================== Test Fixtures ====================

const TEST_USER_ID = 'user-test-123';
const TEST_DATE = new Date('2024-06-15T12:00:00Z');

function createMockProfile(overrides: Record<string, unknown> = {}) {
  return {
    userId: TEST_USER_ID,
    experienceYears: 5,
    currentRole: 'Software Engineer',
    targetRoles: ['Senior Software Engineer', 'Staff Engineer'],
    techStack: ['TypeScript', 'React', 'Node.js'],
    currentLocation: 'San Francisco, CA',
    targetLocations: ['San Francisco', 'Remote'],
    workAuthorization: 'US Citizen',
    remoteOnly: false,
    companySizePrefs: ['startup', 'mid-size'],
    industries: ['technology', 'fintech'],
    salaryExpectation: { min: 150000, max: 200000, currency: 'USD' },
    currentStrategyMode: StrategyMode.APPLY_MODE,
    weeklyAppTarget: 10,
    ...overrides,
  };
}

function createMockResume(overrides: Record<string, unknown> = {}) {
  return {
    id: 'resume-1',
    userId: TEST_USER_ID,
    versionNumber: 3,
    name: 'Master Resume',
    isMaster: true,
    content: { sections: ['experience', 'education'] },
    overallScore: 82,
    componentScores: {
      contentQuality: 85,
      atsCompatibility: 78,
      formatStructure: 80,
      impactMetrics: 84,
    },
    improvementAreas: ['Add more metrics', 'Improve summary'],
    targetRoles: ['Senior Engineer'],
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-10'),
    ...overrides,
  };
}

function createMockApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    userId: TEST_USER_ID,
    resumeId: 'resume-1',
    jobId: 'job-1',
    status: 'submitted',
    appliedAt: new Date('2024-06-01'),
    lastFollowUpAt: null,
    followUpCount: 0,
    customCoverLetter: null,
    customMessage: null,
    interviewScheduledAt: null,
    offerReceivedAt: null,
    rejectedAt: null,
    notes: null,
    metadata: null,
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

function createMockEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    userId: TEST_USER_ID,
    eventType: 'APPLICATION_SUBMITTED',
    context: { jobId: 'job-1' },
    metadata: null,
    timestamp: TEST_DATE,
    ...overrides,
  };
}

// ==================== Tests ====================

describe('Layer 4 Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== getUserProfile ====================

  describe('getUserProfile', () => {
    it('should return a mapped user profile for an existing user', async () => {
      const mockProfile = createMockProfile();
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await getUserProfile(TEST_USER_ID);

      expect(result).not.toBeNull();
      expect(result!.userId).toBe(TEST_USER_ID);
      expect(result!.experienceYears).toBe(5);
      expect(result!.currentRole).toBe('Software Engineer');
      expect(result!.targetRoles).toEqual(['Senior Software Engineer', 'Staff Engineer']);
      expect(result!.techStack).toEqual(['TypeScript', 'React', 'Node.js']);
      expect(result!.currentStrategyMode).toBe(StrategyMode.APPLY_MODE);
      expect(result!.salaryExpectation).toEqual({ min: 150000, max: 200000, currency: 'USD' });
      expect(result!.weeklyAppTarget).toBe(10);

      expect(prisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID },
      });
    });

    it('should return null for a non-existent user', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getUserProfile('non-existent-user');

      expect(result).toBeNull();
    });

    it('should default to IMPROVE_RESUME_FIRST for invalid strategy mode', async () => {
      const mockProfile = createMockProfile({
        currentStrategyMode: 'INVALID_MODE',
      });
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await getUserProfile(TEST_USER_ID);

      expect(result).not.toBeNull();
      expect(result!.currentStrategyMode).toBe(StrategyMode.IMPROVE_RESUME_FIRST);
    });

    it('should handle non-array JSON fields gracefully', async () => {
      const mockProfile = createMockProfile({
        targetRoles: 'not-an-array',
        techStack: null,
        targetLocations: undefined,
        companySizePrefs: 42,
        industries: {},
      });
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await getUserProfile(TEST_USER_ID);

      expect(result).not.toBeNull();
      expect(result!.targetRoles).toEqual([]);
      expect(result!.techStack).toEqual([]);
      expect(result!.targetLocations).toEqual([]);
      expect(result!.companySizePrefs).toEqual([]);
      expect(result!.industries).toEqual([]);
    });
  });

  // ==================== calculateUserMetrics ====================

  describe('calculateUserMetrics', () => {
    it('should return accurate counts and rates', async () => {
      (prisma.application.count as jest.Mock)
        .mockResolvedValueOnce(20)  // totalApplications
        .mockResolvedValueOnce(5)   // applicationsThisWeek
        .mockResolvedValueOnce(8)   // withResponse (interview + offer + rejected)
        .mockResolvedValueOnce(3);  // withInterview

      const mockLastEvent = { timestamp: new Date('2024-06-14') };
      (prisma.interactionEvent.findFirst as jest.Mock).mockResolvedValue(mockLastEvent);

      const result = await calculateUserMetrics(TEST_USER_ID);

      expect(result.totalApplications).toBe(20);
      expect(result.applicationsThisWeek).toBe(5);
      expect(result.responseRate).toBeCloseTo(0.4);   // 8/20
      expect(result.interviewRate).toBeCloseTo(0.15);  // 3/20
      expect(result.lastActivityAt).toEqual(new Date('2024-06-14'));
    });

    it('should handle zero applications without division errors', async () => {
      (prisma.application.count as jest.Mock)
        .mockResolvedValueOnce(0)  // totalApplications
        .mockResolvedValueOnce(0)  // applicationsThisWeek
        .mockResolvedValueOnce(0)  // withResponse
        .mockResolvedValueOnce(0); // withInterview

      (prisma.interactionEvent.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await calculateUserMetrics(TEST_USER_ID);

      expect(result.totalApplications).toBe(0);
      expect(result.applicationsThisWeek).toBe(0);
      expect(result.responseRate).toBe(0);
      expect(result.interviewRate).toBe(0);
      expect(result.lastActivityAt).toBeNull();
    });
  });

  // ==================== getCurrentResume ====================

  describe('getCurrentResume', () => {
    it('should return the master resume when one exists', async () => {
      const mockResume = createMockResume();
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(mockResume);

      const result = await getCurrentResume(TEST_USER_ID);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('resume-1');
      expect(result!.isMaster).toBe(true);
      expect(result!.overallScore).toBe(82);
      expect(result!.improvementAreas).toEqual(['Add more metrics', 'Improve summary']);

      // Should have been called with isMaster: true
      expect(prisma.resumeVersion.findFirst).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID, isMaster: true },
        orderBy: { versionNumber: 'desc' },
      });
    });

    it('should fall back to latest version when no master resume exists', async () => {
      const latestResume = createMockResume({
        id: 'resume-latest',
        isMaster: false,
        versionNumber: 5,
        name: 'Latest Version',
      });

      // First call (master) returns null, second call (latest) returns resume
      (prisma.resumeVersion.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(latestResume);

      const result = await getCurrentResume(TEST_USER_ID);

      expect(result).not.toBeNull();
      expect(result!.id).toBe('resume-latest');
      expect(result!.isMaster).toBe(false);
      expect(result!.versionNumber).toBe(5);

      // Should have been called twice
      expect(prisma.resumeVersion.findFirst).toHaveBeenCalledTimes(2);
    });

    it('should return null when no resumes exist at all', async () => {
      (prisma.resumeVersion.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)  // No master
        .mockResolvedValueOnce(null); // No latest either

      const result = await getCurrentResume(TEST_USER_ID);

      expect(result).toBeNull();
    });
  });

  // ==================== getUserStateSnapshot ====================

  describe('getUserStateSnapshot', () => {
    it('should return a complete snapshot with success=true', async () => {
      const mockProfile = createMockProfile();
      const mockResume = createMockResume();
      const mockApps = [createMockApplication()];
      const mockStrategy = {
        id: 'strategy-1',
        userId: TEST_USER_ID,
        strategyMode: StrategyMode.APPLY_MODE,
        reason: 'Resume score above threshold',
        triggeredBy: 'system',
        activatedAt: new Date('2024-06-01'),
        deactivatedAt: null,
        performanceData: { applicationsCount: 15, interviewRate: 0.2 },
      };

      // getUserProfile mock
      (prisma.userProfile.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      // getCurrentResume mock - master resume found on first call
      (prisma.resumeVersion.findFirst as jest.Mock).mockResolvedValue(mockResume);

      // queryApplications mocks
      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApps);
      (prisma.application.count as jest.Mock)
        .mockResolvedValueOnce(1)  // queryApplications total count
        .mockResolvedValueOnce(20) // calculateUserMetrics total
        .mockResolvedValueOnce(5)  // calculateUserMetrics thisWeek
        .mockResolvedValueOnce(8)  // calculateUserMetrics withResponse
        .mockResolvedValueOnce(3); // calculateUserMetrics withInterview

      // strategyHistory mock
      (prisma.strategyHistory.findFirst as jest.Mock).mockResolvedValue(mockStrategy);

      // calculateUserMetrics last event
      (prisma.interactionEvent.findFirst as jest.Mock).mockResolvedValue({
        timestamp: new Date('2024-06-15T10:00:00Z'),
      });

      const result = await getUserStateSnapshot(TEST_USER_ID);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.userId).toBe(TEST_USER_ID);
      expect(result.data!.profile).not.toBeNull();
      expect(result.data!.currentResume).not.toBeNull();
      expect(result.data!.recentApplications).toHaveLength(1);
      expect(result.data!.activeStrategy).not.toBeNull();
      expect(result.data!.activeStrategy!.strategyMode).toBe(StrategyMode.APPLY_MODE);
      expect(result.data!.metrics.totalApplications).toBe(20);

      expect(result.metadata.layerId).toBe(4);
      expect(result.metadata.layerName).toBe('State & Pipeline');
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return success=false with error details when a query fails', async () => {
      (prisma.userProfile.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection lost')
      );

      const result = await getUserStateSnapshot(TEST_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('STATE_QUERY_FAILED');
      expect(result.error!.message).toBe('Failed to retrieve user state');
      expect(result.error!.details).toBe('Database connection lost');
      expect(result.metadata.layerId).toBe(4);
    });
  });

  // ==================== queryApplications ====================

  describe('queryApplications', () => {
    it('should return paginated results with total and hasMore', async () => {
      const mockApps = [
        createMockApplication({ id: 'app-1' }),
        createMockApplication({ id: 'app-2' }),
      ];

      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApps);
      (prisma.application.count as jest.Mock).mockResolvedValue(5);

      const result = await queryApplications({
        userId: TEST_USER_ID,
        limit: 2,
        offset: 0,
      });

      expect(result.applications).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true); // 0 + 2 < 5

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: TEST_USER_ID },
          orderBy: { createdAt: 'desc' },
          take: 2,
          skip: 0,
        })
      );
    });

    it('should filter by a single status', async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      await queryApplications({
        userId: TEST_USER_ID,
        status: LayerApplicationStatus.SUBMITTED,
      });

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            status: LayerApplicationStatus.SUBMITTED,
          }),
        })
      );
    });

    it('should filter by multiple statuses using array', async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      await queryApplications({
        userId: TEST_USER_ID,
        status: [LayerApplicationStatus.SUBMITTED, LayerApplicationStatus.INTERVIEW_SCHEDULED],
      });

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: [LayerApplicationStatus.SUBMITTED, LayerApplicationStatus.INTERVIEW_SCHEDULED],
            },
          }),
        })
      );
    });

    it('should handle empty results', async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.application.count as jest.Mock).mockResolvedValue(0);

      const result = await queryApplications({ userId: TEST_USER_ID });

      expect(result.applications).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should correctly map application status values', async () => {
      const mockApps = [
        createMockApplication({ id: 'app-int', status: 'interview_scheduled' }),
        createMockApplication({ id: 'app-offer', status: 'offer' }),
        createMockApplication({ id: 'app-rej', status: 'rejected' }),
      ];

      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApps);
      (prisma.application.count as jest.Mock).mockResolvedValue(3);

      const result = await queryApplications({ userId: TEST_USER_ID });

      expect(result.applications[0].status).toBe(LayerApplicationStatus.INTERVIEW_SCHEDULED);
      expect(result.applications[1].status).toBe(LayerApplicationStatus.OFFER);
      expect(result.applications[2].status).toBe(LayerApplicationStatus.REJECTED);
    });
  });

  // ==================== getApplicationsNeedingFollowUp ====================

  describe('getApplicationsNeedingFollowUp', () => {
    it('should return applications that need follow-up', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10); // 10 days ago

      const mockApps = [
        createMockApplication({
          id: 'app-follow-1',
          status: 'submitted',
          appliedAt: oldDate,
          followUpCount: 0,
        }),
        createMockApplication({
          id: 'app-follow-2',
          status: 'submitted',
          appliedAt: oldDate,
          followUpCount: 1,
        }),
      ];

      (prisma.application.findMany as jest.Mock).mockResolvedValue(mockApps);

      const result = await getApplicationsNeedingFollowUp(TEST_USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('app-follow-1');
      expect(result[1].id).toBe('app-follow-2');

      // Verify the query filters
      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            status: 'submitted',
            followUpCount: { lt: 2 },
            rejectedAt: null,
            offerReceivedAt: null,
            interviewScheduledAt: null,
          }),
          orderBy: { appliedAt: 'asc' },
        })
      );
    });

    it('should return empty array when no applications need follow-up', async () => {
      (prisma.application.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getApplicationsNeedingFollowUp(TEST_USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ==================== queryEvents ====================

  describe('queryEvents', () => {
    it('should return filtered events mapped to InteractionEventState', async () => {
      const mockEvents = [
        createMockEvent({ id: 'evt-1', eventType: 'APPLICATION_SUBMITTED' }),
        createMockEvent({ id: 'evt-2', eventType: 'RESUME_SCORED' }),
      ];

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue(mockEvents);

      const result = await queryEvents({ userId: TEST_USER_ID });

      expect(result).toHaveLength(2);
      // Event types should be lowercased
      expect(result[0].eventType).toBe('application_submitted');
      expect(result[1].eventType).toBe('resume_scored');
      expect(result[0].userId).toBe(TEST_USER_ID);
    });

    it('should filter by event types', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await queryEvents({
        userId: TEST_USER_ID,
        eventTypes: [LayerEventType.RESUME_UPLOADED, LayerEventType.RESUME_SCORED],
      });

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            eventType: {
              in: ['RESUME_UPLOADED', 'RESUME_SCORED'],
            },
          }),
        })
      );
    });

    it('should handle date range filters', async () => {
      const start = new Date('2024-06-01');
      const end = new Date('2024-06-30');

      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await queryEvents({
        userId: TEST_USER_ID,
        dateRange: { start, end },
      });

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: TEST_USER_ID,
            timestamp: { gte: start, lte: end },
          }),
        })
      );
    });

    it('should respect the limit parameter', async () => {
      (prisma.interactionEvent.findMany as jest.Mock).mockResolvedValue([]);

      await queryEvents({
        userId: TEST_USER_ID,
        limit: 10,
      });

      expect(prisma.interactionEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          orderBy: { timestamp: 'desc' },
        })
      );
    });
  });

  // ==================== updateStrategyMode ====================

  describe('updateStrategyMode', () => {
    it('should update the profile and create a new strategy history entry', async () => {
      (prisma.userProfile.update as jest.Mock).mockResolvedValue({});
      (prisma.strategyHistory.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.strategyHistory.create as jest.Mock).mockResolvedValue({
        id: 'strategy-new',
        userId: TEST_USER_ID,
        strategyMode: StrategyMode.RETHINK_TARGETS,
        reason: 'Low response rate',
        triggeredBy: 'orchestrator',
        activatedAt: new Date(),
        deactivatedAt: null,
      });

      await updateStrategyMode(
        TEST_USER_ID,
        StrategyMode.RETHINK_TARGETS,
        'Low response rate',
        'orchestrator'
      );

      // Should update the user profile
      expect(prisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: TEST_USER_ID },
        data: { currentStrategyMode: StrategyMode.RETHINK_TARGETS },
      });

      // Should deactivate previous strategy
      expect(prisma.strategyHistory.updateMany).toHaveBeenCalledWith({
        where: {
          userId: TEST_USER_ID,
          deactivatedAt: null,
        },
        data: {
          deactivatedAt: expect.any(Date),
        },
      });

      // Should create new strategy entry
      expect(prisma.strategyHistory.create).toHaveBeenCalledWith({
        data: {
          userId: TEST_USER_ID,
          strategyMode: StrategyMode.RETHINK_TARGETS,
          reason: 'Low response rate',
          triggeredBy: 'orchestrator',
        },
      });
    });
  });

  // ==================== logEvent ====================

  describe('logEvent', () => {
    it('should create an event record and return the event id', async () => {
      (prisma.interactionEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-new-123',
      });

      const eventId = await logEvent(
        TEST_USER_ID,
        LayerEventType.APPLICATION_SUBMITTED,
        { jobId: 'job-42', company: 'Acme Corp' },
        { source: 'manual' }
      );

      expect(eventId).toBe('event-new-123');
      expect(prisma.interactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: TEST_USER_ID,
          eventType: 'APPLICATION_SUBMITTED',
          context: { jobId: 'job-42', company: 'Acme Corp' },
          metadata: { source: 'manual' },
        }),
      });
    });

    it('should handle events without optional metadata', async () => {
      (prisma.interactionEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-no-meta',
      });

      const eventId = await logEvent(
        TEST_USER_ID,
        LayerEventType.RESUME_UPLOADED,
        { resumeId: 'resume-1' }
      );

      expect(eventId).toBe('event-no-meta');
      expect(prisma.interactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: TEST_USER_ID,
          eventType: 'RESUME_UPLOADED',
          context: { resumeId: 'resume-1' },
          metadata: undefined,
        }),
      });
    });

    it('should map LayerEventType.STRATEGY_MODE_CHANGED to the correct Prisma event type', async () => {
      (prisma.interactionEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-strategy',
      });

      await logEvent(
        TEST_USER_ID,
        LayerEventType.STRATEGY_MODE_CHANGED,
        { oldMode: 'APPLY_MODE', newMode: 'RETHINK_TARGETS' }
      );

      expect(prisma.interactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'STRATEGY_MODE_CHANGED',
        }),
      });
    });

    it('should fall back to SUGGESTION_GENERATED for unmapped event types', async () => {
      (prisma.interactionEvent.create as jest.Mock).mockResolvedValue({
        id: 'event-fallback',
      });

      // Use an event type not in the logEvent mapping (e.g. FOLLOW_UP_SENT)
      await logEvent(
        TEST_USER_ID,
        LayerEventType.FOLLOW_UP_SENT,
        { applicationId: 'app-1' }
      );

      expect(prisma.interactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'SUGGESTION_GENERATED',
        }),
      });
    });
  });
});
