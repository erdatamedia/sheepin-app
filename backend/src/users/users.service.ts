import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMyLocationDto } from './dto/update-my-location.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        loginCode: true,
        role: true,
        isActive: true,
      },
    });
  }

  findByLoginCode(loginCode: string) {
    return this.prisma.user.findUnique({
      where: { loginCode },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        loginCode: true,
        role: true,
        isActive: true,
      },
    });
  }

  async findById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        select: this.profileSelectWithPhoto(),
      });
    } catch (error) {
      if (!this.isMissingPhotoUrlColumn(error)) {
        throw error;
      }

      this.logger.warn(
        'Kolom User.photoUrl belum ada di database. Fallback profil tanpa foto dipakai.',
      );

      const user = await this.prisma.user.findUnique({
        where: { id },
        select: this.profileSelectWithoutPhoto(),
      });

      return user ? { ...user, photoUrl: null } : null;
    }
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        select: this.profileSelectWithPhoto(),
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      if (!this.isMissingPhotoUrlColumn(error)) {
        throw error;
      }

      this.logger.warn(
        'Kolom User.photoUrl belum ada di database. Daftar user dikirim tanpa foto.',
      );

      const users = await this.prisma.user.findMany({
        select: this.profileSelectWithoutPhoto(),
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users.map((user) => ({ ...user, photoUrl: null }));
    }
  }

  async getMySheep(user: { id: string; role: UserRole }) {
    if (user.role !== UserRole.FARMER) {
      throw new NotFoundException('Endpoint ini hanya untuk peternak');
    }

    const data = await this.prisma.sheep.findMany({
      where: {
        ownerUserId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        sheepCode: true,
        name: true,
        breed: true,
        gender: true,
        status: true,
        photoUrl: true,
        location: true,
        weights: {
          take: 1,
          orderBy: {
            recordDate: 'desc',
          },
          select: {
            recordDate: true,
            weightKg: true,
          },
        },
        bcsRecords: {
          take: 1,
          orderBy: {
            recordDate: 'desc',
          },
          select: {
            recordDate: true,
            bcsScore: true,
          },
        },
        healthRecords: {
          take: 1,
          orderBy: {
            checkDate: 'desc',
          },
          select: {
            checkDate: true,
            healthStatus: true,
            diseaseName: true,
          },
        },
        reproductions: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            status: true,
            matingDate: true,
            lambingDate: true,
          },
        },
      },
    });

    return {
      message: 'Daftar ternak milik peternak berhasil diambil',
      data: data.map((item) => ({
        id: item.id,
        sheepCode: item.sheepCode,
        name: item.name,
        breed: item.breed,
        gender: item.gender,
        status: item.status,
        photoUrl: item.photoUrl,
        location: item.location,
        latestWeight: item.weights[0] ?? null,
        latestBcs: item.bcsRecords[0] ?? null,
        latestHealth: item.healthRecords[0] ?? null,
        latestReproduction: item.reproductions[0] ?? null,
      })),
    };
  }

  async getMyLocation(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        loginCode: true,
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
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return {
      message: 'Lokasi user berhasil diambil',
      data: user,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateMyProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          phone: dto.phone,
          address: dto.address,
          groupName: dto.groupName,
          photoUrl: dto.photoUrl,
        },
        select: this.profileSelectWithPhoto(),
      });

      return {
        message: 'Profil user berhasil diperbarui',
        data: updated,
      };
    } catch (error) {
      if (!this.isMissingPhotoUrlColumn(error)) {
        throw error;
      }

      this.logger.warn(
        'Update profil dijalankan tanpa photoUrl karena migrasi database belum diterapkan.',
      );

      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          phone: dto.phone,
          address: dto.address,
          groupName: dto.groupName,
        },
        select: this.profileSelectWithoutPhoto(),
      });

      return {
        message:
          'Profil user berhasil diperbarui. Foto profil akan aktif setelah migrasi database dijalankan.',
        data: {
          ...updated,
          photoUrl: null,
        },
      };
    }
  }

  async updateMyLocation(userId: string, dto: UpdateMyLocationDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        province: dto.province,
        regency: dto.regency,
        district: dto.district,
        village: dto.village,
        addressDetail: dto.addressDetail,
        latitude: dto.latitude,
        longitude: dto.longitude,
        locationSource: dto.locationSource,
        locationUpdatedAt:
          dto.latitude !== undefined && dto.longitude !== undefined
            ? new Date()
            : undefined,
      },
      select: {
        id: true,
        name: true,
        loginCode: true,
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
      },
    });

    return {
      message: 'Lokasi user berhasil diperbarui',
      data: updated,
    };
  }

  private profileSelectWithPhoto() {
    return {
      id: true,
      name: true,
      email: true,
      loginCode: true,
      photoUrl: true,
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
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    } satisfies Prisma.UserSelect;
  }

  private profileSelectWithoutPhoto() {
    return {
      id: true,
      name: true,
      email: true,
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
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    } satisfies Prisma.UserSelect;
  }

  private isMissingPhotoUrlColumn(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2022' &&
      error.message.includes('User.photoUrl')
    );
  }
}
