'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getMyLocation, updateMyLocation } from '@/lib/location';
import { getMe, type MeResponse } from '@/lib/me';
import { labelPeran, labelSumberLokasi } from '@/lib/labels';

const LocationPickerMap = dynamic(
  () => import('@/components/map/location-picker-map'),
  { ssr: false },
);

export default function LocationPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
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

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, locationRes] = await Promise.all([getMe(), getMyLocation()]);
        setMe(meRes);

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
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleGetMyLocation = () => {
    setMessage('');
    if (!navigator.geolocation) {
      setMessage('Browser/perangkat tidak mendukung geolocation.');
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
        setMessage('Lokasi perangkat berhasil diambil.');
      },
      (error) => {
        console.error(error);
        setMessage('Gagal mengambil lokasi perangkat. Pastikan izin lokasi aktif.');
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
      setMessage('');

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

      setMessage('Lokasi berhasil disimpan.');
    } catch (error) {
      console.error(error);
      setMessage('Gagal menyimpan lokasi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <p className="text-sm text-gray-500">Memuat lokasi...</p>
        </DashboardShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lokasi Peternak</h1>
          <p className="mt-1 text-sm text-gray-500">
            Atur titik lokasi kandang/peternak untuk kebutuhan pemetaan
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Nama</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {me?.name || '-'}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Peran</p>
            <div className="mt-2">
              <Badge variant="info">{labelPeran(me?.role)}</Badge>
            </div>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">ID Peternak</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {me?.loginCode || '-'}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Kelompok</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {me?.groupName || '-'}
            </h2>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="mb-4 flex flex-wrap gap-3">
            <Button type="button" onClick={handleGetMyLocation}>
              Ambil Lokasi Perangkat
            </Button>
            <a
              href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Buka di Google Maps
            </a>
          </div>

          {message && (
            <div className="mb-4 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
              {message}
            </div>
          )}

          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Input
              placeholder="Provinsi"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
            <Input
              placeholder="Kabupaten/Kota"
              value={form.regency}
              onChange={(e) => setForm({ ...form, regency: e.target.value })}
            />
            <Input
              placeholder="Kecamatan"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
            <Input
              placeholder="Desa/Kelurahan"
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
            />
            <Input
              placeholder="Alamat detail"
              value={form.addressDetail}
              onChange={(e) =>
                setForm({ ...form, addressDetail: e.target.value })
              }
            />
            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
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
            </select>
            <Input
              type="number"
              step="0.000001"
              placeholder="Latitude"
              value={form.latitude}
              onChange={(e) =>
                setForm({ ...form, latitude: Number(e.target.value) })
              }
            />
            <Input
              type="number"
              step="0.000001"
              placeholder="Longitude"
              value={form.longitude}
              onChange={(e) =>
                setForm({ ...form, longitude: Number(e.target.value) })
              }
            />
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

          <div className="mt-4">
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Lokasi'}
            </Button>
          </div>
        </Card>
      </DashboardShell>
    </RoleGuard>
  );
}
