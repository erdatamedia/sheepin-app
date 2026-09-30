import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';

function setup(user: { role: UserRole; phone: string | null }) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'u1', ...user }),
      update: jest.fn().mockResolvedValue({ id: 'u1' }),
    },
  };
  return { service: new UsersService(prisma as never), prisma };
}

describe('UsersService.updateMyProfile (nomor HP = identitas login)', () => {
  it('peternak tidak boleh mengganti nomor HP sendiri', async () => {
    const { service, prisma } = setup({
      role: UserRole.FARMER,
      phone: '6281234567890',
    });

    await expect(
      service.updateMyProfile('u1', { phone: '6289999999999' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('peternak boleh menyimpan profil dengan nomor yang sama (format berbeda pun)', async () => {
    const { service, prisma } = setup({
      role: UserRole.FARMER,
      phone: '6281234567890',
    });

    await service.updateMyProfile('u1', {
      name: 'Baru',
      phone: '0812-3456-7890',
    });

    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('peternak lama dengan nomor belum ternormalisasi tidak terblokir', async () => {
    const { service, prisma } = setup({
      role: UserRole.FARMER,
      phone: '0812-3456-7890',
    });

    await service.updateMyProfile('u1', { phone: '6281234567890' });

    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('staf boleh mengganti nomor; nomor ganda -> 409', async () => {
    const { service, prisma } = setup({ role: UserRole.OFFICER, phone: null });
    prisma.user.update.mockRejectedValue(
      Object.assign(new Error('unique'), { code: 'P2002' }),
    );

    await expect(
      service.updateMyProfile('u1', { phone: '6281234567890' }),
    ).rejects.toThrow(ConflictException);
  });
});
