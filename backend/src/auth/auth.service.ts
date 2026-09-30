import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { randomBytes } from 'crypto';
import { compare, hash, hashSync } from 'bcrypt';
import { PIN_LOCK_MINUTES, PIN_MAX_ATTEMPTS, isWeakPin } from '../common/pin';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePinDto } from './dto/change-pin.dto';
import { LoginFarmerDto } from './dto/login-farmer.dto';
import { LoginPhoneDto } from './dto/login-phone.dto';
import { RegisterFarmerDto } from './dto/register-farmer.dto';

// Hash pengganti agar waktu respons sama baik email terdaftar maupun tidak.
const DUMMY_HASH = hashSync(randomBytes(16).toString('hex'), 10);

// PIN hanya 6 digit (ruang kecil), jadi biaya hash dibuat lebih tinggi.
const PIN_HASH_COST = 12;

const PHONE_LOGIN_FAILED =
  'Nomor HP atau PIN salah. Jika sudah salah 5 kali, tunggu 15 menit.';

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

  /**
   * Login lama (kode peternak). Hanya untuk akun yang BELUM punya PIN; setelah petugas
   * memberi PIN, akun wajib masuk dengan no. HP + PIN. Akan dihapus di tahap akhir.
   */
  async loginFarmer(dto: LoginFarmerDto) {
    const loginCode = dto.loginCode.trim().toUpperCase();
    const user = await this.usersService.findByLoginCode(loginCode);

    // Satu pesan untuk semua kegagalan agar ID yang valid tidak bisa ditebak.
    if (
      !user ||
      !user.isActive ||
      user.role !== UserRole.FARMER ||
      user.pinHash
    ) {
      throw new UnauthorizedException('ID peternak tidak valid');
    }

    return this.buildAuthResponse(user);
  }

  async loginPhone(dto: LoginPhoneDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      select: {
        id: true,
        name: true,
        email: true,
        loginCode: true,
        role: true,
        isActive: true,
        pinHash: true,
        failedPinAttempts: true,
        lockedUntil: true,
        mustChangePin: true,
      },
    });

    // Selalu jalankan compare agar waktu respons tidak membocorkan nomor terdaftar.
    const pinValid = await compare(dto.pin, user?.pinHash ?? DUMMY_HASH);

    const eligible =
      !!user &&
      user.isActive &&
      user.role === UserRole.FARMER &&
      !!user.pinHash;

    // Satu pesan untuk semua kegagalan (tidak terdaftar, PIN salah, terkunci, belum punya PIN).
    if (!eligible || !user) {
      throw new UnauthorizedException(PHONE_LOGIN_FAILED);
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(PHONE_LOGIN_FAILED);
    }

    if (!pinValid) {
      await this.recordPinFailure(user.id);
      throw new UnauthorizedException(PHONE_LOGIN_FAILED);
    }

    if (user.failedPinAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedPinAttempts: 0, lockedUntil: null },
        select: { id: true },
      });
    }

    return this.buildAuthResponse(user);
  }

  async registerFarmer(dto: RegisterFarmerDto) {
    if (isWeakPin(dto.pin)) {
      throw new BadRequestException(
        'PIN terlalu mudah ditebak. Hindari angka berurutan atau berulang.',
      );
    }

    const pinHash = await hash(dto.pin, PIN_HASH_COST);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          phone: dto.phone,
          address: dto.address,
          groupName: dto.groupName,
          pinHash,
          pinChangedAt: new Date(),
          role: UserRole.FARMER,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          loginCode: true,
          role: true,
          mustChangePin: true,
        },
      });

      return {
        ...(await this.buildAuthResponse(user)),
        message: 'Registrasi peternak berhasil',
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        // Pesan sengaja tidak menyebut bahwa nomor sudah terdaftar.
        throw new ConflictException(
          'Nomor HP ini tidak dapat didaftarkan. Jika sudah punya akun, silakan masuk atau hubungi petugas.',
        );
      }
      throw error;
    }
  }

  async changePin(userId: string, dto: ChangePinDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        loginCode: true,
        role: true,
        isActive: true,
        pinHash: true,
        lockedUntil: true,
      },
    });

    if (!user || !user.isActive || !user.pinHash) {
      throw new BadRequestException(
        'PIN belum diatur untuk akun ini. Hubungi petugas.',
      );
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException(
        'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.',
      );
    }

    if (!(await compare(dto.currentPin, user.pinHash))) {
      await this.recordPinFailure(user.id);
      throw new UnauthorizedException('PIN saat ini salah');
    }

    if (dto.newPin === dto.currentPin) {
      throw new BadRequestException(
        'PIN baru harus berbeda dari PIN saat ini.',
      );
    }

    if (isWeakPin(dto.newPin)) {
      throw new BadRequestException(
        'PIN terlalu mudah ditebak. Hindari angka berurutan atau berulang.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        pinHash: await hash(dto.newPin, PIN_HASH_COST),
        // Token lama (perangkat lain) tidak berlaku lagi; token baru dikembalikan di bawah.
        pinChangedAt: new Date(),
        mustChangePin: false,
        failedPinAttempts: 0,
        lockedUntil: null,
      },
      select: { id: true },
    });

    return {
      ...(await this.buildAuthResponse({ ...user, mustChangePin: false })),
      message: 'PIN berhasil diganti',
    };
  }

  async me(userId: string, mustChangePin = false) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return { ...user, mustChangePin };
  }

  private async buildAuthResponse(user: {
    id: string;
    name: string;
    email: string | null;
    loginCode: string | null;
    role: UserRole;
    mustChangePin?: boolean;
  }) {
    // Payload sengaja minimal: tidak memuat email, kode, atau nomor HP.
    const payload = { sub: user.id, role: user.role };

    return {
      message: 'Login berhasil',
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        loginCode: user.loginCode,
        role: user.role,
        mustChangePin: user.mustChangePin ?? false,
      },
    };
  }

  /** Hitung PIN salah; kunci akun sementara setelah batas tercapai. */
  private async recordPinFailure(userId: string) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { failedPinAttempts: { increment: 1 } },
      select: { failedPinAttempts: true },
    });

    if (updated.failedPinAttempts >= PIN_MAX_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedPinAttempts: 0,
          lockedUntil: new Date(Date.now() + PIN_LOCK_MINUTES * 60_000),
        },
        select: { id: true },
      });
    }
  }
}
