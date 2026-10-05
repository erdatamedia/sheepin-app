import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { EvaluationService } from '../evaluation/evaluation.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  averageDailyGainGrams,
  ageInMonths,
  countBy,
  parseDay,
} from './reports.helpers';

const DAY_MS = 24 * 60 * 60 * 1000;
const ALL_TIME_FROM = '2000-01-01';

const STATUS: Record<string, string> = {
  ACTIVE: 'Aktif',
  SOLD: 'Terjual',
  DEAD: 'Mati',
  CULLED: 'Afkir',
};
const GENDER: Record<string, string> = { MALE: 'Jantan', FEMALE: 'Betina' };
const HEALTH: Record<string, string> = {
  HEALTHY: 'Sehat',
  SICK: 'Sakit',
  RECOVERING: 'Pemulihan',
};
const REPRO: Record<string, string> = {
  OPEN: 'Siap kawin',
  MATED: 'Sudah kawin',
  PREGNANT: 'Bunting',
  LAMBED: 'Sudah beranak',
};
const BREEDING: Record<string, string> = {
  LAYAK_BIBIT: 'Layak bibit',
  PERLU_PEMANTAUAN: 'Perlu dipantau',
  BELUM_DIREKOMENDASIKAN: 'Belum direkomendasikan',
};
const COMPLETENESS: Record<string, string> = {
  COMPLETE: 'Lengkap',
  PARTIAL: 'Sebagian',
  MINIMAL: 'Minimal',
};

const label = (map: Record<string, string>, key?: string | null) =>
  key ? (map[key] ?? key) : '';
const dateOnly = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : '');

export type WorkbookOptions = {
  /** YYYY-MM-DD; kosong = sejak awal ("sampai saat ini"). */
  from?: string;
  to?: string;
  farmerId?: string;
};

export type WorkbookResult = {
  buffer: Buffer;
  filename: string;
  summary: {
    farmers: number;
    sheep: number;
    activeSheep: number;
    eligible: number;
    verified: number;
    records: number;
    period: { from: string; to: string };
  };
};

/**
 * Laporan Excel untuk peneliti dan dinas: ringkasan, peternak, ternak, penimbangan, kesehatan.
 * Sengaja tanpa data kontak (nomor HP, alamat rinci, koordinat) karena dikirim ke pihak luar.
 */
@Injectable()
export class ReportWorkbookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluation: EvaluationService,
  ) {}

  async build(options: WorkbookOptions = {}): Promise<WorkbookResult> {
    const now = new Date();
    const today = parseDay(now.toISOString(), now);
    const to = parseDay(options.to, today);
    const from = parseDay(
      options.from ?? ALL_TIME_FROM,
      new Date(ALL_TIME_FROM),
    );
    const toExclusive = new Date(to.getTime() + DAY_MS);
    const range = { gte: from, lt: toExclusive };

    const sheepWhere = options.farmerId
      ? { ownerUserId: options.farmerId }
      : {};

    const [farmers, sheep] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          role: 'FARMER',
          isActive: true,
          ...(options.farmerId ? { id: options.farmerId } : {}),
        },
        select: {
          id: true,
          name: true,
          groupName: true,
          regency: true,
          district: true,
          village: true,
          latitude: true,
          longitude: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      }),
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
          verifiedAt: true,
          createdAt: true,
          ownerUserId: true,
          weights: {
            where: { recordDate: range },
            orderBy: { recordDate: 'asc' },
            select: { weightKg: true, recordDate: true },
          },
          bcsRecords: {
            where: { recordDate: range },
            orderBy: { recordDate: 'desc' },
            select: { bcsScore: true, recordDate: true },
          },
          healthRecords: {
            where: { checkDate: range },
            orderBy: { checkDate: 'desc' },
            select: {
              healthStatus: true,
              diseaseName: true,
              treatment: true,
              medicine: true,
              checkDate: true,
            },
          },
          reproductions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { status: true },
          },
        },
        orderBy: [{ ownerUserId: 'asc' }, { sheepCode: 'asc' }],
      }),
    ]);

    const evaluations = await this.evaluation.evaluateByIds(
      sheep.map((s) => s.id),
    );
    const farmerName = new Map(farmers.map((f) => [f.id, f.name]));
    const ownerOf = (id: string | null) =>
      id ? (farmerName.get(id) ?? '') : '';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sheep-In';
    workbook.created = now;

    // ---- Per-ternak (dihitung dulu karena dipakai sheet lain) ----
    const sheepRows = sheep.map((s) => {
      const ev = evaluations.get(s.id);
      const latestW = s.weights[s.weights.length - 1];
      const dates = [
        ...s.weights.map((w) => w.recordDate),
        ...s.bcsRecords.map((b) => b.recordDate),
        ...s.healthRecords.map((h) => h.checkDate),
      ];
      const last = dates.length
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : null;
      return {
        s,
        ev,
        latestW,
        records:
          s.weights.length + s.bcsRecords.length + s.healthRecords.length,
        last,
        adg: averageDailyGainGrams(
          s.weights.map((w) => ({ date: w.recordDate, value: w.weightKg })),
        ),
      };
    });

    const eligible = sheepRows.filter(
      (r) => r.ev?.evaluation.breedingStatus === 'LAYAK_BIBIT',
    ).length;
    const verified = sheepRows.filter((r) => r.s.verifiedAt).length;
    const totalRecords = sheepRows.reduce((a, r) => a + r.records, 0);
    const activeSheep = sheep.filter((s) => s.status === 'ACTIVE').length;

    // ---- 1. Ringkasan ----
    const summarySheet = workbook.addWorksheet('Ringkasan');
    summarySheet.columns = [
      { header: 'Keterangan', key: 'k', width: 46 },
      { header: 'Nilai', key: 'v', width: 28 },
    ];
    const adgValues = sheepRows
      .map((r) => r.adg)
      .filter((v): v is number => v !== null);
    const completeness = countBy(sheepRows, (r) => r.ev?.completeness.status);
    const summaryRows: Array<[string, string | number]> = [
      ['Laporan', 'Rekapitulasi peternak dan ternak Sheep-In'],
      [
        'Dibuat pada',
        now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
      ],
      [
        'Periode data',
        options.from
          ? `${dateOnly(from)} s.d. ${dateOnly(to)}`
          : `Sejak awal s.d. ${dateOnly(to)}`,
      ],
      ['', ''],
      ['Jumlah peternak', farmers.length],
      [
        'Peternak dengan lokasi terpetakan',
        farmers.filter((f) => f.latitude !== null && f.longitude !== null)
          .length,
      ],
      ['Jumlah ternak', sheep.length],
      ['Ternak aktif', activeSheep],
      ...countBy(sheep, (s) => s.status).map((c): [string, number] => [
        `  Status ${label(STATUS, c.label)}`,
        c.total,
      ]),
      ...countBy(sheep, (s) => s.gender).map((c): [string, number] => [
        `  ${label(GENDER, c.label)}`,
        c.total,
      ]),
      ['Ternak layak bibit (penilaian sistem)', eligible],
      ['Ternak terverifikasi untuk katalog', verified],
      ['Total catatan (timbang, BCS, kesehatan)', totalRecords],
      [
        'Rata-rata pertambahan bobot harian (g/hari)',
        adgValues.length
          ? Math.round(adgValues.reduce((a, b) => a + b, 0) / adgValues.length)
          : '-',
      ],
      ...completeness.map((c): [string, number] => [
        `Kelengkapan data: ${label(COMPLETENESS, c.label)}`,
        c.total,
      ]),
      ['', ''],
      [
        'Catatan',
        'Layak bibit = skor evaluasi sistem >= 80 dari 100 (tren bobot, BCS, kesehatan, reproduksi, kelengkapan data) dan tidak sakit.',
      ],
      [
        'Catatan',
        'PBBH dihitung dari selisih bobot pertama dan terakhir dalam periode; butuh minimal dua penimbangan di hari berbeda.',
      ],
      [
        'Catatan',
        'Laporan tidak memuat nomor HP, alamat rinci, maupun koordinat peternak.',
      ],
    ];
    summaryRows.forEach(([k, v]) => summarySheet.addRow({ k, v }));
    this.styleHeader(summarySheet);

    // ---- 2. Peternak ----
    const farmerSheet = workbook.addWorksheet('Peternak');
    farmerSheet.columns = [
      { header: 'Peternak', key: 'name', width: 28 },
      { header: 'Kelompok', key: 'group', width: 24 },
      { header: 'Kabupaten', key: 'regency', width: 18 },
      { header: 'Kecamatan', key: 'district', width: 18 },
      { header: 'Desa', key: 'village', width: 18 },
      { header: 'Lokasi terpetakan', key: 'mapped', width: 16 },
      { header: 'Terdaftar', key: 'joined', width: 12 },
      { header: 'Jumlah ternak', key: 'total', width: 13 },
      { header: 'Aktif', key: 'active', width: 8 },
      { header: 'Jantan', key: 'male', width: 8 },
      { header: 'Betina', key: 'female', width: 8 },
      { header: 'Penimbangan', key: 'weights', width: 13 },
      { header: 'Catatan BCS', key: 'bcs', width: 12 },
      { header: 'Pemeriksaan kesehatan', key: 'health', width: 21 },
      { header: 'Hari mengisi data', key: 'days', width: 17 },
      { header: 'Terakhir mengisi', key: 'last', width: 15 },
      { header: 'Layak bibit', key: 'eligible', width: 11 },
      { header: 'Terverifikasi', key: 'verified', width: 13 },
    ];
    for (const f of farmers) {
      const mine = sheepRows.filter((r) => r.s.ownerUserId === f.id);
      const days = new Set<string>();
      let lastMs = 0;
      for (const r of mine) {
        for (const d of [
          ...r.s.weights.map((w) => w.recordDate),
          ...r.s.bcsRecords.map((b) => b.recordDate),
          ...r.s.healthRecords.map((h) => h.checkDate),
        ]) {
          days.add(dateOnly(d));
          lastMs = Math.max(lastMs, d.getTime());
        }
      }
      farmerSheet.addRow({
        name: f.name,
        group: f.groupName ?? '',
        regency: f.regency ?? '',
        district: f.district ?? '',
        village: f.village ?? '',
        mapped: f.latitude !== null && f.longitude !== null ? 'Ya' : 'Belum',
        joined: dateOnly(f.createdAt),
        total: mine.length,
        active: mine.filter((r) => r.s.status === 'ACTIVE').length,
        male: mine.filter((r) => r.s.gender === 'MALE').length,
        female: mine.filter((r) => r.s.gender === 'FEMALE').length,
        weights: mine.reduce((a, r) => a + r.s.weights.length, 0),
        bcs: mine.reduce((a, r) => a + r.s.bcsRecords.length, 0),
        health: mine.reduce((a, r) => a + r.s.healthRecords.length, 0),
        days: days.size,
        last: lastMs ? dateOnly(new Date(lastMs)) : '',
        eligible: mine.filter(
          (r) => r.ev?.evaluation.breedingStatus === 'LAYAK_BIBIT',
        ).length,
        verified: mine.filter((r) => r.s.verifiedAt).length,
      });
    }
    this.styleHeader(farmerSheet);

    // ---- 3. Ternak ----
    const sheepSheet = workbook.addWorksheet('Ternak');
    sheepSheet.columns = [
      { header: 'Kode', key: 'code', width: 14 },
      { header: 'Nama', key: 'name', width: 18 },
      { header: 'Peternak', key: 'farmer', width: 26 },
      { header: 'Jenis / rumpun', key: 'breed', width: 16 },
      { header: 'Jenis kelamin', key: 'gender', width: 13 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Tanggal lahir', key: 'birth', width: 13 },
      { header: 'Umur (bulan)', key: 'age', width: 12 },
      { header: 'Bobot terakhir (kg)', key: 'weight', width: 18 },
      { header: 'Tanggal timbang', key: 'wdate', width: 15 },
      { header: 'PBBH (g/hari)', key: 'adg', width: 13 },
      { header: 'BCS terakhir', key: 'bcs', width: 12 },
      { header: 'Kesehatan terakhir', key: 'health', width: 17 },
      { header: 'Reproduksi terakhir', key: 'repro', width: 18 },
      { header: 'Penilaian sistem', key: 'breeding', width: 22 },
      { header: 'Skor (0-100)', key: 'score', width: 12 },
      { header: 'Terverifikasi', key: 'verified', width: 13 },
      { header: 'Jumlah catatan', key: 'records', width: 14 },
      { header: 'Kelengkapan data', key: 'completeness', width: 16 },
      { header: 'Terakhir dicatat', key: 'last', width: 15 },
    ];
    for (const r of sheepRows) {
      const { s, ev } = r;
      sheepSheet.addRow({
        code: s.sheepCode,
        name: s.name ?? '',
        farmer: ownerOf(s.ownerUserId),
        breed: s.breed,
        gender: label(GENDER, s.gender),
        status: label(STATUS, s.status),
        birth: dateOnly(s.birthDate),
        age: ageInMonths(s.birthDate, now) ?? '',
        weight: r.latestW?.weightKg ?? '',
        wdate: dateOnly(r.latestW?.recordDate),
        adg: r.adg ?? '',
        bcs: s.bcsRecords[0]?.bcsScore ?? '',
        health: label(HEALTH, s.healthRecords[0]?.healthStatus),
        repro: label(REPRO, s.reproductions[0]?.status),
        breeding: label(BREEDING, ev?.evaluation.breedingStatus),
        score: ev?.evaluation.breedingScore ?? '',
        verified: s.verifiedAt ? 'Ya' : '',
        records: r.records,
        completeness: label(COMPLETENESS, ev?.completeness.status),
        last: dateOnly(r.last),
      });
    }
    this.styleHeader(sheepSheet);

    // ---- 4. Penimbangan ----
    const weightSheet = workbook.addWorksheet('Penimbangan');
    weightSheet.columns = [
      { header: 'Kode ternak', key: 'code', width: 14 },
      { header: 'Peternak', key: 'farmer', width: 26 },
      { header: 'Tanggal', key: 'date', width: 13 },
      { header: 'Bobot (kg)', key: 'kg', width: 12 },
    ];
    for (const r of sheepRows) {
      for (const w of r.s.weights) {
        weightSheet.addRow({
          code: r.s.sheepCode,
          farmer: ownerOf(r.s.ownerUserId),
          date: dateOnly(w.recordDate),
          kg: w.weightKg,
        });
      }
    }
    this.styleHeader(weightSheet);

    // ---- 5. Kesehatan ----
    const healthSheet = workbook.addWorksheet('Kesehatan');
    healthSheet.columns = [
      { header: 'Kode ternak', key: 'code', width: 14 },
      { header: 'Peternak', key: 'farmer', width: 26 },
      { header: 'Tanggal', key: 'date', width: 13 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Penyakit / keluhan', key: 'disease', width: 26 },
      { header: 'Pengobatan', key: 'treatment', width: 26 },
      { header: 'Obat', key: 'medicine', width: 20 },
    ];
    for (const r of sheepRows) {
      for (const h of r.s.healthRecords) {
        healthSheet.addRow({
          code: r.s.sheepCode,
          farmer: ownerOf(r.s.ownerUserId),
          date: dateOnly(h.checkDate),
          status: label(HEALTH, h.healthStatus),
          disease: h.diseaseName ?? '',
          treatment: h.treatment ?? '',
          medicine: h.medicine ?? '',
        });
      }
    }
    this.styleHeader(healthSheet);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return {
      buffer,
      filename: `laporan-sheepin-${dateOnly(to)}.xlsx`,
      summary: {
        farmers: farmers.length,
        sheep: sheep.length,
        activeSheep,
        eligible,
        verified,
        records: totalRecords,
        period: { from: dateOnly(from), to: dateOnly(to) },
      },
    };
  }

  private styleHeader(sheet: ExcelJS.Worksheet) {
    const header = sheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF805A3D' },
    };
    header.alignment = { vertical: 'middle', wrapText: true };
    header.height = 30;
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    if (sheet.columnCount > 2) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: sheet.columnCount },
      };
    }
  }
}
