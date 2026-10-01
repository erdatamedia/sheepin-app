import { buildBadges, currentStreak } from './achievements';

describe('achievements', () => {
  it('streak berakhir hari ini', () => {
    const days = new Set([
      '2026-10-01',
      '2026-09-30',
      '2026-09-29',
      '2026-09-27',
    ]);
    expect(currentStreak(days, '2026-10-01')).toBe(3);
  });

  it('streak tidak putus bila hari ini belum diisi', () => {
    const days = new Set(['2026-09-30', '2026-09-29']);
    expect(currentStreak(days, '2026-10-01')).toBe(2);
  });

  it('streak 0 bila kemarin dan hari ini kosong', () => {
    expect(currentStreak(new Set(['2026-09-20']), '2026-10-01')).toBe(0);
    expect(currentStreak(new Set(), '2026-10-01')).toBe(0);
  });

  it('lencana dihitung dari ambang', () => {
    const badges = buildBadges({
      totalRecords: 12,
      weighings: 10,
      streakDays: 7,
      activeDays: 9,
      healthChecks: 5,
      sickNow: 0,
      averageAdgGrams: 120,
      activeSheep: 3,
      sheepRecordedInPeriod: 3,
    });
    const earned = Object.fromEntries(badges.map((b) => [b.id, b.earned]));
    expect(earned).toMatchObject({
      mulai: true,
      timbang: true,
      rutin7: true,
      rutin30: false,
      aktif: false,
      lengkap: true,
      sehat: true,
      tumbuh: true,
    });
  });
});
