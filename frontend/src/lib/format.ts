/** Berat dalam kg dengan koma desimal: 32,5 kg. */
export function formatKg(value: number) {
  return `${value.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg`;
}

/** Selisih bertanda untuk tren: "1,2" (tanpa tanda; arah ditunjukkan ikon/kata). */
export function formatDiff(value: number) {
  return Math.abs(value).toLocaleString('id-ID', { maximumFractionDigits: 1 });
}

/** Jumlah hari sejak tanggal (hari kalender, zona waktu perangkat); null bila tanggal kosong. */
export function daysSince(iso?: string | null, now: Date = new Date()): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;

  const then = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - then) / 86_400_000));
}

/** "hari ini", "kemarin", "3 hari lalu", "2 minggu lalu", "belum pernah dicatat". */
export function labelTimeAgo(iso?: string | null, now: Date = new Date()): string {
  const days = daysSince(iso, now);
  if (days === null) return 'belum pernah dicatat';
  if (days === 0) return 'hari ini';
  if (days === 1) return 'kemarin';
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  return `${Math.floor(days / 30)} bulan lalu`;
}

/** Ambil tanggal kalender dari ISO (tanpa geser zona waktu) sebagai Date lokal. */
export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "3 Sep" */
export function formatDayShort(iso: string) {
  return parseDay(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** "30 September 2026" */
export function formatDayLong(iso: string) {
  return parseDay(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "September 2026" */
export function formatMonthYear(iso: string) {
  return parseDay(iso).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}
