import {
  ageInMonths,
  averageDailyGainGrams,
  countBy,
  monthKey,
  parseDay,
} from './reports.helpers';

describe('reports.helpers', () => {
  it('menghitung ADG gram per hari', () => {
    const adg = averageDailyGainGrams([
      { date: new Date('2026-01-01'), value: 20 },
      { date: new Date('2026-01-31'), value: 26 },
    ]);
    expect(adg).toBe(200);
  });

  it('ADG null bila kurang dari dua titik atau satu hari yang sama', () => {
    expect(
      averageDailyGainGrams([{ date: new Date('2026-01-01'), value: 20 }]),
    ).toBeNull();
    expect(
      averageDailyGainGrams([
        { date: new Date('2026-01-01'), value: 20 },
        { date: new Date('2026-01-01'), value: 21 },
      ]),
    ).toBeNull();
  });

  it('usia dalam bulan penuh', () => {
    expect(ageInMonths(new Date('2026-01-15'), new Date('2026-04-14'))).toBe(2);
    expect(ageInMonths(new Date('2026-01-15'), new Date('2026-04-15'))).toBe(3);
    expect(ageInMonths(null, new Date())).toBeNull();
  });

  it('countBy mengurutkan dan melewati nilai kosong', () => {
    expect(countBy(['a', 'b', 'a', '', null], (x) => x)).toEqual([
      { label: 'a', total: 2 },
      { label: 'b', total: 1 },
    ]);
  });

  it('parseDay dan monthKey', () => {
    expect(monthKey(parseDay('2026-03-09', new Date()))).toBe('2026-03');
    const fb = new Date('2026-01-01');
    expect(parseDay('bukan-tanggal', fb)).toBe(fb);
  });
});
