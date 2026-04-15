import { Controller, Get } from '@nestjs/common';

@Controller('pemantauan')
export class ObservabilityController {
  @Get('status')
  getStatus() {
    const memoryUsage = process.memoryUsage();

    return {
      message: 'Layanan Sheep-In siap dipantau',
      data: {
        status: 'sehat',
        environment: process.env.NODE_ENV || 'development',
        waktuServer: new Date().toISOString(),
        uptimeDetik: Math.round(process.uptime()),
        memori: {
          rss: memoryUsage.rss,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
        },
      },
    };
  }
}
