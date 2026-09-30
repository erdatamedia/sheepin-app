import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { getJwtSecret } from '../common/config/jwt-secret';
import { AuthService } from './auth.service';

const PASSWORD = 'rahasia-panjang-123';

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  password: string | null;
  loginCode: string | null;
  role: UserRole;
  isActive: boolean;
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
    ...overrides,
  };
}

function setup() {
  const usersService = {
    findByEmail: jest.fn(),
    findByLoginCode: jest.fn(),
    findById: jest.fn(),
  };
  const jwtService = { signAsync: jest.fn().mockResolvedValue('token-tes') };
  const prisma = {
    user: { create: jest.fn(), findFirst: jest.fn() },
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

  it('kredensial benar -> token', async () => {
    const { service, usersService } = setup();
    usersService.findByEmail.mockResolvedValue(makeUser());

    const result = await service.login({
      email: 'admin@contoh.id',
      password: PASSWORD,
    });

    expect(result.access_token).toBe('token-tes');
  });
});

describe('AuthService.loginFarmer', () => {
  const farmer = makeUser({
    role: UserRole.FARMER,
    email: null,
    password: null,
    loginCode: 'FRM001',
  });

  it.each([
    ['kode tidak ada', null],
    ['akun nonaktif', { ...farmer, isActive: false }],
    ['bukan peternak', { ...farmer, role: UserRole.ADMIN }],
  ])('%s -> satu pesan yang sama', async (_label, user) => {
    const { service, usersService } = setup();
    usersService.findByLoginCode.mockResolvedValue(user);

    await expect(service.loginFarmer({ loginCode: 'frm001' })).rejects.toThrow(
      'ID peternak tidak valid',
    );
  });

  it('kode dinormalisasi ke huruf besar lalu berhasil', async () => {
    const { service, usersService } = setup();
    usersService.findByLoginCode.mockResolvedValue(farmer);

    const result = await service.loginFarmer({ loginCode: ' frm001 ' });

    expect(usersService.findByLoginCode).toHaveBeenCalledWith('FRM001');
    expect(result.access_token).toBe('token-tes');
  });
});

describe('AuthService.registerFarmer', () => {
  const uniqueViolation = Object.assign(new Error('unique'), { code: 'P2002' });

  it('mengulang dengan kode berikutnya bila kode bentrok', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ loginCode: 'FRM001' });
    prisma.user.create
      .mockRejectedValueOnce(uniqueViolation)
      .mockResolvedValueOnce({ id: 'baru', loginCode: 'FRM002' });

    const result = await service.registerFarmer({ name: 'Budi' });

    expect(prisma.user.create).toHaveBeenCalledTimes(2);
    const codes = prisma.user.create.mock.calls.map(
      (call: [{ data: { loginCode: string } }]) => call[0].data.loginCode,
    );
    expect(codes).toEqual(['FRM001', 'FRM002']);
    expect(result.data.loginCode).toBe('FRM002');
  });

  it('error selain pelanggaran unik langsung dilempar', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue(new Error('db mati'));

    await expect(service.registerFarmer({ name: 'Budi' })).rejects.toThrow(
      'db mati',
    );
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
  });

  it('menyerah setelah 5 kali bentrok', async () => {
    const { service, prisma } = setup();
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue(uniqueViolation);

    await expect(service.registerFarmer({ name: 'Budi' })).rejects.toBe(
      uniqueViolation,
    );
    expect(prisma.user.create).toHaveBeenCalledTimes(5);
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
