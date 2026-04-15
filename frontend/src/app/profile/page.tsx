'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PhotoUploadField } from '@/components/ui/photo-upload-field';
import { getMe, updateMyProfile, type MeResponse } from '@/lib/me';
import { getApiErrorMessage } from '@/lib/api';
import { labelPeran } from '@/lib/labels';

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    groupName: '',
    address: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await getMe();
        setMe(meRes);
        setForm({
          name: meRes.name || '',
          phone: meRes.phone || '',
          groupName: meRes.groupName || '',
          address: meRes.address || '',
        });
        setPhotoUrl(meRes.photoUrl || '');
      } catch (error) {
        console.error('Gagal memuat profil:', error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const initials = useMemo(() => {
    if (!me?.name) return 'SI';
    return me.name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }, [me?.name]);

  const handleSave = async () => {
    if (!me) return;

    try {
      setSaving(true);
      setMessage('');

      const response = await updateMyProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        groupName: form.groupName.trim() || undefined,
        address: form.address.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
      });

      setMe(response.data);
      setPhotoUrl(response.data.photoUrl || '');
      setMessage('Profil berhasil diperbarui.');
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, 'Gagal memperbarui profil.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
            <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
              Pengaturan identitas pengguna untuk kebutuhan lapangan dan operasional.
            </p>
          </div>
          {me?.role && <Badge variant="info">{labelPeran(me.role)}</Badge>}
        </div>

        {loading ? (
          <Card>
            <p className="text-sm text-[color:var(--ink-muted)]">Memuat profil...</p>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="bg-[color:var(--surface-strong)]">
              <h2 className="text-lg font-semibold text-gray-900">Foto Profil</h2>
              <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
                Pilih file foto agar identitas pengguna lebih mudah dikenali saat operasional lapangan.
              </p>

              <div className="mt-5">
                <PhotoUploadField
                  label="Foto profil"
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  helperText="Foto profil disimpan ke server dan akan muncul konsisten di perangkat lain setelah profil disimpan."
                  emptyLabel={initials}
                />
              </div>
            </Card>

            <Card className="bg-[color:var(--surface-strong)]">
              <h2 className="text-lg font-semibold text-gray-900">Pengaturan Profil</h2>
              <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
                Rapikan data dasar supaya dashboard, lokasi, dan kepemilikan ternak tetap konsisten.
              </p>

              {message && (
                <div className="mt-4 rounded-2xl border border-[color:rgba(86,74,50,0.12)] bg-white/80 px-4 py-3 text-sm text-gray-800">
                  {message}
                </div>
              )}

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Nama lengkap"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <Input
                  placeholder="Nomor telepon"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  placeholder="Kelompok / kandang"
                  value={form.groupName}
                  onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                />
                <Input value={me?.loginCode || me?.email || '-'} disabled />
                <div className="md:col-span-2">
                  <Input
                    placeholder="Alamat singkat"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.location.assign('/location')}>
                  Atur Lokasi
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
