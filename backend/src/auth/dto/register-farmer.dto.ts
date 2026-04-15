import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterFarmerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  groupName?: string;
}
