/**
 * Rahasia JWT wajib diset lewat env. Tidak ada nilai bawaan: nilai bawaan yang tertulis
 * di repo membuat token bisa dipalsukan bila env lupa diisi.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length < 16) {
    throw new Error(
      'JWT_SECRET belum diset atau terlalu pendek (minimal 16 karakter). Isi di backend/.env.',
    );
  }

  return secret;
}
