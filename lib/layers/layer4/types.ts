/**
 * Layer 4 - State & Pipeline Layer
 * Type Definitions
 *
 * Purpose: Maintain complete understanding of user's job search over time.
 * Uses existing Prisma models: User, UserProfile, ResumeVersion, JobPosting,
 * Application, InteractionEvent, StrategyHistory
 */

import {
  StrategyMode,
  LayerEventType,
  LayerApplicationStatus,
  SeniorityLevel,
  LayerOutput,
} from '../shared/types';

// ==================== User Profile Types ====================

/**
 * User profile state as maintained by Layer 4
 * Maps to existing UserProfile Prisma model
 */
export interface UserProfileState {
  userId: string;
  experienceYears: number | null;
  currentRole: string | null;
  targetRoles: string[];
  techStack: string[];
  currentLocation: string | null;
  targetLocations: string[];
  workAuthorization: string | null;
  remoteOnly: boolean;
  companySizePrefs: string[];
  industries: string[];
  salaryExpectation: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;
  currentStrategyMode: StrategyMode;
  weeklyAppTarget: number;
}

// ==================== Resume Types ====================

/**
 * Resume version state
 * Maps to existing ResumeVersion Prisma model
 */
export interface ResumeVersionState {
  id: string;
  userId: string;
  versionNumber: number;
  name: string | null;
  isMaster: boolean;
  content: Record<string, unknown>;
  overallScore: number | null;
  componentScores: {
    contentQuality?: number;
    atsCompatibility?: number;
    formatStructure?: number;
    impactMetrics?: number;
  } | null;
  improvementAreas: string[];
  targetRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Job Types ====================

/**
 * Job posting state
 * Maps to existing JobPosting Prisma model
 */
export interface JobPostingState {
  id: string;
  title: string;
  company: string;
  location: string | null;
  jobUrl: string;
  description: string | null;
  seniorityLevel: SeniorityLevel | null;
  requiredSkills: string[];
  remoteOption: boolean;
  salaryRange: {
    min?: number;
    max?: number;
    currency?: string;
  } | null;
  discoveredAt: Date;
  source: string;
  discoveredViaQuery: string | null;
  matchScore: number | null;
  matchReasoning: Record<string, unknown> | null;
}

// ==================== Application Types ====================

/**
 * Application state
 * Maps to existing Application Prisma model
 */
export interface ApplicationState {
  id: string;
  userId: string;
  resumeId: string;
  jobId: string;
  status: LayerApplicationStatus;
  appliedAt: Date | null;
  lastFollowUpAt: Date | null;
  followUpCount: number;
  customCoverLetter: string | null;
  customMessage: string | null;
  interviewScheduledAt: Date | null;
  offerReceivedAt: Date | null;
  rejectedAt: Date | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Event Types ====================

/**
 * Interaction event for logging
 * Maps to existing InteractionEvent Prisma model
 */
export interface InteractionEventState {
  id: string;
  userId: string;
  eventType: LayerEventType;
  context: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

// ==================== Strategy Types ====================

/**
 * Strategy history entry
 * Maps to existing StrategyHistory Prisma model
 */
export interface StrategyHistoryState {
  id: string;
  userId: string;
  strategyMode: StrategyMode;
  reason: string;
  triggeredBy: string;
  activatedAt: Date;
  deactivatedAt: Date | null;
  performanceData: {
    applicationsCount?: number;
    interviewRate?: number;
    responseRate?: number;
  } | null;
}

// ==================== Aggregate State Types ====================

/**
 * Complete user state snapshot
 * Aggregates data from multiple models for Layer 5 (Orchestrator)
 */
export interface UserStateSnapshot {
  userId: string;
  profile: UserProfileState | null;
  currentResume: ResumeVersionState | null;
  recentApplications: ApplicationState[];
  activeStrategy: StrategyHistoryState | null;

  // Computed metrics
  metrics: {
    totalApplications: number;
    applicationsThisWeek: number;
    responseRate: number;
    interviewRate: number;
    lastActivityAt: Date | null;
  };

  // State freshness
  stateAt: Date;
  isStale: boolean;
}

// ==================== Query Parameters ====================

/**
 * Parameters for querying applications
 */
export interface ApplicationQueryParams {
  userId: string;
  status?: LayerApplicationStatus | LayerApplicationStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
  offset?: number;
}

/**
 * Parameters for querying job postings
 */
export interface JobQueryParams {
  userId?: string;
  minMatchScore?: number;
  source?: string;
  seniorityLevel?: SeniorityLevel;
  remoteOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Parameters for querying events
 */
export interface EventQueryParams {
  userId: string;
  eventTypes?: LayerEventType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}

// ==================== Layer Output Types ====================

/**
 * Layer 4 output for user state queries
 */
export type Layer4StateOutput = LayerOutput<UserStateSnapshot>;

/**
 * Layer 4 output for application queries
 */
export type Layer4ApplicationsOutput = LayerOutput<{
  applications: ApplicationState[];
  total: number;
  hasMore: boolean;
}>;

/**
 * Layer 4 output for event logging
 */
export type Layer4EventOutput = LayerOutput<{
  eventId: string;
  logged: boolean;
}>;
