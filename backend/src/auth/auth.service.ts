import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { compare, hashSync } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginFarmerDto } from './dto/login-farmer.dto';
import { RegisterFarmerDto } from './dto/register-farmer.dto';

// Hash pengganti agar waktu respons sama baik email terdaftar maupun tidak.
const DUMMY_HASH = hashSync(randomBytes(16).toString('hex'), 10);

const FARMER_CODE_MAX_ATTEMPTS = 5;

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    // Selalu jalankan compare agar waktu respons tidak membocorkan email terdaftar.
    const isPasswordValid = await compare(
      dto.password,
      user?.password ?? DUMMY_HASH,
    );

    const isStaff =
      user?.role === UserRole.ADMIN || user?.role === UserRole.OFFICER;

    if (
      !user ||
      !user.isActive ||
      !user.password ||
      !isStaff ||
      !isPasswordValid
    ) {
      throw new UnauthorizedException('Email atau password salah');
    }

    return this.buildAuthResponse(user);
  }

  async loginFarmer(dto: LoginFarmerDto) {
    const loginCode = dto.loginCode.trim().toUpperCase();
    const user = await this.usersService.findByLoginCode(loginCode);

    // Satu pesan untuk semua kegagalan agar ID yang valid tidak bisa ditebak.
    if (!user || !user.isActive || user.role !== UserRole.FARMER) {
      throw new UnauthorizedException('ID peternak tidak valid');
    }

    return this.buildAuthResponse(user);
  }

  async registerFarmer(dto: RegisterFarmerDto) {
    // Kode dibuat dari "kode terakhir + 1"; dua pendaftaran bersamaan bisa bentrok,
    // maka ulangi bila kode sudah dipakai (pelanggaran unik).
    for (let attempt = 1; attempt <= FARMER_CODE_MAX_ATTEMPTS; attempt++) {
      const nextCode = await this.generateFarmerCode();

      try {
        const user = await this.prisma.user.create({
          data: {
            name: dto.name,
            phone: dto.phone,
            address: dto.address,
            groupName: dto.groupName,
            loginCode: nextCode,
            role: UserRole.FARMER,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            loginCode: true,
            phone: true,
            address: true,
            groupName: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        });

        return {
          message: 'Registrasi peternak berhasil',
          data: user,
        };
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === FARMER_CODE_MAX_ATTEMPTS) {
          throw error;
        }
      }
    }

    throw new Error('Gagal membuat kode peternak');
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return user;
  }

  private async buildAuthResponse(user: {
    id: string;
    name: string;
    email: string | null;
    loginCode: string | null;
    role: UserRole;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      loginCode: user.loginCode,
      role: user.role,
    };

    return {
      message: 'Login berhasil',
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        loginCode: user.loginCode,
        role: user.role,
      },
    };
  }

  private async generateFarmerCode() {
    const latestFarmer = await this.prisma.user.findFirst({
      where: {
        role: UserRole.FARMER,
        loginCode: {
          startsWith: 'FRM',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        loginCode: true,
      },
    });

    if (!latestFarmer?.loginCode) {
      return 'FRM001';
    }

    const currentNumber =
      Number(latestFarmer.loginCode.replace('FRM', '')) || 0;
    const nextNumber = currentNumber + 1;

    return `FRM${String(nextNumber).padStart(3, '0')}`;
  }
}
