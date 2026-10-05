import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifySheepDto {
  @IsBoolean()
  verified: boolean;

  /** Catatan internal verifikasi (mis. nomor berita acara). Tidak tampil di katalog publik. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(200)
  note?: string;
}
