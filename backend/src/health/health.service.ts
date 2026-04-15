import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHealthDto } from './dto/create-health.dto';
import { UpdateHealthDto } from './dto/update-health.dto';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHealthDto, user: { id: string; role: UserRole }) {
    await this.ensureSheepAccess(dto.sheepId, user);

    const record = await this.prisma.sheepHealth.create({
      data: {
        sheepId: dto.sheepId,
        checkDate: new Date(dto.checkDate),
        diseaseName: dto.diseaseName,
        treatment: dto.treatment,
        medicine: dto.medicine,
        healthStatus: dto.healthStatus,
        note: dto.note,
        createdById: user.id,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: dto.sheepId,
        action: 'CREATE_HEALTH',
        description: `Menambahkan data kesehatan dengan status ${dto.healthStatus}`,
      },
    });

    return {
      message: 'Data kesehatan berhasil ditambahkan',
      data: record,
    };
  }

  async findBySheepId(sheepId: string, user: { id: string; role: UserRole }) {
    await this.ensureSheepAccess(sheepId, user);

    const items = await this.prisma.sheepHealth.findMany({
      where: { sheepId },
      orderBy: {
        checkDate: 'desc',
      },
      select: this.detailSelect(),
    });

    return {
      message: 'Riwayat kesehatan berhasil diambil',
      data: items,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.sheepHealth.findUnique({
      where: { id },
      select: this.detailSelect(),
    });

    if (!item) {
      throw new NotFoundException('Data kesehatan tidak ditemukan');
    }

    return {
      message: 'Detail kesehatan berhasil diambil',
      data: item,
    };
  }

  async update(
    id: string,
    dto: UpdateHealthDto,
    user: { id: string; role: UserRole },
  ) {
    const existing = await this.prisma.sheepHealth.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data kesehatan tidak ditemukan');
    }

    const sheepId = dto.sheepId ?? existing.sheepId;
    await this.ensureSheepAccess(sheepId, user);

    const updated = await this.prisma.sheepHealth.update({
      where: { id },
      data: {
        sheepId: dto.sheepId,
        checkDate: dto.checkDate ? new Date(dto.checkDate) : undefined,
        diseaseName: dto.diseaseName,
        treatment: dto.treatment,
        medicine: dto.medicine,
        healthStatus: dto.healthStatus,
        note: dto.note,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: updated.sheep.id,
        action: 'UPDATE_HEALTH',
        description: `Memperbarui data kesehatan menjadi ${updated.healthStatus}`,
      },
    });

    return {
      message: 'Data kesehatan berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string, user: { id: string; role: UserRole }) {
    const existing = await this.prisma.sheepHealth.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
        healthStatus: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data kesehatan tidak ditemukan');
    }

    await this.ensureSheepAccess(existing.sheepId, user);

    await this.prisma.sheepHealth.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: existing.sheepId,
        action: 'DELETE_HEALTH',
        description: `Menghapus data kesehatan dengan status ${existing.healthStatus}`,
      },
    });

    return {
      message: 'Data kesehatan berhasil dihapus',
    };
  }

  private async ensureSheepAccess(
    sheepId: string,
    user?: { id: string; role: UserRole },
  ) {
    const sheep = await this.prisma.sheep.findUnique({
      where: { id: sheepId },
      select: { id: true, ownerUserId: true },
    });

    if (!sheep) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    if (user?.role === UserRole.FARMER && sheep.ownerUserId !== user.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke data ternak ini',
      );
    }

    return sheep;
  }

  private detailSelect() {
    return {
      id: true,
      checkDate: true,
      diseaseName: true,
      treatment: true,
      medicine: true,
      healthStatus: true,
      note: true,
      createdAt: true,
      sheep: {
        select: {
          id: true,
          sheepCode: true,
          name: true,
          breed: true,
          gender: true,
          status: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    } as const;
  }
}
