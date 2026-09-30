import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Di belakang reverse proxy (nginx) IP klien ada di X-Forwarded-For; tanpa ini
  // batas per-IP akan menghitung semua pengguna sebagai satu IP (IP proxy).
  app.set('trust proxy', 1);

  // CORS_ORIGINS: daftar asal dipisah koma. Kosong = terbuka (pengembangan lokal).
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    logger.warn('CORS_ORIGINS kosong: semua asal diizinkan');
  }

  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    // Nama berkas memuat cap waktu dan angka acak, jadi isinya tidak pernah berubah.
    maxAge: '30d',
    immutable: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);

  const port = process.env.PORT || 8000;
  await app.listen(port);

  logger.log(`Sheep-In backend aktif di http://localhost:${port}/api`);
}
void bootstrap();
