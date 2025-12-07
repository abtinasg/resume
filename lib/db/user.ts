import { prisma } from './index';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const userService = {
  async create(data: {
    email: string;
    name?: string;
    password?: string;
  }) {
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
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

  async updateProfile(userId: string, data: Partial<Prisma.UserProfileUpdateInput>) {
    return prisma.userProfile.update({
      where: { userId },
      data,
    });
  },

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { password: true },
    });

    if (!user || !user.password) {
      return false;
    }

    return bcrypt.compare(password, user.password);
  },
};
