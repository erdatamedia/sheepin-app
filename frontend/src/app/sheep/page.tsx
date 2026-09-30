'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PawPrint, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { StatTile } from '@/components/ui/stat-tile';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { SheepAvatar } from '@/components/sheep/sheep-avatar';
import {
  AddSheepForm,
  emptySheepForm,
  type SheepFormState,
} from '@/components/sheep/add-sheep-form';
import { api, getApiErrorMessage } from '@/lib/api';
import { getMe, getMySheep, type MeResponse, type MySheepResponse } from '@/lib/me';
import { farmerLabel, getFarmers, type FarmerOption } from '@/lib/farmers';
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

function getStatusVariant(status: string) {
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
}

function ListSkeleton() {
  return (
    <div
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Memuat data ternak"
    >
      {[0, 1, 2].map((key) => (
        <Skeleton key={key} className="h-32 rounded-[var(--radius-card)]" />
      ))}
    </div>
  );
}

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
  const [showFilters, setShowFilters] = useState(false);

  const [form, setForm] = useState<SheepFormState>(emptySheepForm);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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
      const keyword = search.toLowerCase();
      const matchesSearch =
        !search ||
        item.sheepCode.toLowerCase().includes(keyword) ||
        (item.name || '').toLowerCase().includes(keyword) ||
        item.breed.toLowerCase().includes(keyword) ||
        (item.location || '').toLowerCase().includes(keyword) ||
        (item.ownerUser?.name || '').toLowerCase().includes(keyword) ||
        (item.ownerUser?.groupName || '').toLowerCase().includes(keyword);

      const matchesGender = genderFilter === 'ALL' || item.gender === genderFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesOwner = ownerFilter === 'ALL' || item.ownerUser?.id === ownerFilter;

      return matchesSearch && matchesGender && matchesStatus && matchesOwner;
    });
  }, [data, search, genderFilter, statusFilter, ownerFilter]);

  const filteredMySheep = useMemo(() => {
    const keyword = search.toLowerCase();
    return mySheep.filter(
      (item) =>
        !search ||
        item.sheepCode.toLowerCase().includes(keyword) ||
        (item.name || '').toLowerCase().includes(keyword) ||
        item.breed.toLowerCase().includes(keyword),
    );
  }, [mySheep, search]);

  const stats = useMemo(
    () => ({
      total: data.length,
      male: data.filter((item) => item.gender === 'MALE').length,
      female: data.filter((item) => item.gender === 'FEMALE').length,
      active: data.filter((item) => item.status === 'ACTIVE').length,
    }),
    [data],
  );

  const isFarmer = me?.role === 'FARMER';
  const canCreateSheep =
    me?.role === 'ADMIN' || me?.role === 'OFFICER' || me?.role === 'FARMER';
  const activeFilterCount = [genderFilter, statusFilter, ownerFilter].filter(
    (value) => value !== 'ALL',
  ).length;

  const closeForm = () => {
    setShowCreateForm(false);
    setForm(emptySheepForm);
    setFormError('');
  };

  const resetFilters = () => {
    setSearch('');
    setGenderFilter('ALL');
    setStatusFilter('ALL');
    setOwnerFilter('ALL');
  };

  async function handleSubmit() {
    if (!canCreateSheep) {
      setFormError('Anda tidak memiliki izin untuk menambah ternak.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      await api.post('/sheep', {
        ...form,
        status: 'ACTIVE',
        photoUrl: form.photoUrl || undefined,
        ownerUserId:
          me?.role === 'ADMIN' || me?.role === 'OFFICER'
            ? form.ownerUserId || undefined
            : undefined,
      });

      closeForm();
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(getApiErrorMessage(err, 'Gagal menambahkan data ternak'));
    } finally {
      setSaving(false);
    }
  }

  const addButton = canCreateSheep && !showCreateForm && (
    <Button onClick={() => setShowCreateForm(true)}>
      <Plus size={18} aria-hidden="true" />
      Tambah Ternak
    </Button>
  );

  const createForm = showCreateForm && (
    <AddSheepForm
      form={form}
      onChange={setForm}
      onSubmit={handleSubmit}
      onCancel={closeForm}
      saving={saving}
      error={formError}
      farmers={isFarmer ? undefined : farmers}
      description={
        isFarmer
          ? 'Ternak yang Anda tambahkan langsung masuk ke akun Anda.'
          : 'Pilih pemilik peternak agar ternak tercatat atas nama mereka.'
      }
    />
  );

  if (isFarmer) {
    const activeMySheep = mySheep.filter((item) => item.status === 'ACTIVE');

    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <PageHeader
            title="Ternak Saya"
            description="Pilih ternak yang ingin dicatat hari ini"
            actions={addButton}
          />

          {createForm}

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total ternak" value={mySheep.length} />
            <StatTile label="Ternak aktif" value={activeMySheep.length} />
            <StatTile
              label="Sedang sakit"
              value={mySheep.filter((item) => item.latestHealth?.healthStatus === 'SICK').length}
            />
            <StatTile
              label="Sedang bunting"
              value={
                mySheep.filter((item) => item.latestReproduction?.status === 'PREGNANT').length
              }
            />
          </div>

          <div className="relative mb-5">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <Input
              className="pl-11"
              aria-label="Cari ternak"
              placeholder="Cari kode, nama, atau jenis ternak"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <ListSkeleton />
          ) : mySheep.length === 0 ? (
            <EmptyState
              icon={PawPrint}
              title="Belum ada ternak"
              description="Tambahkan ternak pertama Anda untuk mulai mencatat."
              action={
                !showCreateForm && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus size={18} aria-hidden="true" />
                    Tambah Ternak
                  </Button>
                )
              }
            />
          ) : filteredMySheep.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Ternak tidak ditemukan"
              description="Coba kata kunci lain."
              action={
                <Button variant="outline" onClick={() => setSearch('')}>
                  Hapus pencarian
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredMySheep.map((item) => (
                <Card key={item.id}>
                  <div className="flex items-start gap-3">
                    <SheepAvatar
                      sheepCode={item.sheepCode}
                      name={item.name}
                      photoUrl={item.photoUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-ink">
                        {item.sheepCode}
                      </h3>
                      <p className="truncate text-sm text-ink-muted">
                        {item.name || item.breed}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(item.status)}>
                      {labelStatusTernak(item.status)}
                    </Badge>
                  </div>

                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-primary-soft/50 px-2 py-2">
                      <dt className="text-xs text-ink-muted">Bobot</dt>
                      <dd className="text-base font-semibold text-ink">
                        {item.latestWeight ? `${item.latestWeight.weightKg} kg` : '-'}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-primary-soft/50 px-2 py-2">
                      <dt className="text-xs text-ink-muted">BCS</dt>
                      <dd className="text-base font-semibold text-ink">
                        {item.latestBcs?.bcsScore ?? '-'}
                      </dd>
                    </div>
                    <div className="rounded-xl bg-primary-soft/50 px-2 py-2">
                      <dt className="text-xs text-ink-muted">Kondisi</dt>
                      <dd className="truncate text-base font-semibold text-ink">
                        {labelStatusKesehatan(item.latestHealth?.healthStatus)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      href={`/recording?sheepId=${item.id}`}
                      className="inline-flex h-12 items-center justify-center rounded-[var(--radius-control)] bg-primary text-sm font-semibold text-white shadow-[var(--shadow-accent)]"
                    >
                      Rekord
                    </Link>
                    <Link
                      href={`/sheep/${item.id}`}
                      className="inline-flex h-12 items-center justify-center rounded-[var(--radius-control)] border border-line bg-surface text-sm font-semibold text-ink"
                    >
                      Lihat
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DashboardShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <PageHeader
          title="Data Ternak"
          description="Kelola data ternak domba berbasis rekording"
          actions={addButton}
        />

        {createForm}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Total ternak" value={stats.total} />
          <StatTile label="Jantan" value={stats.male} />
          <StatTile label="Betina" value={stats.female} />
          <StatTile label="Aktif" value={stats.active} />
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <Input
                className="pl-11"
                aria-label="Cari ternak"
                placeholder="Cari kode, nama, jenis, atau pemilik"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={activeFilterCount ? 'solid' : 'outline'}
              className="h-12 md:hidden"
              aria-expanded={showFilters}
              aria-controls="sheep-filters"
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>

          <div
            id="sheep-filters"
            className={`${showFilters ? 'grid' : 'hidden'} gap-3 md:grid md:grid-cols-3`}
          >
            <Select
              aria-label="Filter jenis kelamin"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="ALL">Semua jenis kelamin</option>
              <option value="MALE">Jantan</option>
              <option value="FEMALE">Betina</option>
            </Select>
            <Select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="SOLD">Terjual</option>
              <option value="DEAD">Mati</option>
              <option value="CULLED">Afkir</option>
            </Select>
            <Select
              aria-label="Filter pemilik"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
            >
              <option value="ALL">Semua pemilik</option>
              {farmers.map((farmer) => (
                <option key={farmer.id} value={farmer.id}>
                  {farmerLabel(farmer)}
                </option>
              ))}
            </Select>
          </div>

          {!loading && (
            <p className="text-sm text-ink-muted">
              Menampilkan {filteredData.length} dari {data.length} ternak
            </p>
          )}
        </div>

        {loading ? (
          <ListSkeleton />
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={data.length === 0 ? PawPrint : Search}
            title={data.length === 0 ? 'Belum ada data ternak' : 'Ternak tidak ditemukan'}
            description={
              data.length === 0
                ? 'Tambahkan ternak pertama untuk mulai merekam data.'
                : 'Tidak ada ternak yang sesuai dengan pencarian atau filter.'
            }
            action={
              data.length === 0 ? (
                !showCreateForm && canCreateSheep && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus size={18} aria-hidden="true" />
                    Tambah Ternak
                  </Button>
                )
              ) : (
                <Button variant="outline" onClick={resetFilters}>
                  Reset pencarian dan filter
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredData.map((item) => (
              <Link
                key={item.id}
                href={`/sheep/${item.id}`}
                className="block rounded-[var(--radius-card)] transition active:scale-[0.99]"
              >
                <Card className="h-full">
                  <div className="flex items-start gap-3">
                    <SheepAvatar
                      sheepCode={item.sheepCode}
                      name={item.name}
                      photoUrl={item.photoUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-ink">
                        {item.sheepCode}
                      </h3>
                      <p className="truncate text-sm text-ink-muted">
                        {item.name || 'Tanpa nama'}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(item.status)}>
                      {labelStatusTernak(item.status)}
                    </Badge>
                  </div>

                  <dl className="mt-3 space-y-1 text-sm text-ink">
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-ink-muted">Jenis</dt>
                      <dd className="min-w-0 truncate">
                        {item.breed} · {labelJenisKelamin(item.gender)}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-ink-muted">Lokasi</dt>
                      <dd className="min-w-0 truncate">{item.location || '-'}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-ink-muted">Pemilik</dt>
                      <dd className="min-w-0 truncate">
                        {item.ownerUser?.name || '-'}
                      </dd>
                    </div>
                  </dl>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
