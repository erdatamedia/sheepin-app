import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWeightDto } from './dto/create-weight.dto';
import { UpdateWeightDto } from './dto/update-weight.dto';

@Injectable()
export class WeightsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWeightDto, user: { id: string; role: UserRole }) {
    await this.ensureSheepAccess(dto.sheepId, user);

    const weight = await this.prisma.sheepWeight.create({
      data: {
        sheepId: dto.sheepId,
        recordDate: new Date(dto.recordDate),
        weightKg: dto.weightKg,
        note: dto.note,
        createdById: user.id,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: dto.sheepId,
        action: 'CREATE_WEIGHT',
        description: `Menambahkan bobot ${dto.weightKg} kg`,
      },
    });

    return {
      message: 'Data bobot berhasil ditambahkan',
      data: weight,
    };
  }

  async findBySheepId(sheepId: string, user: { id: string; role: UserRole }) {
    await this.ensureSheepAccess(sheepId, user);

    const items = await this.prisma.sheepWeight.findMany({
      where: { sheepId },
      orderBy: {
        recordDate: 'desc',
      },
      select: this.detailSelect(),
    });

    return {
      message: 'Riwayat bobot berhasil diambil',
      data: items,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.sheepWeight.findUnique({
      where: { id },
      select: this.detailSelect(),
    });

    if (!item) {
      throw new NotFoundException('Data bobot tidak ditemukan');
    }

    return {
      message: 'Detail bobot berhasil diambil',
      data: item,
    };
  }

  async update(
    id: string,
    dto: UpdateWeightDto,
    user: { id: string; role: UserRole },
  ) {
    const existing = await this.prisma.sheepWeight.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data bobot tidak ditemukan');
    }

    const sheepId = dto.sheepId ?? existing.sheepId;
    await this.ensureSheepAccess(sheepId, user);

    const updated = await this.prisma.sheepWeight.update({
      where: { id },
      data: {
        sheepId: dto.sheepId,
        recordDate: dto.recordDate ? new Date(dto.recordDate) : undefined,
        weightKg: dto.weightKg,
        note: dto.note,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: updated.sheep.id,
        action: 'UPDATE_WEIGHT',
        description: `Memperbarui data bobot menjadi ${updated.weightKg} kg`,
      },
    });

    return {
      message: 'Data bobot berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string, user: { id: string; role: UserRole }) {
    const existing = await this.prisma.sheepWeight.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
        weightKg: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data bobot tidak ditemukan');
    }

    await this.ensureSheepAccess(existing.sheepId, user);

    await this.prisma.sheepWeight.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: existing.sheepId,
        action: 'DELETE_WEIGHT',
        description: `Menghapus data bobot ${existing.weightKg} kg`,
      },
    });

    return {
      message: 'Data bobot berhasil dihapus',
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
      recordDate: true,
      weightKg: true,
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
