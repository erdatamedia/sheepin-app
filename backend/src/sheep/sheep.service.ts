import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SheepGender, SheepStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSheepDto } from './dto/create-sheep.dto';
import { RecordStatusEventDto } from './dto/record-status-event.dto';
import { UpdateSheepDto } from './dto/update-sheep.dto';

@Injectable()
export class SheepService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSheepDto, userId: string) {
    if (dto.ownerUserId) {
      await this.ensureFarmerExists(dto.ownerUserId);
    }

    const sheep = await this.prisma.sheep.create({
      data: {
        sheepCode: dto.sheepCode,
        name: dto.name,
        breed: dto.breed,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        color: dto.color,
        physicalMark: dto.physicalMark,
        sireId: dto.sireId,
        damId: dto.damId,
        location: dto.location,
        status: dto.status ?? 'ACTIVE',
        photoUrl: dto.photoUrl,
        createdById: userId,
        ownerUserId: dto.ownerUserId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            loginCode: true,
            role: true,
          },
        },
        ownerUser: {
          select: {
            id: true,
            name: true,
            loginCode: true,
            groupName: true,
          },
        },
      },
    });

    return {
      message: 'Data ternak berhasil ditambahkan',
      data: sheep,
    };
  }

  async findAll(params: {
    user: { id: string; role: UserRole };
    search?: string;
    gender?: string;
    status?: string;
    breed?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 20);
    const skip = (page - 1) * limit;

    const where: Prisma.SheepWhereInput = {
      ...(params.search
        ? {
            OR: [
              {
                sheepCode: {
                  contains: params.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                name: { contains: params.search, mode: 'insensitive' as const },
              },
              {
                breed: {
                  contains: params.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                location: {
                  contains: params.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      ...(params.gender ? { gender: params.gender as SheepGender } : {}),
      ...(params.status ? { status: params.status as SheepStatus } : {}),
      ...(params.breed
        ? {
            breed: { contains: params.breed, mode: 'insensitive' as const },
          }
        : {}),
      ...(params.user.role === UserRole.FARMER
        ? { ownerUserId: params.user.id }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.sheep.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              loginCode: true,
              role: true,
            },
          },
          ownerUser: {
            select: {
              id: true,
              name: true,
              loginCode: true,
              groupName: true,
            },
          },
          _count: {
            select: {
              weights: true,
              bcsRecords: true,
              healthRecords: true,
              reproductions: true,
              activityLogs: true,
            },
          },
        },
      }),
      this.prisma.sheep.count({ where }),
    ]);

    return {
      message: 'Data ternak berhasil diambil',
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: { id: string; role: UserRole }) {
    const sheep = await this.prisma.sheep.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            loginCode: true,
            role: true,
          },
        },
        ownerUser: {
          select: {
            id: true,
            name: true,
            loginCode: true,
            groupName: true,
            phone: true,
          },
        },
        _count: {
          select: {
            weights: true,
            bcsRecords: true,
            healthRecords: true,
            reproductions: true,
            activityLogs: true,
          },
        },
      },
    });

    if (!sheep) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    this.ensureSheepAccess(sheep.ownerUser?.id ?? null, user);

    return {
      message: 'Detail ternak berhasil diambil',
      data: sheep,
    };
  }

  async update(id: string, dto: UpdateSheepDto, userId: string) {
    const existing = await this.prisma.sheep.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    if (dto.ownerUserId) {
      await this.ensureFarmerExists(dto.ownerUserId);
    }

    const sheep = await this.prisma.sheep.update({
      where: { id },
      data: {
        sheepCode: dto.sheepCode,
        name: dto.name,
        breed: dto.breed,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        color: dto.color,
        physicalMark: dto.physicalMark,
        sireId: dto.sireId,
        damId: dto.damId,
        location: dto.location,
        status: dto.status,
        photoUrl: dto.photoUrl,
        ownerUserId: dto.ownerUserId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            loginCode: true,
            role: true,
          },
        },
        ownerUser: {
          select: {
            id: true,
            name: true,
            loginCode: true,
            groupName: true,
          },
        },
      },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        sheepId: id,
        action: 'UPDATE_SHEEP',
        description: `Memperbarui data ternak ${sheep.sheepCode}`,
      },
    });

    return {
      message: 'Data ternak berhasil diperbarui',
      data: sheep,
    };
  }

  async recordStatusEvent(
    id: string,
    dto: RecordStatusEventDto,
    user: { id: string; role: UserRole },
  ) {
    const sheep = await this.prisma.sheep.findUnique({
      where: { id },
      select: {
        id: true,
        sheepCode: true,
        status: true,
        ownerUserId: true,
      },
    });

    if (!sheep) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    this.ensureSheepAccess(sheep.ownerUserId, user);

    if (!this.isAllowedStatusEvent(dto.status, user.role)) {
      throw new BadRequestException('Status kejadian tidak diizinkan');
    }

    if (sheep.status === dto.status) {
      throw new BadRequestException(
        'Status ternak sudah sesuai dengan kejadian ini',
      );
    }

    if (sheep.status !== SheepStatus.ACTIVE) {
      throw new BadRequestException(
        'Kejadian status hanya bisa dicatat dari ternak yang masih aktif',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextSheep = await tx.sheep.update({
        where: { id },
        data: {
          status: dto.status,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              loginCode: true,
              role: true,
            },
          },
          ownerUser: {
            select: {
              id: true,
              name: true,
              loginCode: true,
              groupName: true,
            },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          sheepId: id,
          action: this.mapStatusEventAction(dto.status),
          description: this.mapStatusEventDescription(
            sheep.sheepCode,
            dto.status,
            dto.note,
          ),
          createdAt: new Date(dto.eventDate),
        },
      });

      return nextSheep;
    });

    return {
      message: `Status ternak berhasil diubah menjadi ${dto.status}`,
      data: updated,
    };
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.sheep.findUnique({
      where: { id },
      select: { id: true, sheepCode: true },
    });

    if (!existing) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    await this.prisma.sheep.delete({
      where: { id },
    });

    await this.prisma.activityLog.create({
      data: {
        userId,
        sheepId: id,
        action: 'DELETE_SHEEP',
        description: `Menghapus data ternak ${existing.sheepCode}`,
      },
    });

    return {
      message: 'Data ternak berhasil dihapus',
      data: {
        id,
      },
    };
  }

  private async ensureFarmerExists(userId: string) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.FARMER,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Peternak pemilik tidak ditemukan');
    }
  }

  private ensureSheepAccess(
    ownerUserId: string | null,
    user: { id: string; role: UserRole },
  ) {
    if (user.role === UserRole.FARMER && ownerUserId !== user.id) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke data ternak ini',
      );
    }
  }

  private isAllowedStatusEvent(status: SheepStatus, role: UserRole) {
    if (role === UserRole.FARMER) {
      return status === SheepStatus.DEAD || status === SheepStatus.SOLD;
    }

    return (
      status === SheepStatus.DEAD ||
      status === SheepStatus.SOLD ||
      status === SheepStatus.CULLED
    );
  }

  private mapStatusEventAction(status: SheepStatus) {
    switch (status) {
      case SheepStatus.DEAD:
        return 'STATUS_DEAD';
      case SheepStatus.SOLD:
        return 'STATUS_SOLD';
      case SheepStatus.CULLED:
        return 'STATUS_CULLED';
      default:
        return 'STATUS_UPDATED';
    }
  }

  private mapStatusEventDescription(
    sheepCode: string,
    status: SheepStatus,
    note?: string,
  ) {
    const base =
      status === SheepStatus.DEAD
        ? `Ternak ${sheepCode} dicatat mati`
        : status === SheepStatus.SOLD
          ? `Ternak ${sheepCode} dicatat terjual`
          : `Ternak ${sheepCode} dicatat afkir`;

    return note ? `${base}. ${note}` : base;
  }
}
