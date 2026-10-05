import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

type Row = {
  id: string;
  sheepCode: string;
  status?: string;
  verifiedAt?: Date | null;
};

function build(opts: {
  rows?: Row[];
  eligible?: string[];
  status?: string;
  found?: boolean;
}) {
  const rows = (opts.rows ?? []).map((row) => ({
    name: null,
    breed: 'Garut',
    gender: 'MALE',
    birthDate: null,
    photoUrl: null,
    verifiedAt: new Date('2026-10-01'),
    ownerUser: { id: 'f1', name: 'Budi', village: 'Desa A' },
    weights: [],
    ...row,
  }));
  const prisma = {
    sheep: {
      findMany: jest.fn(() => Promise.resolve(rows)),
      findUnique: jest.fn(() =>
        Promise.resolve(
          opts.found === false
            ? null
            : { id: 's1', sheepCode: 'DMB-1', status: opts.status ?? 'ACTIVE' },
        ),
      ),
      update: jest.fn(() => Promise.resolve({ id: 's1' })),
    },
    sheepPhoto: { findMany: jest.fn(() => Promise.resolve([])) },
    activityLog: { create: jest.fn(() => Promise.resolve({ id: 'l' })) },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
  const eligible = new Set(opts.eligible ?? []);
  const evaluation = {
    evaluateByIds: jest.fn((ids: string[]) =>
      Promise.resolve(
        new Map(
          ids.map((id) => [
            id,
            {
              latestRecords: { bcs: { value: 3 } },
              evaluation: {
                breedingScore: eligible.has(id) ? 88 : 50,
                breedingStatus: eligible.has(id)
                  ? 'LAYAK_BIBIT'
                  : 'PERLU_PEMANTAUAN',
                reasons: ['BCS ideal'],
              },
            },
          ]),
        ),
      ),
    ),
  };
  return {
    service: new CatalogService(prisma as never, evaluation as never),
    prisma,
    evaluation,
  };
}

describe('CatalogService.list (publik)', () => {
  it('hanya ternak aktif dan terverifikasi dicari ke database', async () => {
    const { service, prisma } = build({ rows: [] });
    await service.list({});
    expect(prisma.sheep.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACTIVE',
          verifiedAt: { not: null },
        }) as unknown,
      }),
    );
  });

  it('ternak terverifikasi yang tidak lagi layak bibit keluar dari katalog', async () => {
    const { service } = build({
      rows: [
        { id: 's1', sheepCode: 'A' },
        { id: 's2', sheepCode: 'B' },
      ],
      eligible: ['s1'],
    });
    const { data } = await service.list({});
    expect(data.map((item) => item.id)).toEqual(['s1']);
    expect(data[0].score).toBe(88);
  });

  it('tidak membocorkan kontak, catatan verifikasi, atau alamat rinci', async () => {
    const { service } = build({
      rows: [{ id: 's1', sheepCode: 'A' }],
      eligible: ['s1'],
    });
    const { data } = await service.list({});
    const json = JSON.stringify(data[0]);
    expect(json).not.toMatch(/phone|verifiedNote|addressDetail|loginCode/i);
  });
});

describe('CatalogService.detail', () => {
  it('404 bila ternak tidak (lagi) layak atau tidak terverifikasi', async () => {
    const { service } = build({
      rows: [{ id: 's1', sheepCode: 'A' }],
      eligible: [],
    });
    await expect(service.detail('s1')).rejects.toThrow(NotFoundException);
  });

  it('memuat alasan layak dan BCS', async () => {
    const { service } = build({
      rows: [{ id: 's1', sheepCode: 'A' }],
      eligible: ['s1'],
    });
    const { data } = await service.detail('s1');
    expect(data.reasons).toEqual(['BCS ideal']);
    expect(data.bcs).toBe(3);
  });
});

describe('CatalogService.setVerified', () => {
  const staff = { id: 'staf' };

  it('menolak memverifikasi ternak yang belum layak bibit', async () => {
    const { service, prisma } = build({ eligible: [] });
    await expect(
      service.setVerified('s1', { verified: true }, staff),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.sheep.update).not.toHaveBeenCalled();
  });

  it('menolak ternak non-aktif', async () => {
    const { service } = build({ eligible: ['s1'], status: 'SOLD' });
    await expect(
      service.setVerified('s1', { verified: true }, staff),
    ).rejects.toThrow(BadRequestException);
  });

  it('memverifikasi ternak layak: mencatat siapa, kapan, dan log aktivitas', async () => {
    const { service, prisma } = build({ eligible: ['s1'] });
    await service.setVerified('s1', { verified: true, note: 'BA-12' }, staff);
    const call = (
      prisma.sheep.update.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0][0];
    expect(call.data.verifiedById).toBe('staf');
    expect(call.data.verifiedAt).toBeInstanceOf(Date);
    expect(call.data.verifiedNote).toBe('BA-12');
    expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
  });

  it('mencabut verifikasi tanpa memeriksa kelayakan', async () => {
    const { service, prisma, evaluation } = build({ eligible: [] });
    await service.setVerified('s1', { verified: false }, staff);
    expect(evaluation.evaluateByIds).not.toHaveBeenCalled();
    const call = (
      prisma.sheep.update.mock.calls as unknown as Array<
        [{ data: Record<string, unknown> }]
      >
    )[0][0];
    expect(call.data).toEqual({
      verifiedAt: null,
      verifiedById: null,
      verifiedNote: null,
    });
  });

  it('ternak tidak ada -> 404', async () => {
    const { service } = build({ found: false });
    await expect(
      service.setVerified('x', { verified: true }, staff),
    ).rejects.toThrow(NotFoundException);
  });
});
