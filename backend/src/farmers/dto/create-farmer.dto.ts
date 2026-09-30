import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsIndonesianPhone } from '../../common/validators/indonesian-phone.decorator';

/** Pendaftaran peternak oleh petugas/admin; PIN sementara dibuat otomatis. */
export class CreateFarmerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsIndonesianPhone()
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupName?: string;
}
