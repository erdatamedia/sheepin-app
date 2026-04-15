import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ObservabilityController } from './observability.controller';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

@Module({
  controllers: [ObservabilityController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class ObservabilityModule {}
