import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsIndonesianPhone } from '../../common/validators/indonesian-phone.decorator';

export class RegisterFarmerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsIndonesianPhone()
  phone: string;

  @Matches(/^\d{6}$/, { message: 'PIN harus 6 angka' })
  pin: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupName?: string;
}
