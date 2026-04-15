import { Module } from '@nestjs/common';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { MapController } from './map.controller';
import { MapService } from './map.service';

@Module({
  imports: [EvaluationModule],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
