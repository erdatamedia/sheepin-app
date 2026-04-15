import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ReproductionStatus } from '@prisma/client';

export class CreateReproductionDto {
  @IsString()
  @IsNotEmpty()
  sheepId: string;

  @IsOptional()
  @IsDateString()
  matingDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedBirthDate?: string;

  @IsOptional()
  @IsDateString()
  lambingDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  maleParent?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalLambBorn?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalLambWeaned?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalBirthWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalWeaningWeight?: number;

  @IsEnum(ReproductionStatus)
  status: ReproductionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
