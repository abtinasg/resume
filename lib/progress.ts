import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export interface ResumeProgressInput {
  userId: string | number;
  resumeId: string | number;
  version: number;
  score: number | null;
  summary?: string | null;
  data?: Prisma.JsonValue | null;
  previousScore?: number | null;
}

export interface ResumeProgressResponse {
  versionHistory: Array<{
    id: string;
    userId: string;
    versionNumber: number;
    overallScore: number | null;
    createdAt: Date;
    name: string | null;
  }>;
  scoreHistory: Array<{
    id: string;
    userId: string;
    score: number | null;
    previousScore: number | null;
    change: number;
    recordedAt: Date;
  }>;
  summary: {
    totalVersions: number;
    trackedResumes: number;
    averageScore: number | null;
    bestScore: number | null;
    latestScore: number | null;
    totalImprovement: number;
  };
}

function calculateAverage(scores: number[]): number | null {
  if (!scores.length) {
    return null;
  }

  const total = scores.reduce((sum, score) => sum + score, 0);
  return parseFloat((total / scores.length).toFixed(2));
}

/**
 * Record resume progress
 * Note: resumeScoreHistory model not in current schema - skipping history tracking
 */
export async function recordResumeProgress({
  userId: _userId,
  resumeId: _resumeId,
  version: _version,
  score: _score,
  summary: _summary = null,
  data: _data = null,
  previousScore: _previousScore = null,
}: ResumeProgressInput): Promise<void> {
  // resumeScoreHistory model not in current schema - no-op
  console.log('[Progress] Resume progress recording skipped - resumeScoreHistory model not available');
}

export async function getResumeProgress(userId: string | number): Promise<ResumeProgressResponse> {
  // Get resume versions for this user
  const versions = await prisma.resumeVersion.findMany({
    where: { userId: String(userId) },
    orderBy: { createdAt: 'desc' },
  });

  const versionHistory = versions.map((version) => ({
    id: version.id,
    userId: version.userId,
    versionNumber: version.versionNumber,
    overallScore: version.overallScore,
    createdAt: version.createdAt,
    name: version.name,
  }));

  // Calculate score history from versions
  const scoreHistory = versions.map((version, index) => {
    const previousVersion = versions[index + 1];
    const previousScore = previousVersion?.overallScore ?? null;
    const currentScore = version.overallScore ?? 0;
    return {
      id: version.id,
      userId: version.userId,
      score: version.overallScore,
      previousScore,
      change: previousScore != null ? currentScore - previousScore : 0,
      recordedAt: version.createdAt,
    };
  });

  const scores = versions.map((v) => v.overallScore).filter((s): s is number => s != null);
  const bestScore = scores.length ? Math.max(...scores) : null;
  const latestScore = versions[0]?.overallScore ?? null;
  const totalImprovement = scoreHistory.reduce((sum, entry) => {
    const delta = entry.change;
    return delta > 0 ? sum + delta : sum;
  }, 0);

  return {
    versionHistory,
    scoreHistory,
    summary: {
      totalVersions: versionHistory.length,
      trackedResumes: new Set(versionHistory.map((item) => item.userId)).size,
      averageScore: calculateAverage(scores),
      bestScore,
      latestScore,
      totalImprovement,
    },
  };
}
