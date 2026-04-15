import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            `${request.method} ${request.url ?? ''} ${response.statusCode} ${Date.now() - startedAt}ms`,
          );
        },
        error: (error: Error) => {
          this.logger.error(
            `${request.method} ${request.url ?? ''} ${response.statusCode} ${Date.now() - startedAt}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
