'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Filter } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PhotoUploadField } from '@/components/ui/photo-upload-field';
import { api, getApiErrorMessage } from '@/lib/api';
import { getMe, getMySheep, type MeResponse, type MySheepResponse } from '@/lib/me';
import { getFarmers, type FarmerOption } from '@/lib/farmers';
import {
  labelJenisKelamin,
  labelStatusKesehatan,
  labelStatusTernak,
} from '@/lib/labels';

type Sheep = {
  id: string;
  sheepCode: string;
  name?: string;
  breed: string;
  gender: string;
  status: string;
  color?: string;
  photoUrl?: string | null;
  location?: string;
  ownerUser?: {
    id: string;
    name: string;
    loginCode?: string | null;
    groupName?: string | null;
  } | null;
};

export default function SheepPage() {
  const [data, setData] = useState<Sheep[]>([]);
  const [mySheep, setMySheep] = useState<MySheepResponse['data']>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);

  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');

  const [form, setForm] = useState({
    sheepCode: '',
    name: '',
    breed: '',
    gender: 'MALE',
    photoUrl: '',
    ownerUserId: '',
  });

  const fetchData = async () => {
    try {
      const [res, meRes] = await Promise.all([api.get('/sheep'), getMe()]);
      setData(res.data.data || []);
      setMe(meRes);

      if (meRes.role === 'ADMIN' || meRes.role === 'OFFICER') {
        const farmerRes = await getFarmers();
        setFarmers(farmerRes.data || []);
      } else {
        const mySheepRes = await getMySheep();
        setMySheep(mySheepRes.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat data sheep:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        !search ||
        item.sheepCode.toLowerCase().includes(search.toLowerCase()) ||
        (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
        item.breed.toLowerCase().includes(search.toLowerCase()) ||
        (item.location || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.ownerUser?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.ownerUser?.loginCode || '').toLowerCase().includes(search.toLowerCase());

      const matchesGender =
        genderFilter === 'ALL' || item.gender === genderFilter;

      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      const matchesOwner =
        ownerFilter === 'ALL' || item.ownerUser?.id === ownerFilter;

      return matchesSearch && matchesGender && matchesStatus && matchesOwner;
    });
  }, [data, search, genderFilter, statusFilter, ownerFilter]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      male: data.filter((item) => item.gender === 'MALE').length,
      female: data.filter((item) => item.gender === 'FEMALE').length,
      active: data.filter((item) => item.status === 'ACTIVE').length,
    };
  }, [data]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'SOLD':
        return 'info';
      case 'DEAD':
        return 'danger';
      case 'CULLED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const canManageSheep = me?.role === 'ADMIN' || me?.role === 'OFFICER';

  if (me?.role === 'FARMER') {
    const activeMySheep = mySheep.filter((item) => item.status === 'ACTIVE');

    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ternak Saya</h1>
              <p className="text-sm text-[color:var(--ink-muted)]">
                Pilih ternak yang ingin dicatat hari ini
              </p>
            </div>
            <Badge variant="info">Aktif: {activeMySheep.length}</Badge>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="min-h-[116px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Total Ternak</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{mySheep.length}</h2>
            </Card>
            <Card className="min-h-[116px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Ternak Aktif</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{activeMySheep.length}</h2>
            </Card>
            <Card className="min-h-[116px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Butuh Cek Kesehatan</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {mySheep.filter((item) => item.latestHealth?.healthStatus === 'SICK').length}
              </h2>
            </Card>
            <Card className="min-h-[116px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Perlu Tindak Lanjut</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {mySheep.filter((item) => item.latestReproduction?.status === 'PREGNANT').length}
              </h2>
            </Card>
          </div>

          <Card className="mb-6 bg-[color:var(--surface-strong)]">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                className="pl-10"
                placeholder="Cari kode, nama, atau breed ternak..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="text-sm text-gray-500">Memuat ternak...</p>
            ) : mySheep.length === 0 ? (
              <Card className="bg-[color:var(--surface-strong)] md:col-span-2 xl:col-span-3">
                <p className="text-sm text-[color:var(--ink-muted)]">
                  Belum ada ternak yang terhubung dengan akun peternak ini.
                </p>
              </Card>
            ) : (
              mySheep
                .filter((item) => {
                  const keyword = search.toLowerCase();
                  return (
                    !search ||
                    item.sheepCode.toLowerCase().includes(keyword) ||
                    (item.name || '').toLowerCase().includes(keyword) ||
                    item.breed.toLowerCase().includes(keyword)
                  );
                })
                .map((item) => (
                  <Card
                    key={item.id}
                    className="border-[color:rgba(86,74,50,0.12)] bg-[color:var(--surface-strong)]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt={item.name || item.sheepCode}
                            className="h-14 w-14 rounded-2xl border border-[color:rgba(86,74,50,0.12)] object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(33,73,61,0.12)] text-sm font-semibold text-[color:var(--accent)]">
                            {item.sheepCode.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {item.sheepCode}
                          </h3>
                          <p className="text-sm text-[color:var(--ink-muted)]">{item.name || item.breed}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(item.status)}>{labelStatusTernak(item.status)}</Badge>
                    </div>

                    <div className="space-y-2 text-sm text-gray-800">
                      <p><span className="font-medium">Breed:</span> {item.breed}</p>
                      <p><span className="font-medium">Bobot terakhir:</span> {item.latestWeight ? `${item.latestWeight.weightKg} kg` : '-'}</p>
                      <p><span className="font-medium">BCS terakhir:</span> {item.latestBcs?.bcsScore ?? '-'}</p>
                      <p><span className="font-medium">Kondisi:</span> {labelStatusKesehatan(item.latestHealth?.healthStatus)}</p>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link href={`/recording?sheepId=${item.id}`} className="flex-1">
                        <Button className="w-full">Rekord</Button>
                      </Link>
                      <Link href={`/sheep/${item.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Lihat
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))
            )}
          </div>
        </DashboardShell>
      </RoleGuard>
    );
  }

  const handleSubmit = async () => {
    try {
      if (!canManageSheep) {
        alert('Hanya admin/petugas yang dapat menambah ternak');
        return;
      }

      await api.post('/sheep', {
        ...form,
        status: 'ACTIVE',
        photoUrl: form.photoUrl || undefined,
        ownerUserId: form.ownerUserId || undefined,
      });

      setForm({
        sheepCode: '',
        name: '',
        breed: '',
        gender: 'MALE',
        photoUrl: '',
        ownerUserId: '',
      });

      fetchData();
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, 'Gagal menambahkan data ternak'));
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Ternak</h1>
            <p className="text-sm text-gray-500">
              Manajemen data ternak domba berbasis rekording
            </p>
          </div>
          <Badge variant="info">Total tampil: {filteredData.length}</Badge>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Total Ternak</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Jantan</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{stats.male}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Betina</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{stats.female}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Aktif</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{stats.active}</h2>
          </Card>
        </div>

        {canManageSheep && (
          <Card className="mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Tambah Ternak</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Input
                placeholder="Kode Ternak"
                value={form.sheepCode}
                onChange={(e) => setForm({ ...form, sheepCode: e.target.value })}
              />

              <Input
                placeholder="Nama Ternak"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <Input
                placeholder="Breed / Rumpun"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
              />

              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="MALE">Jantan</option>
                <option value="FEMALE">Betina</option>
              </select>

              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                value={form.ownerUserId}
                onChange={(e) => setForm({ ...form, ownerUserId: e.target.value })}
              >
                <option value="">Pilih Pemilik Peternak</option>
                {farmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.name} {farmer.loginCode ? `- ${farmer.loginCode}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <PhotoUploadField
              label="Foto ternak"
              value={form.photoUrl}
              onChange={(value) => setForm({ ...form, photoUrl: value })}
              helperText="Unggah foto ternak untuk memudahkan identifikasi visual di kandang."
              emptyLabel="FOTO TERNAK"
            />

            <div>
              <Button onClick={handleSubmit}>Simpan Ternak</Button>
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Pencarian & Filter</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                className="pl-10"
                placeholder="Cari kode, nama, breed, lokasi, pemilik..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="ALL">Semua Gender</option>
              <option value="MALE">Jantan</option>
              <option value="FEMALE">Betina</option>
            </select>

            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="SOLD">Terjual</option>
              <option value="DEAD">Mati</option>
              <option value="CULLED">Afkir</option>
            </select>
            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="ALL">Semua Pemilik</option>
              {farmers.map((farmer) => (
                <option key={farmer.id} value={farmer.id}>
                  {farmer.name} {farmer.loginCode ? `- ${farmer.loginCode}` : ''}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <p className="text-sm text-gray-500">Memuat data ternak...</p>
          ) : filteredData.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-3">
              <p className="text-sm text-gray-500">
                Tidak ada data ternak yang sesuai dengan pencarian/filter.
              </p>
            </Card>
          ) : (
            filteredData.map((item) => (
              <Link key={item.id} href={`/sheep/${item.id}`}>
                <Card className="group h-full cursor-pointer border-gray-200 transition duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.name || item.sheepCode}
                          className="h-14 w-14 rounded-2xl border border-[color:rgba(86,74,50,0.12)] object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(33,73,61,0.12)] text-sm font-semibold text-[color:var(--accent)]">
                          {item.sheepCode.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.sheepCode}
                        </h3>
                        <p className="text-sm text-gray-500">{item.name || 'Tanpa nama'}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(item.status)}>
                      {labelStatusTernak(item.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Breed:</span> {item.breed}
                    </p>
                    <p>
                      <span className="font-medium">Jenis kelamin:</span> {labelJenisKelamin(item.gender)}
                    </p>
                    <p>
                      <span className="font-medium">Lokasi:</span> {item.location || '-'}
                    </p>
                    <p>
                      <span className="font-medium">Pemilik:</span>{' '}
                      {item.ownerUser?.name || '-'}
                      {item.ownerUser?.loginCode ? ` (${item.ownerUser.loginCode})` : ''}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-400 transition group-hover:text-gray-600">
                      Klik untuk melihat detail rekording →
                    </p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
