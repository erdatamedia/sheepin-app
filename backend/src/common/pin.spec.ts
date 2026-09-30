import { generateTempPin, isWeakPin } from './pin';

describe('isWeakPin', () => {
  it.each([
    '000000',
    '111111',
    '123456',
    '654321',
    '234567',
    '890123',
    '121212',
    '123123',
    '112233',
    '12345',
    'abcdef',
    '',
  ])('%s lemah', (pin) => {
    expect(isWeakPin(pin)).toBe(true);
  });

  it.each(['482915', '907351', '360842'])('%s cukup kuat', (pin) => {
    expect(isWeakPin(pin)).toBe(false);
  });
});

describe('generateTempPin', () => {
  it('selalu 6 digit dan lolos aturan PIN kuat', () => {
    for (let i = 0; i < 500; i++) {
      const pin = generateTempPin();
      expect(pin).toMatch(/^\d{6}$/);
      expect(isWeakPin(pin)).toBe(false);
    }
  });
});
