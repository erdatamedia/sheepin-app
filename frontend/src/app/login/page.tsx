'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { AuthShell } from '@/components/auth/auth-shell';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const [farmerCode, setFarmerCode] = useState('');
  const [staffForm, setStaffForm] = useState({ email: '', password: '' });

  const handleFarmerLogin = async () => {
    try {
      setLoading(true);
      setServerError('');

      const response = await api.post('/auth/login-farmer', {
        loginCode: farmerCode.trim().toUpperCase(),
      });

      saveToken(response.data.access_token);
      router.push('/dashboard');
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Login peternak gagal.'));
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async () => {
    try {
      setLoading(true);
      setServerError('');

      const response = await api.post('/auth/login', staffForm);

      saveToken(response.data.access_token);
      router.push('/dashboard');
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Login petugas/admin gagal.'));
    } finally {
      setLoading(false);
    }
  };

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
      <div
        role="tablist"
        aria-label="Jenis akses"
        className="mb-6 grid grid-cols-2 gap-1 rounded-[var(--radius-control)] border border-line bg-white p-1"
      >
        {modes.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={mode === item.key}
            onClick={() => {
              setMode(item.key);
              setServerError('');
            }}
            className={cn(
              'min-h-11 rounded-[10px] px-3 text-sm font-semibold transition',
              mode === item.key
                ? 'bg-primary text-white'
                : 'text-ink-muted hover:bg-primary-soft/50',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === 'farmer' ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading && farmerCode.trim()) void handleFarmerLogin();
          }}
        >
          <Field label="ID Peternak" hint="ID diberikan saat pendaftaran, contoh FRM001.">
            <Input
              placeholder="Contoh: FRM001"
              autoComplete="username"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="text-lg font-semibold tracking-wide"
              value={farmerCode}
              onChange={(e) => setFarmerCode(e.target.value.toUpperCase())}
            />
          </Field>

          {errorBox}

          <Button
            type="submit"
            size="lg"
            disabled={loading || !farmerCode.trim()}
            className="w-full"
          >
            {loading ? 'Memproses...' : 'Masuk sebagai Peternak'}
          </Button>

          <p className="text-center text-sm text-ink-muted">
            Belum punya ID?{' '}
            <Link
              href="/register-farmer"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
            >
              Daftar sebagai peternak
            </Link>
          </p>
        </form>
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
