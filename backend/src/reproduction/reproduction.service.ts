import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReproductionDto } from './dto/create-reproduction.dto';
import { UpdateReproductionDto } from './dto/update-reproduction.dto';

@Injectable()
export class ReproductionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateReproductionDto,
    user: { id: string; role: UserRole },
  ) {
    await this.ensureSheepAccess(dto.sheepId, user);

    const record = await this.prisma.sheepReproduction.create({
      data: {
        sheepId: dto.sheepId,
        matingDate: dto.matingDate ? new Date(dto.matingDate) : undefined,
        estimatedBirthDate: dto.estimatedBirthDate
          ? new Date(dto.estimatedBirthDate)
          : undefined,
        lambingDate: dto.lambingDate ? new Date(dto.lambingDate) : undefined,
        maleParent: dto.maleParent,
        totalLambBorn: dto.totalLambBorn,
        totalLambWeaned: dto.totalLambWeaned,
        totalBirthWeight: dto.totalBirthWeight,
        totalWeaningWeight: dto.totalWeaningWeight,
        status: dto.status,
        note: dto.note,
        createdById: user.id,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: dto.sheepId,
        action: 'CREATE_REPRODUCTION',
        description: `Menambahkan data reproduksi dengan status ${dto.status}`,
      },
    });

    return {
      message: 'Data reproduksi berhasil ditambahkan',
      data: record,
    };
  }

  async findBySheepId(sheepId: string, user: { id: string; role: UserRole }) {
    await this.ensureSheepAccess(sheepId, user);

    const items = await this.prisma.sheepReproduction.findMany({
      where: { sheepId },
      orderBy: {
        createdAt: 'desc',
      },
      select: this.detailSelect(),
    });

    return {
      message: 'Riwayat reproduksi berhasil diambil',
      data: items,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.sheepReproduction.findUnique({
      where: { id },
      select: this.detailSelect(),
    });

    if (!item) {
      throw new NotFoundException('Data reproduksi tidak ditemukan');
    }

    return {
      message: 'Detail reproduksi berhasil diambil',
      data: item,
    };
  }

  async update(
    id: string,
    dto: UpdateReproductionDto,
    user: { id: string; role: UserRole },
  ) {
    const existing = await this.prisma.sheepReproduction.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data reproduksi tidak ditemukan');
    }

    const sheepId = dto.sheepId ?? existing.sheepId;
    await this.ensureSheepAccess(sheepId, user);

    const updated = await this.prisma.sheepReproduction.update({
      where: { id },
      data: {
        sheepId: dto.sheepId,
        matingDate:
          dto.matingDate === undefined
            ? undefined
            : dto.matingDate
              ? new Date(dto.matingDate)
              : null,
        estimatedBirthDate:
          dto.estimatedBirthDate === undefined
            ? undefined
            : dto.estimatedBirthDate
              ? new Date(dto.estimatedBirthDate)
              : null,
        lambingDate:
          dto.lambingDate === undefined
            ? undefined
            : dto.lambingDate
              ? new Date(dto.lambingDate)
              : null,
        maleParent: dto.maleParent,
        totalLambBorn: dto.totalLambBorn,
        totalLambWeaned: dto.totalLambWeaned,
        totalBirthWeight: dto.totalBirthWeight,
        totalWeaningWeight: dto.totalWeaningWeight,
        status: dto.status,
        note: dto.note,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: updated.sheep.id,
        action: 'UPDATE_REPRODUCTION',
        description: `Memperbarui data reproduksi menjadi ${updated.status}`,
      },
    });

    return {
      message: 'Data reproduksi berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string, user: { id: string; role: UserRole }) {
    const existing = await this.prisma.sheepReproduction.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
        status: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data reproduksi tidak ditemukan');
    }

    await this.ensureSheepAccess(existing.sheepId, user);

    await this.prisma.sheepReproduction.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: existing.sheepId,
        action: 'DELETE_REPRODUCTION',
        description: `Menghapus data reproduksi dengan status ${existing.status}`,
      },
    });

    return {
      message: 'Data reproduksi berhasil dihapus',
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
      matingDate: true,
      estimatedBirthDate: true,
      lambingDate: true,
      maleParent: true,
      totalLambBorn: true,
      totalLambWeaned: true,
      totalBirthWeight: true,
      totalWeaningWeight: true,
      status: true,
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
