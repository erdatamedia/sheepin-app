import { estimateBirthDate } from './age';

describe('estimateBirthDate', () => {
  it('mengurangi bulan dari tanggal pencatatan', () => {
    expect(estimateBirthDate('2026-10-01', 8).toISOString().slice(0, 10)).toBe(
      '2026-02-01',
    );
  });

  it('melewati batas tahun', () => {
    expect(estimateBirthDate('2026-03-15', 15).toISOString().slice(0, 10)).toBe(
      '2024-12-15',
    );
  });

  it('umur 0 = tanggal pencatatan', () => {
    expect(estimateBirthDate('2026-10-01', 0).toISOString().slice(0, 10)).toBe(
      '2026-10-01',
    );
  });
});
