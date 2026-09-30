import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFarmerDto } from '../../farmers/dto/create-farmer.dto';
import { UpdateMyProfileDto } from '../../users/dto/update-my-profile.dto';
import { ChangePinDto } from './change-pin.dto';
import { LoginPhoneDto } from './login-phone.dto';
import { RegisterFarmerDto } from './register-farmer.dto';

async function check<T extends object>(cls: new () => T, plain: object) {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance);
  return { instance, errors };
}

describe('DTO nomor HP dan PIN', () => {
  it('LoginPhoneDto menormalisasi nomor sebelum divalidasi', async () => {
    const { instance, errors } = await check(LoginPhoneDto, {
      phone: '0812-3456-7890',
      pin: '482915',
    });

    expect(errors).toHaveLength(0);
    expect(instance.phone).toBe('6281234567890');
  });

  it.each([
    [{ phone: 'abc', pin: '482915' }],
    [{ phone: '0211234567', pin: '482915' }],
    [{ phone: '081234567890', pin: '12345' }],
    [{ phone: '081234567890', pin: '12345a' }],
    [{ phone: '081234567890', pin: '1234567' }],
    [{ phone: 12345, pin: '482915' }],
  ])('LoginPhoneDto menolak %j', async (plain) => {
    const { errors } = await check(LoginPhoneDto, plain);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('RegisterFarmerDto: wajib nama, nomor, dan PIN; alamat opsional', async () => {
    const ok = await check(RegisterFarmerDto, {
      name: 'Budi',
      phone: '+62 812 3456 7890',
      pin: '482915',
    });
    expect(ok.errors).toHaveLength(0);
    expect(ok.instance.phone).toBe('6281234567890');

    const noPin = await check(RegisterFarmerDto, {
      name: 'Budi',
      phone: '081234567890',
    });
    expect(noPin.errors.length).toBeGreaterThan(0);
  });

  it('ChangePinDto menolak PIN bukan 6 angka', async () => {
    expect(
      (await check(ChangePinDto, { currentPin: '482915', newPin: '907351' }))
        .errors,
    ).toHaveLength(0);
    expect(
      (await check(ChangePinDto, { currentPin: '48291', newPin: '907351' }))
        .errors.length,
    ).toBeGreaterThan(0);
    expect(
      (await check(ChangePinDto, { currentPin: '482915', newPin: 'abcdef' }))
        .errors.length,
    ).toBeGreaterThan(0);
  });

  it('CreateFarmerDto dan UpdateMyProfileDto ikut menormalisasi nomor', async () => {
    const created = await check(CreateFarmerDto, {
      name: 'Siti',
      phone: '081311112222',
    });
    expect(created.errors).toHaveLength(0);
    expect(created.instance.phone).toBe('6281311112222');

    const optional = await check(UpdateMyProfileDto, { name: 'Tanpa nomor' });
    expect(optional.errors).toHaveLength(0);

    const invalid = await check(UpdateMyProfileDto, { phone: '123' });
    expect(invalid.errors.length).toBeGreaterThan(0);
  });
});
