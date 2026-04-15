import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SheepModule } from './sheep/sheep.module';
import { WeightsModule } from './weights/weights.module';
import { BcsModule } from './bcs/bcs.module';
import { HealthModule } from './health/health.module';
import { ReproductionModule } from './reproduction/reproduction.module';
import { DashboardModule } from './dashboard/dashboard.module';
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
    EvaluationModule,
    MapModule,
    FarmersModule,
    RecordingModule,
    MediaModule,
    ObservabilityModule,
  ],
})
export class AppModule {}
