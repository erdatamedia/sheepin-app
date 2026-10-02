import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SheepPhotoAngle, UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSheepDto } from './dto/create-sheep.dto';
import { SetSheepPhotoDto } from './dto/set-sheep-photo.dto';
import { UpdateSheepPhotoDto } from './dto/update-sheep-photo.dto';
import { UpdateSheepAboutDto } from './dto/update-sheep-about.dto';
import { UpdateSheepTraitsDto } from './dto/update-sheep-traits.dto';
import { SheepService } from './sheep.service';

type SheepState = {
  id: string;
  ownerUserId: string | null;
  photoUrl: string | null;
  faceNose: string | null;
  earsHorns: string | null;
  tailBody: string | null;
  physicalMark: string | null;
};

const { FACE, SIDE, REAR, EARS_HORNS, TAIL } = SheepPhotoAngle;
const farmer = { id: 'f1', role: UserRole.FARMER };
const officer = { id: 'staf', role: UserRole.OFFICER };

/** Tiruan database kecil yang menyimpan status, agar alur beberapa langkah bisa diuji. */
function setup(initial: Partial<SheepState> | null = {}) {
  const state = {
    sheep: initial
      ? ({
          id: 's1',
          ownerUserId: 'f1',
          photoUrl: null,
          faceNose: null,
          earsHorns: null,
          tailBody: null,
          physicalMark: null,
          ...initial,
        } as SheepState)
      : null,
    photos: [] as Array<{ id: string; angle: SheepPhotoAngle; url: string }>,
  };
  let seq = 0;

  const prisma = {
    sheep: {
      findUnique: jest.fn(() =>
        Promise.resolve(state.sheep && { ...state.sheep }),
      ),
      update: jest.fn((args: { data: Partial<SheepState> }) => {
        const defined = Object.fromEntries(
          Object.entries(args.data).filter(([, value]) => value !== undefined),
        );
        Object.assign(state.sheep as SheepState, defined);
        return Promise.resolve({ ...(state.sheep as SheepState) });
      }),
    },
    sheepPhoto: {
      findMany: jest.fn(() =>
        Promise.resolve(state.photos.map(({ angle, url }) => ({ angle, url }))),
      ),
      findUnique: jest.fn(
        (args: { where: { sheepId_angle: { angle: SheepPhotoAngle } } }) =>
          Promise.resolve(
            state.photos.find(
              (p) => p.angle === args.where.sheepId_angle.angle,
            ) ?? null,
          ),
      ),
      upsert: jest.fn(
        (args: {
          where: { sheepId_angle: { angle: SheepPhotoAngle } };
          create: { angle: SheepPhotoAngle; url: string };
          update: { url: string };
        }) => {
          const found = state.photos.find(
            (p) => p.angle === args.where.sheepId_angle.angle,
          );
          if (found) found.url = args.update.url;
          else
            state.photos.push({
              id: `p${++seq}`,
              angle: args.create.angle,
              url: args.create.url,
            });
          return Promise.resolve({ id: 'x' });
        },
      ),
      delete: jest.fn((args: { where: { id: string } }) => {
        state.photos = state.photos.filter((p) => p.id !== args.where.id);
        return Promise.resolve({ id: args.where.id });
      }),
    },
  };

  return { service: new SheepService(prisma as never), prisma, state };
}

const photoDto = (photoUrl: string) => ({ photoUrl });

describe('SheepService: foto per sudut', () => {
  it('foto wajah menjadi pratinjau utama', async () => {
    const { service, state } = setup();
    await service.setPhoto('s1', FACE, photoDto('/uploads/wajah.jpg'), farmer);
    expect(state.sheep?.photoUrl).toBe('/uploads/wajah.jpg');
  });

  it('foto pertama bukan wajah menjadi pratinjau sementara; tidak menimpa bila sudah ada', async () => {
    const { service, state } = setup();
    await service.setPhoto(
      's1',
      SIDE,
      photoDto('/uploads/samping.jpg'),
      farmer,
    );
    expect(state.sheep?.photoUrl).toBe('/uploads/samping.jpg');

    await service.setPhoto(
      's1',
      REAR,
      photoDto('/uploads/belakang.jpg'),
      farmer,
    );
    expect(state.sheep?.photoUrl).toBe('/uploads/samping.jpg');

    await service.setPhoto('s1', FACE, photoDto('/uploads/wajah.jpg'), farmer);
    expect(state.sheep?.photoUrl).toBe('/uploads/wajah.jpg');
  });

  it('mengganti foto sudut yang sama menimpa, bukan menambah', async () => {
    const { service, state } = setup();
    await service.setPhoto('s1', SIDE, photoDto('/uploads/a.jpg'), farmer);
    await service.setPhoto('s1', SIDE, photoDto('/uploads/b.jpg'), farmer);
    expect(state.photos).toHaveLength(1);
    expect(state.photos[0].url).toBe('/uploads/b.jpg');
  });

  it('daftar foto berurutan: wajah, samping, belakang, telinga/tanduk, ekor', async () => {
    const { service } = setup();
    for (const [angle, url] of [
      [TAIL, '/uploads/ekor.jpg'],
      [SIDE, '/uploads/samping.jpg'],
      [FACE, '/uploads/wajah.jpg'],
      [EARS_HORNS, '/uploads/telinga.jpg'],
      [REAR, '/uploads/belakang.jpg'],
    ] as const) {
      await service.setPhoto('s1', angle, photoDto(url), farmer);
    }

    const { data } = await service.listPhotos('s1', farmer);
    expect(data.photos.map((p) => p.angle)).toEqual([
      FACE,
      SIDE,
      REAR,
      EARS_HORNS,
      TAIL,
    ]);
  });

  it('foto tunggal lama (tanpa baris sudut) dianggap foto wajah dan tampil pertama', async () => {
    const { service } = setup({ photoUrl: '/uploads/lama.jpg' });
    await service.setPhoto(
      's1',
      SIDE,
      photoDto('/uploads/samping.jpg'),
      farmer,
    );

    const { data } = await service.listPhotos('s1', farmer);
    expect(data.photos).toEqual([
      { angle: FACE, url: '/uploads/lama.jpg' },
      { angle: SIDE, url: '/uploads/samping.jpg' },
    ]);
  });

  it('menghapus foto wajah: pratinjau pindah ke sudut berikutnya, lalu null bila habis', async () => {
    const { service, state } = setup();
    await service.setPhoto('s1', FACE, photoDto('/uploads/wajah.jpg'), farmer);
    await service.setPhoto(
      's1',
      SIDE,
      photoDto('/uploads/samping.jpg'),
      farmer,
    );

    await service.removePhoto('s1', FACE, farmer);
    expect(state.sheep?.photoUrl).toBe('/uploads/samping.jpg');

    await service.removePhoto('s1', SIDE, farmer);
    expect(state.sheep?.photoUrl).toBeNull();
  });

  it('menghapus sudut non-utama tidak mengubah pratinjau, termasuk foto lama tanpa baris', async () => {
    const { service, state } = setup({ photoUrl: '/uploads/lama.jpg' });
    await service.setPhoto(
      's1',
      SIDE,
      photoDto('/uploads/samping.jpg'),
      farmer,
    );

    await service.removePhoto('s1', SIDE, farmer);
    expect(state.sheep?.photoUrl).toBe('/uploads/lama.jpg');
  });

  it('menghapus sudut yang tidak ada tidak error', async () => {
    const { service } = setup();
    await expect(
      service.removePhoto('s1', TAIL, farmer),
    ).resolves.toBeDefined();
  });

  it('peternak tidak boleh mengubah ternak orang lain (foto, hapus, daftar, ciri)', async () => {
    const { service, prisma } = setup({ ownerUserId: 'f2' });

    await expect(
      service.setPhoto('s1', FACE, photoDto('/uploads/a.jpg'), farmer),
    ).rejects.toThrow(ForbiddenException);
    await expect(service.removePhoto('s1', FACE, farmer)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(service.listPhotos('s1', farmer)).rejects.toThrow(
      ForbiddenException,
    );
    await expect(
      service.updateTraits('s1', { faceNose: 'lurus' }, farmer),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.sheepPhoto.upsert).not.toHaveBeenCalled();
  });

  it.each([UserRole.ADMIN, UserRole.OFFICER])(
    '%s boleh untuk ternak siapa pun',
    async (role) => {
      const { service } = setup({ ownerUserId: 'f2' });
      await expect(
        service.setPhoto('s1', FACE, photoDto('/uploads/a.jpg'), {
          id: 'staf',
          role,
        }),
      ).resolves.toBeDefined();
    },
  );

  it('ternak tidak ada -> 404', async () => {
    const { service } = setup(null);
    await expect(service.listPhotos('x', officer)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updatePhoto (klien lama) = pasang/hapus foto wajah', async () => {
    const { service, state } = setup();

    const set = await service.updatePhoto(
      's1',
      photoDto('/uploads/a.jpg'),
      farmer,
    );
    expect(set.data?.photoUrl).toBe('/uploads/a.jpg');
    expect(state.photos).toEqual([
      expect.objectContaining({ angle: FACE, url: '/uploads/a.jpg' }),
    ]);

    const cleared = await service.updatePhoto('s1', photoDto(''), farmer);
    expect(cleared.data?.photoUrl).toBeNull();
    expect(state.photos).toHaveLength(0);
  });
});

describe('SheepService.updateTraits', () => {
  it('menyimpan ciri; string kosong menghapus; yang tidak dikirim tidak berubah', async () => {
    const { service, state } = setup({
      tailBody: 'ekor gemuk',
      physicalMark: 'bercak di kaki',
    });

    const result = await service.updateTraits(
      's1',
      { faceNose: 'hidung cembung', earsHorns: '', physicalMark: '' },
      farmer,
    );

    expect(state.sheep?.faceNose).toBe('hidung cembung');
    expect(state.sheep?.earsHorns).toBeNull();
    expect(state.sheep?.physicalMark).toBeNull();
    expect(state.sheep?.tailBody).toBe('ekor gemuk'); // tidak dikirim -> tetap
    expect(result.data.faceNose).toBe('hidung cembung');
  });
});

describe('CreateSheepDto kode ternak', () => {
  it('membuang spasi di ujung dan menolak kode kosong', async () => {
    const ok = plainToInstance(CreateSheepDto, {
      sheepCode: '  Jm  ',
      breed: 'Garut',
      gender: 'MALE',
    });
    expect(await validate(ok)).toHaveLength(0);
    expect(ok.sheepCode).toBe('Jm');

    const blank = plainToInstance(CreateSheepDto, {
      sheepCode: '   ',
      breed: 'Garut',
      gender: 'MALE',
    });
    expect(await validate(blank)).not.toHaveLength(0);
  });
});

describe('SheepService kode ternak ganda', () => {
  const dto = { sheepCode: 'DMB-1', breed: 'Garut', gender: 'MALE' } as never;

  it('create: kode sudah dipakai -> 409, bukan 500', async () => {
    const prisma = {
      sheep: {
        create: jest.fn(() =>
          Promise.reject(Object.assign(new Error('unique'), { code: 'P2002' })),
        ),
      },
    };
    const service = new SheepService(prisma as never);
    await expect(service.create(dto, officer)).rejects.toThrow(
      ConflictException,
    );
  });

  it('create: galat lain tetap diteruskan', async () => {
    const boom = new Error('db mati');
    const prisma = { sheep: { create: jest.fn(() => Promise.reject(boom)) } };
    const service = new SheepService(prisma as never);
    await expect(service.create(dto, officer)).rejects.toBe(boom);
  });

  it('update: kode sudah dipakai -> 409', async () => {
    const prisma = {
      sheep: {
        findUnique: jest.fn(() => Promise.resolve({ id: 's1' })),
        update: jest.fn(() =>
          Promise.reject(Object.assign(new Error('unique'), { code: 'P2002' })),
        ),
      },
    };
    const service = new SheepService(prisma as never);
    await expect(
      service.update('s1', { sheepCode: 'DMB-1' }, 'staf'),
    ).rejects.toThrow(ConflictException);
  });
});

describe('SheepService.updateAbout', () => {
  const build = (ownerUserId = 'f1') => {
    const row: Record<string, unknown> = {
      id: 's1',
      sheepCode: 'DMB-1',
      ownerUserId,
      photoUrl: null,
      name: 'Lama',
      breed: 'Garut',
      birthDate: new Date('2026-01-01'),
      color: 'putih',
      location: 'kandang A',
      sireId: null,
      damId: null,
    };
    const prisma = {
      sheep: {
        findUnique: jest.fn(() => Promise.resolve({ ...row })),
        update: jest.fn((args: { data: Record<string, unknown> }) => {
          for (const [k, v] of Object.entries(args.data)) {
            if (v !== undefined) row[k] = v;
          }
          return Promise.resolve({ ...row });
        }),
      },
      activityLog: { create: jest.fn(() => Promise.resolve({})) },
    };
    return { service: new SheepService(prisma as never), prisma, row };
  };

  it('peternak mengisi keterangan ternaknya; kosong menghapus; tidak dikirim tidak berubah', async () => {
    const { service, row, prisma } = build();
    await service.updateAbout(
      's1',
      {
        birthDate: '2026-03-15',
        sireId: 'DMB-009',
        damId: 'Si Betina',
        color: '',
      },
      farmer,
    );
    expect(row.birthDate).toEqual(new Date('2026-03-15'));
    expect(row.sireId).toBe('DMB-009');
    expect(row.damId).toBe('Si Betina');
    expect(row.color).toBeNull();
    expect(row.location).toBe('kandang A');
    expect(prisma.activityLog.create).toHaveBeenCalledTimes(1);
  });

  it('tanggal lahir kosong menghapus', async () => {
    const { service, row } = build();
    await service.updateAbout('s1', { birthDate: '' }, farmer);
    expect(row.birthDate).toBeNull();
  });

  it('peternak tidak boleh mengubah ternak orang lain', async () => {
    const { service, prisma } = build('f2');
    await expect(
      service.updateAbout('s1', { color: 'hitam' }, farmer),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.sheep.update).not.toHaveBeenCalled();
  });

  it('petugas boleh; jenis tidak boleh dikosongkan', async () => {
    const { service } = build('f2');
    await expect(
      service.updateAbout('s1', { color: 'hitam' }, officer),
    ).resolves.toBeDefined();
    await expect(
      service.updateAbout('s1', { breed: '' }, officer),
    ).rejects.toThrow(BadRequestException);
  });

  it('DTO menolak tanggal lahir tidak valid dan menerima kosong', async () => {
    const bad = plainToInstance(UpdateSheepAboutDto, {
      birthDate: '15/03/2026',
    });
    expect(await validate(bad)).not.toHaveLength(0);
    const empty = plainToInstance(UpdateSheepAboutDto, { birthDate: '' });
    expect(await validate(empty)).toHaveLength(0);
  });
});

describe('DTO foto dan ciri', () => {
  const check = async <T extends object>(cls: new () => T, plain: object) => {
    const instance = plainToInstance(cls, plain);
    return { instance, errors: await validate(instance) };
  };

  it('UpdateSheepPhotoDto menormalkan alamat penuh dan menerima kosong', async () => {
    const full = await check(UpdateSheepPhotoDto, {
      photoUrl: 'http://127.0.0.1:8000/uploads/foto-1.jpeg',
    });
    expect(full.errors).toHaveLength(0);
    expect(full.instance.photoUrl).toBe('/uploads/foto-1.jpeg');
    expect(
      (await check(UpdateSheepPhotoDto, { photoUrl: '' })).errors,
    ).toHaveLength(0);
  });

  it('SetSheepPhotoDto wajib berisi alamat unggahan yang sah', async () => {
    expect(
      (await check(SetSheepPhotoDto, { photoUrl: '/uploads/a-1.jpg' })).errors,
    ).toHaveLength(0);
    for (const bad of [
      '',
      'https://contoh.id/a.jpg',
      '/uploads/..',
      '/uploads/a/b.jpg',
      5,
    ]) {
      expect(
        (await check(SetSheepPhotoDto, { photoUrl: bad })).errors.length,
      ).toBeGreaterThan(0);
    }
  });

  it('UpdateSheepTraitsDto memangkas spasi dan membatasi panjang', async () => {
    const ok = await check(UpdateSheepTraitsDto, {
      faceNose: '  hidung lurus  ',
    });
    expect(ok.errors).toHaveLength(0);
    expect(ok.instance.faceNose).toBe('hidung lurus');

    expect((await check(UpdateSheepTraitsDto, {})).errors).toHaveLength(0);
    expect(
      (await check(UpdateSheepTraitsDto, { faceNose: 'x'.repeat(121) })).errors
        .length,
    ).toBeGreaterThan(0);
    expect(
      (await check(UpdateSheepTraitsDto, { physicalMark: 'x'.repeat(201) }))
        .errors.length,
    ).toBeGreaterThan(0);
  });
});
