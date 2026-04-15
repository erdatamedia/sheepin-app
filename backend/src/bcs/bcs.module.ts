import { Module } from '@nestjs/common';
import { BcsController } from './bcs.controller';
import { BcsService } from './bcs.service';

@Module({
  controllers: [BcsController],
  providers: [BcsService],
})
export class BcsModule {}
