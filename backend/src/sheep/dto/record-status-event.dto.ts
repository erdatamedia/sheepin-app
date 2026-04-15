import { SheepStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RecordStatusEventDto {
  @IsEnum(SheepStatus)
  status: SheepStatus;

  @IsDateString()
  eventDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}
