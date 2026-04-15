'use client';

import Link from 'next/link';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMe } from '@/lib/me';
import { getApiErrorMessage } from '@/lib/api';
import { labelJenisKelamin, labelStatusTernak, labelSumberLokasi } from '@/lib/labels';
import {
  deleteFarmer,
  getFarmerDetail,
  getFarmerSheep,
  getFarmerSummary,
  updateFarmer,
  type FarmerDetailResponse,
  type FarmerSheepResponse,
  type FarmerSummaryResponse,
} from '@/lib/farmers';

type FarmerDetail = FarmerDetailResponse['data'];
type FarmerSheepItem = FarmerSheepResponse['data']['sheep'][number];
type FarmerSummary = FarmerSummaryResponse['data']['summary'];

export default function FarmerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [farmer, setFarmer] = useState<FarmerDetail | null>(null);
  const [summary, setSummary] = useState<FarmerSummary | null>(null);
  const [sheep, setSheep] = useState<FarmerSheepItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    groupName: '',
    province: '',
    regency: '',
    district: '',
    village: '',
    addressDetail: '',
    isActive: true,
  });

  const loadAll = useCallback(async () => {
    try {
      setErrorMessage('');

      const meRes = await getMe();
      if (meRes.role !== 'ADMIN' && meRes.role !== 'OFFICER') {
        setErrorMessage('Halaman ini hanya dapat diakses admin atau petugas.');
        return;
      }

      const [detailRes, summaryRes, sheepRes] = await Promise.all([
        getFarmerDetail(id),
        getFarmerSummary(id),
        getFarmerSheep(id),
      ]);

      setFarmer(detailRes.data);
      setSummary(summaryRes.data.summary);
      setSheep(sheepRes.data.sheep || []);
      setForm({
        name: detailRes.data.name || '',
        phone: detailRes.data.phone || '',
        address: detailRes.data.address || '',
        groupName: detailRes.data.groupName || '',
        province: detailRes.data.province || '',
        regency: detailRes.data.regency || '',
        district: detailRes.data.district || '',
        village: detailRes.data.village || '',
        addressDetail: detailRes.data.addressDetail || '',
        isActive: detailRes.data.isActive,
      });
    } catch (error) {
      console.error('Gagal memuat detail peternak:', error);

      const message = getApiErrorMessage(
        error,
        'Terjadi kesalahan saat memuat detail peternak.',
      );

      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setErrorMessage('Anda tidak memiliki akses ke halaman detail peternak.');
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        setErrorMessage('Data peternak tidak ditemukan. Pastikan link memakai userId, bukan loginCode.');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void loadAll();
    }
  }, [id, loadAll]);

  const totalEvaluated = useMemo(() => {
    if (!summary) return 0;
    return (
      (summary.eligibleBreeding || 0) +
      (summary.monitoring || 0) +
      (summary.notRecommended || 0)
    );
  }, [summary]);

  const eligiblePercent = useMemo(() => {
    if (!summary || totalEvaluated === 0) return 0;
    return Math.round((summary.eligibleBreeding / totalEvaluated) * 100);
  }, [summary, totalEvaluated]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateFarmer(id, form);
      alert('Data peternak berhasil diperbarui');
      await loadAll();
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal memperbarui peternak'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const ok = window.confirm('Yakin ingin menghapus peternak ini?');
      if (!ok) return;

      await deleteFarmer(id);
      alert('Data peternak berhasil dihapus');
      router.push('/map');
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal menghapus peternak'));
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
        <DashboardShell>
          <p className="text-sm text-gray-500">Memuat detail peternak...</p>
        </DashboardShell>
      </RoleGuard>
    );
  }

  if (errorMessage || !farmer || !summary) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
        <DashboardShell>
          <Card>
            <p className="text-sm text-red-500">
              {errorMessage || 'Data peternak tidak ditemukan.'}
            </p>
          </Card>
        </DashboardShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <div className="mb-6">
          <Link
            href="/map"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Kembali ke peta sebaran
          </Link>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{farmer.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Detail peternak, lokasi, dan ringkasan populasi ternak
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{farmer.loginCode || '-'}</Badge>
              <Badge variant={farmer.isActive ? 'success' : 'danger'}>
                {farmer.isActive ? 'Aktif' : 'Tidak aktif'}
              </Badge>
              <Badge variant="default">{labelSumberLokasi(farmer.locationSource)}</Badge>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Edit Peternak</h2>
              <p className="text-sm text-gray-500">Perbarui data identitas peternak</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="No. HP" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Alamat" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="Kelompok" value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
            <Input placeholder="Provinsi" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
            <Input placeholder="Kabupaten" value={form.regency} onChange={(e) => setForm({ ...form, regency: e.target.value })} />
            <Input placeholder="Kecamatan" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input placeholder="Desa" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
            <Input placeholder="Alamat Detail" value={form.addressDetail} onChange={(e) => setForm({ ...form, addressDetail: e.target.value })} />
            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
              value={String(form.isActive)}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
            >
              <option value="true">Aktif</option>
              <option value="false">Tidak aktif</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 px-5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Hapus Peternak
            </button>
          </div>
        </Card>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Kelompok</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">{farmer.groupName || '-'}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">No. HP</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">{farmer.phone || '-'}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Total Ternak</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">{summary.totalSheep}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Ternak Aktif</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">{summary.activeSheep}</h2>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <MapPin size={18} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Informasi Lokasi</h2>
            </div>

            <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              <p><span className="font-medium">Provinsi:</span> {farmer.province || '-'}</p>
              <p><span className="font-medium">Kabupaten:</span> {farmer.regency || '-'}</p>
              <p><span className="font-medium">Kecamatan:</span> {farmer.district || '-'}</p>
              <p><span className="font-medium">Desa:</span> {farmer.village || '-'}</p>
              <p className="md:col-span-2"><span className="font-medium">Alamat:</span> {farmer.addressDetail || farmer.address || '-'}</p>
              <p><span className="font-medium">Latitude:</span> {farmer.latitude ?? '-'}</p>
              <p><span className="font-medium">Longitude:</span> {farmer.longitude ?? '-'}</p>
              <p>
                <span className="font-medium">Update Lokasi:</span>{' '}
                {farmer.locationUpdatedAt
                  ? new Date(farmer.locationUpdatedAt).toLocaleString('id-ID')
                  : '-'}
              </p>
            </div>

            {farmer.latitude != null && farmer.longitude != null && (
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${farmer.latitude},${farmer.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Buka Rute di Google Maps
                </a>
                <a
                  href={`https://www.google.com/maps?q=${farmer.latitude},${farmer.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Lihat Titik di Google Maps
                </a>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Ringkasan Evaluasi</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Total dievaluasi</span>
                <span className="font-semibold">{totalEvaluated}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Layak bibit</span>
                <span className="font-semibold">{summary.eligibleBreeding}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pemantauan</span>
                <span className="font-semibold">{summary.monitoring}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Belum direkomendasikan</span>
                <span className="font-semibold">{summary.notRecommended}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Persentase layak bibit</span>
                <span className="font-semibold">{eligiblePercent}%</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-gray-500">Layak Bibit</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">{summary.eligibleBreeding}</h3>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Perlu Pemantauan</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">{summary.monitoring}</h3>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Belum Direkomendasikan</p>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">{summary.notRecommended}</h3>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Data Ternak Milik Peternak</h2>
              <p className="text-sm text-gray-500">Daftar ternak yang terhubung dengan peternak ini</p>
            </div>
            <Badge variant="info">Total: {sheep.length}</Badge>
          </div>

          {sheep.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada data ternak yang terhubung dengan peternak ini.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sheep.map((item) => (
                <Link key={item.id} href={`/sheep/${item.id}`}>
                  <div className="rounded-2xl border border-gray-200 p-4 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-md">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.sheepCode}</h3>
                        <p className="text-sm text-gray-500">{item.name || 'Tanpa nama'}</p>
                      </div>
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
                        {labelStatusTernak(item.status)}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium">Breed:</span> {item.breed}</p>
                      <p><span className="font-medium">Jenis kelamin:</span> {labelJenisKelamin(item.gender)}</p>
                      <p><span className="font-medium">Warna:</span> {item.color || '-'}</p>
                      <p><span className="font-medium">Lokasi:</span> {item.location || '-'}</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <div className="rounded-lg bg-gray-50 px-3 py-2">Bobot: {item._count.weights}</div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">BCS: {item._count.bcsRecords}</div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">Kesehatan: {item._count.healthRecords}</div>
                      <div className="rounded-lg bg-gray-50 px-3 py-2">Reproduksi: {item._count.reproductions}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </DashboardShell>
    </RoleGuard>
  );
}
