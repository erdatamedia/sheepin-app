import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';
import { UPLOAD_PATH_PATTERN } from './update-sheep-photo.dto';

/** Foto untuk satu sudut: alamat relatif "/uploads/<berkas>" (alamat penuh dinormalisasi). Wajib diisi. */
export class SetSheepPhotoDto {
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    const index = trimmed.indexOf('/uploads/');
    return index >= 0 ? trimmed.slice(index) : trimmed;
  })
  @IsString()
  @MaxLength(255)
  @Matches(UPLOAD_PATH_PATTERN, { message: 'Alamat foto tidak valid' })
  photoUrl: string;
}
