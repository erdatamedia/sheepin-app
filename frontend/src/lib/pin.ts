export const PIN_LENGTH = 6;

/** Sama dengan aturan backend (common/pin.ts); server tetap yang memutuskan. */
const COMMON_PINS = new Set([
  '123456', '654321', '112233', '121212', '123123', '111222', '000123', '123321',
  '159753', '147258', '696969', '520520', '102030', '101010', '202020', '010203',
]);

export function onlyDigits(value: string) {
  return value.replace(/\D/g, '').slice(0, PIN_LENGTH);
}

export function isWeakPin(pin: string): boolean {
  if (!/^\d{6}$/.test(pin)) return true;
  if (/^(\d)\1{5}$/.test(pin)) return true;

  const digits = [...pin].map(Number);
  const ascending = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 1) % 10);
  const descending = digits.every((d, i) => i === 0 || d === (digits[i - 1] + 9) % 10);
  if (ascending || descending) return true;

  if (/^(\d{2})\1\1$/.test(pin) || /^(\d{3})\1$/.test(pin)) return true;

  return COMMON_PINS.has(pin);
}

/** Pesan untuk PIN baru; null bila PIN boleh dipakai. */
export function pinProblem(pin: string, confirm?: string): string | null {
  if (pin.length !== PIN_LENGTH) return 'PIN harus 6 angka.';
  if (isWeakPin(pin)) return 'PIN terlalu mudah ditebak. Hindari angka berurutan atau berulang.';
  if (confirm !== undefined && pin !== confirm) return 'Konfirmasi PIN tidak sama.';
  return null;
}
