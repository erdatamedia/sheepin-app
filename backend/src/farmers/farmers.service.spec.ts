import { ConflictException, NotFoundException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { FarmersService } from './farmers.service';

function setup() {
  const prisma = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'f1' }),
    },
  };
  const service = new FarmersService(prisma as never, {} as never);
  return { service, prisma };
}

describe('FarmersService.create (oleh petugas)', () => {
  it('membuat PIN sementara acak, menyimpan hash-nya, dan menandai wajib ganti', async () => {
    const { service, prisma } = setup();
    prisma.user.create.mockResolvedValue({ id: 'f1', name: 'Budi' });

    const result = await service.create(
      { name: 'Budi', phone: '6281234567890' },
      'petugas1',
    );

    const call = prisma.user.create.mock.calls[0] as [
      { data: { pinHash: string; mustChangePin: boolean; role: string } },
    ];
    expect(result.data.pin).toMatch(/^\d{6}$/);
    expect(call[0].data.pinHash).not.toContain(result.data.pin);
    expect(await compare(result.data.pin, call[0].data.pinHash)).toBe(true);
    expect(call[0].data.mustChangePin).toBe(true);
    expect(call[0].data.role).toBe('FARMER');
  });

  it('nomor ganda -> 409', async () => {
    const { service, prisma } = setup();
    prisma.user.create.mockRejectedValue(
      Object.assign(new Error('unique'), { code: 'P2002' }),
    );

    await expect(
      service.create({ name: 'Budi', phone: '6281234567890' }, 'petugas1'),
    ).rejects.toThrow(ConflictException);
  });
});

describe('FarmersService.resetPin', () => {
  it('peternak tidak ada -> 404, tidak menulis apa pun', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.resetPin('x', 'petugas1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('PIN baru, wajib ganti, sesi lama dicabut, kunci dan penghitung dibersihkan', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue({ id: 'f1', name: 'Budi' });

    const before = Date.now();
    const result = await service.resetPin('f1', 'petugas1');

    const call = prisma.user.update.mock.calls[0] as [
      {
        data: {
          pinHash: string;
          mustChangePin: boolean;
          pinChangedAt: Date;
          failedPinAttempts: number;
          lockedUntil: null;
        };
      },
    ];
    const data = call[0].data;
    expect(await compare(result.data.pin, data.pinHash)).toBe(true);
    expect(data.mustChangePin).toBe(true);
    expect(data.failedPinAttempts).toBe(0);
    expect(data.lockedUntil).toBeNull();
    expect(data.pinChangedAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('hanya mencari akun berperan FARMER (staf tidak bisa direset lewat sini)', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);

    await service.resetPin('admin1', 'petugas1').catch(() => undefined);

    expect(prisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'admin1', role: 'FARMER' },
      }),
    );
  });
});
