import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBcsDto {
  @IsString()
  @IsNotEmpty()
  sheepId: string;

  @IsDateString()
  recordDate: string;

  @IsInt()
  @Min(1)
  @Max(5)
  bcsScore: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
