import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ReportQueryDto {
  /** Awal periode (YYYY-MM-DD). Bawaan: 90 hari terakhir. */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Akhir periode, termasuk hari itu (YYYY-MM-DD). Bawaan: hari ini. */
  @IsOptional()
  @IsDateString()
  to?: string;

  /** Batasi pada satu peternak. */
  @IsOptional()
  @IsString()
  farmerId?: string;
}
