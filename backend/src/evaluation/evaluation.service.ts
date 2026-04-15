import { Injectable, NotFoundException } from '@nestjs/common';
import {
  HealthStatus,
  Prisma,
  ReproductionStatus,
  SheepStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type TrendStatus = 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
type BcsCategory = 'LOW' | 'IDEAL' | 'HIGH';
type OverallCondition = 'GOOD' | 'FAIR' | 'POOR';
type CompletenessStatus = 'COMPLETE' | 'PARTIAL' | 'MINIMAL';
type BreedingStatus =
  | 'LAYAK_BIBIT'
  | 'PERLU_PEMANTAUAN'
  | 'BELUM_DIREKOMENDASIKAN';

type SheepSnapshot = {
  id: string;
  sheepCode: string;
  name: string | null;
  breed: string;
  gender: string;
  status: SheepStatus;
  location: string | null;
};

type WeightRecord = {
  id: string;
  sheepId: string;
  recordDate: Date;
  weightKg: number;
  note: string | null;
};

type BcsRecord = {
  id: string;
  sheepId: string;
  recordDate: Date;
  bcsScore: number;
  note: string | null;
};

type HealthRecord = {
  id: string;
  sheepId: string;
  checkDate: Date;
  diseaseName: string | null;
  treatment: string | null;
  medicine: string | null;
  healthStatus: HealthStatus;
  note: string | null;
};

type ReproductionRecord = {
  id: string;
  sheepId: string;
  matingDate: Date | null;
  estimatedBirthDate: Date | null;
  lambingDate: Date | null;
  maleParent: string | null;
  totalLambBorn: number | null;
  totalLambWeaned: number | null;
  totalBirthWeight: number | null;
  totalWeaningWeight: number | null;
  status: ReproductionStatus;
  note: string | null;
};

@Injectable()
export class EvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateSheep(sheepId: string) {
    const sheep = await this.getSheepSnapshot(sheepId);

    if (!sheep) {
      throw new NotFoundException('Data ternak tidak ditemukan');
    }

    const records = await this.getEvaluationRecords([sheepId]);

    return this.buildEvaluation(
      sheep,
      this.limitRecords(records.weightsBySheep.get(sheepId)),
      this.limitRecords(records.bcsBySheep.get(sheepId)),
      this.limitRecords(records.healthBySheep.get(sheepId)),
      this.limitRecords(records.reproductionsBySheep.get(sheepId)),
    );
  }

  async summary() {
    const sheepList = await this.prisma.sheep.findMany({
      select: {
        id: true,
        sheepCode: true,
        name: true,
        breed: true,
        gender: true,
        status: true,
        location: true,
      },
    });

    const evaluations = await this.evaluateMany(sheepList);

    let eligible = 0;
    let monitoring = 0;
    let notRecommended = 0;
    let completeRecords = 0;
    let partialRecords = 0;
    let minimalRecords = 0;

    for (const evaluation of evaluations) {
      const data = evaluation.data;

      if (data.evaluation.breedingStatus === 'LAYAK_BIBIT') eligible++;
      else if (data.evaluation.breedingStatus === 'PERLU_PEMANTAUAN')
        monitoring++;
      else notRecommended++;

      if (data.completeness.status === 'COMPLETE') completeRecords++;
      else if (data.completeness.status === 'PARTIAL') partialRecords++;
      else minimalRecords++;
    }

    return {
      message: 'Ringkasan evaluasi berhasil diambil',
      data: {
        totalEvaluated: sheepList.length,
        eligible,
        monitoring,
        notRecommended,
        completeRecords,
        partialRecords,
        minimalRecords,
      },
    };
  }

  async summarizeBreedingStatusesBySheepIds(sheepIds: string[]) {
    if (sheepIds.length === 0) {
      return new Map<
        string,
        {
          breedingStatus: BreedingStatus;
          completenessStatus: CompletenessStatus;
        }
      >();
    }

    const sheepList = await this.prisma.sheep.findMany({
      where: {
        id: { in: sheepIds },
      },
      select: {
        id: true,
        sheepCode: true,
        name: true,
        breed: true,
        gender: true,
        status: true,
        location: true,
      },
    });

    const evaluations = await this.evaluateMany(sheepList);

    return new Map(
      evaluations.map((evaluation) => [
        evaluation.data.sheep.id,
        {
          breedingStatus: evaluation.data.evaluation.breedingStatus,
          completenessStatus: evaluation.data.completeness.status,
        },
      ]),
    );
  }

  private async evaluateMany(sheepList: SheepSnapshot[]) {
    const records = await this.getEvaluationRecords(
      sheepList.map((sheep) => sheep.id),
    );

    return sheepList.map((sheep) =>
      this.buildEvaluation(
        sheep,
        this.limitRecords(records.weightsBySheep.get(sheep.id)),
        this.limitRecords(records.bcsBySheep.get(sheep.id)),
        this.limitRecords(records.healthBySheep.get(sheep.id)),
        this.limitRecords(records.reproductionsBySheep.get(sheep.id)),
      ),
    );
  }

  private async getSheepSnapshot(
    sheepId: string,
  ): Promise<SheepSnapshot | null> {
    return this.prisma.sheep.findUnique({
      where: { id: sheepId },
      select: {
        id: true,
        sheepCode: true,
        name: true,
        breed: true,
        gender: true,
        status: true,
        location: true,
      },
    });
  }

  private async getEvaluationRecords(sheepIds: string[]) {
    if (sheepIds.length === 0) {
      return {
        weightsBySheep: new Map<string, WeightRecord[]>(),
        bcsBySheep: new Map<string, BcsRecord[]>(),
        healthBySheep: new Map<string, HealthRecord[]>(),
        reproductionsBySheep: new Map<string, ReproductionRecord[]>(),
      };
    }

    const sheepIdList = Prisma.join(sheepIds);
    const [weights, bcsRecords, healthRecords, reproductions] =
      await Promise.all([
        this.prisma.$queryRaw<WeightRecord[]>(Prisma.sql`
          SELECT "id", "sheepId", "recordDate", "weightKg", "note"
          FROM (
            SELECT
              "id",
              "sheepId",
              "recordDate",
              "weightKg",
              "note",
              ROW_NUMBER() OVER (
                PARTITION BY "sheepId"
                ORDER BY "recordDate" DESC
              ) AS row_num
            FROM "SheepWeight"
            WHERE "sheepId" IN (${sheepIdList})
          ) ranked
          WHERE row_num <= 3
          ORDER BY "sheepId" ASC, "recordDate" DESC
        `),
        this.prisma.$queryRaw<BcsRecord[]>(Prisma.sql`
          SELECT "id", "sheepId", "recordDate", "bcsScore", "note"
          FROM (
            SELECT
              "id",
              "sheepId",
              "recordDate",
              "bcsScore",
              "note",
              ROW_NUMBER() OVER (
                PARTITION BY "sheepId"
                ORDER BY "recordDate" DESC
              ) AS row_num
            FROM "SheepBCS"
            WHERE "sheepId" IN (${sheepIdList})
          ) ranked
          WHERE row_num <= 3
          ORDER BY "sheepId" ASC, "recordDate" DESC
        `),
        this.prisma.$queryRaw<HealthRecord[]>(Prisma.sql`
          SELECT
            "id",
            "sheepId",
            "checkDate",
            "diseaseName",
            "treatment",
            "medicine",
            "healthStatus",
            "note"
          FROM (
            SELECT
              "id",
              "sheepId",
              "checkDate",
              "diseaseName",
              "treatment",
              "medicine",
              "healthStatus",
              "note",
              ROW_NUMBER() OVER (
                PARTITION BY "sheepId"
                ORDER BY "checkDate" DESC
              ) AS row_num
            FROM "SheepHealth"
            WHERE "sheepId" IN (${sheepIdList})
          ) ranked
          WHERE row_num <= 3
          ORDER BY "sheepId" ASC, "checkDate" DESC
        `),
        this.prisma.$queryRaw<ReproductionRecord[]>(Prisma.sql`
          SELECT
            "id",
            "sheepId",
            "matingDate",
            "estimatedBirthDate",
            "lambingDate",
            "maleParent",
            "totalLambBorn",
            "totalLambWeaned",
            "totalBirthWeight",
            "totalWeaningWeight",
            "status",
            "note"
          FROM (
            SELECT
              "id",
              "sheepId",
              "matingDate",
              "estimatedBirthDate",
              "lambingDate",
              "maleParent",
              "totalLambBorn",
              "totalLambWeaned",
              "totalBirthWeight",
              "totalWeaningWeight",
              "status",
              "note",
              ROW_NUMBER() OVER (
                PARTITION BY "sheepId"
                ORDER BY "createdAt" DESC
              ) AS row_num
            FROM "SheepReproduction"
            WHERE "sheepId" IN (${sheepIdList})
          ) ranked
          WHERE row_num <= 3
          ORDER BY "sheepId" ASC, "matingDate" DESC NULLS LAST
        `),
      ]);

    return {
      weightsBySheep: this.groupBySheepId(weights),
      bcsBySheep: this.groupBySheepId(bcsRecords),
      healthBySheep: this.groupBySheepId(healthRecords),
      reproductionsBySheep: this.groupBySheepId(reproductions),
    };
  }

  private buildEvaluation(
    sheep: SheepSnapshot,
    weights: WeightRecord[],
    bcsRecords: BcsRecord[],
    healthRecords: HealthRecord[],
    reproductions: ReproductionRecord[],
  ) {
    const latestWeight = weights[0] ?? null;
    const latestBcs = bcsRecords[0] ?? null;
    const latestHealth = healthRecords[0] ?? null;
    const latestReproduction = reproductions[0] ?? null;

    const weightTrend = this.calculateWeightTrend(weights);
    const bcsTrend = this.calculateBcsTrend(bcsRecords);
    const healthTrend = this.mapHealthTrend(latestHealth?.healthStatus);

    const completeness = this.calculateCompleteness({
      sheep,
      weights,
      bcsRecords,
      healthRecords,
      reproductions,
    });

    const bcsCategory = this.getBcsCategory(latestBcs?.bcsScore);
    const overallCondition = this.getOverallCondition({
      sheepStatus: sheep.status,
      healthStatus: latestHealth?.healthStatus,
      bcsCategory,
    });

    const breedingEvaluation = this.calculateBreedingEvaluation({
      sheepStatus: sheep.status,
      latestHealthStatus: latestHealth?.healthStatus,
      latestBcsScore: latestBcs?.bcsScore,
      latestReproductionStatus: latestReproduction?.status,
      completenessStatus: completeness.status,
      weightTrend: weightTrend.status,
      weightsCount: weights.length,
    });

    return {
      message: 'Evaluasi ternak berhasil diambil',
      data: {
        sheep,
        latestRecords: {
          weight: latestWeight
            ? {
                value: latestWeight.weightKg,
                recordDate: latestWeight.recordDate,
                note: latestWeight.note,
              }
            : null,
          bcs: latestBcs
            ? {
                value: latestBcs.bcsScore,
                category: bcsCategory,
                recordDate: latestBcs.recordDate,
                note: latestBcs.note,
              }
            : null,
          health: latestHealth
            ? {
                status: latestHealth.healthStatus,
                checkDate: latestHealth.checkDate,
                diseaseName: latestHealth.diseaseName,
                note: latestHealth.note,
              }
            : null,
          reproduction: latestReproduction
            ? {
                status: latestReproduction.status,
                matingDate: latestReproduction.matingDate,
                estimatedBirthDate: latestReproduction.estimatedBirthDate,
                lambingDate: latestReproduction.lambingDate,
                maleParent: latestReproduction.maleParent,
              }
            : null,
        },
        trend: {
          weight: weightTrend,
          bcs: bcsTrend,
          health: {
            status: healthTrend,
          },
        },
        completeness,
        evaluation: {
          overallCondition,
          breedingScore: breedingEvaluation.score,
          breedingStatus: breedingEvaluation.status,
          reasons: breedingEvaluation.reasons,
          warnings: breedingEvaluation.warnings,
        },
      },
    };
  }

  private groupBySheepId<T extends { sheepId: string }>(records: T[]) {
    return records.reduce<Map<string, T[]>>((map, record) => {
      const current = map.get(record.sheepId) ?? [];
      current.push(record);
      map.set(record.sheepId, current);
      return map;
    }, new Map<string, T[]>());
  }

  private limitRecords<T>(records: T[] | undefined): T[] {
    return records ?? [];
  }

  private calculateWeightTrend(weights: Array<{ weightKg: number }>): {
    status: TrendStatus;
    previous: number | null;
    latest: number | null;
    difference: number | null;
  } {
    if (weights.length < 2) {
      return {
        status: 'INSUFFICIENT_DATA',
        previous: null,
        latest: weights[0]?.weightKg ?? null,
        difference: null,
      };
    }

    const latest = weights[0].weightKg;
    const previous = weights[1].weightKg;
    const difference = Number((latest - previous).toFixed(2));

    let status: TrendStatus = 'STABLE';
    if (difference > 0.5) status = 'UP';
    else if (difference < -0.5) status = 'DOWN';

    return {
      status,
      previous,
      latest,
      difference,
    };
  }

  private calculateBcsTrend(records: Array<{ bcsScore: number }>): {
    status: TrendStatus;
    previous: number | null;
    latest: number | null;
    difference: number | null;
  } {
    if (records.length < 2) {
      return {
        status: 'INSUFFICIENT_DATA',
        previous: null,
        latest: records[0]?.bcsScore ?? null,
        difference: null,
      };
    }

    const latest = records[0].bcsScore;
    const previous = records[1].bcsScore;
    const difference = latest - previous;

    let status: TrendStatus = 'STABLE';
    if (difference > 0) status = 'UP';
    else if (difference < 0) status = 'DOWN';

    return {
      status,
      previous,
      latest,
      difference,
    };
  }

  private getBcsCategory(score?: number | null): BcsCategory | null {
    if (!score) return null;
    if (score <= 2) return 'LOW';
    if (score <= 4) return 'IDEAL';
    return 'HIGH';
  }

  private mapHealthTrend(status?: HealthStatus): 'GOOD' | 'CAUTION' | 'BAD' {
    if (status === HealthStatus.HEALTHY) return 'GOOD';
    if (status === HealthStatus.RECOVERING) return 'CAUTION';
    return 'BAD';
  }

  private getOverallCondition(params: {
    sheepStatus: SheepStatus;
    healthStatus?: HealthStatus;
    bcsCategory: BcsCategory | null;
  }): OverallCondition {
    if (
      params.sheepStatus === SheepStatus.DEAD ||
      params.sheepStatus === SheepStatus.CULLED ||
      params.healthStatus === HealthStatus.SICK
    ) {
      return 'POOR';
    }

    if (
      params.sheepStatus === SheepStatus.ACTIVE &&
      params.healthStatus === HealthStatus.HEALTHY &&
      params.bcsCategory === 'IDEAL'
    ) {
      return 'GOOD';
    }

    return 'FAIR';
  }

  private calculateCompleteness(params: {
    sheep: {
      sheepCode: string;
      breed: string;
      gender: string;
      status: SheepStatus;
    };
    weights: unknown[];
    bcsRecords: unknown[];
    healthRecords: unknown[];
    reproductions: unknown[];
  }): {
    identity: boolean;
    weights: boolean;
    bcs: boolean;
    health: boolean;
    reproduction: boolean;
    score: number;
    status: CompletenessStatus;
  } {
    const identity =
      !!params.sheep.sheepCode &&
      !!params.sheep.breed &&
      !!params.sheep.gender &&
      !!params.sheep.status;

    const weights = params.weights.length > 0;
    const bcs = params.bcsRecords.length > 0;
    const health = params.healthRecords.length > 0;
    const reproduction = params.reproductions.length > 0;

    let score = 0;
    if (identity) score += 20;
    if (weights) score += 20;
    if (bcs) score += 20;
    if (health) score += 20;
    if (reproduction) score += 20;

    let status: CompletenessStatus = 'MINIMAL';
    if (score >= 80) status = 'COMPLETE';
    else if (score >= 50) status = 'PARTIAL';

    return {
      identity,
      weights,
      bcs,
      health,
      reproduction,
      score,
      status,
    };
  }

  private calculateBreedingEvaluation(params: {
    sheepStatus: SheepStatus;
    latestHealthStatus?: HealthStatus;
    latestBcsScore?: number;
    latestReproductionStatus?: ReproductionStatus;
    completenessStatus: CompletenessStatus;
    weightTrend: TrendStatus;
    weightsCount: number;
  }): {
    score: number;
    status: BreedingStatus;
    reasons: string[];
    warnings: string[];
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    if (params.sheepStatus === SheepStatus.ACTIVE) {
      score += 10;
      reasons.push('Status ternak aktif');
    } else {
      warnings.push('Status ternak tidak aktif');
    }

    if (params.weightsCount >= 2) {
      score += 10;
      reasons.push('Histori bobot tersedia');
    } else {
      warnings.push('Data bobot belum cukup');
    }

    if (params.weightTrend === 'UP' || params.weightTrend === 'STABLE') {
      score += 10;
      reasons.push('Tren bobot stabil/naik');
    } else if (params.weightTrend === 'DOWN') {
      warnings.push('Tren bobot menurun');
    }

    const bcsCategory = this.getBcsCategory(params.latestBcsScore);
    if (bcsCategory === 'IDEAL') {
      score += 20;
      reasons.push('BCS ideal');
    } else if (bcsCategory === 'LOW' || bcsCategory === 'HIGH') {
      score += 10;
      warnings.push('BCS belum ideal');
    } else {
      warnings.push('Data BCS belum tersedia');
    }

    if (params.latestHealthStatus === HealthStatus.HEALTHY) {
      score += 25;
      reasons.push('Kesehatan baik');
    } else if (params.latestHealthStatus === HealthStatus.RECOVERING) {
      score += 10;
      warnings.push('Masih dalam pemulihan');
    } else if (params.latestHealthStatus === HealthStatus.SICK) {
      warnings.push('Kondisi kesehatan bermasalah');
    } else {
      warnings.push('Data kesehatan belum tersedia');
    }

    if (
      params.latestReproductionStatus === ReproductionStatus.PREGNANT ||
      params.latestReproductionStatus === ReproductionStatus.LAMBED
    ) {
      score += 15;
      reasons.push('Status reproduksi baik');
    } else if (params.latestReproductionStatus === ReproductionStatus.MATED) {
      score += 10;
      reasons.push('Sudah ada progres reproduksi');
    } else if (params.latestReproductionStatus === ReproductionStatus.OPEN) {
      score += 5;
      warnings.push('Data reproduksi masih terbatas');
    } else {
      warnings.push('Data reproduksi belum tersedia');
    }

    if (params.completenessStatus === 'COMPLETE') {
      score += 10;
      reasons.push('Data rekording lengkap');
    } else if (params.completenessStatus === 'PARTIAL') {
      score += 5;
      warnings.push('Data rekording belum lengkap');
    } else {
      warnings.push('Data rekording sangat minimal');
    }

    let status: BreedingStatus = 'BELUM_DIREKOMENDASIKAN';

    if (
      params.sheepStatus === SheepStatus.DEAD ||
      params.sheepStatus === SheepStatus.CULLED ||
      params.latestHealthStatus === HealthStatus.SICK
    ) {
      status = 'BELUM_DIREKOMENDASIKAN';
    } else if (score >= 80) {
      status = 'LAYAK_BIBIT';
    } else if (score >= 60) {
      status = 'PERLU_PEMANTAUAN';
    }

    return {
      score,
      status,
      reasons,
      warnings,
    };
  }
}
