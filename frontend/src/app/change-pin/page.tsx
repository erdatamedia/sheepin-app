'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { changePin } from '@/lib/farmer-auth';
import { pinProblem } from '@/lib/pin';
import { RoleGuard } from '@/components/auth/role-guard';
import { AuthShell } from '@/components/auth/auth-shell';
import { Field } from '@/components/ui/field';
import { PinInput } from '@/components/ui/pin-input';
import { Button } from '@/components/ui/button';

function ChangePinForm() {
  const router = useRouter();
  const forced = useSearchParams().get('wajib') === '1';

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const problem = newPin.length === 6 ? pinProblem(newPin, confirmPin || undefined) : null;
  const canSubmit =
    !loading &&
    currentPin.length === 6 &&
    newPin.length === 6 &&
    confirmPin.length === 6 &&
    !pinProblem(newPin, confirmPin);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setServerError('');

      const result = await changePin({ currentPin, newPin });
      // Sesi lama dicabut oleh server; pakai token baru.
      saveToken(result.access_token);
      router.replace(forced ? '/dashboard' : '/profile');
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'PIN gagal diganti.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={forced ? 'Buat PIN Baru' : 'Ganti PIN'}
      description={
        forced
          ? 'PIN dari petugas hanya sementara. Buat PIN Anda sendiri untuk melanjutkan.'
          : 'Masukkan PIN saat ini, lalu buat PIN baru.'
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) void handleSubmit();
        }}
      >
        <Field label={forced ? 'PIN sementara dari petugas' : 'PIN saat ini'}>
          <PinInput value={currentPin} onChange={setCurrentPin} />
        </Field>

        <Field label="PIN baru (6 angka)" hint="Hindari angka berurutan seperti 123456 atau berulang seperti 111111.">
          <PinInput value={newPin} onChange={setNewPin} autoComplete="new-password" />
        </Field>

        <Field label="Ulangi PIN baru">
          <PinInput value={confirmPin} onChange={setConfirmPin} autoComplete="new-password" />
        </Field>

        {problem && (
          <p role="alert" className="text-sm font-medium text-danger">
            {problem}
          </p>
        )}

        {serverError && (
          <div
            role="alert"
            className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {serverError}
          </div>
        )}

        <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
          {loading ? 'Menyimpan...' : 'Simpan PIN'}
        </Button>

        {!forced && (
          <p className="text-center text-sm">
            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
            >
              Kembali ke profil
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
}

export default function ChangePinPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']} allowPendingPin>
      <Suspense fallback={null}>
        <ChangePinForm />
      </Suspense>
    </RoleGuard>
  );
}
