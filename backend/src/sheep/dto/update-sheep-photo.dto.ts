import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';

/**
 * Foto ternak: alamat relatif "/uploads/<berkas>" (hasil unggahan). String kosong menghapus foto.
 * Alamat penuh (http://host/uploads/x.jpg) dinormalisasi ke bentuk relatif agar tidak terikat
 * domain atau protokol, dan alamat di luar /uploads ditolak.
 */
export class UpdateSheepPhotoDto {
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    const index = trimmed.indexOf('/uploads/');
    return index >= 0 ? trimmed.slice(index) : trimmed;
  })
  @IsString()
  @MaxLength(255)
  @Matches(/^(\/uploads\/(?!\.{1,2}$)[A-Za-z0-9._-]+)?$/, {
    message: 'Alamat foto tidak valid',
  })
  photoUrl: string;
}
