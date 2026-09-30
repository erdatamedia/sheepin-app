'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api, getApiErrorMessage } from '@/lib/api';
import { AuthShell } from '@/components/auth/auth-shell';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button, buttonClassName } from '@/components/ui/button';

type RegisterResult = {
  name: string;
  loginCode: string;
  phone?: string;
  address?: string;
  groupName?: string;
};

const emptyForm = { name: '', phone: '', address: '', groupName: '' };

export default function RegisterFarmerPage() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<RegisterResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const handleRegister = async () => {
    try {
      setLoading(true);
      setServerError('');
      setResult(null);
      setCopied(false);

      const response = await api.post('/auth/register-farmer', {
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        groupName: form.groupName || undefined,
      });

      setResult(response.data.data);
      setForm(emptyForm);
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Registrasi peternak gagal.'));
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.loginCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AuthShell
      title="Daftar Peternak"
      description="Isi data singkat untuk mendapatkan ID peternak"
    >
      {result ? (
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-[var(--radius-card)] border border-[color:var(--success-border)] bg-success-soft p-4 text-center"
          >
            <CheckCircle2 size={32} className="mx-auto text-success" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-success">Registrasi berhasil</p>
            <p className="mt-3 text-sm text-ink-muted">ID Peternak Anda</p>
            <p className="text-3xl font-bold tracking-wider text-ink">{result.loginCode}</p>
            <p className="mt-2 text-sm text-ink-muted">
              Simpan atau foto ID ini, dipakai untuk masuk ke aplikasi.
            </p>
          </div>

          <Button variant="outline" size="lg" className="w-full" onClick={copyCode}>
            {copied ? 'ID tersalin' : 'Salin ID'}
          </Button>
          <Link href="/login" className={buttonClassName({ size: 'lg', className: 'w-full' })}>
            Lanjut ke Login
          </Link>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!loading && form.name.trim()) void handleRegister();
          }}
        >
          <Field label="Nama peternak">
            <Input
              placeholder="Masukkan nama peternak"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Nomor HP (opsional)">
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Contoh: 08123456789"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>

          <Field label="Alamat / lokasi (opsional)">
            <Input
              placeholder="Contoh: Sukoanyar"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>

          <Field label="Kelompok ternak (opsional)">
            <Input
              placeholder="Contoh: Kelompok Makmur"
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
            />
          </Field>

          {serverError && (
            <div
              role="alert"
              className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
            >
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading || !form.name.trim()}
            className="w-full"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </Button>

          <p className="text-center text-sm text-ink-muted">
            Sudah punya ID?{' '}
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
            >
              Kembali ke login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
