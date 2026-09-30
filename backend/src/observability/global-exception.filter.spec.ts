import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './global-exception.filter';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'POST', url: '/api/auth/login-phone' }),
    }),
  } as unknown as ArgumentsHost;

  new GlobalExceptionFilter().catch(exception, host);

  const statusCalls = status.mock.calls as number[][];
  const jsonCalls = json.mock.calls as Array<[Record<string, unknown>]>;

  return { status: statusCalls[0][0], body: jsonCalls[0][0] };
}

describe('GlobalExceptionFilter', () => {
  it('429 dari throttler dijawab dalam bahasa Indonesia', () => {
    const { status, body } = run(new ThrottlerException());

    expect(status).toBe(429);
    expect(body.message).toBe(
      'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.',
    );
    expect(String(body.message)).not.toMatch(/ThrottlerException|Too Many/);
  });

  it('meneruskan field code (mis. PIN_CHANGE_REQUIRED)', () => {
    const { status, body } = run(
      new HttpException(
        { message: 'Ganti PIN', code: 'PIN_CHANGE_REQUIRED' },
        HttpStatus.FORBIDDEN,
      ),
    );

    expect(status).toBe(403);
    expect(body.code).toBe('PIN_CHANGE_REQUIRED');
  });

  it('error tak dikenal -> 500 tanpa membocorkan detail', () => {
    const { status, body } = run(new Error('koneksi db: password=rahasia'));

    expect(status).toBe(500);
    expect(body.message).toBe('Terjadi kesalahan pada server');
    expect(JSON.stringify(body)).not.toContain('rahasia');
  });
});
