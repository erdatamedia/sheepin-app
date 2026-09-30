'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { registerWithPhone } from '@/lib/farmer-auth';
import { pinProblem } from '@/lib/pin';
import { AuthShell } from '@/components/auth/auth-shell';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PinInput } from '@/components/ui/pin-input';
import { Button } from '@/components/ui/button';

const emptyForm = { name: '', phone: '', address: '', groupName: '' };

export default function RegisterFarmerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const problem = pin ? pinProblem(pin, pinConfirm || undefined) : null;
  const canSubmit =
    !loading &&
    form.name.trim() &&
    form.phone.trim() &&
    pin.length === 6 &&
    pinConfirm.length === 6 &&
    !pinProblem(pin, pinConfirm);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setServerError('');

      const result = await registerWithPhone({
        name: form.name.trim(),
        phone: form.phone.trim(),
        pin,
        address: form.address.trim() || undefined,
        groupName: form.groupName.trim() || undefined,
      });

      saveToken(result.access_token);
      router.push('/dashboard');
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Registrasi peternak gagal.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Daftar Peternak"
      description="Cukup nama, nomor HP, dan PIN 6 angka"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) void handleRegister();
        }}
      >
        <Field label="Nama peternak">
          <Input
            placeholder="Masukkan nama Anda"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>

        <Field label="Nomor HP" hint="Nomor ini dipakai untuk masuk. Contoh: 081234567890">
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="081234567890"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>

        <Field label="Buat PIN (6 angka)" hint="Ingat PIN ini. Jangan beri tahu siapa pun.">
          <PinInput value={pin} onChange={setPin} autoComplete="new-password" />
        </Field>

        <Field label="Ulangi PIN">
          <PinInput value={pinConfirm} onChange={setPinConfirm} autoComplete="new-password" />
        </Field>

        {problem && (pin.length === 6 || pinConfirm.length === 6) && (
          <p role="alert" className="text-sm font-medium text-danger">
            {problem}
          </p>
        )}

        <details className="rounded-[var(--radius-control)] border border-line p-3">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-ink">
            Data tambahan (boleh dikosongkan)
          </summary>
          <div className="mt-3 space-y-4">
            <Field label="Alamat / lokasi">
              <Input
                placeholder="Contoh: Sukoanyar"
                autoComplete="street-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="Kelompok ternak">
              <Input
                placeholder="Contoh: Kelompok Makmur"
                value={form.groupName}
                onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              />
            </Field>
          </div>
        </details>

        {serverError && (
          <div
            role="alert"
            className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
          {loading ? 'Memproses...' : 'Daftar Sekarang'}
        </Button>

        <p className="text-center text-sm text-ink-muted">
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
          >
            Masuk
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
