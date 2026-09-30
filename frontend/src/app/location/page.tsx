'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { LocateFixed, Navigation } from 'lucide-react';
import { LoadError } from '@/components/ui/load-error';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button, buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/field';
import { BackLink } from '@/components/ui/back-link';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast, useToast } from '@/components/ui/toast';
import { getMyLocation, updateMyLocation } from '@/lib/location';
import { labelSumberLokasi } from '@/lib/labels';

const LocationPickerMap = dynamic(() => import('@/components/map/location-picker-map'), {
  ssr: false,
});

export default function LocationPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast, notify } = useToast();
  const [form, setForm] = useState({
    province: '',
    regency: '',
    district: '',
    village: '',
    addressDetail: '',
    latitude: -8.2143,
    longitude: 114.3012,
    locationSource: 'MANUAL' as 'GPS' | 'MAP_PICKER' | 'MANUAL',
  });

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const locationRes = await getMyLocation();

      const loc = locationRes.data;
      setForm({
        province: loc.province || '',
        regency: loc.regency || '',
        district: loc.district || '',
        village: loc.village || '',
        addressDetail: loc.addressDetail || '',
        latitude: loc.latitude ?? -8.2143,
        longitude: loc.longitude ?? 114.3012,
        locationSource: (loc.locationSource as 'GPS' | 'MAP_PICKER' | 'MANUAL') || 'MANUAL',
      });
    } catch (error) {
      console.error('Gagal memuat lokasi:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      notify('error', 'Browser/perangkat tidak mendukung geolocation.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          locationSource: 'GPS',
        }));
        notify('success', 'Lokasi perangkat berhasil diambil. Jangan lupa simpan.');
      },
      (error) => {
        console.error(error);
        notify('error', 'Gagal mengambil lokasi perangkat. Pastikan izin lokasi aktif.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await updateMyLocation({
        province: form.province || undefined,
        regency: form.regency || undefined,
        district: form.district || undefined,
        village: form.village || undefined,
        addressDetail: form.addressDetail || undefined,
        latitude: form.latitude,
        longitude: form.longitude,
        locationSource: form.locationSource,
      });

      notify('success', 'Lokasi berhasil disimpan.');
    } catch (error) {
      console.error(error);
      notify('error', 'Gagal menyimpan lokasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <BackLink href="/profile" label="Akun" />
        <PageHeader
          title="Lokasi kandang"
          description="Atur titik lokasi kandang untuk kebutuhan pemetaan"
        />

        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Memuat lokasi">
            <Skeleton className="h-14" />
            <Skeleton className="h-80 rounded-[var(--radius-card)]" />
          </div>
        ) : failed ? (
          <LoadError
            onRetry={() => {
              setLoading(true);
              void load();
            }}
          />
        ) : (
          <div className="space-y-5">
            <Card>
              <h2 className="text-lg font-semibold text-ink">Titik lokasi</h2>
              <p className="mb-4 mt-1 text-sm text-ink-muted">
                Ambil lokasi dari perangkat saat berada di kandang, atau ketuk peta untuk
                memindahkan titik.
              </p>

              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <Button size="lg" onClick={handleGetMyLocation}>
                  <LocateFixed size={20} aria-hidden="true" />
                  Ambil Lokasi Perangkat
                </Button>
                <a
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClassName({ variant: 'tinted', size: 'lg' })}
                >
                  <Navigation size={20} aria-hidden="true" />
                  Buka di Google Maps
                </a>
              </div>

              <LocationPickerMap
                latitude={form.latitude}
                longitude={form.longitude}
                onPick={(lat, lng) =>
                  setForm((prev) => ({
                    ...prev,
                    latitude: Number(lat.toFixed(6)),
                    longitude: Number(lng.toFixed(6)),
                    locationSource: 'MAP_PICKER',
                  }))
                }
              />

              <p className="mt-3 text-sm text-ink-muted">
                Koordinat: {form.latitude}, {form.longitude} · Sumber:{' '}
                {form.locationSource === 'GPS' ? 'GPS' : labelSumberLokasi(form.locationSource)}
              </p>
            </Card>

            <Card>
              <h2 className="mb-4 text-lg font-semibold text-ink">Alamat</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Provinsi">
                  <Input
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                  />
                </Field>
                <Field label="Kabupaten/Kota">
                  <Input
                    value={form.regency}
                    onChange={(e) => setForm({ ...form, regency: e.target.value })}
                  />
                </Field>
                <Field label="Kecamatan">
                  <Input
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                  />
                </Field>
                <Field label="Desa/Kelurahan">
                  <Input
                    value={form.village}
                    onChange={(e) => setForm({ ...form, village: e.target.value })}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Alamat detail">
                    <Input
                      value={form.addressDetail}
                      onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                    />
                  </Field>
                </div>
              </div>

              <details className="mt-5 rounded-[var(--radius-control)] border border-line p-3">
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-ink">
                  Pengaturan lanjutan (koordinat manual)
                </summary>
                <div className="mt-3 grid gap-4 md:grid-cols-3">
                  <Field label="Latitude">
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Longitude">
                    <Input
                      type="number"
                      step="0.000001"
                      inputMode="decimal"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Sumber lokasi">
                    <Select
                      value={form.locationSource}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          locationSource: e.target.value as 'GPS' | 'MAP_PICKER' | 'MANUAL',
                        })
                      }
                    >
                      <option value="GPS">GPS</option>
                      <option value="MAP_PICKER">{labelSumberLokasi('MAP_PICKER')}</option>
                      <option value="MANUAL">{labelSumberLokasi('MANUAL')}</option>
                    </Select>
                  </Field>
                </div>
              </details>

              <Button
                size="lg"
                className="mt-6 w-full sm:w-auto sm:min-w-56"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : 'Simpan Lokasi'}
              </Button>
            </Card>
          </div>
        )}
        <Toast toast={toast} />
      </DashboardShell>
    </RoleGuard>
  );
}
