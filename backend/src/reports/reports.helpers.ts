export type Point = { date: Date; value: number };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Awal hari lokal server dalam UTC dari "YYYY-MM-DD". */
export function parseDay(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/** Penambahan bobot harian rata-rata (gram/hari) antara titik pertama dan terakhir; null bila kurang dari 2 titik atau rentang 0 hari. */
export function averageDailyGainGrams(points: Point[]): number | null {
  if (points.length < 2) return null;
  const sorted = [...points].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = (last.date.getTime() - first.date.getTime()) / DAY_MS;
  if (days <= 0) return null;
  return Math.round(((last.value - first.value) * 1000) / days);
}

/** Usia dalam bulan penuh; null bila tanggal lahir tidak ada. */
export function ageInMonths(
  birthDate: Date | null | undefined,
  now: Date,
): number | null {
  if (!birthDate) return null;
  const months =
    (now.getUTCFullYear() - birthDate.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - birthDate.getUTCMonth()) -
    (now.getUTCDate() < birthDate.getUTCDate() ? 1 : 0);
  return Math.max(0, months);
}

export function countBy<T>(
  items: T[],
  key: (item: T) => string | null | undefined,
) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
