import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';
import {
  ageInMonths,
  averageDailyGainGrams,
  countBy,
  monthKey,
  parseDay,
  round1,
} from './reports.helpers';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(query: ReportQueryDto) {
    const now = new Date();
    const today = parseDay(now.toISOString(), now);
    const to = parseDay(query.to, today);
    const from = parseDay(query.from, new Date(to.getTime() - 90 * DAY_MS));
    // Batas atas eksklusif agar seluruh hari "to" ikut terhitung.
    const toExclusive = new Date(to.getTime() + DAY_MS);

    const sheepWhere = query.farmerId ? { ownerUserId: query.farmerId } : {};
    const inRange = (field: string) => ({
      [field]: { gte: from, lt: toExclusive },
    });

    const [sheep, weights, bcs, health, reproductions] = await Promise.all([
      this.prisma.sheep.findMany({
        where: sheepWhere,
        select: {
          id: true,
          sheepCode: true,
          name: true,
          breed: true,
          gender: true,
          status: true,
          birthDate: true,
          ownerUser: {
            select: { id: true, name: true, groupName: true, regency: true },
          },
        },
        orderBy: { sheepCode: 'asc' },
      }),
      this.prisma.sheepWeight.findMany({
        where: { sheep: sheepWhere, ...inRange('recordDate') },
        select: {
          sheepId: true,
          recordDate: true,
          weightKg: true,
          createdById: true,
        },
      }),
      this.prisma.sheepBCS.findMany({
        where: { sheep: sheepWhere, ...inRange('recordDate') },
        select: {
          sheepId: true,
          recordDate: true,
          bcsScore: true,
          createdById: true,
        },
      }),
      this.prisma.sheepHealth.findMany({
        where: { sheep: sheepWhere, ...inRange('checkDate') },
        select: {
          sheepId: true,
          checkDate: true,
          healthStatus: true,
          diseaseName: true,
          createdById: true,
        },
      }),
      this.prisma.sheepReproduction.findMany({
        where: { sheep: sheepWhere },
        select: {
          sheepId: true,
          status: true,
          matingDate: true,
          lambingDate: true,
          totalLambBorn: true,
          totalLambWeaned: true,
          totalBirthWeight: true,
          createdAt: true,
          createdById: true,
        },
      }),
    ]);

    const sheepById = new Map(sheep.map((s) => [s.id, s]));

    // Populasi
    const population = {
      total: sheep.length,
      byStatus: countBy(sheep, (s) => s.status),
      byGender: countBy(sheep, (s) => s.gender),
      byBreed: countBy(sheep, (s) => s.breed),
    };

    // Per peternak
    const farmerMap = new Map<
      string,
      {
        farmerId: string;
        name: string;
        groupName: string | null;
        regency: string | null;
        total: number;
        active: number;
        male: number;
        female: number;
        records: number;
      }
    >();
    for (const s of sheep) {
      const o = s.ownerUser;
      const key = o?.id ?? '-';
      const row = farmerMap.get(key) ?? {
        farmerId: key,
        name: o?.name ?? 'Tanpa pemilik',
        groupName: o?.groupName ?? null,
        regency: o?.regency ?? null,
        total: 0,
        active: 0,
        male: 0,
        female: 0,
        records: 0,
      };
      row.total += 1;
      if (s.status === 'ACTIVE') row.active += 1;
      if (s.gender === 'MALE') row.male += 1;
      else row.female += 1;
      farmerMap.set(key, row);
    }
    const recordOwner = (sheepId: string) =>
      sheepById.get(sheepId)?.ownerUser?.id ?? '-';
    for (const r of [...weights, ...bcs, ...health]) {
      const row = farmerMap.get(recordOwner(r.sheepId));
      if (row) row.records += 1;
    }
    const farmers = [...farmerMap.values()].sort((a, b) => b.total - a.total);

    // Aktivitas rekording
    const months = new Map<
      string,
      { month: string; weights: number; bcs: number; health: number }
    >();
    const bump = (date: Date, field: 'weights' | 'bcs' | 'health') => {
      const m = monthKey(date);
      const row = months.get(m) ?? { month: m, weights: 0, bcs: 0, health: 0 };
      row[field] += 1;
      months.set(m, row);
    };
    weights.forEach((w) => bump(w.recordDate, 'weights'));
    bcs.forEach((b) => bump(b.recordDate, 'bcs'));
    health.forEach((h) => bump(h.checkDate, 'health'));

    const creatorIds = [
      ...new Set([...weights, ...bcs, ...health].map((r) => r.createdById)),
    ];
    const creators = creatorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true, role: true },
        })
      : [];
    const creatorName = new Map(creators.map((c) => [c.id, c]));
    const byCreator = new Map<string, number>();
    for (const r of [...weights, ...bcs, ...health]) {
      byCreator.set(r.createdById, (byCreator.get(r.createdById) ?? 0) + 1);
    }

    const activity = {
      totals: {
        weights: weights.length,
        bcs: bcs.length,
        health: health.length,
      },
      byMonth: [...months.values()].sort((a, b) =>
        a.month.localeCompare(b.month),
      ),
      byRecorder: [...byCreator.entries()]
        .map(([id, total]) => ({
          userId: id,
          name: creatorName.get(id)?.name ?? '-',
          role: creatorName.get(id)?.role ?? null,
          total,
        }))
        .sort((a, b) => b.total - a.total),
    };

    // Pertumbuhan per ternak (dalam periode)
    const weightsBySheep = new Map<string, typeof weights>();
    for (const w of weights) {
      const list = weightsBySheep.get(w.sheepId) ?? [];
      list.push(w);
      weightsBySheep.set(w.sheepId, list);
    }
    const latestBcs = new Map<string, { date: Date; score: number }>();
    for (const b of bcs) {
      const cur = latestBcs.get(b.sheepId);
      if (!cur || b.recordDate > cur.date) {
        latestBcs.set(b.sheepId, { date: b.recordDate, score: b.bcsScore });
      }
    }
    const growth = sheep
      .filter((s) => weightsBySheep.has(s.id))
      .map((s) => {
        const list = [...(weightsBySheep.get(s.id) ?? [])].sort(
          (a, b) => a.recordDate.getTime() - b.recordDate.getTime(),
        );
        const first = list[0];
        const last = list[list.length - 1];
        return {
          sheepId: s.id,
          sheepCode: s.sheepCode,
          name: s.name,
          farmer: s.ownerUser?.name ?? null,
          gender: s.gender,
          status: s.status,
          ageMonths: ageInMonths(s.birthDate, now),
          weighings: list.length,
          firstWeightKg: first.weightKg,
          lastWeightKg: last.weightKg,
          gainKg: round1(last.weightKg - first.weightKg),
          adgGrams: averageDailyGainGrams(
            list.map((w) => ({ date: w.recordDate, value: w.weightKg })),
          ),
          latestBcs: latestBcs.get(s.id)?.score ?? null,
        };
      })
      .sort((a, b) => (b.adgGrams ?? -Infinity) - (a.adgGrams ?? -Infinity));
    const adgValues = growth
      .map((g) => g.adgGrams)
      .filter((v): v is number => v !== null);
    const growthSummary = {
      sheepWeighed: growth.length,
      averageAdgGrams: adgValues.length
        ? Math.round(adgValues.reduce((a, b) => a + b, 0) / adgValues.length)
        : null,
      averageLatestWeightKg: growth.length
        ? round1(growth.reduce((a, g) => a + g.lastWeightKg, 0) / growth.length)
        : null,
    };

    // Kesehatan
    const latestHealth = new Map<string, { date: Date; status: string }>();
    for (const h of health) {
      const cur = latestHealth.get(h.sheepId);
      if (!cur || h.checkDate > cur.date) {
        latestHealth.set(h.sheepId, {
          date: h.checkDate,
          status: h.healthStatus,
        });
      }
    }
    const sickNow = [...latestHealth.entries()]
      .filter(([, v]) => v.status === 'SICK')
      .map(([id, v]) => {
        const s = sheepById.get(id);
        return {
          sheepId: id,
          sheepCode: s?.sheepCode ?? '-',
          name: s?.name ?? null,
          farmer: s?.ownerUser?.name ?? null,
          since: v.date.toISOString().slice(0, 10),
        };
      });
    const healthReport = {
      checks: health.length,
      byStatus: countBy(health, (h) => h.healthStatus),
      topDiseases: countBy(health, (h) =>
        h.diseaseName?.trim().toLowerCase(),
      ).slice(0, 10),
      sickNow,
    };

    // Reproduksi
    const latestRepro = new Map<string, (typeof reproductions)[number]>();
    for (const r of reproductions) {
      const cur = latestRepro.get(r.sheepId);
      if (!cur || r.createdAt > cur.createdAt) latestRepro.set(r.sheepId, r);
    }
    const lambings = reproductions.filter(
      (r) =>
        r.lambingDate && r.lambingDate >= from && r.lambingDate < toExclusive,
    );
    const born = lambings.reduce((a, r) => a + (r.totalLambBorn ?? 0), 0);
    const weaned = lambings.reduce((a, r) => a + (r.totalLambWeaned ?? 0), 0);
    const birthWeights = lambings
      .map((r) => r.totalBirthWeight)
      .filter((v): v is number => typeof v === 'number');
    const reproduction = {
      byStatus: countBy([...latestRepro.values()], (r) => r.status),
      lambings: lambings.length,
      lambBorn: born,
      lambWeaned: weaned,
      weaningRatePercent: born > 0 ? Math.round((weaned / born) * 100) : null,
      averageBirthWeightKg: birthWeights.length
        ? round1(birthWeights.reduce((a, b) => a + b, 0) / birthWeights.length)
        : null,
    };

    return {
      generatedAt: now.toISOString(),
      period: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      },
      farmerId: query.farmerId ?? null,
      population,
      farmers,
      activity,
      growth: { summary: growthSummary, rows: growth },
      health: healthReport,
      reproduction,
    };
  }
}
