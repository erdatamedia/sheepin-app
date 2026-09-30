'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { loginWithLegacyCode, loginWithPhone } from '@/lib/farmer-auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PinInput } from '@/components/ui/pin-input';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { PIN_LENGTH } from '@/lib/pin';

type LoginMode = 'farmer' | 'staff';

const modes: { key: LoginMode; label: string }[] = [
  { key: 'farmer', label: 'Peternak' },
  { key: 'staff', label: 'Petugas/Admin' },
];

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>('farmer');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [legacyCode, setLegacyCode] = useState('');
  const [staffForm, setStaffForm] = useState({ email: '', password: '' });

  const finish = (token: string, mustChangePin: boolean) => {
    saveToken(token);
    router.push(mustChangePin ? '/change-pin?wajib=1' : '/dashboard');
  };

  const run = async (action: () => Promise<void>, fallback: string) => {
    try {
      setLoading(true);
      setServerError('');
      await action();
    } catch (error) {
      setServerError(getApiErrorMessage(error, fallback));
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerLogin = () =>
    run(async () => {
      const result = await loginWithPhone({ phone: phone.trim(), pin });
      finish(result.access_token, result.user.mustChangePin);
    }, 'Login peternak gagal.');

  const handleLegacyLogin = () =>
    run(async () => {
      const result = await loginWithLegacyCode(legacyCode.trim().toUpperCase());
      finish(result.access_token, result.user.mustChangePin);
    }, 'Login dengan ID lama gagal.');

  const handleStaffLogin = () =>
    run(async () => {
      const response = await api.post('/auth/login', staffForm);
      finish(response.data.access_token, false);
    }, 'Login petugas/admin gagal.');

  const errorBox = serverError && (
    <div
      role="alert"
      className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
    >
      {serverError}
    </div>
  );

  return (
    <AuthShell title="Masuk ke Sheep-In" description="Pilih jenis akses yang sesuai">
      <Segmented
        label="Jenis akses"
        className="mb-6"
        value={mode}
        onChange={(value) => {
          setMode(value as LoginMode);
          setServerError('');
        }}
        options={modes.map((item) => ({ value: item.key, label: item.label }))}
      />

      {mode === 'farmer' ? (
        <div className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!loading && phone.trim() && pin.length === PIN_LENGTH) void handleFarmerLogin();
            }}
          >
            <Field label="Nomor HP">
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Contoh: 081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>

            <Field
              label="PIN (6 angka)"
              hint="Salah 5 kali, akun terkunci 15 menit. Lupa PIN? Hubungi petugas."
            >
              <PinInput value={pin} onChange={setPin} />
            </Field>

            {errorBox}

            <Button
              type="submit"
              size="lg"
              disabled={loading || !phone.trim() || pin.length !== PIN_LENGTH}
              className="w-full"
            >
              {loading ? 'Memproses...' : 'Masuk sebagai Peternak'}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-muted">
            Belum punya akun?{' '}
            <Link
              href="/register-farmer"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
            >
              Daftar sebagai peternak
            </Link>
          </p>

          <details className="rounded-[var(--radius-control)] border border-line p-3">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-ink">
              Masih memakai ID lama (FRM…)?
            </summary>
            <form
              className="mt-3 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!loading && legacyCode.trim()) void handleLegacyLogin();
              }}
            >
              <p className="text-sm text-ink-muted">
                ID lama hanya berlaku sementara. Minta petugas membuatkan PIN agar bisa masuk dengan
                nomor HP.
              </p>
              <Input
                aria-label="Contoh: FRM001"
                placeholder="Contoh: FRM001"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                value={legacyCode}
                onChange={(e) => setLegacyCode(e.target.value.toUpperCase())}
              />
              <Button
                type="submit"
                variant="tinted"
                className="w-full"
                disabled={loading || !legacyCode.trim()}
              >
                Masuk dengan ID lama
              </Button>
            </form>
          </details>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading) void handleStaffLogin();
          }}
        >
          <Field label="Email">
            <Input
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="nama@email.com"
              value={staffForm.email}
              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
            />
          </Field>

          <Field label="Kata sandi">
            <Input
              type="password"
              autoComplete="current-password"
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
            />
          </Field>

          {errorBox}

          <Button
            type="submit"
            size="lg"
            disabled={loading || !staffForm.email || !staffForm.password}
            className="w-full"
          >
            {loading ? 'Memproses...' : 'Masuk sebagai Petugas/Admin'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
