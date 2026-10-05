import { Module } from '@nestjs/common';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [EvaluationModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
