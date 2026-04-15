'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type RegisterResult = {
  name: string;
  loginCode: string;
  phone?: string;
  address?: string;
  groupName?: string;
};

export default function RegisterFarmerPage() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [result, setResult] = useState<RegisterResult | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    groupName: '',
  });

  const handleRegister = async () => {
    try {
      setLoading(true);
      setServerError('');
      setResult(null);

      const response = await api.post('/auth/register-farmer', {
        name: form.name,
        phone: form.phone || undefined,
        address: form.address || undefined,
        groupName: form.groupName || undefined,
      });

      setResult(response.data.data);
      setForm({
        name: '',
        phone: '',
        address: '',
        groupName: '',
      });
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Registrasi peternak gagal.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8">
      <Card className="w-full max-w-lg animate-[fadeInUp_.4s_ease-out]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Daftar Peternak
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Isi data singkat untuk mendapatkan ID peternak
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nama Peternak
            </label>
            <Input
              placeholder="Masukkan nama peternak"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nomor HP
            </label>
            <Input
              placeholder="Contoh: 08123456789"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Alamat / Lokasi
            </label>
            <Input
              placeholder="Contoh: Sukoanyar"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Kelompok Ternak
            </label>
            <Input
              placeholder="Contoh: Kelompok Makmur"
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
            />
          </div>

          {serverError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {serverError}
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">Registrasi berhasil.</p>
              <h2 className="mt-2 text-xl font-bold text-green-900">
                ID Peternak: {result.loginCode}
              </h2>
              <p className="mt-2 text-sm text-green-700">
                Simpan ID ini untuk login ke aplikasi.
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleRegister}
            disabled={loading || !form.name.trim()}
            className="w-full"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </Button>

          <p className="text-center text-sm text-gray-500">
            Sudah punya ID?{' '}
            <Link
              href="/login"
              className="font-medium text-gray-900 underline underline-offset-4"
            >
              Kembali ke login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
