import { api } from '@/lib/api';

export type Counted = { label: string; total: number };

export type ReportOverview = {
  generatedAt: string;
  period: { from: string; to: string };
  farmerId: string | null;
  population: {
    total: number;
    byStatus: Counted[];
    byGender: Counted[];
    byBreed: Counted[];
  };
  farmers: {
    farmerId: string;
    name: string;
    groupName: string | null;
    regency: string | null;
    total: number;
    active: number;
    male: number;
    female: number;
    records: number;
  }[];
  activity: {
    totals: { weights: number; bcs: number; health: number };
    byMonth: { month: string; weights: number; bcs: number; health: number }[];
    byRecorder: { userId: string; name: string; role: string | null; total: number }[];
  };
  growth: {
    summary: {
      sheepWeighed: number;
      averageAdgGrams: number | null;
      averageLatestWeightKg: number | null;
    };
    rows: {
      sheepId: string;
      sheepCode: string;
      name: string | null;
      farmer: string | null;
      gender: string;
      status: string;
      ageMonths: number | null;
      weighings: number;
      firstWeightKg: number;
      lastWeightKg: number;
      gainKg: number;
      adgGrams: number | null;
      latestBcs: number | null;
    }[];
  };
  health: {
    checks: number;
    byStatus: Counted[];
    topDiseases: Counted[];
    sickNow: { sheepId: string; sheepCode: string; name: string | null; farmer: string | null; since: string }[];
  };
  reproduction: {
    byStatus: Counted[];
    lambings: number;
    lambBorn: number;
    lambWeaned: number;
    weaningRatePercent: number | null;
    averageBirthWeightKg: number | null;
  };
};

export async function getReportOverview(params: { from?: string; to?: string; farmerId?: string }) {
  const response = await api.get<ReportOverview>('/reports/overview', {
    params: {
      from: params.from || undefined,
      to: params.to || undefined,
      farmerId: params.farmerId || undefined,
    },
  });
  return response.data;
}

/** CSV yang terbuka benar di Excel: BOM UTF-8, pemisah titik koma (lokal Indonesia), sel diberi tanda kutip. */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    let s = v === null || v === undefined ? '' : String(v);
    // Cegah sel dibaca sebagai rumus.
    if (/^[=+\-@]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const lines = [headers, ...rows].map((r) => r.map(cell).join(';'));
  return `﻿${lines.join('\r\n')}`;
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
