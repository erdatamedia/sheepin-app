import { randomInt } from 'crypto';

export const PIN_LENGTH = 6;
export const PIN_PATTERN = /^\d{6}$/;
export const PIN_MAX_ATTEMPTS = 5;
export const PIN_LOCK_MINUTES = 15;

const COMMON_PINS = new Set([
  '123456',
  '654321',
  '112233',
  '121212',
  '123123',
  '111222',
  '000123',
  '123321',
  '159753',
  '147258',
  '696969',
  '520520',
  '102030',
  '101010',
  '202020',
  '010203',
]);

/** PIN yang mudah ditebak: angka sama, berurutan, berulang, atau umum dipakai. */
export function isWeakPin(pin: string): boolean {
  if (!PIN_PATTERN.test(pin)) return true;
  if (/^(\d)\1{5}$/.test(pin)) return true; // 111111

  const digits = [...pin].map(Number);
  const ascending = digits.every(
    (digit, i) => i === 0 || digit === (digits[i - 1] + 1) % 10,
  );
  const descending = digits.every(
    (digit, i) => i === 0 || digit === (digits[i - 1] + 9) % 10,
  );
  if (ascending || descending) return true; // 123456, 987654

  if (/^(\d{2})\1\1$/.test(pin) || /^(\d{3})\1$/.test(pin)) return true; // 121212, 123123

  return COMMON_PINS.has(pin);
}

/** PIN sementara acak (kriptografis) yang lolos aturan PIN kuat. */
export function generateTempPin(): string {
  for (;;) {
    const pin = String(randomInt(0, 1_000_000)).padStart(PIN_LENGTH, '0');
    if (!isWeakPin(pin)) return pin;
  }
}
