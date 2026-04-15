import { Injectable } from '@nestjs/common';
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
}
