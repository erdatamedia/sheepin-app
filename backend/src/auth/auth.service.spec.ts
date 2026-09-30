import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { compare, hashSync } from 'bcrypt';
import { getJwtSecret } from '../common/config/jwt-secret';
import { AuthService } from './auth.service';

const PASSWORD = 'rahasia-panjang-123';
const PIN = '482915';
const PHONE = '6281234567890';
const PHONE_FAILED =
  'Nomor HP atau PIN salah. Jika sudah salah 5 kali, tunggu 15 menit.';

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  password: string | null;
  loginCode: string | null;
  role: UserRole;
  isActive: boolean;
  pinHash: string | null;
  failedPinAttempts: number;
  lockedUntil: Date | null;
  mustChangePin: boolean;
};

function makeUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'u1',
    name: 'Tes',
    email: 'admin@contoh.id',
    password: hashSync(PASSWORD, 4),
    loginCode: null,
    role: UserRole.ADMIN,
    isActive: true,
    pinHash: null,
    failedPinAttempts: 0,
    lockedUntil: null,
    mustChangePin: false,
    ...overrides,
  };
}

function makeFarmer(overrides: Partial<UserRow> = {}): UserRow {
  return makeUser({
    role: UserRole.FARMER,
    email: null,
    password: null,
    pinHash: hashSync(PIN, 4),
    ...overrides,
  });
}

function setup() {
  const usersService = {
    findByEmail: jest.fn(),
    findByLoginCode: jest.fn(),
    findById: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('token-tes') };
  const prisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'u1', failedPinAttempts: 1 }),
    },
  };

  const service = new AuthService(
    usersService as never,
    jwtService as never,
    prisma as never,
  );

  return { service, usersService, jwtService, prisma };
}

describe('AuthService.login (petugas/admin)', () => {
  it('email tidak terdaftar -> pesan umum', async () => {
    const { service, usersService } = setup();
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'x@y.id', password: PASSWORD }),
    ).rejects.toThrow(new UnauthorizedException('Email atau password salah'));
  });

  it('kata sandi salah -> pesan yang sama', async () => {
    const { service, usersService } = setup();
    usersService.findByEmail.mockResolvedValue(makeUser());

    await expect(
      service.login({ email: 'admin@contoh.id', password: 'salah-salah' }),
    ).rejects.toThrow('Email atau password salah');
  });

  it('akun peternak yang mencoba login petugas -> pesan yang sama', async () => {
    const { service, usersService } = setup();
    usersService.findByEmail.mockResolvedValue(
      makeUser({ role: UserRole.FARMER }),
    );

    await expect(
      service.login({ email: 'admin@contoh.id', password: PASSWORD }),
    ).rejects.toThrow('Email atau password salah');
  });

  it('akun nonaktif ditolak', async () => {
    const { service, usersService } = setup();
    usersService.findByEmail.mockResolvedValue(makeUser({ isActive: false }));

    await expect(
      service.login({ email: 'admin@contoh.id', password: PASSWORD }),
    ).rejects.toThrow('Email atau password salah');
  });

  it('kredensial benar -> token dengan payload minimal', async () => {
    const { service, usersService, jwtService } = setup();
    usersService.findByEmail.mockResolvedValue(makeUser());

    const result = await service.login({
      email: 'admin@contoh.id',
      password: PASSWORD,
    });

    expect(result.access_token).toBe('token-tes');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'u1',
      role: UserRole.ADMIN,
    });
  });
});

describe('AuthService.loginFarmer (kode lama)', () => {
  const legacy = makeFarmer({ loginCode: 'FRM001', pinHash: null });

  it.each([
    ['kode tidak ada', null],
    ['akun nonaktif', { ...legacy, isActive: false }],
    ['bukan peternak', { ...legacy, role: UserRole.ADMIN }],
    ['sudah punya PIN', { ...legacy, pinHash: hashSync(PIN, 4) }],
  ])('%s -> satu pesan yang sama', async (_label, user) => {
    const { service, usersService } = setup();
    usersService.findByLoginCode.mockResolvedValue(user);

    await expect(service.loginFarmer({ loginCode: 'frm001' })).rejects.toThrow(
      'ID peternak tidak valid',
    );
  });

  it('akun tanpa PIN masih bisa masuk (masa transisi)', async () => {
    const { service, usersService } = setup();
    usersService.findByLoginCode.mockResolvedValue(legacy);

    const result = await service.loginFarmer({ loginCode: ' frm001 ' });

    expect(usersService.findByLoginCode).toHaveBeenCalledWith('FRM001');
    expect(result.access_token).toBe('token-tes');
  });
});

describe('AuthService.loginPhone', () => {
  it('nomor + PIN benar -> token, dan penghitung gagal direset', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(
      makeFarmer({ failedPinAttempts: 3 }),
    );

    const result = await service.loginPhone({ phone: PHONE, pin: PIN });

    expect(result.access_token).toBe('token-tes');
    expect(result.user.mustChangePin).toBe(false);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { failedPinAttempts: 0, lockedUntil: null },
      }),
    );
  });

  it('PIN sementara -> mustChangePin true di respons', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(
      makeFarmer({ mustChangePin: true }),
    );

    const result = await service.loginPhone({ phone: PHONE, pin: PIN });

    expect(result.user.mustChangePin).toBe(true);
  });

  it('semua jenis kegagalan memakai satu pesan yang sama', async () => {
    const cases: Array<[string, UserRow | null]> = [
      ['nomor tidak terdaftar', null],
      ['PIN salah', makeFarmer()],
      ['akun nonaktif', makeFarmer({ isActive: false })],
      ['belum punya PIN', makeFarmer({ pinHash: null })],
      ['akun staf', makeUser({ pinHash: hashSync(PIN, 4) })],
      [
        'sedang terkunci',
        makeFarmer({ lockedUntil: new Date(Date.now() + 60_000) }),
      ],
    ];

    for (const [label, user] of cases) {
      const { service, prisma } = setup();
      prisma.user.findUnique.mockResolvedValue(user);
      const pin = label === 'PIN salah' ? '907351' : PIN;

      await expect(service.loginPhone({ phone: PHONE, pin })).rejects.toThrow(
        new UnauthorizedException(PHONE_FAILED),
      );
    }
  });

  it('PIN salah menaikkan penghitung', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(makeFarmer());
    prisma.user.update.mockResolvedValue({ failedPinAttempts: 2 });

    await expect(
      service.loginPhone({ phone: PHONE, pin: '907351' }),
    ).rejects.toThrow(PHONE_FAILED);

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { failedPinAttempts: { increment: 1 } },
      }),
    );
  });

  it('salah kelima kalinya mengunci akun 15 menit dan mereset penghitung', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(
      makeFarmer({ failedPinAttempts: 4 }),
    );
    prisma.user.update.mockResolvedValueOnce({ failedPinAttempts: 5 });

    const before = Date.now();
    await expect(
      service.loginPhone({ phone: PHONE, pin: '907351' }),
    ).rejects.toThrow(PHONE_FAILED);

    expect(prisma.user.update).toHaveBeenCalledTimes(2);
    const lockCall = prisma.user.update.mock.calls[1] as [
      { data: { failedPinAttempts: number; lockedUntil: Date } },
    ];
    expect(lockCall[0].data.failedPinAttempts).toBe(0);
    const lockedMs = lockCall[0].data.lockedUntil.getTime() - before;
    expect(lockedMs).toBeGreaterThanOrEqual(15 * 60_000 - 1000);
    expect(lockedMs).toBeLessThanOrEqual(15 * 60_000 + 5000);
  });

  it('akun terkunci ditolak walau PIN benar dan tidak menambah penghitung', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(
      makeFarmer({ lockedUntil: new Date(Date.now() + 60_000) }),
    );

    await expect(
      service.loginPhone({ phone: PHONE, pin: PIN }),
    ).rejects.toThrow(PHONE_FAILED);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('kunci yang sudah lewat tidak lagi menghalangi', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(
      makeFarmer({ lockedUntil: new Date(Date.now() - 1000) }),
    );

    const result = await service.loginPhone({ phone: PHONE, pin: PIN });

    expect(result.access_token).toBe('token-tes');
  });
});

describe('AuthService.registerFarmer', () => {
  const dto = { name: 'Budi', phone: PHONE, pin: PIN };

  it('PIN lemah ditolak sebelum menyentuh database', async () => {
    const { service, prisma } = setup();

    await expect(
      service.registerFarmer({ ...dto, pin: '123456' }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('menyimpan hash PIN (bukan PIN asli) dan langsung memberi token', async () => {
    const { service, prisma } = setup();
    prisma.user.create.mockResolvedValue({
      id: 'baru',
      name: 'Budi',
      email: null,
      loginCode: null,
      role: UserRole.FARMER,
      mustChangePin: false,
    });

    const result = await service.registerFarmer(dto);

    const call = prisma.user.create.mock.calls[0] as [
      { data: { pinHash: string; phone: string; role: UserRole } },
    ];
    expect(call[0].data.pinHash).not.toContain(PIN);
    expect(await compare(PIN, call[0].data.pinHash)).toBe(true);
    expect(call[0].data.phone).toBe(PHONE);
    expect(call[0].data.role).toBe(UserRole.FARMER);
    expect(result.access_token).toBe('token-tes');
  });

  it('nomor sudah terdaftar -> pesan yang tidak menyebut "sudah terdaftar"', async () => {
    const { service, prisma } = setup();
    prisma.user.create.mockRejectedValue(
      Object.assign(new Error('unique'), { code: 'P2002' }),
    );

    const error = await service.registerFarmer(dto).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as Error).message).not.toMatch(/sudah terdaftar/i);
  });

  it('error lain dilempar apa adanya', async () => {
    const { service, prisma } = setup();
    prisma.user.create.mockRejectedValue(new Error('db mati'));

    await expect(service.registerFarmer(dto)).rejects.toThrow('db mati');
  });
});

describe('AuthService.changePin', () => {
  const dto = { currentPin: PIN, newPin: '907351' };

  it('PIN saat ini salah -> gagal dan dihitung', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(makeFarmer());

    await expect(
      service.changePin('u1', { ...dto, currentPin: '111222' }),
    ).rejects.toThrow('PIN saat ini salah');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { failedPinAttempts: { increment: 1 } },
      }),
    );
  });

  it('PIN baru lemah atau sama dengan lama ditolak', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(makeFarmer());

    await expect(
      service.changePin('u1', { ...dto, newPin: '123456' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.changePin('u1', { currentPin: PIN, newPin: PIN }),
    ).rejects.toThrow(BadRequestException);
  });

  it('akun tanpa PIN tidak bisa menetapkan PIN sendiri (harus lewat petugas)', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(makeFarmer({ pinHash: null }));

    await expect(service.changePin('u1', dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('berhasil: hash baru, sesi lama dicabut, PIN sementara selesai, token baru', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(
      makeFarmer({ mustChangePin: true }),
    );

    const before = Date.now();
    const result = await service.changePin('u1', dto);

    const call = prisma.user.update.mock.calls[0] as [
      {
        data: {
          pinHash: string;
          pinChangedAt: Date;
          mustChangePin: boolean;
          failedPinAttempts: number;
          lockedUntil: null;
        };
      },
    ];
    const data = call[0].data;
    expect(await compare('907351', data.pinHash)).toBe(true);
    expect(data.mustChangePin).toBe(false);
    expect(data.failedPinAttempts).toBe(0);
    expect(data.lockedUntil).toBeNull();
    expect(data.pinChangedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.access_token).toBe('token-tes');
    expect(result.user.mustChangePin).toBe(false);
  });
});

describe('getJwtSecret', () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it('menolak bila kosong atau pendek', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET');
    process.env.JWT_SECRET = 'pendek';
    expect(() => getJwtSecret()).toThrow('JWT_SECRET');
  });

  it('menerima rahasia yang cukup panjang', () => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    expect(getJwtSecret()).toBe('a'.repeat(32));
  });
});
