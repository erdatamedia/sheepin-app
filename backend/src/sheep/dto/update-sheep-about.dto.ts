import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { SheepGender } from '@prisma/client';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Data "tentang ternak" yang boleh diisi peternak untuk ternaknya sendiri. Semuanya opsional;
 * string kosong menghapus isian, yang tidak dikirim tidak berubah.
 */
export class UpdateSheepAboutDto {
  /** Kode ternak; unik per pemilik. Kosong ditolak oleh layanan. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  sheepCode?: string;

  @IsOptional()
  @IsEnum(SheepGender)
  gender?: SheepGender;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  breed?: string;

  /** YYYY-MM-DD, atau kosong untuk menghapus. */
  @IsOptional()
  @Transform(trim)
  @Matches(/^(\d{4}-\d{2}-\d{2})?$/, {
    message: 'Tanggal lahir harus berformat YYYY-MM-DD',
  })
  birthDate?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  location?: string;

  /** Pejantan (ayah): kode atau nama ternak. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  sireId?: string;

  /** Induk (ibu): kode atau nama ternak. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  damId?: string;
}
