import { Module } from '@nestjs/common';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { FarmersController } from './farmers.controller';
import { FarmersService } from './farmers.service';

@Module({
  imports: [EvaluationModule],
  controllers: [FarmersController],
  providers: [FarmersService],
})
export class FarmersModule {}
