import { prisma } from '@/lib/db';
import { resumeService } from '@/lib/db/resume';

// Note: ApplicationStatus and EventType are strings in schema, not Prisma enums
// We define them here for type safety
type ApplicationStatus = 'APPLIED' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'OFFER_RECEIVED';
type StrategyMode = 'IMPROVE_RESUME_FIRST' | 'APPLY_MODE' | 'RETHINK_TARGETS';

// ==================== Type Definitions ====================

export interface UserState {
  userId: string;

  // Resume State
  masterResumeId: string | null;
  resumeScore: number | null;
  lastScoredAt: Date | null;

  // Application State
  totalApplications: number;
  applicationsThisWeek: number;
  applicationsThisMonth: number;

  // Outcome State
  interviewRate: number; // integer percentage 0-100
  totalInterviews: number;
  totalRejections: number;

  // Strategy State
  currentStrategyMode: string;
  weeklyAppTarget: number;
  weeklyTargetMet: boolean;

  // Computed Fields
  needsResumeImprovement: boolean;
  isActivelyApplying: boolean;
  hasRecentInterviews: boolean;
}

export interface ApplicationSummary {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: Date;
  updatedAt: Date;
  daysSinceUpdate: number;
  needsFollowUp: boolean;
}

export interface RecentOutcome {
  id: string;
  jobTitle: string;
  company: string;
  outcome: 'INTERVIEW' | 'REJECTION' | 'OFFER' | 'GHOSTED';
  occurredAt: Date;
}

export interface WeeklyProgress {
  weekStartDate: Date;
  weekEndDate: Date;
  applicationsTarget: number;
  applicationsActual: number;
  targetMet: boolean;
  percentComplete: number;
  daysRemaining: number;
}

// ==================== Service Class ====================

export class StateService {

  /**
   * Get comprehensive user state
   * Read-only aggregation layer - does not modify data
   */
  async getUserState(userId: string): Promise<UserState> {
    // Fetch user with profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get master resume
    const masterResume = await this.getMasterResume(userId);

    // Get application counts (fetch total first to reuse)
    const totalApps = await this.getTotalApplications(userId);
    const [weekApps, monthApps] = await Promise.all([
      this.getApplicationsThisWeek(userId),
      this.getApplicationsThisMonth(userId),
    ]);

    // Get outcome stats (bundle for performance, pass totalApps to avoid duplicate query)
    const [interviewRate, totalInterviews, totalRejections, hasRecentInterviews] = await Promise.all([
      this.calculateInterviewRate(userId, totalApps),
      this.countOutcomesByType(userId, 'INTERVIEW'),
      this.countOutcomesByType(userId, 'REJECTION'),
      this.hasInterviewsInLastNDays(userId, 30),
    ]);

    // Get strategy info (with defaults if no profile)
    const currentMode = user.profile?.currentStrategyMode || 'IMPROVE_RESUME_FIRST';
    const weeklyTarget = user.profile?.weeklyAppTarget || 0;

    // Compute derived fields
    const resumeScore = masterResume?.overallScore || null;
    const needsResumeImprovement = resumeScore !== null && resumeScore < 75;
    const weeklyTargetMet = weekApps >= weeklyTarget;
    const isActivelyApplying = weekApps > 0;

    return {
      userId,
      masterResumeId: masterResume?.id || null,
      resumeScore,
      lastScoredAt: masterResume?.updatedAt || null,
      totalApplications: totalApps,
      applicationsThisWeek: weekApps,
      applicationsThisMonth: monthApps,
      interviewRate,
      totalInterviews,
      totalRejections,
      currentStrategyMode: currentMode,
      weeklyAppTarget: weeklyTarget,
      weeklyTargetMet,
      needsResumeImprovement,
      isActivelyApplying,
      hasRecentInterviews,
    };
  }

  /**
   * Get applications needing follow-up
   * Definition: Applied > 7 days ago, status still APPLIED
   */
  async getApplicationsNeedingFollowUp(userId: string): Promise<ApplicationSummary[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const applications = await prisma.application.findMany({
      where: {
        userId,
        status: 'APPLIED',
        appliedAt: { lt: sevenDaysAgo },
      },
      include: {
        job: true,
      },
      orderBy: { appliedAt: 'asc' },
    });

    const now = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    return applications.map(app => {
      // Null-safe: fallback to appliedAt if updatedAt is somehow null
      const lastUpdated = app.updatedAt ?? app.appliedAt;
      const daysSinceUpdate = Math.floor(
        (now.getTime() - lastUpdated.getTime()) / MS_PER_DAY
      );

      return {
        id: app.id,
        jobTitle: app.job.title,
        company: app.job.company,
        status: app.status,
        appliedAt: app.appliedAt || now, // Fallback just in case
        updatedAt: lastUpdated,
        daysSinceUpdate,
        needsFollowUp: daysSinceUpdate >= 7,
      };
    });
  }

  /**
   * Get applications submitted this week
   */
  async getApplicationsThisWeek(userId: string): Promise<number> {
    const { weekStart } = this.getCurrentWeekBounds();

    return prisma.application.count({
      where: {
        userId,
        appliedAt: { gte: weekStart },
      },
    });
  }

  /**
   * Get applications submitted this month
   */
  async getApplicationsThisMonth(userId: string): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return prisma.application.count({
      where: {
        userId,
        appliedAt: { gte: monthStart },
      },
    });
  }

  /**
   * Get total applications ever
   */
  async getTotalApplications(userId: string): Promise<number> {
    return prisma.application.count({
      where: { userId },
    });
  }

  /**
   * Get master resume (latest with highest score)
   */
  async getMasterResume(userId: string) {
    return prisma.resumeVersion.findFirst({
      where: {
        userId,
        overallScore: { not: null },
      },
      orderBy: [
        { overallScore: 'desc' },
        { versionNumber: 'desc' },
      ],
    });
  }

  /**
   * Get recent outcomes (interviews, rejections, offers)
   */
  async getRecentOutcomes(userId: string, days: number): Promise<RecentOutcome[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const applications = await prisma.application.findMany({
      where: {
        userId,
        status: {
          in: ['INTERVIEW_SCHEDULED', 'REJECTED', 'OFFER_RECEIVED'],
        },
        updatedAt: { gte: since },
      },
      include: {
        job: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    return applications.map(app => ({
      id: app.id,
      jobTitle: app.job.jobTitle,
      company: app.job.company,
      outcome: this.mapStatusToOutcome(app.status),
      occurredAt: app.updatedAt,
    }));
  }

  /**
   * Calculate interview rate
   * @param totalApplications - Optional pre-fetched count to avoid duplicate query
   */
  async calculateInterviewRate(userId: string, totalApplications?: number): Promise<number> {
    const total = totalApplications ?? await this.getTotalApplications(userId);

    if (total === 0) return 0;

    const interviews = await prisma.application.count({
      where: {
        userId,
        status: {
          in: ['INTERVIEW_SCHEDULED', 'OFFER_RECEIVED'],
        },
      },
    });

    return Math.round((interviews / total) * 100);
  }

  /**
   * Get weekly progress
   */
  async getWeeklyProgress(userId: string): Promise<WeeklyProgress> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const weeklyTarget = user?.profile?.weeklyAppTarget || 0;
    const { weekStart, weekEnd } = this.getCurrentWeekBounds();

    const applicationsActual = await prisma.application.count({
      where: {
        userId,
        appliedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
    });

    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((weekEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const percentComplete = weeklyTarget > 0
      ? Math.min(100, Math.round((applicationsActual / weeklyTarget) * 100))
      : 0;

    return {
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      applicationsTarget: weeklyTarget,
      applicationsActual,
      targetMet: applicationsActual >= weeklyTarget,
      percentComplete,
      daysRemaining,
    };
  }

  // ==================== Private Helpers ====================

  private async countOutcomesByType(
    userId: string,
    outcomeType: 'INTERVIEW' | 'REJECTION' | 'OFFER'
  ): Promise<number> {
    const statusMap = {
      INTERVIEW: ['INTERVIEW_SCHEDULED'],
      REJECTION: ['REJECTED'],
      OFFER: ['OFFER_RECEIVED'],
    };

    return prisma.application.count({
      where: {
        userId,
        status: { in: statusMap[outcomeType] },
      },
    });
  }

  /**
   * Check if user has recent positive outcomes (interviews or offers)
   */
  private async hasInterviewsInLastNDays(userId: string, days: number): Promise<boolean> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const count = await prisma.application.count({
      where: {
        userId,
        status: {
          in: [
            'INTERVIEW_SCHEDULED',
            'OFFER_RECEIVED', // Include offers as positive signal
          ],
        },
        updatedAt: { gte: since },
      },
    });

    return count > 0;
  }

  private getCurrentWeekBounds(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...

    // Week starts on Monday
    const weekStart = new Date(now);
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return { weekStart, weekEnd };
  }

  private mapStatusToOutcome(status: string): 'INTERVIEW' | 'REJECTION' | 'OFFER' | 'GHOSTED' {
    switch (status) {
      case 'INTERVIEW_SCHEDULED':
        return 'INTERVIEW';
      case 'REJECTED':
        return 'REJECTION';
      case 'OFFER_RECEIVED':
        return 'OFFER';
      default:
        return 'GHOSTED';
    }
  }
}

export const stateService = new StateService();
