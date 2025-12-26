/**
 * Layer 7 - Learning Engine Foundation
 * Report Generator
 *
 * Generate summary reports in markdown/text format.
 * Provides weekly and monthly summaries of user activity.
 */

import { AnalyticsError, AnalyticsErrorCode } from '../errors';
import { calculateApplicationMetrics, calculateResumeMetrics, calculateStrategyMetrics, getCurrentResumeScore } from '../metrics';
import { getTotalEventCount } from '../queries';
import { validateUserId, formatDate, formatPercent } from '../utils';
import type { WeeklySummaryReport, MonthlySummaryReport, DateRange } from '../types';

// ==================== Helper Functions ====================

/**
 * Get week boundaries
 */
function getWeekBoundaries(weekOffset: number = 0): DateRange {
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Start of current week (Sunday)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek - (weekOffset * 7));
  weekStart.setHours(0, 0, 0, 0);

  // End of week (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { start: weekStart, end: weekEnd };
}

/**
 * Get month boundaries
 */
function getMonthBoundaries(monthOffset: number = 0): DateRange {
  const now = new Date();
  
  // Start of month
  const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  
  // End of month
  const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  return { start: monthStart, end: monthEnd };
}

/**
 * Determine trend direction
 */
function determineTrend(current: number, previous: number): 'increasing' | 'decreasing' | 'stable' {
  const change = current - previous;
  const threshold = 0.05; // 5% change threshold
  
  if (change > threshold) return 'increasing';
  if (change < -threshold) return 'decreasing';
  return 'stable';
}

/**
 * Determine score trend
 */
function determineScoreTrend(
  current: number | null,
  initial: number | null
): 'improving' | 'declining' | 'stable' {
  if (current === null || initial === null) return 'stable';
  
  const change = current - initial;
  if (change > 2) return 'improving';
  if (change < -2) return 'declining';
  return 'stable';
}

// ==================== Report Generators ====================

/**
 * Generate weekly summary report
 *
 * @param userId - User ID
 * @param weekOffset - Week offset (0 = current week, 1 = last week)
 * @returns Weekly summary report
 *
 * @example
 * ```ts
 * const report = await generateWeeklySummary('user_123');
 * console.log(report.summary);
 * ```
 */
export async function generateWeeklySummary(
  userId: string,
  weekOffset: number = 0
): Promise<WeeklySummaryReport> {
  validateUserId(userId);

  const { start: weekStart, end: weekEnd } = getWeekBoundaries(weekOffset);
  const dateRange: DateRange = { start: weekStart, end: weekEnd };

  try {
    // Get metrics for the week
    const [applicationMetrics, resumeMetrics, currentScore, totalEvents] = await Promise.all([
      calculateApplicationMetrics(userId, { dateRange }),
      calculateResumeMetrics(userId, { dateRange }),
      getCurrentResumeScore(userId),
      getTotalEventCount(userId, dateRange),
    ]);

    // Build highlights
    const highlights: string[] = [];
    const concerns: string[] = [];

    // Application highlights
    if (applicationMetrics.totalApplications > 0) {
      highlights.push(`Submitted ${applicationMetrics.totalApplications} application(s) this week`);
    }

    if (applicationMetrics.interviewsReceived > 0) {
      highlights.push(`Received ${applicationMetrics.interviewsReceived} interview request(s)! 🎉`);
    }

    if (applicationMetrics.offersReceived > 0) {
      highlights.push(`Received ${applicationMetrics.offersReceived} offer(s)! 🎊`);
    }

    // Resume highlights
    if (resumeMetrics.rewritesApplied > 0) {
      highlights.push(`Applied ${resumeMetrics.rewritesApplied} resume improvement(s)`);
    }

    if (resumeMetrics.improvementPercentage && resumeMetrics.improvementPercentage > 0) {
      highlights.push(`Resume score improved by ${resumeMetrics.improvementPercentage.toFixed(1)}%`);
    }

    // Concerns
    if (applicationMetrics.totalApplications === 0) {
      concerns.push('No applications submitted this week');
    }

    if (applicationMetrics.rejectionCount > applicationMetrics.interviewsReceived) {
      concerns.push('More rejections than interviews - consider resume improvements');
    }

    if (applicationMetrics.ghostedCount > 0) {
      concerns.push(`${applicationMetrics.ghostedCount} application(s) with no response after 30+ days`);
    }

    // Build summary markdown
    const weekLabel = weekOffset === 0 ? 'This Week' : `Week of ${formatDate(weekStart)}`;
    const summary = `# Weekly Summary: ${weekLabel}

**Period:** ${formatDate(weekStart)} - ${formatDate(weekEnd)}

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| Applications Submitted | ${applicationMetrics.totalApplications} |
| Interviews Received | ${applicationMetrics.interviewsReceived} |
| Interview Rate | ${formatPercent(applicationMetrics.interviewRate)} |
| Current Resume Score | ${currentScore ?? 'N/A'}/100 |

## ✅ Highlights
${highlights.length > 0 ? highlights.map(h => `- ${h}`).join('\n') : '- No highlights this week'}

${concerns.length > 0 ? `## ⚠️ Areas of Attention\n${concerns.map(c => `- ${c}`).join('\n')}` : ''}

---
*Report generated on ${formatDate(new Date())}*
`;

    // Determine if targets were met (simple heuristic)
    const targetsMet = applicationMetrics.totalApplications >= 5 || applicationMetrics.interviewsReceived > 0;

    return {
      userId,
      weekStart,
      weekEnd,
      summary,
      highlights,
      concerns,
      metrics: {
        applicationsSubmitted: applicationMetrics.totalApplications,
        interviewsReceived: applicationMetrics.interviewsReceived,
        currentResumeScore: currentScore,
        targetsMet,
      },
      generatedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.REPORT_GENERATION_FAILED, error);
  }
}

/**
 * Generate monthly summary report
 *
 * @param userId - User ID
 * @param monthOffset - Month offset (0 = current month, 1 = last month)
 * @returns Monthly summary report
 */
export async function generateMonthlySummary(
  userId: string,
  monthOffset: number = 0
): Promise<MonthlySummaryReport> {
  validateUserId(userId);

  const { start: monthStart, end: monthEnd } = getMonthBoundaries(monthOffset);
  const dateRange: DateRange = { start: monthStart, end: monthEnd };

  // Get previous month for comparison
  const prevMonth = getMonthBoundaries(monthOffset + 1);

  try {
    // Get metrics for current and previous month
    const [
      currentMetrics,
      previousMetrics,
      resumeMetrics,
      strategyMetrics,
    ] = await Promise.all([
      calculateApplicationMetrics(userId, { dateRange }),
      calculateApplicationMetrics(userId, { dateRange: prevMonth }),
      calculateResumeMetrics(userId, { dateRange }),
      calculateStrategyMetrics(userId, { dateRange }),
    ]);

    // Calculate trends
    const applicationTrend = determineTrend(
      currentMetrics.totalApplications,
      previousMetrics.totalApplications
    );
    const interviewRateTrend = determineTrend(
      currentMetrics.interviewRate,
      previousMetrics.interviewRate
    ) as 'improving' | 'declining' | 'stable';
    const scoreTrend = determineScoreTrend(
      resumeMetrics.currentScore,
      resumeMetrics.initialScore
    );

    // Build highlights
    const highlights: string[] = [];

    if (currentMetrics.totalApplications > previousMetrics.totalApplications) {
      const increase = currentMetrics.totalApplications - previousMetrics.totalApplications;
      highlights.push(`Submitted ${increase} more application(s) than last month`);
    }

    if (currentMetrics.interviewRate > previousMetrics.interviewRate) {
      highlights.push('Interview rate improved compared to last month');
    }

    if (currentMetrics.offersReceived > 0) {
      highlights.push(`Received ${currentMetrics.offersReceived} offer(s) this month!`);
    }

    if (resumeMetrics.improvementPercentage && resumeMetrics.improvementPercentage > 5) {
      highlights.push(`Resume score improved by ${resumeMetrics.improvementPercentage.toFixed(1)}%`);
    }

    // Find best performing mode
    const bestMode = strategyMetrics.outcomesPerMode
      .filter(m => m.applicationsCount > 0)
      .sort((a, b) => b.interviewRate - a.interviewRate)[0];

    if (bestMode && bestMode.interviewRate > 0) {
      highlights.push(`Best performing strategy mode: ${bestMode.mode} (${formatPercent(bestMode.interviewRate)} interview rate)`);
    }

    // Build summary markdown
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const summary = `# Monthly Summary: ${monthLabel}

**Period:** ${formatDate(monthStart)} - ${formatDate(monthEnd)}

## 📊 Overview

| Metric | This Month | Last Month | Trend |
|--------|------------|------------|-------|
| Applications | ${currentMetrics.totalApplications} | ${previousMetrics.totalApplications} | ${applicationTrend === 'increasing' ? '📈' : applicationTrend === 'decreasing' ? '📉' : '➡️'} |
| Interviews | ${currentMetrics.interviewsReceived} | ${previousMetrics.interviewsReceived} | ${interviewRateTrend === 'improving' ? '📈' : interviewRateTrend === 'declining' ? '📉' : '➡️'} |
| Interview Rate | ${formatPercent(currentMetrics.interviewRate)} | ${formatPercent(previousMetrics.interviewRate)} | ${interviewRateTrend === 'improving' ? '📈' : interviewRateTrend === 'declining' ? '📉' : '➡️'} |
| Offers | ${currentMetrics.offersReceived} | ${previousMetrics.offersReceived} | - |

## 📈 Trends

- **Application Volume:** ${applicationTrend}
- **Resume Score:** ${scoreTrend}
- **Interview Rate:** ${interviewRateTrend}

${highlights.length > 0 ? `## ✅ Highlights\n${highlights.map(h => `- ${h}`).join('\n')}` : ''}

## 🎯 Strategy Performance

${strategyMetrics.outcomesPerMode
  .filter(m => m.applicationsCount > 0)
  .map(m => `- **${m.mode}:** ${m.applicationsCount} apps, ${m.interviewsCount} interviews (${formatPercent(m.interviewRate)})`)
  .join('\n')}

---
*Report generated on ${formatDate(new Date())}*
`;

    return {
      userId,
      monthStart,
      monthEnd,
      summary,
      highlights,
      trends: {
        applicationTrend,
        scoreTrend,
        interviewRateTrend,
      },
      metrics: currentMetrics,
      generatedAt: new Date(),
    };
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.REPORT_GENERATION_FAILED, error);
  }
}

/**
 * Generate a simple text summary
 *
 * @param userId - User ID
 * @param days - Number of days to summarize
 * @returns Text summary string
 */
export async function generateTextSummary(
  userId: string,
  days: number = 7
): Promise<string> {
  validateUserId(userId);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  const dateRange: DateRange = { start, end };

  try {
    const [applicationMetrics, resumeMetrics] = await Promise.all([
      calculateApplicationMetrics(userId, { dateRange }),
      calculateResumeMetrics(userId, { dateRange }),
    ]);

    return `Summary (Last ${days} days):
- Applications: ${applicationMetrics.totalApplications}
- Interviews: ${applicationMetrics.interviewsReceived}
- Interview Rate: ${formatPercent(applicationMetrics.interviewRate)}
- Offers: ${applicationMetrics.offersReceived}
- Current Resume Score: ${resumeMetrics.currentScore ?? 'N/A'}/100
- Resume Rewrites: ${resumeMetrics.rewritesApplied}`;
  } catch (error) {
    if (error instanceof AnalyticsError) {
      throw error;
    }
    throw new AnalyticsError(AnalyticsErrorCode.REPORT_GENERATION_FAILED, error);
  }
}
