import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Keyboard Indonesia memakai koma desimal: ubah ke titik dan buang karakter selain angka. */
export function sanitizeDecimal(raw: string) {
  const cleaned = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
}

/** Tanggal hari ini (YYYY-MM-DD) menurut zona waktu perangkat, bukan UTC. */
export function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
