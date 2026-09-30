import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_PENDING_PIN_KEY } from '../decorators/allow-pending-pin.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowed = (await super.canActivate(context)) as boolean;
    if (!allowed) return false;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { mustChangePin?: boolean } }>();

    if (request.user?.mustChangePin) {
      const allowPending = this.reflector.getAllAndOverride<boolean>(
        ALLOW_PENDING_PIN_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!allowPending) {
        throw new ForbiddenException({
          message: 'Ganti PIN sementara Anda terlebih dahulu.',
          code: 'PIN_CHANGE_REQUIRED',
        });
      }
    }

    return true;
  }
}
