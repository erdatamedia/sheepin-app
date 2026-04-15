import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { EvaluationService } from '../evaluation/evaluation.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFarmerDto } from './dto/update-farmer.dto';

@Injectable()
export class FarmersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
  ) {}

  async findAll() {
    const farmers = await this.prisma.user.findMany({
      where: {
        role: UserRole.FARMER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        loginCode: true,
        groupName: true,
        village: true,
        district: true,
        regency: true,
      },
      orderBy: [{ name: 'asc' }],
    });

    return {
      message: 'Daftar peternak berhasil diambil',
      data: farmers,
    };
  }

  async findOne(id: string) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.FARMER,
      },
      select: {
        id: true,
        name: true,
        loginCode: true,
        phone: true,
        address: true,
        groupName: true,
        province: true,
        regency: true,
        district: true,
        village: true,
        addressDetail: true,
        latitude: true,
        longitude: true,
        locationSource: true,
        locationUpdatedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Data peternak tidak ditemukan');
    }

    return {
      message: 'Detail peternak berhasil diambil',
      data: farmer,
    };
  }

  async update(id: string, dto: UpdateFarmerDto) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.FARMER,
      },
      select: { id: true },
    });

    if (!farmer) {
      throw new NotFoundException('Data peternak tidak ditemukan');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
        groupName: dto.groupName,
        province: dto.province,
        regency: dto.regency,
        district: dto.district,
        village: dto.village,
        addressDetail: dto.addressDetail,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        name: true,
        loginCode: true,
        phone: true,
        address: true,
        groupName: true,
        province: true,
        regency: true,
        district: true,
        village: true,
        addressDetail: true,
        latitude: true,
        longitude: true,
        locationSource: true,
        locationUpdatedAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Data peternak berhasil diperbarui',
      data: updated,
    };
  }

  async remove(id: string) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.FARMER,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Data peternak tidak ditemukan');
    }

    const ownedSheepCount = await this.prisma.sheep.count({
      where: {
        ownerUserId: id,
      },
    });

    if (ownedSheepCount > 0) {
      throw new BadRequestException(
        `Peternak tidak dapat dihapus karena masih memiliki ${ownedSheepCount} ternak. Pindahkan atau hapus ternaknya terlebih dahulu.`,
      );
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: 'Data peternak berhasil dihapus',
      data: {
        id,
        name: farmer.name,
      },
    };
  }

  async findSheepByFarmer(id: string) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.FARMER,
      },
      select: {
        id: true,
        name: true,
        loginCode: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Data peternak tidak ditemukan');
    }

    const sheep = await this.prisma.sheep.findMany({
      where: {
        ownerUserId: id,
      },
      select: {
        id: true,
        sheepCode: true,
        name: true,
        breed: true,
        gender: true,
        color: true,
        location: true,
        status: true,
        createdAt: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Data ternak peternak berhasil diambil',
      data: {
        farmer,
        sheep,
      },
    };
  }

  async summary(id: string) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.FARMER,
      },
      select: {
        id: true,
        name: true,
        loginCode: true,
        phone: true,
        groupName: true,
        province: true,
        regency: true,
        district: true,
        village: true,
        addressDetail: true,
        latitude: true,
        longitude: true,
        locationSource: true,
        locationUpdatedAt: true,
        isActive: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Data peternak tidak ditemukan');
    }

    const sheepList = await this.prisma.sheep.findMany({
      where: {
        ownerUserId: id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    let eligibleBreeding = 0;
    let monitoring = 0;
    let notRecommended = 0;

    for (const sheep of sheepList) {
      const evaluation = await this.evaluationService.evaluateSheep(sheep.id);
      const breedingStatus = evaluation.data.evaluation.breedingStatus;

      if (breedingStatus === 'LAYAK_BIBIT') eligibleBreeding++;
      else if (breedingStatus === 'PERLU_PEMANTAUAN') monitoring++;
      else notRecommended++;
    }

    return {
      message: 'Ringkasan peternak berhasil diambil',
      data: {
        farmer,
        summary: {
          totalSheep: sheepList.length,
          activeSheep: sheepList.filter((s) => s.status === 'ACTIVE').length,
          eligibleBreeding,
          monitoring,
          notRecommended,
        },
      },
    };
  }
}
