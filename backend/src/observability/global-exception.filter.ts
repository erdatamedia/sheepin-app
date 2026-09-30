import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : 'Terjadi kesalahan pada server';

    const rawMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as { message?: string | string[] }).message ||
          'Terjadi kesalahan pada server';

    // Pesan bawaan throttler berbahasa Inggris; peternak melihatnya langsung di layar.
    const message =
      status === 429
        ? 'Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.'
        : rawMessage;

    const line = `${request.method} ${request.url} -> ${status}`;

    if (status >= 500) {
      // error server: butuh stack trace lengkap
      this.logger.error(
        line,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    } else if (status === 404) {
      // 404 mayoritas dari bot/salah ketik URL - cukup level debug
      this.logger.debug(line);
    } else {
      // 4xx lain (400/401/403/409/422): satu baris, tanpa stack trace
      this.logger.warn(line);
    }

    const code =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as { code?: string }).code
        : undefined;

    response.status(status).json({
      message,
      ...(code ? { code } : {}),
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
