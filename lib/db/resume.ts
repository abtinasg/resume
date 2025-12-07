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

  async findAllByUser(userId: string) {
    return prisma.resumeVersion.findMany({
      where: { userId },
      orderBy: { versionNumber: 'desc' },
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
};
