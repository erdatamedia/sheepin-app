import { Module } from '@nestjs/common';
import { ReproductionController } from './reproduction.controller';
import { ReproductionService } from './reproduction.service';

@Module({
  controllers: [ReproductionController],
  providers: [ReproductionService],
})
export class ReproductionModule {}
