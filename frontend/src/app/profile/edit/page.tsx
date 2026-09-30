'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoadError } from '@/components/ui/load-error';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackLink } from '@/components/ui/back-link';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast, useToast } from '@/components/ui/toast';
import { PhotoUploadField } from '@/components/ui/photo-upload-field';
import { getMe, updateMyProfile, type MeResponse } from '@/lib/me';
import { getApiErrorMessage } from '@/lib/api';

export default function EditProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast, notify } = useToast();
  const [photoUrl, setPhotoUrl] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    groupName: '',
    address: '',
  });

  const load = useCallback(async () => {
    try {
      setFailed(false);
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
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isFarmer = me?.role === 'FARMER';

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

      const response = await updateMyProfile({
        name: form.name.trim(),
        // Nomor HP peternak adalah identitas login: hanya petugas yang boleh mengubahnya.
        phone: isFarmer ? undefined : form.phone.trim() || undefined,
        groupName: form.groupName.trim() || undefined,
        address: form.address.trim() || undefined,
        photoUrl: photoUrl.trim() || undefined,
      });

      setMe(response.data);
      setPhotoUrl(response.data.photoUrl || '');
      notify('success', 'Profil berhasil diperbarui.');
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal memperbarui profil.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <BackLink href="/profile" label="Akun" />
        <PageHeader title="Data profil" description="Nama, kelompok, alamat, dan foto Anda" />

        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Memuat profil">
            <Skeleton className="h-40 rounded-[var(--radius-card)]" />
            <Skeleton className="h-64 rounded-[var(--radius-card)]" />
          </div>
        ) : failed ? (
          <LoadError
            onRetry={() => {
              setLoading(true);
              void load();
            }}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card>
              <h2 className="text-lg font-semibold text-ink">Foto profil</h2>
              <div className="mt-4">
                <PhotoUploadField
                  label="Foto profil"
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  helperText="Tersimpan di server dan tampil di perangkat lain setelah profil disimpan."
                  emptyLabel={initials}
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold text-ink">Data profil</h2>
              <p className="mb-5 mt-1 text-sm text-ink-muted">
                Data yang rapi menjaga dasbor, lokasi, dan kepemilikan ternak tetap konsisten.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama lengkap">
                  <Input
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field
                  label="Nomor HP"
                  hint={
                    isFarmer
                      ? 'Dipakai untuk masuk. Untuk mengubahnya, hubungi petugas.'
                      : undefined
                  }
                >
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    disabled={isFarmer}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Kelompok / kandang">
                  <Input
                    value={form.groupName}
                    onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                  />
                </Field>
                {!isFarmer && (
                  <Field label="Email">
                    <Input value={me?.email || '-'} disabled />
                  </Field>
                )}
                <div className="md:col-span-2">
                  <Field label="Alamat singkat">
                    <Input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button size="lg" onClick={handleSave} disabled={saving || !form.name.trim()}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </Card>
          </div>
        )}
        <Toast toast={toast} />
      </DashboardShell>
    </RoleGuard>
  );
}
