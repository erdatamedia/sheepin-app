import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSheepPhotoDto } from './dto/update-sheep-photo.dto';
import { SheepService } from './sheep.service';

function setup(sheep: { id: string; ownerUserId: string | null } | null) {
  const prisma = {
    sheep: {
      findUnique: jest.fn().mockResolvedValue(sheep),
      update: jest
        .fn()
        .mockImplementation((args: { data: { photoUrl: string | null } }) =>
          Promise.resolve({ id: 's1', photoUrl: args.data.photoUrl }),
        ),
    },
  };
  return { service: new SheepService(prisma as never), prisma };
}

const dto = (photoUrl: string) => ({ photoUrl });

describe('SheepService.updatePhoto', () => {
  it('peternak boleh mengganti foto ternaknya sendiri', async () => {
    const { service, prisma } = setup({ id: 's1', ownerUserId: 'f1' });

    const result = await service.updatePhoto('s1', dto('/uploads/a.jpg'), {
      id: 'f1',
      role: UserRole.FARMER,
    });

    expect(result.data.photoUrl).toBe('/uploads/a.jpg');
    expect(prisma.sheep.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { photoUrl: '/uploads/a.jpg' } }),
    );
  });

  it('peternak tidak boleh mengubah foto ternak orang lain', async () => {
    const { service, prisma } = setup({ id: 's1', ownerUserId: 'f2' });

    await expect(
      service.updatePhoto('s1', dto('/uploads/a.jpg'), {
        id: 'f1',
        role: UserRole.FARMER,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.sheep.update).not.toHaveBeenCalled();
  });

  it('ternak tanpa pemilik juga ditolak untuk peternak', async () => {
    const { service } = setup({ id: 's1', ownerUserId: null });

    await expect(
      service.updatePhoto('s1', dto('/uploads/a.jpg'), {
        id: 'f1',
        role: UserRole.FARMER,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it.each([UserRole.ADMIN, UserRole.OFFICER])(
    '%s boleh mengubah foto ternak siapa pun',
    async (role) => {
      const { service } = setup({ id: 's1', ownerUserId: 'f2' });

      const result = await service.updatePhoto('s1', dto('/uploads/a.jpg'), {
        id: 'staf',
        role,
      });

      expect(result.data.photoUrl).toBe('/uploads/a.jpg');
    },
  );

  it('string kosong menghapus foto (null)', async () => {
    const { service, prisma } = setup({ id: 's1', ownerUserId: 'f1' });

    await service.updatePhoto('s1', dto(''), {
      id: 'f1',
      role: UserRole.FARMER,
    });

    expect(prisma.sheep.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { photoUrl: null } }),
    );
  });

  it('ternak tidak ada -> 404', async () => {
    const { service } = setup(null);

    await expect(
      service.updatePhoto('x', dto('/uploads/a.jpg'), {
        id: 'f1',
        role: UserRole.FARMER,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('UpdateSheepPhotoDto', () => {
  const check = async (photoUrl: unknown) => {
    const instance = plainToInstance(UpdateSheepPhotoDto, { photoUrl });
    return { instance, errors: await validate(instance) };
  };

  it('menormalkan alamat penuh ke alamat relatif', async () => {
    const { instance, errors } = await check(
      'http://127.0.0.1:8000/uploads/foto-1776318188751-365173373.jpeg',
    );
    expect(errors).toHaveLength(0);
    expect(instance.photoUrl).toBe(
      '/uploads/foto-1776318188751-365173373.jpeg',
    );
  });

  it('menerima alamat relatif dan string kosong', async () => {
    expect((await check('/uploads/a-1.jpg')).errors).toHaveLength(0);
    expect((await check('')).errors).toHaveLength(0);
  });

  it.each([
    ['https://contoh.id/foto.jpg'],
    ['/etc/passwd'],
    ['/uploads/../rahasia.jpg'],
    ['/uploads/a/b.jpg'],
    ['/uploads/..'],
    ['/uploads/.'],
    ['javascript:alert(1)'],
    [123],
  ])('menolak %s', async (value) => {
    expect((await check(value)).errors.length).toBeGreaterThan(0);
  });
});
