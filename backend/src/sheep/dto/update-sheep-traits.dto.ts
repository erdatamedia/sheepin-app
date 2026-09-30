import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Ciri pembeda (semua opsional). String kosong menghapus isian. */
export class UpdateSheepTraitsDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  faceNose?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  earsHorns?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  tailBody?: string;

  /** Tanda khusus (kolom physicalMark yang sudah ada). */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  physicalMark?: string;
}
