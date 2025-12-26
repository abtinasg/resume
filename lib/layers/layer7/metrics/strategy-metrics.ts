/**
 * Layer 7 - Learning Engine Foundation
 * Strategy Metrics Calculator
 *
 * Track strategy effectiveness by analyzing mode usage,
 * transitions, and outcomes per strategy mode.
 */

import prisma from '@/lib/prisma';
import { StrategyMode, isValidStrategyMode } from '../../shared/types';
import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { validateUserId, getDateRangeFromOptions, daysBetween } from '../utils';
import type {
  StrategyMetrics,
  DateRange,
  PeriodOptions,
  ModeOutcome,
  ModeTransition,
} from '../types';

// ==================== Helper Functions ====================

/**
 * Calculate a simple effectiveness score (0-100) based on interview rate
 * This is a basic heuristic for MVP - can be enhanced later
 */
function calculateEffectivenessScore(interviewRate: number): number {
  // Simple scoring: scale interview rate to 0-100
  // Assumes 20% interview rate is excellent (100 score)
  const score = Math.min(100, (interviewRate / 0.20) * 100);
  return Math.round(score);
}

// ==================== Main Metrics Function ====================

/**
 * Calculate strategy metrics for a user
 *
 * @param userId - User ID to calculate metrics for
 * @param options - Period options (date range or lookback days)
 * @returns Strategy metrics object
 *
 * @example
 * ```ts
 * const metrics = await calculateStrategyMetrics('user_123', {
 *   lookbackDays: 30
 * });
 * console.log(metrics.outcomesPerMode);
 * ```
 */
export async function calculateStrategyMetrics(
  userId: string,
  options: PeriodOptions = {}
): Promise<StrategyMetrics> {
  validateUserId(userId);

  const period = getDateRangeFromOptions(options);

  try {
    // Get strategy history entries
    const strategyHistory = await prisma.strategyHistory.findMany({
      where: {
        userId,
        activatedAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      orderBy: {
        activatedAt: 'asc',
      },
    });

    // Get applications with their metadata to find which mode they were created in
    const applications = await prisma.application.findMany({
      where: {
        userId,
        createdAt: {
          gte: period.start,
          lte: period.end,
        },
      },
      select: {
        id: true,
        status: true,
        interviewScheduledAt: true,
        offerReceivedAt: true,
        createdAt: true,
        metadata: true,
      },
    });

    // Initialize outcomes tracking for each mode
    const modeData: Record<
      StrategyMode,
      {
        applications: number;
        interviews: number;
        offers: number;
        totalDays: number;
        periods: number;
      }
    > = {
      [StrategyMode.IMPROVE_RESUME_FIRST]: { applications: 0, interviews: 0, offers: 0, totalDays: 0, periods: 0 },
      [StrategyMode.APPLY_MODE]: { applications: 0, interviews: 0, offers: 0, totalDays: 0, periods: 0 },
      [StrategyMode.RETHINK_TARGETS]: { applications: 0, interviews: 0, offers: 0, totalDays: 0, periods: 0 },
    };

    // Process strategy history to get time in mode and transitions
    const modeTransitions: ModeTransition[] = [];
    const now = new Date();

    for (let i = 0; i < strategyHistory.length; i++) {
      const entry = strategyHistory[i];
      const mode = entry.strategyMode as StrategyMode;
      
      if (!isValidStrategyMode(mode)) continue;

      // Calculate time in this mode
      const modeStart = entry.activatedAt;
      const modeEnd = entry.deactivatedAt ?? now;
      const daysInMode = daysBetween(modeStart, modeEnd);

      modeData[mode].totalDays += daysInMode;
      modeData[mode].periods++;

      // Create transition record if there's a previous mode
      if (i > 0) {
        const prevEntry = strategyHistory[i - 1];
        const prevMode = prevEntry.strategyMode as StrategyMode;
        
        if (isValidStrategyMode(prevMode)) {
          modeTransitions.push({
            from: prevMode,
            to: mode,
            changedAt: entry.activatedAt,
            reason: entry.reason,
          });
        }
      }
    }

    // Get current mode to assign applications
    const currentProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { currentStrategyMode: true },
    });

    const currentMode = currentProfile?.currentStrategyMode;

    // Assign applications to modes based on metadata or current mode
    for (const app of applications) {
      // Try to get mode from application metadata
      const metadata = app.metadata as Record<string, unknown> | null;
      let appMode = metadata?.strategyMode as string | undefined;

      // Fall back to current mode if not in metadata
      if (!appMode || !isValidStrategyMode(appMode)) {
        if (currentMode && isValidStrategyMode(currentMode)) {
          appMode = currentMode;
        } else {
          appMode = StrategyMode.IMPROVE_RESUME_FIRST;
        }
      }

      const mode = appMode as StrategyMode;
      modeData[mode].applications++;

      if (app.interviewScheduledAt) {
        modeData[mode].interviews++;
      }

      if (app.offerReceivedAt) {
        modeData[mode].offers++;
      }
    }

    // Build outcomes per mode
    const outcomesPerMode: ModeOutcome[] = Object.entries(modeData).map(([mode, data]) => {
      const interviewRate = data.applications > 0 ? data.interviews / data.applications : 0;
      const avgTimeInMode = data.periods > 0 ? data.totalDays / data.periods : null;

      return {
        mode: mode as StrategyMode,
        applicationsCount: data.applications,
        interviewsCount: data.interviews,
        offersCount: data.offers,
        interviewRate,
        avgTimeInModeDays: avgTimeInMode,
      };
    });

    // Build avg time in mode record
    const avgTimeInMode: Record<StrategyMode, number | null> = {
      [StrategyMode.IMPROVE_RESUME_FIRST]: null,
      [StrategyMode.APPLY_MODE]: null,
      [StrategyMode.RETHINK_TARGETS]: null,
    };

    for (const outcome of outcomesPerMode) {
      avgTimeInMode[outcome.mode] = outcome.avgTimeInModeDays;
    }

    // Build effectiveness scores
    const effectivenessScores: Record<StrategyMode, number | null> = {
      [StrategyMode.IMPROVE_RESUME_FIRST]: null,
      [StrategyMode.APPLY_MODE]: null,
      [StrategyMode.RETHINK_TARGETS]: null,
    };

    for (const outcome of outcomesPerMode) {
      if (outcome.applicationsCount > 0) {
        effectivenessScores[outcome.mode] = calculateEffectivenessScore(outcome.interviewRate);
      }
    }

    return {
      outcomesPerMode,
      avgTimeInMode,
      modeTransitions,
      effectivenessScores,
      period,
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.METRICS_CALCULATION_FAILED, error);
  }
}

/**
 * Get current strategy mode for a user
 *
 * @param userId - User ID
 * @returns Current strategy mode or null
 */
export async function getCurrentStrategyMode(userId: string): Promise<StrategyMode | null> {
  validateUserId(userId);

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { currentStrategyMode: true },
    });

    const mode = profile?.currentStrategyMode;
    if (mode && isValidStrategyMode(mode)) {
      return mode as StrategyMode;
    }

    return null;
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}

/**
 * Get mode transition count for a user
 *
 * @param userId - User ID
 * @param dateRange - Optional date range
 * @returns Number of mode transitions
 */
export async function getModeTransitionCount(
  userId: string,
  dateRange?: DateRange
): Promise<number> {
  validateUserId(userId);

  const range = dateRange ?? getDateRangeFromOptions({});

  try {
    // Count strategy history entries (minus 1 for transitions)
    const count = await prisma.strategyHistory.count({
      where: {
        userId,
        activatedAt: {
          gte: range.start,
          lte: range.end,
        },
      },
    });

    return Math.max(0, count - 1);
  } catch (error) {
    throw new AnalyticsError(AnalyticsErrorCode.QUERY_FAILED, error);
  }
}
