import { NextRequest, NextResponse } from 'next/server';
import { Layer7 } from '@/lib/layers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const period = searchParams.get('period');

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Validate period if provided
    const validPeriods = ['weekly', 'monthly', 'all_time'];
    if (period && !validPeriods.includes(period)) {
      return NextResponse.json(
        { 
          error: `Invalid period. Must be one of: ${validPeriods.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Calculate lookback days based on period
    let lookbackDays: number;
    switch (period) {
      case 'weekly':
        lookbackDays = 7;
        break;
      case 'monthly':
        lookbackDays = 30;
        break;
      case 'all_time':
        lookbackDays = 365; // Use 1 year as "all time" limit
        break;
      default:
        lookbackDays = 30; // Default to monthly
    }

    // Call Layer 7 to get metrics
    const metrics = await Layer7.getMetrics(user_id, { lookbackDays });

    return NextResponse.json({
      success: true,
      metrics: {
        applications: {
          total_applications: metrics.applications.totalApplications,
          interviews_received: metrics.applications.interviewsReceived,
          offers_received: metrics.applications.offersReceived,
          avg_days_to_response: metrics.applications.avgDaysToResponse,
          conversion_rates: {
            interview_rate: metrics.applications.interviewRate,
            offer_rate: metrics.applications.offerRate,
            overall_conversion_rate: metrics.applications.overallConversionRate,
          },
        },
        resume: {
          initial_score: metrics.resume.initialScore,
          current_score: metrics.resume.currentScore,
          improvement_percentage: metrics.resume.improvementPercentage,
          rewrites_applied: metrics.resume.rewritesApplied,
          score_history: metrics.resume.scoreHistory.map(entry => ({
            date: entry.date.toISOString(),
            score: entry.score,
          })),
        },
        strategy: {
          outcomes_per_mode: metrics.strategy.outcomesPerMode.map(outcome => ({
            mode: outcome.mode,
            applications_count: outcome.applicationsCount,
            interviews_count: outcome.interviewsCount,
            offers_count: outcome.offersCount,
            interview_rate: outcome.interviewRate,
            avg_time_in_mode_days: outcome.avgTimeInModeDays,
          })),
          avg_time_in_mode: metrics.strategy.avgTimeInMode,
          mode_transitions: metrics.strategy.modeTransitions.map(transition => ({
            from: transition.from,
            to: transition.to,
            changed_at: transition.changedAt.toISOString(),
            reason: transition.reason,
          })),
        },
      },
      period: period || 'monthly',
    });
  } catch (error) {
    console.error('Analytics metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
