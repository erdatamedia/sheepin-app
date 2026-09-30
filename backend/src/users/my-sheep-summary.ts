export type WeightPoint = { recordDate: Date; weightKg: number };

export type WeightTrend = 'UP' | 'DOWN' | 'STABLE';

/** Selisih di bawah ini (kg) dianggap stabil; menghindari panah naik/turun karena timbangan goyah. */
const STABLE_BAND_KG = 0.1;

/**
 * Tren dari dua penimbangan terbaru. `weights` diurutkan dari yang terbaru.
 * Tanpa dua data, tren dan selisih null.
 */
export function summarizeWeights(weights: WeightPoint[]) {
  const latest = weights[0] ?? null;
  const previous = weights[1] ?? null;

  if (!latest || !previous) {
    return {
      latest,
      previous,
      diffKg: null,
      trend: null as WeightTrend | null,
    };
  }

  const diffKg = Math.round((latest.weightKg - previous.weightKg) * 10) / 10;
  const trend: WeightTrend =
    diffKg > STABLE_BAND_KG
      ? 'UP'
      : diffKg < -STABLE_BAND_KG
        ? 'DOWN'
        : 'STABLE';

  return { latest, previous, diffKg, trend };
}

/** Tanggal catatan paling baru di antara semua jenis catatan; null bila belum ada satu pun. */
export function latestActivityDate(
  dates: Array<Date | null | undefined>,
): Date | null {
  const valid = dates.filter((date): date is Date => !!date);
  if (valid.length === 0) return null;
  return new Date(Math.max(...valid.map((date) => date.getTime())));
}
