import { prisma } from './index';

export const resumeService = {
  async create(userId: string, data: {
    versionNumber: number;
    name?: string;
    content: any;
    overallScore?: number;
    sectionScores?: any;
    improvementAreas?: string[];
    targetRoles?: string[];
  }) {
    return prisma.resumeVersion.create({
      data: {
        userId,
        versionNumber: data.versionNumber,
        name: data.name,
        content: data.content,
        overallScore: data.overallScore,
        sectionScores: data.sectionScores,
        improvementAreas: data.improvementAreas || [],
        targetRoles: data.targetRoles || [],
        isMaster: data.versionNumber === 1,
      },
    });
  },

  async findLatestByUser(userId: string) {
    return prisma.resumeVersion.findFirst({
      where: { userId },
      orderBy: { versionNumber: 'desc' },
    });
  },

  async findMasterByUser(userId: string) {
    return prisma.resumeVersion.findFirst({
      where: { userId, isMaster: true },
    });
  },

  async setMaster(userId: string, resumeId: string) {
    await prisma.resumeVersion.updateMany({
      where: { userId },
      data: { isMaster: false },
    });

    return prisma.resumeVersion.update({
      where: { id: resumeId },
      data: { isMaster: true },
    });
  },

  /**
   * Find resume by ID
   */
  async findById(resumeId: string) {
    return prisma.resumeVersion.findUnique({
      where: { id: resumeId },
    });
  },

  /**
   * Find all scored resumes for a user
   * Only returns resumes that have been scored (overallScore is not null)
   */
  async findAllByUser(userId: string, limit = 20) {
    return prisma.resumeVersion.findMany({
      where: {
        userId,
        overallScore: { not: null },
      },
      select: {
        id: true,
        versionNumber: true,
        name: true,
        overallScore: true,
        componentScores: true,
        improvementAreas: true,
        updatedAt: true,
      },
      orderBy: { versionNumber: 'desc' },
      take: limit,
    });
  },

  /**
   * Update scores for a resume after scoring
   * Sets sectionScores to null (deprecated field)
   */
  async updateScores(
    resumeId: string,
    scores: {
      overallScore: number;
      componentScores: any;  // Json field
      improvementAreas: any; // Json field - accepts any JSON-serializable data
    }
  ) {
    return prisma.resumeVersion.update({
      where: { id: resumeId },
      data: {
        overallScore: scores.overallScore,
        componentScores: scores.componentScores,
        improvementAreas: scores.improvementAreas,
      },
    });
  },
};
