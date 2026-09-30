import { Matches } from 'class-validator';
import { IsIndonesianPhone } from '../../common/validators/indonesian-phone.decorator';

export class LoginPhoneDto {
  @IsIndonesianPhone()
  phone: string;

  @Matches(/^\d{6}$/, { message: 'PIN harus 6 angka' })
  pin: string;
}
