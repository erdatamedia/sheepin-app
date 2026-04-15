import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QuickRecordingDto } from './dto/quick-recording.dto';

@Injectable()
export class RecordingService {
  constructor(private readonly prisma: PrismaService) {}

  async quickRecord(
    dto: QuickRecordingDto,
    user: { id: string; role: UserRole },
  ) {
    const sheep = await this.prisma.sheep.findUnique({
      where: { id: dto.sheepId },
      select: {
        id: true,
        sheepCode: true,
        ownerUserId: true,
        status: true,
      },
    });

    if (!sheep) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    if (user.role === UserRole.FARMER && sheep.ownerUserId !== user.id) {
      throw new ForbiddenException(
        'Anda tidak dapat merekord ternak yang bukan milik Anda',
      );
    }

    if (
      dto.weightKg === undefined &&
      dto.bcsScore === undefined &&
      dto.healthStatus === undefined
    ) {
      throw new BadRequestException(
        'Minimal isi salah satu data: bobot, BCS, atau kesehatan',
      );
    }

    const results: Record<string, any> = {};

    await this.prisma.$transaction(async (tx) => {
      if (dto.weightKg !== undefined) {
        results.weight = await tx.sheepWeight.create({
          data: {
            sheepId: dto.sheepId,
            recordDate: new Date(dto.recordDate),
            weightKg: dto.weightKg,
            note: dto.note,
            createdById: user.id,
          },
        });
      }

      if (dto.bcsScore !== undefined) {
        results.bcs = await tx.sheepBCS.create({
          data: {
            sheepId: dto.sheepId,
            recordDate: new Date(dto.recordDate),
            bcsScore: dto.bcsScore,
            note: dto.note,
            createdById: user.id,
          },
        });
      }

      if (dto.healthStatus !== undefined) {
        results.health = await tx.sheepHealth.create({
          data: {
            sheepId: dto.sheepId,
            checkDate: new Date(dto.recordDate),
            diseaseName: dto.diseaseName,
            treatment: dto.treatment,
            medicine: dto.medicine,
            healthStatus: dto.healthStatus,
            note: dto.note,
            createdById: user.id,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: user.id,
          sheepId: dto.sheepId,
          action: 'QUICK_RECORDING',
          description: `Rekording cepat untuk ternak ${sheep.sheepCode}`,
        },
      });
    });

    return {
      message: 'Rekording cepat berhasil disimpan',
      data: {
        sheepId: dto.sheepId,
        recordDate: dto.recordDate,
        saved: {
          weight: !!results.weight,
          bcs: !!results.bcs,
          health: !!results.health,
        },
        results,
      },
    };
  }

  async sheepOptions(user: { id: string; role: UserRole }) {
    const where =
      user.role === UserRole.FARMER
        ? {
            ownerUserId: user.id,
            status: 'ACTIVE' as const,
          }
        : {
            status: 'ACTIVE' as const,
          };

    const data = await this.prisma.sheep.findMany({
      where,
      select: {
        id: true,
        sheepCode: true,
        name: true,
        breed: true,
        gender: true,
        location: true,
        ownerUser: {
          select: {
            id: true,
            name: true,
            loginCode: true,
            groupName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Opsi ternak untuk rekording berhasil diambil',
      data,
    };
  }
}
