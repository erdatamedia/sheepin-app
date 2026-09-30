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
