import { Module } from '@nestjs/common';
import { RecordingController } from './recording.controller';
import { RecordingHistoryService } from './recording-history.service';
import { RecordingService } from './recording.service';

@Module({
  controllers: [RecordingController],
  providers: [RecordingService, RecordingHistoryService],
})
export class RecordingModule {}
