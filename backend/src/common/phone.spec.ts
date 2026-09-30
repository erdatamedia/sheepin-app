import { maskPhone, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it.each([
    ['081234567890', '6281234567890'],
    ['81234567890', '6281234567890'],
    ['6281234567890', '6281234567890'],
    ['+62 812-3456-7890', '6281234567890'],
    ['(0812) 3456.7890', '6281234567890'],
    ['006281234567890', '6281234567890'],
    ['  08123456789  ', '628123456789'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each([
    [''],
    [null],
    [undefined],
    ['abc'],
    ['0812345'], // terlalu pendek
    ['08123456789012345'], // terlalu panjang
    ['0211234567'], // telepon rumah, bukan seluler
    ['+1 415 555 0100'], // bukan Indonesia
  ])('%s ditolak', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });

  it('dua penulisan nomor yang sama menghasilkan kunci yang sama', () => {
    expect(normalizePhone('0812-3456-7890')).toBe(
      normalizePhone('+62 81 2345 67890'),
    );
  });
});

describe('maskPhone', () => {
  it('menyamarkan bagian tengah', () => {
    expect(maskPhone('6281234567890')).toBe('6281****7890');
  });

  it('aman untuk nilai kosong atau pendek', () => {
    expect(maskPhone(null)).toBe('-');
    expect(maskPhone('123')).toBe('****');
  });
});
