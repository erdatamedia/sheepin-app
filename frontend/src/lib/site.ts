/** Alamat publik situs; dipakai untuk QR. Atur NEXT_PUBLIC_SITE_URL bila domain berubah. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sheep-in.com').replace(/\/$/, '');
export const LOGIN_URL = `${SITE_URL}/login`;
