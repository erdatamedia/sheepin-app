import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateWeightDto {
  @IsString()
  @IsNotEmpty()
  sheepId: string;

  @IsDateString()
  recordDate: string;

  @IsNumber()
  @Min(0)
  weightKg: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
