import { prisma } from './index';

export const resumeService = {
  async create(userId: string, data: {
    versionNumber: number;
    name?: string;
    content: any;
    overallScore?: number;
    targetRoles?: string[];
  }) {
    return prisma.resumeVersion.create({
      data: {
        userId,
        ...data,
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
};
