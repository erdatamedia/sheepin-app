import { Matches } from 'class-validator';

export class ChangePinDto {
  @Matches(/^\d{6}$/, { message: 'PIN saat ini harus 6 angka' })
  currentPin: string;

  @Matches(/^\d{6}$/, { message: 'PIN baru harus 6 angka' })
  newPin: string;
}
