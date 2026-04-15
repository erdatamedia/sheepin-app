'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getApiErrorMessage } from '@/lib/api';
import { saveToken } from '@/lib/auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type LoginMode = 'farmer' | 'staff';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>('farmer');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const [farmerCode, setFarmerCode] = useState('');
  const [staffForm, setStaffForm] = useState({
    email: 'admin@sheepin.local',
    password: 'admin123',
  });

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="w-full max-w-md animate-[fadeInUp_.4s_ease-out]">
        <div className="mb-6 text-center">
          <div className="mb-5 flex justify-center">
            <Image
              src="/sheepin-logo.png"
              alt="Sheep-In"
              width={320}
              height={96}
              priority
              className="h-20 w-auto max-w-full object-contain sm:h-24"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Masuk ke Sheep-In</h1>
          <p className="mt-2 text-sm text-gray-500">
            Pilih jenis akses yang sesuai
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1">
          <button
            onClick={() => {
              setMode('farmer');
              setServerError('');
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'farmer'
                ? 'bg-[color:var(--accent)] text-white shadow-[0_10px_24px_rgba(33,73,61,0.18)]'
                : 'text-gray-600 hover:bg-white/70'
            }`}
          >
            Peternak
          </button>
          <button
            onClick={() => {
              setMode('staff');
              setServerError('');
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              mode === 'staff'
                ? 'bg-[color:var(--accent)] text-white shadow-[0_10px_24px_rgba(33,73,61,0.18)]'
                : 'text-gray-600 hover:bg-white/70'
            }`}
          >
            Petugas/Admin
          </button>
        </div>

        {mode === 'farmer' ? (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ID Peternak
              </label>
              <Input
                placeholder="Contoh: FRM001"
                value={farmerCode}
                onChange={(e) => setFarmerCode(e.target.value.toUpperCase())}
              />
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button
              type="button"
              onClick={handleFarmerLogin}
              disabled={loading || !farmerCode.trim()}
              className="w-full"
            >
              {loading ? 'Memproses...' : 'Masuk sebagai Peternak'}
            </Button>

            <p className="text-center text-sm text-gray-500">
              Belum punya ID?{' '}
              <Link
                href="/register-farmer"
                className="font-medium text-gray-900 underline underline-offset-4"
              >
                Daftar sebagai peternak
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                type="email"
                value={staffForm.email}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, email: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                type="password"
                value={staffForm.password}
                onChange={(e) =>
                  setStaffForm({ ...staffForm, password: e.target.value })
                }
              />
            </div>

            {serverError && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <Button
              type="button"
              onClick={handleStaffLogin}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Memproses...' : 'Masuk sebagai Petugas/Admin'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
