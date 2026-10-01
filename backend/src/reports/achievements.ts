/** Hitung hari berturut-turut yang ada catatan, berakhir hari ini atau kemarin (hari ini belum diisi tidak memutus). */
export function currentStreak(days: Set<string>, todayIso: string): number {
  const shift = (iso: string, delta: number) => {
    const d = new Date(`${iso}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  };
  let cursor = days.has(todayIso) ? todayIso : shift(todayIso, -1);
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = shift(cursor, -1);
  }
  return count;
}

export type BadgeInput = {
  totalRecords: number;
  weighings: number;
  streakDays: number;
  activeDays: number;
  healthChecks: number;
  sickNow: number;
  averageAdgGrams: number | null;
  activeSheep: number;
  sheepRecordedInPeriod: number;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  value: number;
  target: number;
};

/**
 * Lencana apresiasi. Ambang dipilih agar peternak kecil pun bisa meraihnya dalam beberapa minggu;
 * ubah angka `target` di sini bila perlu.
 */
export function buildBadges(i: BadgeInput): Badge[] {
  const make = (
    id: string,
    title: string,
    description: string,
    value: number,
    target: number,
  ): Badge => ({
    id,
    title,
    description,
    earned: value >= target,
    value,
    target,
  });

  return [
    make(
      'mulai',
      'Mulai Mencatat',
      'Sudah mencatat perkembangan ternak',
      i.totalRecords,
      1,
    ),
    make(
      'timbang',
      'Rajin Menimbang',
      '10 kali penimbangan dalam periode',
      i.weighings,
      10,
    ),
    make(
      'rutin7',
      'Rutin 7 Hari',
      'Mengisi data 7 hari berturut-turut',
      i.streakDays,
      7,
    ),
    make(
      'rutin30',
      'Rutin 30 Hari',
      'Mengisi data 30 hari berturut-turut',
      i.streakDays,
      30,
    ),
    make(
      'aktif',
      'Konsisten',
      'Mengisi data di 15 hari berbeda dalam periode',
      i.activeDays,
      15,
    ),
    make(
      'lengkap',
      'Semua Terpantau',
      'Setiap ternak aktif punya catatan dalam periode',
      i.activeSheep > 0 && i.sheepRecordedInPeriod >= i.activeSheep ? 1 : 0,
      1,
    ),
    make(
      'sehat',
      'Kandang Sehat',
      'Pemeriksaan kesehatan rutin dan tidak ada ternak sakit',
      i.healthChecks >= 5 && i.sickNow === 0 ? 1 : 0,
      1,
    ),
    make(
      'tumbuh',
      'Pertumbuhan Baik',
      'Rata-rata pertambahan bobot minimal 100 g/hari',
      i.averageAdgGrams ?? 0,
      100,
    ),
  ];
}
