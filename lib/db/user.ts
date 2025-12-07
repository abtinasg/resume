import { prisma } from './index';

export const userService = {
  async create(data: { email: string; name?: string; password?: string }) {
    return prisma.user.create({
      data: {
        ...data,
        profile: {
          create: {
            currentStrategyMode: 'IMPROVE_RESUME_FIRST',
            weeklyAppTarget: 5,
          },
        },
      },
      include: { profile: true },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  },

  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  },

  async updateProfile(userId: string, data: any) {
    return prisma.userProfile.update({
      where: { userId },
      data,
    });
  },
};
