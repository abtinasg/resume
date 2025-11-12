import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export interface ResumeProgressInput {
  userId: number;
  resumeId: number;
  version: number;
  score: number;
  summary?: string | null;
  data?: Prisma.JsonValue | null;
  previousScore?: number | null;
}

export interface ResumeProgressResponse {
  versionHistory: Array<{
    id: number;
    resumeId: number;
    userId: number;
    version: number;
    score: number;
    summary?: string | null;
    data?: Prisma.JsonValue | null;
    createdAt: Date;
    fileName: string;
  }>;
  scoreHistory: Array<{
    id: number;
    resumeId: number;
    userId: number;
    score: number;
    previousScore: number | null;
    change: number;
    recordedAt: Date;
    fileName: string;
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

export async function recordResumeProgress({
  userId,
  resumeId,
  version,
  score,
  summary = null,
  data = null,
  previousScore = null,
}: ResumeProgressInput): Promise<void> {
  const change = previousScore != null ? score - previousScore : 0;

  await prisma.$transaction([
    prisma.resumeVersion.create({
      data: {
        resumeId,
        userId,
        version,
        score,
        summary,
        data,
      },
    }),
    prisma.resumeScoreHistory.create({
      data: {
        resumeId,
        userId,
        score,
        previousScore,
        change,
      },
    }),
  ]);
}

export async function getResumeProgress(userId: number): Promise<ResumeProgressResponse> {
  const [versions, scoreHistory] = await Promise.all([
    prisma.resumeVersion.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        resume: {
          select: {
            fileName: true,
          },
        },
      },
    }),
    prisma.resumeScoreHistory.findMany({
      where: { userId },
      orderBy: { recordedAt: 'asc' },
      include: {
        resume: {
          select: {
            fileName: true,
          },
        },
      },
    }),
  ]);

  const versionHistory = versions.map((version) => ({
    id: version.id,
    resumeId: version.resumeId,
    userId: version.userId,
    version: version.version,
    score: version.score,
    summary: version.summary,
    data: version.data,
    createdAt: version.createdAt,
    fileName: version.resume.fileName,
  }));

  const scoreEntries = scoreHistory.map((entry) => ({
    id: entry.id,
    resumeId: entry.resumeId,
    userId: entry.userId,
    score: entry.score,
    previousScore: entry.previousScore ?? null,
    change: entry.change ?? (entry.previousScore != null ? entry.score - entry.previousScore : 0),
    recordedAt: entry.recordedAt,
    fileName: entry.resume.fileName,
  }));

  const scores = scoreEntries.map((entry) => entry.score);
  const bestScore = scores.length ? Math.max(...scores) : null;
  const latestScore = scores.length ? scores[scores.length - 1] : null;
  const totalImprovement = scoreEntries.reduce((sum, entry) => {
    const delta = entry.change ?? 0;
    return delta > 0 ? sum + delta : sum;
  }, 0);

  return {
    versionHistory,
    scoreHistory: scoreEntries,
    summary: {
      totalVersions: versionHistory.length,
      trackedResumes: new Set(versionHistory.map((item) => item.resumeId)).size,
      averageScore: calculateAverage(scores),
      bestScore,
      latestScore,
      totalImprovement,
    },
  };
}
