import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SheepStatus } from '@prisma/client';
import { EvaluationService } from '../evaluation/evaluation.service';
import { PrismaService } from '../prisma/prisma.service';

const PUBLIC_LIMIT = 100;

const ELIGIBLE = 'LAYAK_BIBIT';

/**
 * Katalog ternak layak bibit. Sebuah ternak tampil di katalog publik hanya bila SEKARANG:
 *  1) berstatus aktif,
 *  2) diverifikasi (verifiedAt terisi) oleh admin/petugas atas nama peneliti dan dinas, dan
 *  3) evaluasi sistem masih menyatakan "layak bibit" (skor >= 80, tidak sakit).
 * Syarat 3 dihitung ulang tiap permintaan, sehingga ternak yang kondisinya memburuk otomatis keluar.
 */
@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluation: EvaluationService,
  ) {}

  private ageMonths(birthDate: Date | null) {
    if (!birthDate) return null;
    return Math.max(
      0,
      Math.floor((Date.now() - birthDate.getTime()) / (30.44 * 86_400_000)),
    );
  }

  private readonly publicSelect = {
    id: true,
    sheepCode: true,
    name: true,
    breed: true,
    gender: true,
    birthDate: true,
    photoUrl: true,
    verifiedAt: true,
    ownerUser: {
      select: {
        id: true,
        name: true,
        groupName: true,
        village: true,
        district: true,
        regency: true,
      },
    },
    weights: {
      orderBy: { recordDate: 'desc' as const },
      take: 1,
      select: { weightKg: true, recordDate: true },
    },
  } satisfies Prisma.SheepSelect;

  /** Ternak terverifikasi yang saat ini masih layak, dengan skor dan alasannya. */
  private async eligibleVerified(where: Prisma.SheepWhereInput = {}) {
    const rows = await this.prisma.sheep.findMany({
      where: {
        status: SheepStatus.ACTIVE,
        verifiedAt: { not: null },
        ...where,
      },
      select: this.publicSelect,
      orderBy: { verifiedAt: 'desc' },
      take: PUBLIC_LIMIT * 2,
    });

    const evaluations = await this.evaluation.evaluateByIds(
      rows.map((row) => row.id),
    );

    return rows
      .map((row) => ({ row, evaluation: evaluations.get(row.id) }))
      .filter((item) => item.evaluation?.evaluation.breedingStatus === ELIGIBLE)
      .slice(0, PUBLIC_LIMIT);
  }

  async list(query: { search?: string; breed?: string; gender?: string }) {
    const where: Prisma.SheepWhereInput = {
      ...(query.gender === 'MALE' || query.gender === 'FEMALE'
        ? { gender: query.gender }
        : {}),
      ...(query.breed
        ? { breed: { equals: query.breed, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              { sheepCode: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
              { breed: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const items = await this.eligibleVerified(where);

    return {
      message: 'Katalog ternak berhasil diambil',
      data: items.map(({ row, evaluation }) => ({
        id: row.id,
        sheepCode: row.sheepCode,
        name: row.name,
        breed: row.breed,
        gender: row.gender,
        ageMonths: this.ageMonths(row.birthDate),
        photoUrl: row.photoUrl,
        latestWeightKg: row.weights[0]?.weightKg ?? null,
        score: evaluation?.evaluation.breedingScore ?? null,
        verifiedAt: row.verifiedAt,
        farmer: row.ownerUser && {
          name: row.ownerUser.name,
          groupName: row.ownerUser.groupName,
          village: row.ownerUser.village,
          district: row.ownerUser.district,
          regency: row.ownerUser.regency,
        },
      })),
    };
  }

  async detail(id: string) {
    const [item] = await this.eligibleVerified({ id });
    if (!item) {
      throw new NotFoundException('Ternak tidak ada di katalog');
    }

    const photos = await this.prisma.sheepPhoto.findMany({
      where: { sheepId: id },
      select: { angle: true, url: true },
    });

    const { row, evaluation } = item;
    return {
      message: 'Detail katalog berhasil diambil',
      data: {
        id: row.id,
        sheepCode: row.sheepCode,
        name: row.name,
        breed: row.breed,
        gender: row.gender,
        ageMonths: this.ageMonths(row.birthDate),
        photoUrl: row.photoUrl,
        photos,
        latestWeightKg: row.weights[0]?.weightKg ?? null,
        latestWeightDate: row.weights[0]?.recordDate ?? null,
        bcs: evaluation?.latestRecords.bcs?.value ?? null,
        score: evaluation?.evaluation.breedingScore ?? null,
        reasons: evaluation?.evaluation.reasons ?? [],
        verifiedAt: row.verifiedAt,
        farmer: row.ownerUser && {
          name: row.ownerUser.name,
          groupName: row.ownerUser.groupName,
          village: row.ownerUser.village,
          district: row.ownerUser.district,
          regency: row.ownerUser.regency,
        },
      },
    };
  }

  /** Untuk admin/petugas: ternak yang sudah memenuhi syarat sistem tetapi belum diverifikasi. */
  async pending() {
    const candidates = await this.prisma.sheep.findMany({
      where: { status: SheepStatus.ACTIVE, verifiedAt: null },
      select: this.publicSelect,
      orderBy: { updatedAt: 'desc' },
      take: 300,
    });

    const evaluations = await this.evaluation.evaluateByIds(
      candidates.map((row) => row.id),
    );

    const data = candidates
      .map((row) => ({ row, evaluation: evaluations.get(row.id) }))
      .filter((item) => item.evaluation?.evaluation.breedingStatus === ELIGIBLE)
      .map(({ row, evaluation }) => ({
        id: row.id,
        sheepCode: row.sheepCode,
        name: row.name,
        breed: row.breed,
        gender: row.gender,
        photoUrl: row.photoUrl,
        latestWeightKg: row.weights[0]?.weightKg ?? null,
        score: evaluation?.evaluation.breedingScore ?? null,
        farmerName: row.ownerUser?.name ?? null,
      }));

    return { message: 'Ternak menunggu verifikasi', data };
  }

  async setVerified(
    id: string,
    dto: { verified: boolean; note?: string },
    user: { id: string },
  ) {
    const sheep = await this.prisma.sheep.findUnique({
      where: { id },
      select: { id: true, sheepCode: true, status: true },
    });
    if (!sheep) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    if (dto.verified) {
      if (sheep.status !== SheepStatus.ACTIVE) {
        throw new BadRequestException(
          'Hanya ternak aktif yang dapat diverifikasi',
        );
      }
      const evaluations = await this.evaluation.evaluateByIds([id]);
      if (evaluations.get(id)?.evaluation.breedingStatus !== ELIGIBLE) {
        throw new BadRequestException(
          'Ternak belum memenuhi syarat layak bibit menurut sistem, jadi belum bisa diverifikasi',
        );
      }
    }

    await this.prisma.$transaction([
      this.prisma.sheep.update({
        where: { id },
        data: dto.verified
          ? {
              verifiedAt: new Date(),
              verifiedById: user.id,
              verifiedNote: dto.note || null,
            }
          : { verifiedAt: null, verifiedById: null, verifiedNote: null },
        select: { id: true },
      }),
      this.prisma.activityLog.create({
        data: {
          userId: user.id,
          sheepId: id,
          action: dto.verified ? 'VERIFY_SHEEP' : 'UNVERIFY_SHEEP',
          description: `${dto.verified ? 'Memverifikasi' : 'Mencabut verifikasi'} ternak ${sheep.sheepCode} untuk katalog`,
        },
        select: { id: true },
      }),
    ]);

    return {
      message: dto.verified
        ? 'Ternak terverifikasi dan tampil di katalog'
        : 'Verifikasi dicabut dan ternak tidak lagi tampil di katalog',
      data: { id, verified: dto.verified },
    };
  }
}
