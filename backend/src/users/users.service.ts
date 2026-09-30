import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { normalizePhone } from '../common/phone';
import { latestActivityDate, summarizeWeights } from './my-sheep-summary';
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
        pinHash: true,
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
        faceNose: true,
        earsHorns: true,
        tailBody: true,
        physicalMark: true,
        location: true,
        weights: {
          take: 2, // terbaru + sebelumnya, untuk tren
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
            createdAt: true,
          },
        },
      },
    });

    return {
      message: 'Daftar ternak milik peternak berhasil diambil',
      data: data.map((item) => {
        const weight = summarizeWeights(item.weights);

        return {
          id: item.id,
          sheepCode: item.sheepCode,
          name: item.name,
          breed: item.breed,
          gender: item.gender,
          status: item.status,
          photoUrl: item.photoUrl,
          faceNose: item.faceNose,
          earsHorns: item.earsHorns,
          tailBody: item.tailBody,
          physicalMark: item.physicalMark,
          location: item.location,
          latestWeight: weight.latest,
          previousWeight: weight.previous,
          weightDiffKg: weight.diffKg,
          weightTrend: weight.trend,
          latestBcs: item.bcsRecords[0] ?? null,
          latestHealth: item.healthRecords[0] ?? null,
          latestReproduction: item.reproductions[0] ?? null,
          // Kapan ternak ini terakhir dicatat (bobot, kondisi, kesehatan, atau reproduksi).
          lastRecordedAt: latestActivityDate([
            item.weights[0]?.recordDate,
            item.bcsRecords[0]?.recordDate,
            item.healthRecords[0]?.checkDate,
            item.reproductions[0]?.createdAt,
          ]),
        };
      }),
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
      select: { id: true, role: true, phone: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // No. HP peternak adalah identitas login; hanya petugas yang boleh mengubahnya.
    const requestedPhone =
      dto.phone === undefined
        ? undefined
        : (normalizePhone(dto.phone) ?? dto.phone);
    const currentPhone = normalizePhone(user.phone) ?? user.phone;

    if (
      user.role === UserRole.FARMER &&
      requestedPhone !== undefined &&
      requestedPhone !== currentPhone
    ) {
      throw new BadRequestException(
        'Nomor HP hanya dapat diubah oleh petugas. Hubungi petugas Anda.',
      );
    }

    try {
      return await this.applyProfileUpdate(userId, dto);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Nomor HP sudah dipakai akun lain');
      }
      throw error;
    }
  }

  private async applyProfileUpdate(userId: string, dto: UpdateMyProfileDto) {
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
