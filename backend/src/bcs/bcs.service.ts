import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBcsDto } from './dto/create-bcs.dto';
import { UpdateBcsDto } from './dto/update-bcs.dto';

@Injectable()
export class BcsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBcsDto, user: { id: string; role: UserRole }) {
    await this.ensureSheepAccess(dto.sheepId, user);

    const record = await this.prisma.sheepBCS.create({
      data: {
        sheepId: dto.sheepId,
        recordDate: new Date(dto.recordDate),
        bcsScore: dto.bcsScore,
        note: dto.note,
        createdById: user.id,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: dto.sheepId,
        action: 'CREATE_BCS',
        description: `Menambahkan BCS ${dto.bcsScore}`,
      },
    });

    return {
      message: 'Data BCS berhasil ditambahkan',
      data: record,
    };
  }

  async findBySheepId(sheepId: string, user: { id: string; role: UserRole }) {
    await this.ensureSheepAccess(sheepId, user);

    const items = await this.prisma.sheepBCS.findMany({
      where: { sheepId },
      orderBy: {
        recordDate: 'desc',
      },
      select: this.detailSelect(),
    });

    return {
      message: 'Riwayat BCS berhasil diambil',
      data: items,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.sheepBCS.findUnique({
      where: { id },
      select: this.detailSelect(),
    });

    if (!item) {
      throw new NotFoundException('Data BCS tidak ditemukan');
    }

    return {
      message: 'Detail BCS berhasil diambil',
      data: item,
    };
  }

  async update(
    id: string,
    dto: UpdateBcsDto,
    user: { id: string; role: UserRole },
  ) {
    const existing = await this.prisma.sheepBCS.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data BCS tidak ditemukan');
    }

    const sheepId = dto.sheepId ?? existing.sheepId;
    await this.ensureSheepAccess(sheepId, user);

    const updated = await this.prisma.sheepBCS.update({
      where: { id },
      data: {
        sheepId: dto.sheepId,
        recordDate: dto.recordDate ? new Date(dto.recordDate) : undefined,
        bcsScore: dto.bcsScore,
        note: dto.note,
      },
      select: this.detailSelect(),
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: updated.sheep.id,
        action: 'UPDATE_BCS',
        description: `Memperbarui BCS menjadi ${updated.bcsScore}`,
      },
    });

    return {
      message: 'Data BCS berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string, user: { id: string; role: UserRole }) {
    const existing = await this.prisma.sheepBCS.findUnique({
      where: { id },
      select: {
        id: true,
        sheepId: true,
        bcsScore: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Data BCS tidak ditemukan');
    }

    await this.ensureSheepAccess(existing.sheepId, user);

    await this.prisma.sheepBCS.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        sheepId: existing.sheepId,
        action: 'DELETE_BCS',
        description: `Menghapus data BCS ${existing.bcsScore}`,
      },
    });

    return {
      message: 'Data BCS berhasil dihapus',
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
      bcsScore: true,
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
