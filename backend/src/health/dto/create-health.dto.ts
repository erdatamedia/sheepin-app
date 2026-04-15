import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { HealthStatus } from '@prisma/client';

export class CreateHealthDto {
  @IsString()
  @IsNotEmpty()
  sheepId: string;

  @IsDateString()
  checkDate: string;

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
  @MaxLength(150)
  medicine?: string;

  @IsEnum(HealthStatus)
  healthStatus: HealthStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
