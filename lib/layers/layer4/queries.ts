/**
 * Layer 4 - State & Pipeline Layer
 * Database Queries
 *
 * Purpose: Query and manage user state using existing Prisma models.
 * This layer integrates with the existing database schema without modifications.
 */

import prisma from '@/lib/prisma';
import {
  StrategyMode,
  LayerEventType,
  LayerApplicationStatus,
  isValidStrategyMode,
} from '../shared/types';
import type {
  UserProfileState,
  ResumeVersionState,
  ApplicationState,
  JobPostingState,
  InteractionEventState,
  StrategyHistoryState,
  UserStateSnapshot,
  ApplicationQueryParams,
  JobQueryParams,
  EventQueryParams,
  Layer4StateOutput,
  Layer4ApplicationsOutput,
  Layer4EventOutput,
} from './types';

// ==================== Constants ====================

/**
 * State is considered stale after 24 hours of inactivity
 */
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * Default query limits
 */
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

// ==================== User Profile Queries ====================

/**
 * Get user profile state
 */
export async function getUserProfile(userId: string): Promise<UserProfileState | null> {
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return null;
  }

  // Parse JSON fields and map to our types
  const targetRoles = Array.isArray(profile.targetRoles) ? profile.targetRoles as string[] : [];
  const techStack = Array.isArray(profile.techStack) ? profile.techStack as string[] : [];
  const targetLocations = Array.isArray(profile.targetLocations) ? profile.targetLocations as string[] : [];
  const companySizePrefs = Array.isArray(profile.companySizePrefs) ? profile.companySizePrefs as string[] : [];
  const industries = Array.isArray(profile.industries) ? profile.industries as string[] : [];

  // Parse salary expectation
  let salaryExpectation = null;
  if (profile.salaryExpectation && typeof profile.salaryExpectation === 'object') {
    const salary = profile.salaryExpectation as Record<string, unknown>;
    salaryExpectation = {
      min: typeof salary.min === 'number' ? salary.min : undefined,
      max: typeof salary.max === 'number' ? salary.max : undefined,
      currency: typeof salary.currency === 'string' ? salary.currency : undefined,
    };
  }

  // Validate and parse strategy mode
  const currentStrategyMode = isValidStrategyMode(profile.currentStrategyMode)
    ? profile.currentStrategyMode
    : StrategyMode.IMPROVE_RESUME_FIRST;

  return {
    userId: profile.userId,
    experienceYears: profile.experienceYears,
    currentRole: profile.currentRole,
    targetRoles,
    techStack,
    currentLocation: profile.currentLocation,
    targetLocations,
    workAuthorization: profile.workAuthorization,
    remoteOnly: profile.remoteOnly,
    companySizePrefs,
    industries,
    salaryExpectation,
    currentStrategyMode,
    weeklyAppTarget: profile.weeklyAppTarget,
  };
}

/**
 * Update user's current strategy mode
 */
export async function updateStrategyMode(
  userId: string,
  newMode: StrategyMode,
  reason: string,
  triggeredBy: string
): Promise<void> {
  // Update profile
  await prisma.userProfile.update({
    where: { userId },
    data: { currentStrategyMode: newMode },
  });

  // Deactivate previous strategy
  await prisma.strategyHistory.updateMany({
    where: {
      userId,
      deactivatedAt: null,
    },
    data: {
      deactivatedAt: new Date(),
    },
  });

  // Create new strategy history entry
  await prisma.strategyHistory.create({
    data: {
      userId,
      strategyMode: newMode,
      reason,
      triggeredBy,
    },
  });
}

// ==================== Resume Queries ====================

/**
 * Get user's current (master) resume
 */
export async function getCurrentResume(userId: string): Promise<ResumeVersionState | null> {
  const resume = await prisma.resumeVersion.findFirst({
    where: {
      userId,
      isMaster: true,
    },
    orderBy: {
      versionNumber: 'desc',
    },
  });

  if (!resume) {
    // Fall back to latest version if no master
    const latestResume = await prisma.resumeVersion.findFirst({
      where: { userId },
      orderBy: { versionNumber: 'desc' },
    });

    if (!latestResume) {
      return null;
    }

    return mapResumeToState(latestResume);
  }

  return mapResumeToState(resume);
}

/**
 * Get all resume versions for a user
 */
export async function getResumeVersions(
  userId: string,
  limit: number = DEFAULT_LIMIT
): Promise<ResumeVersionState[]> {
  const resumes = await prisma.resumeVersion.findMany({
    where: { userId },
    orderBy: { versionNumber: 'desc' },
    take: Math.min(limit, MAX_LIMIT),
  });

  return resumes.map(mapResumeToState);
}

/**
 * Helper to map Prisma resume to our state type
 */
function mapResumeToState(resume: {
  id: string;
  userId: string;
  versionNumber: number;
  name: string | null;
  isMaster: boolean;
  content: unknown;
  overallScore: number | null;
  componentScores: unknown;
  improvementAreas: unknown;
  targetRoles: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ResumeVersionState {
  const content = typeof resume.content === 'object' && resume.content !== null
    ? resume.content as Record<string, unknown>
    : {};

  const componentScores = typeof resume.componentScores === 'object' && resume.componentScores !== null
    ? resume.componentScores as ResumeVersionState['componentScores']
    : null;

  const improvementAreas = Array.isArray(resume.improvementAreas)
    ? resume.improvementAreas as string[]
    : [];

  const targetRoles = Array.isArray(resume.targetRoles)
    ? resume.targetRoles as string[]
    : [];

  return {
    id: resume.id,
    userId: resume.userId,
    versionNumber: resume.versionNumber,
    name: resume.name,
    isMaster: resume.isMaster,
    content,
    overallScore: resume.overallScore,
    componentScores,
    improvementAreas,
    targetRoles,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
}

// ==================== Application Queries ====================

/**
 * Query applications with filters
 */
export async function queryApplications(
  params: ApplicationQueryParams
): Promise<{ applications: ApplicationState[]; total: number; hasMore: boolean }> {
  const { userId, status, dateRange, limit = DEFAULT_LIMIT, offset = 0 } = params;

  const where: Record<string, unknown> = { userId };

  if (status) {
    where.status = Array.isArray(status) ? { in: status } : status;
  }

  if (dateRange) {
    where.createdAt = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, MAX_LIMIT),
      skip: offset,
    }),
    prisma.application.count({ where }),
  ]);

  return {
    applications: applications.map(mapApplicationToState),
    total,
    hasMore: offset + applications.length < total,
  };
}

/**
 * Get applications needing follow-up
 */
export async function getApplicationsNeedingFollowUp(userId: string): Promise<ApplicationState[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const applications = await prisma.application.findMany({
    where: {
      userId,
      status: 'submitted',
      appliedAt: { lte: sevenDaysAgo },
      followUpCount: { lt: 2 }, // Max 2 follow-ups
      rejectedAt: null,
      offerReceivedAt: null,
      interviewScheduledAt: null,
    },
    orderBy: { appliedAt: 'asc' },
  });

  return applications.map(mapApplicationToState);
}

/**
 * Helper to map Prisma application to our state type
 */
function mapApplicationToState(app: {
  id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  status: string;
  appliedAt: Date | null;
  lastFollowUpAt: Date | null;
  followUpCount: number;
  customCoverLetter: string | null;
  customMessage: string | null;
  interviewScheduledAt: Date | null;
  offerReceivedAt: Date | null;
  rejectedAt: Date | null;
  notes: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ApplicationState {
  const metadata = typeof app.metadata === 'object' && app.metadata !== null
    ? app.metadata as Record<string, unknown>
    : null;

  // Map database status to our LayerApplicationStatus
  const statusMap: Record<string, LayerApplicationStatus> = {
    draft: LayerApplicationStatus.DRAFT,
    submitted: LayerApplicationStatus.SUBMITTED,
    no_response: LayerApplicationStatus.NO_RESPONSE,
    interview_scheduled: LayerApplicationStatus.INTERVIEW_SCHEDULED,
    rejected: LayerApplicationStatus.REJECTED,
    offer: LayerApplicationStatus.OFFER,
  };

  return {
    id: app.id,
    userId: app.userId,
    resumeId: app.resumeId,
    jobId: app.jobId,
    status: statusMap[app.status] || LayerApplicationStatus.DRAFT,
    appliedAt: app.appliedAt,
    lastFollowUpAt: app.lastFollowUpAt,
    followUpCount: app.followUpCount,
    customCoverLetter: app.customCoverLetter,
    customMessage: app.customMessage,
    interviewScheduledAt: app.interviewScheduledAt,
    offerReceivedAt: app.offerReceivedAt,
    rejectedAt: app.rejectedAt,
    notes: app.notes,
    metadata,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
  };
}

// ==================== Metrics Calculation ====================

/**
 * Calculate user metrics for state snapshot
 */
export async function calculateUserMetrics(userId: string): Promise<{
  totalApplications: number;
  applicationsThisWeek: number;
  responseRate: number;
  interviewRate: number;
  lastActivityAt: Date | null;
}> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalApplications, applicationsThisWeek, withResponse, withInterview, lastEvent] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.application.count({
      where: {
        userId,
        createdAt: { gte: oneWeekAgo },
      },
    }),
    prisma.application.count({
      where: {
        userId,
        OR: [
          { interviewScheduledAt: { not: null } },
          { offerReceivedAt: { not: null } },
          { rejectedAt: { not: null } },
        ],
      },
    }),
    prisma.application.count({
      where: {
        userId,
        interviewScheduledAt: { not: null },
      },
    }),
    prisma.interactionEvent.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  const responseRate = totalApplications > 0 ? withResponse / totalApplications : 0;
  const interviewRate = totalApplications > 0 ? withInterview / totalApplications : 0;

  return {
    totalApplications,
    applicationsThisWeek,
    responseRate,
    interviewRate,
    lastActivityAt: lastEvent?.timestamp || null,
  };
}

// ==================== Event Logging ====================

/**
 * Log an interaction event
 */
export async function logEvent(
  userId: string,
  eventType: LayerEventType,
  context: Record<string, unknown>,
  metadata?: Record<string, unknown>
): Promise<string> {
  // Map our LayerEventType to Prisma's EventType enum
  // The Prisma schema uses an enum, so we need to map appropriately
  const eventTypeMap: Record<string, string> = {
    [LayerEventType.RESUME_UPLOADED]: 'RESUME_UPLOADED',
    [LayerEventType.RESUME_SCORED]: 'RESUME_SCORED',
    [LayerEventType.APPLICATION_CREATED]: 'APPLICATION_CREATED',
    [LayerEventType.APPLICATION_SUBMITTED]: 'APPLICATION_SUBMITTED',
    [LayerEventType.STRATEGY_MODE_CHANGED]: 'STRATEGY_MODE_CHANGED',
    [LayerEventType.APPLICATION_STATUS_CHANGED]: 'APPLICATION_UPDATED',
    [LayerEventType.FIRST_INTERVIEW]: 'INTERVIEW_SCHEDULED',
    [LayerEventType.FIRST_OFFER]: 'OFFER_RECEIVED',
  };

  // Use the mapped event type or default to a generic one
  const prismaEventType = eventTypeMap[eventType] || 'SUGGESTION_GENERATED';

  const event = await prisma.interactionEvent.create({
    data: {
      userId,
      // Cast to any to handle the enum mapping - Prisma will validate
      eventType: prismaEventType as unknown as import('@prisma/client').EventType,
      context: context as import('@prisma/client').Prisma.InputJsonValue,
      metadata: metadata as import('@prisma/client').Prisma.InputJsonValue | undefined,
    },
  });

  return event.id;
}

/**
 * Query events with filters
 */
export async function queryEvents(
  params: EventQueryParams
): Promise<InteractionEventState[]> {
  const { userId, eventTypes, dateRange, limit = DEFAULT_LIMIT } = params;

  const where: Record<string, unknown> = { userId };

  if (eventTypes && eventTypes.length > 0) {
    // Map our event types to Prisma event types
    const eventTypeMap: Record<string, string> = {
      [LayerEventType.RESUME_UPLOADED]: 'RESUME_UPLOADED',
      [LayerEventType.RESUME_SCORED]: 'RESUME_SCORED',
      [LayerEventType.APPLICATION_CREATED]: 'APPLICATION_CREATED',
      [LayerEventType.APPLICATION_SUBMITTED]: 'APPLICATION_SUBMITTED',
      [LayerEventType.STRATEGY_MODE_CHANGED]: 'STRATEGY_MODE_CHANGED',
    };

    const prismaEventTypes = eventTypes
      .map(t => eventTypeMap[t])
      .filter(Boolean);

    if (prismaEventTypes.length > 0) {
      where.eventType = { in: prismaEventTypes };
    }
  }

  if (dateRange) {
    where.timestamp = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  const events = await prisma.interactionEvent.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: Math.min(limit, MAX_LIMIT),
  });

  return events.map(e => ({
    id: e.id,
    userId: e.userId,
    // Map back to our event type
    eventType: (e.eventType.toLowerCase().replace(/_/g, '_')) as LayerEventType,
    context: typeof e.context === 'object' && e.context !== null
      ? e.context as Record<string, unknown>
      : {},
    metadata: typeof e.metadata === 'object' && e.metadata !== null
      ? e.metadata as Record<string, unknown>
      : null,
    timestamp: e.timestamp,
  }));
}

// ==================== Full State Snapshot ====================

/**
 * Get complete user state snapshot
 * This is the main entry point for Layer 5 (Orchestrator)
 */
export async function getUserStateSnapshot(userId: string): Promise<Layer4StateOutput> {
  const startTime = Date.now();

  try {
    const [profile, currentResume, recentApps, activeStrategy, metrics] = await Promise.all([
      getUserProfile(userId),
      getCurrentResume(userId),
      queryApplications({
        userId,
        limit: 20,
      }),
      prisma.strategyHistory.findFirst({
        where: {
          userId,
          deactivatedAt: null,
        },
        orderBy: { activatedAt: 'desc' },
      }),
      calculateUserMetrics(userId),
    ]);

    // Determine if state is stale
    const lastActivity = metrics.lastActivityAt;
    const isStale = lastActivity
      ? Date.now() - lastActivity.getTime() > STALE_THRESHOLD_MS
      : true;

    const snapshot: UserStateSnapshot = {
      userId,
      profile,
      currentResume,
      recentApplications: recentApps.applications,
      activeStrategy: activeStrategy ? {
        id: activeStrategy.id,
        userId: activeStrategy.userId,
        strategyMode: isValidStrategyMode(activeStrategy.strategyMode)
          ? activeStrategy.strategyMode
          : StrategyMode.IMPROVE_RESUME_FIRST,
        reason: activeStrategy.reason,
        triggeredBy: activeStrategy.triggeredBy,
        activatedAt: activeStrategy.activatedAt,
        deactivatedAt: activeStrategy.deactivatedAt,
        performanceData: typeof activeStrategy.performanceData === 'object' && activeStrategy.performanceData !== null
          ? activeStrategy.performanceData as StrategyHistoryState['performanceData']
          : null,
      } : null,
      metrics,
      stateAt: new Date(),
      isStale,
    };

    return {
      success: true,
      data: snapshot,
      metadata: {
        layerId: 4,
        layerName: 'State & Pipeline',
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'STATE_QUERY_FAILED',
        message: 'Failed to retrieve user state',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      metadata: {
        layerId: 4,
        layerName: 'State & Pipeline',
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
