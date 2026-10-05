import { Module } from '@nestjs/common';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { ReportMailService } from './report-mail.service';
import { ReportWorkbookService } from './report-workbook.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [EvaluationModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportWorkbookService, ReportMailService],
})
export class ReportsModule {}
