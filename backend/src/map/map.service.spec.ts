import { NotFoundException } from '@nestjs/common';
import { MapService } from './map.service';

function build(farmer: object | null = { id: 'f1', name: 'Budi' }) {
  const prisma = {
    user: { findFirst: jest.fn(() => Promise.resolve(farmer)) },
    sheep: {
      findMany: jest.fn(() =>
        Promise.resolve([
          {
            id: 's1',
            sheepCode: 'DMB-1',
            weights: [{ weightKg: 31.5, recordDate: new Date('2026-09-01') }],
          },
          { id: 's2', sheepCode: 'DMB-2', weights: [] },
        ]),
      ),
    },
  };
  return { service: new MapService(prisma as never, {} as never), prisma };
}

describe('MapService.catalog', () => {
  it('versi publik: hanya peternak di peta dan ternak aktif', async () => {
    const { service, prisma } = build();
    await service.catalog('f1', true);
    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          latitude: { not: null },
          longitude: { not: null },
        }) as unknown,
      }),
    );
    expect(prisma.sheep.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ownerUserId: 'f1', status: 'ACTIVE' },
      }),
    );
  });

  it('versi petugas: semua status', async () => {
    const { service, prisma } = build();
    await service.catalog('f1', false);
    expect(prisma.sheep.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerUserId: 'f1' } }),
    );
  });

  it('meratakan bobot terakhir', async () => {
    const { service } = build();
    const { data } = await service.catalog('f1', false);
    expect(data.sheep[0].latestWeightKg).toBe(31.5);
    expect(data.sheep[1].latestWeightKg).toBeNull();
  });

  it('peternak tidak ada -> 404', async () => {
    const { service } = build(null);
    await expect(service.catalog('x', true)).rejects.toThrow(NotFoundException);
  });
});
