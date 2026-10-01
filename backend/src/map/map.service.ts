import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { EvaluationService } from '../evaluation/evaluation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationService: EvaluationService,
  ) {}

  async distribution() {
    const farmers = await this.prisma.user.findMany({
      where: {
        role: UserRole.FARMER,
        latitude: { not: null },
        longitude: { not: null },
        isActive: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const sheepList = await this.prisma.sheep.findMany({
      where: {
        ownerUserId: {
          in: farmers.map((farmer) => farmer.id),
        },
      },
      select: {
        id: true,
        ownerUserId: true,
        status: true,
      },
    });

    const breedingSummaryBySheepId =
      await this.evaluationService.summarizeBreedingStatusesBySheepIds(
        sheepList.map((sheep) => sheep.id),
      );

    const sheepByFarmer = sheepList.reduce<
      Map<
        string,
        Array<{
          id: string;
          status: string;
        }>
      >
    >((map, sheep) => {
      if (!sheep.ownerUserId) {
        return map;
      }

      const current = map.get(sheep.ownerUserId) ?? [];
      current.push(sheep);
      map.set(sheep.ownerUserId, current);
      return map;
    }, new Map());

    const data = farmers.map((farmer) => {
      const sheepList = sheepByFarmer.get(farmer.id) ?? [];
      let eligibleBreeding = 0;
      let monitoring = 0;
      let notRecommended = 0;

      for (const sheep of sheepList) {
        const breedingStatus = breedingSummaryBySheepId.get(
          sheep.id,
        )?.breedingStatus;

        if (breedingStatus === 'LAYAK_BIBIT') eligibleBreeding++;
        else if (breedingStatus === 'PERLU_PEMANTAUAN') monitoring++;
        else notRecommended++;
      }

      return {
        userId: farmer.id,
        name: farmer.name,
        loginCode: farmer.loginCode,
        groupName: farmer.groupName,
        province: farmer.province,
        regency: farmer.regency,
        district: farmer.district,
        village: farmer.village,
        addressDetail: farmer.addressDetail,
        latitude: farmer.latitude,
        longitude: farmer.longitude,
        locationSource: farmer.locationSource,
        locationUpdatedAt: farmer.locationUpdatedAt,
        totalSheep: sheepList.length,
        activeSheep: sheepList.filter((s) => s.status === 'ACTIVE').length,
        eligibleBreeding,
        monitoring,
        notRecommended,
      };
    });

    return {
      message: 'Data sebaran berhasil diambil',
      data,
    };
  }

  async distributionPublic() {
    const distribution = await this.distribution();

    return {
      message: 'Data sebaran publik berhasil diambil',
      data: distribution.data.map((item) => ({
        userId: item.userId,
        name: item.name,
        groupName: item.groupName,
        regency: item.regency,
        district: item.district,
        village: item.village,
        latitude: item.latitude,
        longitude: item.longitude,
        totalSheep: item.totalSheep,
        activeSheep: item.activeSheep,
      })),
    };
  }

  /**
   * Katalog ternak satu titik peternak di peta. Versi publik hanya memuat peternak yang tampil di peta
   * publik dan ternak berstatus aktif, tanpa data kontak, ciri, maupun catatan kesehatan.
   */
  async catalog(userId: string, publicView: boolean) {
    const farmer = await this.prisma.user.findFirst({
      where: {
        id: userId,
        role: UserRole.FARMER,
        isActive: true,
        ...(publicView
          ? { latitude: { not: null }, longitude: { not: null } }
          : {}),
      },
      select: {
        id: true,
        name: true,
        groupName: true,
        regency: true,
        district: true,
        village: true,
      },
    });

    if (!farmer) {
      throw new NotFoundException('Peternak tidak ditemukan');
    }

    const sheep = await this.prisma.sheep.findMany({
      where: {
        ownerUserId: userId,
        ...(publicView ? { status: 'ACTIVE' } : {}),
      },
      select: {
        id: true,
        sheepCode: true,
        name: true,
        breed: true,
        gender: true,
        status: true,
        photoUrl: true,
        birthDate: true,
        weights: {
          orderBy: { recordDate: 'desc' },
          take: 1,
          select: { weightKg: true, recordDate: true },
        },
      },
      orderBy: [{ status: 'asc' }, { sheepCode: 'asc' }],
    });

    return {
      message: 'Katalog ternak berhasil diambil',
      data: {
        farmer,
        sheep: sheep.map(({ weights, ...item }) => ({
          ...item,
          latestWeightKg: weights[0]?.weightKg ?? null,
          latestWeightDate: weights[0]?.recordDate ?? null,
        })),
      },
    };
  }
}
