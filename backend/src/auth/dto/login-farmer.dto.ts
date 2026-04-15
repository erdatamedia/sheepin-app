import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginFarmerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  loginCode: string;
}
