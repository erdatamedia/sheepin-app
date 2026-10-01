import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { HealthStatus } from '@prisma/client';

export class QuickRecordingDto {
  @IsString()
  sheepId: string;

  @IsDateString()
  recordDate: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  /**
   * Umur ternak dalam bulan (opsional). Hanya dipakai bila ternak belum punya tanggal lahir:
   * tanggal lahir diperkirakan dari umur ini.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  ageMonths?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  bcsScore?: number;

  @IsOptional()
  @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  diseaseName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  treatment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  medicine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
