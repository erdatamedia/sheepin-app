import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsIndonesianPhone } from '../../common/validators/indonesian-phone.decorator';

export class UpdateFarmerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIndonesianPhone()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  regency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  village?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressDetail?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
