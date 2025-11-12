import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';

export type AnalyticsEventName =
  | 'resume_upload'
  | 'analysis_complete'
  | 'user_registration'
  | 'user_login'
  | 'resume_deleted'
  | 'dashboard_viewed'
  | 'exit_feedback_submitted';

interface TrackEventOptions {
  userId?: number;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function resolveIp(options: TrackEventOptions): string | null {
  if (options.ipAddress) {
    return options.ipAddress;
  }

  const forwardedFor = options.request?.headers
    .get('x-forwarded-for')
    ?.split(',')[0]
    ?.trim();

  if (forwardedFor) {
    return forwardedFor;
  }

  if (options.request?.ip) {
    return options.request.ip;
  }

  return null;
}

function resolveUserAgent(options: TrackEventOptions): string | null {
  if (options.userAgent) {
    return options.userAgent;
  }

  return options.request?.headers.get('user-agent') ?? null;
}

export async function trackEvent(
  event: AnalyticsEventName,
  options: TrackEventOptions = {}
): Promise<void> {
  try {
    const ipAddress = resolveIp(options);
    const userAgent = resolveUserAgent(options);

    await prisma.analyticsEvent.create({
      data: {
        event,
        userId: options.userId ?? undefined,
        metadata: options.metadata as Prisma.JsonValue | undefined,
        ipAddress: ipAddress ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    });
  } catch (error) {
    console.error(`[Analytics] Failed to track event "${event}":`, error);
  }
}
