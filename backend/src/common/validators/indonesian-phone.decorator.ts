import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { Matches } from 'class-validator';
import { normalizePhone } from '../phone';

/**
 * Nomor HP Indonesia: dinormalisasi ke 62xxxxxxxxxx sebelum divalidasi,
 * sehingga service selalu menerima format yang sama.
 */
export function IsIndonesianPhone() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string'
        ? (normalizePhone(value) ?? value.trim())
        : value,
    ),
    Matches(/^628\d{8,11}$/, {
      message: 'Nomor HP tidak valid. Contoh: 081234567890',
    }),
  );
}
