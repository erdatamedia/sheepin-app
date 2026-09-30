import { formatDayLong, formatDiff, formatKg, formatMonthYear } from '@/lib/format';
import { labelStatusKesehatan } from '@/lib/labels';

export type WeightRecord = { id: string; recordDate: string; weightKg: number; note?: string };
export type BcsRecord = { id: string; recordDate: string; bcsScore: number; note?: string };
export type HealthRecord = {
  id: string;
  checkDate: string;
  diseaseName?: string;
  treatment?: string;
  medicine?: string;
  healthStatus: string;
  note?: string;
};
export type ReproductionRecord = {
  id: string;
  matingDate?: string;
  estimatedBirthDate?: string;
  lambingDate?: string;
  maleParent?: string;
  totalLambBorn?: number;
  totalLambWeaned?: number;
  status: string;
  note?: string;
  /** Waktu pencatatan; dipakai bila catatan reproduksi tidak punya tanggal sendiri. */
  createdAt?: string;
};

export type TimelineKind = 'WEIGHT' | 'BCS' | 'HEALTH' | 'REPRODUCTION';
export type TimelineTone = 'default' | 'success' | 'warning' | 'danger';

export type TimelineEvent = {
  id: string;
  kind: TimelineKind;
  /** ISO; hanya 10 karakter pertama (tanggal) yang dipakai. */
  date: string;
  title: string;
  detail?: string;
  tone: TimelineTone;
};

/** Panduan menilai kondisi tubuh (BCS) 1-5 dengan cara meraba punggung dan tulang rusuk. */
export const BCS_GUIDE: Array<{ score: number; label: string; hint: string }> = [
  { score: 1, label: 'Sangat kurus', hint: 'Tulang punggung dan rusuk menonjol tajam, hampir tidak teraba daging.' },
  { score: 2, label: 'Kurus', hint: 'Tulang punggung terasa jelas, daging di pinggang tipis.' },
  { score: 3, label: 'Ideal', hint: 'Tulang punggung teraba halus, pinggang berdaging rata. Kondisi yang dituju.' },
  { score: 4, label: 'Gemuk', hint: 'Tulang punggung sulit diraba, ada lapisan lemak yang jelas.' },
  { score: 5, label: 'Sangat gemuk', hint: 'Tulang tertutup lemak tebal, badan tampak terlalu berat.' },
];

const BCS_LABELS: Record<number, string> = Object.fromEntries(
  BCS_GUIDE.map((item) => [item.score, item.label]),
);

/** Penjelasan skor kondisi tubuh (BCS) dalam bahasa awam. */
export function bcsLabel(score: number) {
  return BCS_LABELS[Math.round(score)] ?? '';
}

const KIND_ORDER: Record<TimelineKind, number> = { WEIGHT: 0, BCS: 1, HEALTH: 2, REPRODUCTION: 3 };

const joinParts = (parts: Array<string | undefined | null | false>) =>
  parts.filter(Boolean).join(' · ') || undefined;

/** Gabungkan semua jenis catatan menjadi satu linimasa, terbaru di atas. */
export function buildTimeline(input: {
  weights: WeightRecord[];
  bcs: BcsRecord[];
  health: HealthRecord[];
  reproduction: ReproductionRecord[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Selisih bobot dihitung terhadap penimbangan sebelumnya menurut tanggal.
  const weightsAsc = [...input.weights].sort((a, b) =>
    a.recordDate.slice(0, 10).localeCompare(b.recordDate.slice(0, 10)),
  );
  weightsAsc.forEach((record, index) => {
    const previous = weightsAsc[index - 1];
    const diff = previous ? Math.round((record.weightKg - previous.weightKg) * 10) / 10 : null;
    const change =
      diff === null
        ? 'Penimbangan pertama'
        : Math.abs(diff) <= 0.1
          ? 'Stabil dari sebelumnya'
          : `${diff > 0 ? 'Naik' : 'Turun'} ${formatDiff(diff)} kg dari sebelumnya`;

    events.push({
      id: `w-${record.id}`,
      kind: 'WEIGHT',
      date: record.recordDate,
      title: `Ditimbang ${formatKg(record.weightKg)}`,
      detail: joinParts([change, record.note]),
      tone: diff !== null && diff < -0.1 ? 'warning' : 'default',
    });
  });

  for (const record of input.bcs) {
    const label = bcsLabel(record.bcsScore);
    events.push({
      id: `b-${record.id}`,
      kind: 'BCS',
      date: record.recordDate,
      title: `Kondisi tubuh ${record.bcsScore}${label ? ` (${label})` : ''}`,
      detail: record.note,
      tone: record.bcsScore <= 2 || record.bcsScore >= 5 ? 'warning' : 'default',
    });
  }

  for (const record of input.health) {
    const sick = record.healthStatus === 'SICK';
    events.push({
      id: `h-${record.id}`,
      kind: 'HEALTH',
      date: record.checkDate,
      title: sick
        ? `Sakit${record.diseaseName ? `: ${record.diseaseName}` : ''}`
        : record.healthStatus === 'RECOVERING'
          ? 'Masa pemulihan'
          : labelStatusKesehatan(record.healthStatus),
      detail: joinParts([
        record.treatment && `Tindakan: ${record.treatment}`,
        record.medicine && `Obat: ${record.medicine}`,
        record.note,
      ]),
      tone: sick ? 'danger' : record.healthStatus === 'RECOVERING' ? 'warning' : 'success',
    });
  }

  for (const record of input.reproduction) {
    const date =
      (record.status === 'LAMBED'
        ? (record.lambingDate ?? record.matingDate)
        : (record.matingDate ?? record.lambingDate)) ?? record.createdAt;
    if (!date) continue; // tanpa tanggal sama sekali tidak bisa ditaruh di linimasa

    let title: string;
    let detail: string | undefined;
    let tone: TimelineTone = 'default';

    switch (record.status) {
      case 'MATED':
        title = 'Dikawinkan';
        detail = joinParts([record.maleParent && `Pejantan: ${record.maleParent}`, record.note]);
        break;
      case 'PREGNANT':
        title = 'Bunting';
        detail = joinParts([
          record.estimatedBirthDate && `Perkiraan beranak ${formatDayLong(record.estimatedBirthDate)}`,
          record.note,
        ]);
        tone = 'warning';
        break;
      case 'LAMBED':
        title = `Beranak${record.totalLambBorn ? ` ${record.totalLambBorn} ekor` : ''}`;
        detail = joinParts([
          record.totalLambWeaned ? `${record.totalLambWeaned} ekor disapih` : null,
          record.note,
        ]);
        tone = 'success';
        break;
      default:
        title = 'Siap dikawinkan';
        detail = record.note;
    }

    events.push({ id: `r-${record.id}`, kind: 'REPRODUCTION', date, title, detail, tone });
  }

  return events.sort(
    (a, b) =>
      b.date.slice(0, 10).localeCompare(a.date.slice(0, 10)) ||
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind],
  );
}

/** Kelompokkan linimasa (sudah terurut) per bulan: "September 2026". */
export function groupByMonth(events: TimelineEvent[]) {
  const groups: Array<{ key: string; label: string; events: TimelineEvent[] }> = [];

  for (const event of events) {
    const key = event.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.events.push(event);
    else groups.push({ key, label: formatMonthYear(event.date), events: [event] });
  }

  return groups;
}

export type WeightPoint = { date: string; weightKg: number };

/** Hari kalender antara dua tanggal ISO (b - a). */
export function daysBetween(a: string, b: string) {
  const [ay, am, ad] = a.slice(0, 10).split('-').map(Number);
  const [by, bm, bd] = b.slice(0, 10).split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/**
 * Rata-rata pertambahan bobot per hari (gram), dari titik pertama ke terakhir.
 * Diperlukan jarak minimal 7 hari agar angkanya bermakna.
 */
export function averageDailyGainGrams(points: WeightPoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const days = daysBetween(first.date, last.date);
  if (days < 7) return null;
  return Math.round(((last.weightKg - first.weightKg) / days) * 1000);
}

/** Batas sumbu-y yang "rapi" dan garis bantunya. */
export function niceScale(min: number, max: number) {
  let lo = min;
  let hi = max;
  if (hi - lo < 1) {
    lo -= 0.5;
    hi += 0.5;
  }

  const steps = [0.5, 1, 2, 5, 10, 20, 50, 100];
  const step = steps.find((candidate) => (hi - lo) / candidate <= 4) ?? 100;

  const scaleMin = Math.floor(lo / step) * step;
  const scaleMax = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let value = scaleMin; value <= scaleMax + 1e-9; value += step) {
    ticks.push(Math.round(value * 10) / 10);
  }

  return { min: scaleMin, max: scaleMax, ticks };
}
