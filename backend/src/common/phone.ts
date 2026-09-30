/**
 * Nomor HP Indonesia disimpan dalam satu format: 62 + nomor tanpa 0 di depan
 * (contoh 6281234567890). Format ini dipakai sebagai kunci unik login.
 *
 * Diterima: 0812..., 812..., 62812..., +62 812-..., (spasi, titik, strip, kurung diabaikan).
 * Nomor seluler Indonesia: 628 + 8 sampai 11 digit (total 11 sampai 14 digit).
 */
const MOBILE_PATTERN = /^628\d{8,11}$/;

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, '');

  if (digits.startsWith('00')) digits = digits.slice(2); // 0062...
  if (digits.startsWith('0'))
    digits = `62${digits.slice(1)}`; // 0812... -> 62812...
  else if (digits.startsWith('8')) digits = `62${digits}`; // 812... -> 62812...

  return MOBILE_PATTERN.test(digits) ? digits : null;
}

/** Samarkan nomor untuk tampilan/log: 6281****7890. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  if (phone.length < 8) return '****';
  return `${phone.slice(0, 4)}****${phone.slice(-4)}`;
}
