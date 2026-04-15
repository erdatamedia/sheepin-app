import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecordingHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: { id: string; role: UserRole }) {
    const sheepWhere =
      user.role === UserRole.FARMER ? { ownerUserId: user.id } : {};

    const [weights, bcsRecords, healthRecords, reproductions, statusEvents] =
      await Promise.all([
        this.prisma.sheepWeight.findMany({
          where: {
            sheep: sheepWhere,
          },
          select: {
            id: true,
            recordDate: true,
            weightKg: true,
            note: true,
            sheep: {
              select: {
                id: true,
                sheepCode: true,
                name: true,
                ownerUser: {
                  select: {
                    id: true,
                    name: true,
                    loginCode: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            recordDate: 'desc',
          },
          take: 100,
        }),

        this.prisma.sheepBCS.findMany({
          where: {
            sheep: sheepWhere,
          },
          select: {
            id: true,
            recordDate: true,
            bcsScore: true,
            note: true,
            sheep: {
              select: {
                id: true,
                sheepCode: true,
                name: true,
                ownerUser: {
                  select: {
                    id: true,
                    name: true,
                    loginCode: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            recordDate: 'desc',
          },
          take: 100,
        }),

        this.prisma.sheepHealth.findMany({
          where: {
            sheep: sheepWhere,
          },
          select: {
            id: true,
            checkDate: true,
            diseaseName: true,
            treatment: true,
            medicine: true,
            healthStatus: true,
            note: true,
            sheep: {
              select: {
                id: true,
                sheepCode: true,
                name: true,
                ownerUser: {
                  select: {
                    id: true,
                    name: true,
                    loginCode: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            checkDate: 'desc',
          },
          take: 100,
        }),

        this.prisma.sheepReproduction.findMany({
          where: {
            sheep: sheepWhere,
          },
          select: {
            id: true,
            status: true,
            matingDate: true,
            estimatedBirthDate: true,
            lambingDate: true,
            maleParent: true,
            totalLambBorn: true,
            note: true,
            sheep: {
              select: {
                id: true,
                sheepCode: true,
                name: true,
                ownerUser: {
                  select: {
                    id: true,
                    name: true,
                    loginCode: true,
                  },
                },
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        }),

        this.prisma.activityLog.findMany({
          where: {
            sheep: sheepWhere,
            action: {
              in: ['STATUS_DEAD', 'STATUS_SOLD', 'STATUS_CULLED'],
            },
          },
          select: {
            id: true,
            action: true,
            description: true,
            createdAt: true,
            sheep: {
              select: {
                id: true,
                sheepCode: true,
                name: true,
                ownerUser: {
                  select: {
                    id: true,
                    name: true,
                    loginCode: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 100,
        }),
      ]);

    const merged = [
      ...weights.map((item) => ({
        id: item.id,
        type: 'WEIGHT',
        recordDate: item.recordDate,
        title: `${item.weightKg} kg`,
        description: item.note || 'Rekording bobot',
        sheep: item.sheep,
        createdBy: item.createdBy,
      })),
      ...bcsRecords.map((item) => ({
        id: item.id,
        type: 'BCS',
        recordDate: item.recordDate,
        title: `BCS ${item.bcsScore}`,
        description: item.note || 'Rekording BCS',
        sheep: item.sheep,
        createdBy: item.createdBy,
      })),
      ...healthRecords.map((item) => ({
        id: item.id,
        type: 'HEALTH',
        recordDate: item.checkDate,
        title: item.healthStatus,
        description:
          item.diseaseName ||
          item.treatment ||
          item.medicine ||
          item.note ||
          'Rekording kesehatan',
        sheep: item.sheep,
        createdBy: item.createdBy,
      })),
      ...reproductions.map((item) => ({
        id: item.id,
        type: 'REPRODUCTION',
        recordDate:
          item.lambingDate ||
          item.matingDate ||
          item.estimatedBirthDate ||
          new Date(),
        title: this.mapReproductionTitle(item.status),
        description:
          item.note ||
          item.maleParent ||
          (item.status === 'LAMBED'
            ? `Jumlah anak lahir: ${item.totalLambBorn ?? '-'}`
            : 'Kejadian reproduksi tercatat'),
        sheep: item.sheep,
        createdBy: item.createdBy,
      })),
      ...statusEvents
        .filter((item) => item.sheep)
        .map((item) => ({
          id: item.id,
          type: 'STATUS',
          recordDate: item.createdAt,
          title: this.mapStatusEventTitle(item.action),
          description: item.description || 'Perubahan status ternak tercatat',
          sheep: item.sheep!,
          createdBy: item.user,
        })),
    ].sort(
      (a, b) =>
        new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime(),
    );

    return {
      message: 'Riwayat rekording berhasil diambil',
      data: merged,
    };
  }

  private mapReproductionTitle(status: string) {
    switch (status) {
      case 'MATED':
        return 'Kawin tercatat';
      case 'PREGNANT':
        return 'Bunting tercatat';
      case 'LAMBED':
        return 'Beranak tercatat';
      default:
        return 'Reproduksi tercatat';
    }
  }

  private mapStatusEventTitle(action: string) {
    switch (action) {
      case 'STATUS_DEAD':
        return 'Ternak mati';
      case 'STATUS_SOLD':
        return 'Ternak terjual';
      case 'STATUS_CULLED':
        return 'Ternak afkir';
      default:
        return 'Status ternak berubah';
    }
  }
}
