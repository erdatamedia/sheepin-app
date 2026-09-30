import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsIndonesianPhone } from '../../common/validators/indonesian-phone.decorator';

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIndonesianPhone()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  groupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  photoUrl?: string;
}
