import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { getJwtSecret } from '../../common/config/jwt-secret';
import { PrismaService } from '../../prisma/prisma.service';

type JwtPayload = {
  sub: string;
  role: UserRole;
  iat?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        pinChangedAt: true,
        mustChangePin: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User tidak aktif atau tidak ditemukan');
    }

    // Token yang terbit sebelum PIN diganti/direset tidak berlaku lagi.
    if (
      user.pinChangedAt &&
      (payload.iat ?? 0) < Math.floor(user.pinChangedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException('Sesi berakhir. Silakan masuk kembali.');
    }

    return user;
  }
}
