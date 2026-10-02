import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SheepGender, SheepStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateSheepDto {
  /** Spasi di awal/akhir dibuang agar "Jm" dan "Jm " tidak dianggap dua kode berbeda. */
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Kode ternak tidak boleh kosong' })
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
