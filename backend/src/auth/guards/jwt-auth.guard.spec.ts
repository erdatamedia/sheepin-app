import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_PENDING_PIN_KEY } from '../decorators/allow-pending-pin.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

class Sample {}

const diizinkan = () => undefined;
const ditolak = () => undefined;
Reflect.defineMetadata(ALLOW_PENDING_PIN_KEY, true, diizinkan);

function contextFor(handler: () => void, user: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => handler,
    getClass: () => Sample,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard (PIN sementara)', () => {
  beforeEach(() => {
    jest
      .spyOn(
        AuthGuard('jwt').prototype as { canActivate: () => unknown },
        'canActivate',
      )
      .mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  const guard = () => new JwtAuthGuard(new Reflector());

  it('akun biasa boleh mengakses endpoint apa pun', async () => {
    const ok = await guard().canActivate(
      contextFor(ditolak, { mustChangePin: false }),
    );
    expect(ok).toBe(true);
  });

  it('akun dengan PIN sementara diblokir dengan kode PIN_CHANGE_REQUIRED', async () => {
    const error = await guard()
      .canActivate(contextFor(ditolak, { mustChangePin: true }))
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ForbiddenException);
    expect((error as ForbiddenException).getResponse()).toMatchObject({
      code: 'PIN_CHANGE_REQUIRED',
    });
  });

  it('akun dengan PIN sementara boleh memakai endpoint yang diizinkan', async () => {
    const ok = await guard().canActivate(
      contextFor(diizinkan, { mustChangePin: true }),
    );
    expect(ok).toBe(true);
  });
});
