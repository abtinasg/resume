import type { NextRequest } from 'next/server';

export type AnalyticsEventName =
  | 'resume_upload'
  | 'analysis_complete'
  | 'user_registration'
  | 'user_login'
  | 'resume_deleted'
  | 'dashboard_viewed'
  | 'exit_feedback_submitted'
  | 'job_match_cached'
  | 'job_match_complete'
  | 'job_match_error'
  | string; // Allow custom event names

interface TrackEventOptions {
  userId?: string | number;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Track an analytics event
 * Note: analyticsEvent model not in current schema - logging to console only
 */
export async function trackEvent(
  event: AnalyticsEventName,
  options: TrackEventOptions = {}
): Promise<void> {
  try {
    // Analytics event model not in current schema, log to console instead
    console.log(`[Analytics] Event: ${event}`, {
      userId: options.userId,
      metadata: options.metadata,
    });
  } catch (error) {
    console.error(`[Analytics] Failed to track event "${event}":`, error);
  }
}
