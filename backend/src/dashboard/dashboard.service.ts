import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      totalSheep,
      totalMale,
      totalFemale,
      totalActive,
      totalWeights,
      totalBcs,
      totalHealth,
      totalReproduction,
      recentSheep,
    ] = await Promise.all([
      this.prisma.sheep.count(),
      this.prisma.sheep.count({
        where: { gender: 'MALE' },
      }),
      this.prisma.sheep.count({
        where: { gender: 'FEMALE' },
      }),
      this.prisma.sheep.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.sheepWeight.count(),
      this.prisma.sheepBCS.count(),
      this.prisma.sheepHealth.count(),
      this.prisma.sheepReproduction.count(),
      this.prisma.sheep.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          sheepCode: true,
          name: true,
          breed: true,
          gender: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      message: 'Dashboard summary ready',
      data: {
        sheep: {
          total: totalSheep,
          male: totalMale,
          female: totalFemale,
          active: totalActive,
        },
        records: {
          weights: totalWeights,
          bcs: totalBcs,
          health: totalHealth,
          reproduction: totalReproduction,
        },
        recentSheep,
      },
    };
  }
}
