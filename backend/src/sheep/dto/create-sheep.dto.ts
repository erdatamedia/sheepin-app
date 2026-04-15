import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { SheepGender, SheepStatus } from '@prisma/client';

export class CreateSheepDto {
  @IsString()
  @MaxLength(50)
  sheepCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsString()
  @MaxLength(100)
  breed: string;

  @IsEnum(SheepGender)
  gender: SheepGender;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  physicalMark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sireId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  damId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string;

  @IsOptional()
  @IsEnum(SheepStatus)
  status?: SheepStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  ownerUserId?: string;
}
