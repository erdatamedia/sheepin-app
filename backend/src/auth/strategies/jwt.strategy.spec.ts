import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

function setup(user: unknown) {
  process.env.JWT_SECRET = 'x'.repeat(32);
  const prisma = { user: { findUnique: jest.fn().mockResolvedValue(user) } };
  return new JwtStrategy(prisma as never);
}

const baseUser = {
  id: 'u1',
  name: 'Tes',
  email: null,
  role: UserRole.FARMER,
  isActive: true,
  pinChangedAt: null as Date | null,
  mustChangePin: false,
};

describe('JwtStrategy.validate', () => {
  it('token valid untuk akun aktif', async () => {
    const strategy = setup(baseUser);
    await expect(
      strategy.validate({ sub: 'u1', role: UserRole.FARMER, iat: 1000 }),
    ).resolves.toMatchObject({ id: 'u1' });
  });

  it('akun nonaktif atau tidak ada ditolak', async () => {
    await expect(
      setup({ ...baseUser, isActive: false }).validate({
        sub: 'u1',
        role: UserRole.FARMER,
      }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      setup(null).validate({ sub: 'u1', role: UserRole.FARMER }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('token yang terbit sebelum PIN diganti dicabut', async () => {
    const changedAt = new Date('2026-09-30T10:00:00Z');
    const strategy = setup({ ...baseUser, pinChangedAt: changedAt });
    const changedSec = Math.floor(changedAt.getTime() / 1000);

    await expect(
      strategy.validate({
        sub: 'u1',
        role: UserRole.FARMER,
        iat: changedSec - 60,
      }),
    ).rejects.toThrow('Sesi berakhir');

    await expect(
      strategy.validate({ sub: 'u1', role: UserRole.FARMER, iat: changedSec }),
    ).resolves.toMatchObject({ id: 'u1' });
  });
});
