import { latestActivityDate, summarizeWeights } from './my-sheep-summary';

const point = (date: string, weightKg: number) => ({
  recordDate: new Date(date),
  weightKg,
});

describe('summarizeWeights', () => {
  it('tanpa data -> semuanya null', () => {
    expect(summarizeWeights([])).toEqual({
      latest: null,
      previous: null,
      diffKg: null,
      trend: null,
    });
  });

  it('satu data -> ada bobot terakhir, belum ada tren', () => {
    const result = summarizeWeights([point('2026-09-01', 30)]);
    expect(result.latest?.weightKg).toBe(30);
    expect(result.previous).toBeNull();
    expect(result.trend).toBeNull();
    expect(result.diffKg).toBeNull();
  });

  it.each([
    [32.5, 31.3, 1.2, 'UP'],
    [28.0, 28.8, -0.8, 'DOWN'],
    [30.0, 30.0, 0, 'STABLE'],
    [30.05, 30.0, 0.1, 'STABLE'], // dalam pita stabil
    [30.2, 30.0, 0.2, 'UP'],
  ])('%s vs %s -> selisih %s, %s', (now, before, diff, trend) => {
    const result = summarizeWeights([
      point('2026-09-10', now),
      point('2026-09-01', before),
    ]);
    expect(result.diffKg).toBe(diff);
    expect(result.trend).toBe(trend);
  });

  it('pembulatan satu desimal tanpa artefak float', () => {
    const result = summarizeWeights([
      point('2026-09-10', 0.3),
      point('2026-09-01', 0.1),
    ]);
    expect(result.diffKg).toBe(0.2);
  });
});

describe('latestActivityDate', () => {
  it('mengambil tanggal paling baru dan mengabaikan kosong', () => {
    const result = latestActivityDate([
      new Date('2026-09-01'),
      null,
      new Date('2026-09-20'),
      undefined,
      new Date('2026-09-05'),
    ]);
    expect(result?.toISOString()).toBe(new Date('2026-09-20').toISOString());
  });

  it('semua kosong -> null', () => {
    expect(latestActivityDate([null, undefined])).toBeNull();
  });
});
