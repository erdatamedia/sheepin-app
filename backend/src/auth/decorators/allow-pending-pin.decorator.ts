import { SetMetadata } from '@nestjs/common';

export const ALLOW_PENDING_PIN_KEY = 'allowPendingPin';

/**
 * Akun dengan PIN sementara (mustChangePin) hanya boleh memanggil endpoint
 * yang diberi dekorator ini (lihat profil sendiri dan ganti PIN).
 */
export const AllowPendingPin = () => SetMetadata(ALLOW_PENDING_PIN_KEY, true);
