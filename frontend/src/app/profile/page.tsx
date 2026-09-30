'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button, buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Field } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast, useToast } from '@/components/ui/toast';
import { PhotoUploadField } from '@/components/ui/photo-upload-field';
import { getMe, updateMyProfile, type MeResponse } from '@/lib/me';
import { getApiErrorMessage } from '@/lib/api';
import { labelPeran } from '@/lib/labels';

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, notify } = useToast();
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

      const response = await updateMyProfile({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
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
        <PageHeader
          title="Profil"
          description="Identitas pengguna untuk kebutuhan lapangan dan operasional"
          actions={me?.role && <Badge variant="info">{labelPeran(me.role)}</Badge>}
        />

        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Memuat profil">
            <Skeleton className="h-40 rounded-[var(--radius-card)]" />
            <Skeleton className="h-64 rounded-[var(--radius-card)]" />
          </div>
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
                <Field label="Nomor telepon">
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Kelompok / kandang">
                  <Input
                    value={form.groupName}
                    onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                  />
                </Field>
                <Field label={me?.loginCode ? 'ID peternak' : 'Email'}>
                  <Input value={me?.loginCode || me?.email || '-'} disabled />
                </Field>
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
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={saving || !form.name.trim()}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Profil'}
                </Button>
                <Link
                  href="/location"
                  className={buttonClassName({ variant: 'outline', size: 'lg' })}
                >
                  <MapPin size={18} aria-hidden="true" />
                  Atur Lokasi
                </Link>
              </div>
            </Card>
          </div>
        )}
        <Toast toast={toast} />
      </DashboardShell>
    </RoleGuard>
  );
}
