import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SheepModule } from './sheep/sheep.module';
import { WeightsModule } from './weights/weights.module';
import { BcsModule } from './bcs/bcs.module';
import { HealthModule } from './health/health.module';
import { ReproductionModule } from './reproduction/reproduction.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CatalogModule } from './catalog/catalog.module';
import { ReportsModule } from './reports/reports.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { MapModule } from './map/map.module';
import { FarmersModule } from './farmers/farmers.module';
import { RecordingModule } from './recording/recording.module';
import { MediaModule } from './media/media.module';
import { ObservabilityModule } from './observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Batas umum per IP (longgar: satu halaman memanggil beberapa endpoint sekaligus
    // dan beberapa pengguna bisa berbagi satu IP). Auth punya batas sendiri.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SheepModule,
    WeightsModule,
    BcsModule,
    HealthModule,
    ReproductionModule,
    DashboardModule,
    ReportsModule,
    CatalogModule,
    EvaluationModule,
    MapModule,
    FarmersModule,
    RecordingModule,
    MediaModule,
    ObservabilityModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
