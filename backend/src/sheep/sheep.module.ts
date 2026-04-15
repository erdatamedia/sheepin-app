import { Module } from '@nestjs/common';
import { SheepController } from './sheep.controller';
import { SheepService } from './sheep.service';

@Module({
  controllers: [SheepController],
  providers: [SheepService],
})
export class SheepModule {}
