'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatKg, labelTimeAgo } from '@/lib/format';
import { traitList } from '@/lib/sheep-photo';
import { PawPrint, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { LoadError } from '@/components/ui/load-error';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/segmented';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { SheepStatusRow } from '@/components/sheep/sheep-status-row';
import { PhotoGrid, type GalleryItem } from '@/components/sheep/photo-gallery';
import { SheepActionSheet } from '@/components/sheep/sheep-action-sheet';
import { PhotoViewer } from '@/components/sheep/photo-viewer';
import { Avatar } from '@/components/ui/avatar';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { Sheet } from '@/components/ui/sheet';
import {
  AddSheepForm,
  emptySheepForm,
  sheepPayload,
  type SheepFormState,
} from '@/components/sheep/add-sheep-form';
import { api, getApiErrorMessage } from '@/lib/api';
import { getMe, getMySheep, type MeResponse, type MySheepResponse } from '@/lib/me';
import { farmerLabel, getFarmers, type FarmerOption } from '@/lib/farmers';
import { labelJenisKelamin, labelStatusTernak } from '@/lib/labels';

type Sheep = {
  id: string;
  sheepCode: string;
  name?: string;
  breed: string;
  gender: string;
  status: string;
  color?: string;
  photoUrl?: string | null;
  faceNose?: string | null;
  earsHorns?: string | null;
  tailBody?: string | null;
  physicalMark?: string | null;
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
  // Tampilan daftar atau foto; diingat di perangkat agar tidak perlu memilih ulang di kandang.
  const [view, setView] = useState<'LIST' | 'PHOTO'>('LIST');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [statusView, setStatusView] = useState<'ACTIVE' | 'ALL'>('ACTIVE');

  const [form, setForm] = useState<SheepFormState>(emptySheepForm);
  const [menuFor, setMenuFor] = useState<{ id: string; code: string; name?: string | null } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      setFailed(false);
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
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sheepin:sheep-view');
      if (saved === 'PHOTO' || saved === 'LIST') setView(saved);
    } catch {
      // penyimpanan tidak tersedia: tetap pakai tampilan daftar
    }
  }, []);

  const changeView = (next: 'LIST' | 'PHOTO') => {
    setView(next);
    try {
      localStorage.setItem('sheepin:sheep-view', next);
    } catch {
      // abaikan
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
        (item.ownerUser?.groupName || '').toLowerCase().includes(keyword) ||
        traitList(item).join(' ').toLowerCase().includes(keyword);

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
        item.breed.toLowerCase().includes(keyword) ||
        traitList(item).join(' ').toLowerCase().includes(keyword),
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
  const canCreateSheep = me?.role === 'ADMIN' || me?.role === 'OFFICER' || me?.role === 'FARMER';
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
        ...sheepPayload(form),
        status: 'ACTIVE',
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

  const addButton = canCreateSheep && (
    <Button variant="tinted" onClick={() => setShowCreateForm(true)}>
      <Plus size={18} aria-hidden="true" />
      Tambah
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

  const searchField = (placeholder: string) => (
    <div className="relative flex-1">
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
      />
      <Input
        className="pl-11"
        aria-label="Cari ternak"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );

  if (isFarmer) {
    const activeMySheep = mySheep.filter((item) => item.status === 'ACTIVE');
    const shownMySheep =
      statusView === 'ACTIVE'
        ? filteredMySheep.filter((item) => item.status === 'ACTIVE')
        : filteredMySheep;

    const farmerGallery: GalleryItem[] = shownMySheep.map((item) => ({
      id: item.id,
      code: item.sheepCode,
      name: item.name,
      photoUrl: item.photoUrl,
      traits: traitList(item),
      subtitle: [
        item.latestWeight ? formatKg(item.latestWeight.weightKg) : null,
        `dicatat ${labelTimeAgo(item.lastRecordedAt)}`,
      ]
        .filter(Boolean)
        .join(' · '),
      alert:
        item.status !== 'ACTIVE'
          ? labelStatusTernak(item.status)
          : item.latestHealth?.healthStatus === 'SICK'
            ? 'Sakit'
            : undefined,
    }));

    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <PageHeader
            title="Ternak saya"
            description={
              loading ? undefined : `${activeMySheep.length} aktif dari ${mySheep.length} ternak`
            }
            actions={addButton}
          />

          {createForm}

          <div className="mb-4 space-y-3">
            <div className="flex gap-2">{searchField('Cari kode, nama, jenis, atau ciri')}</div>
            <div className="grid grid-cols-2 gap-2">
              <Segmented
                label="Tampilkan"
                value={statusView}
                onChange={(value) => setStatusView(value as 'ACTIVE' | 'ALL')}
                options={[
                  { value: 'ACTIVE', label: 'Aktif' },
                  { value: 'ALL', label: 'Semua' },
                ]}
              />
              <Segmented
                label="Tampilan"
                value={view}
                onChange={(value) => changeView(value as 'LIST' | 'PHOTO')}
                options={[
                  { value: 'LIST', label: 'Daftar' },
                  { value: 'PHOTO', label: 'Foto' },
                ]}
              />
            </div>
          </div>

          {loading ? (
            <ListSkeleton />
          ) : failed ? (
            <LoadError
              onRetry={() => {
                setLoading(true);
                void fetchData();
              }}
            />
          ) : mySheep.length === 0 ? (
            <EmptyState
              icon={PawPrint}
              title="Belum ada ternak"
              description="Tambahkan ternak pertama Anda untuk mulai mencatat."
              action={
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus size={18} aria-hidden="true" />
                  Tambah ternak
                </Button>
              }
            />
          ) : shownMySheep.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Ternak tidak ditemukan"
              description="Coba kata kunci lain atau pilih Semua."
              action={
                <Button variant="tinted" onClick={() => setSearch('')}>
                  Hapus pencarian
                </Button>
              }
            />
          ) : view === 'PHOTO' ? (
            <PhotoGrid
              items={farmerGallery}
              onOpen={setViewerIndex}
              onMenu={(index) => {
                const target = farmerGallery[index];
                if (target) setMenuFor({ id: target.id, code: target.code, name: target.name });
              }}
            />
          ) : (
            <ListGroup className="lg:max-w-3xl">
              {shownMySheep.map((item) => (
                <SheepStatusRow
                  key={item.id}
                  item={item}
                  onMenu={(row) => setMenuFor({ id: row.id, code: row.sheepCode, name: row.name })}
                />
              ))}
            </ListGroup>
          )}

          <SheepActionSheet target={menuFor} onClose={() => setMenuFor(null)} />

          {viewerIndex !== null && (
            <PhotoViewer
              items={farmerGallery}
              index={Math.min(viewerIndex, farmerGallery.length - 1)}
              onIndexChange={setViewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )}
        </DashboardShell>
      </RoleGuard>
    );
  }

  const staffGallery: GalleryItem[] = filteredData.map((item) => ({
    id: item.id,
    code: item.sheepCode,
    name: item.name,
    photoUrl: item.photoUrl,
    traits: traitList(item),
    subtitle: [item.breed, item.ownerUser?.name].filter(Boolean).join(' · '),
    alert: item.status !== 'ACTIVE' ? labelStatusTernak(item.status) : undefined,
  }));

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <PageHeader
          title="Ternak"
          description={loading ? undefined : `${stats.active} aktif dari ${stats.total} ternak`}
          actions={addButton}
        />

        {createForm}

        <div className="mb-3 flex gap-2">
          {searchField('Cari kode, nama, jenis, ciri, atau pemilik')}
          <Button
            variant={activeFilterCount ? 'solid' : 'tinted'}
            className="h-12"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>

        <div className="mb-4 max-w-xs">
          <Segmented
            label="Tampilan"
            value={view}
            onChange={(value) => changeView(value as 'LIST' | 'PHOTO')}
            options={[
              { value: 'LIST', label: 'Daftar' },
              { value: 'PHOTO', label: 'Foto' },
            ]}
          />
        </div>

        <Sheet open={showFilters} onClose={() => setShowFilters(false)} title="Filter ternak">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink">Jenis kelamin</span>
              <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                <option value="ALL">Semua</option>
                <option value="MALE">Jantan</option>
                <option value="FEMALE">Betina</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink">Status</span>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">Semua</option>
                <option value="ACTIVE">Aktif</option>
                <option value="SOLD">Terjual</option>
                <option value="DEAD">Mati</option>
                <option value="CULLED">Afkir</option>
              </Select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-medium text-ink">Pemilik</span>
              <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                <option value="ALL">Semua pemilik</option>
                {farmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmerLabel(farmer)}
                  </option>
                ))}
              </Select>
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="tinted" size="lg" onClick={resetFilters}>
                Reset
              </Button>
              <Button size="lg" onClick={() => setShowFilters(false)}>
                Lihat {filteredData.length} ternak
              </Button>
            </div>
          </div>
        </Sheet>

        {loading ? (
          <ListSkeleton />
        ) : failed ? (
          <LoadError
            onRetry={() => {
              setLoading(true);
              void fetchData();
            }}
          />
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
                canCreateSheep && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus size={18} aria-hidden="true" />
                    Tambah ternak
                  </Button>
                )
              ) : (
                <Button variant="tinted" onClick={resetFilters}>
                  Reset pencarian dan filter
                </Button>
              )
            }
          />
        ) : (
          <>
            <p className="mb-2 px-1 text-[13px] text-ink-muted">
              Menampilkan {filteredData.length} dari {data.length} ternak
            </p>
            {view === 'PHOTO' ? (
              <PhotoGrid items={staffGallery} onOpen={setViewerIndex} />
            ) : (
              <ListGroup>
                {filteredData.map((item) => (
                  <ListRow
                    key={item.id}
                    href={`/sheep/${item.id}`}
                    leading={
                      <Avatar
                        name={item.name || item.sheepCode}
                        photoUrl={item.photoUrl}
                        size="md"
                      />
                    }
                    title={item.name ? `${item.sheepCode} · ${item.name}` : item.sheepCode}
                    subtitle={[item.breed, labelJenisKelamin(item.gender), item.ownerUser?.name]
                      .filter(Boolean)
                      .join(' · ')}
                    trailing={
                      <Badge variant={getStatusVariant(item.status)}>
                        {labelStatusTernak(item.status)}
                      </Badge>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </>
        )}

        {viewerIndex !== null && (
          <PhotoViewer
            items={staffGallery}
            index={Math.min(viewerIndex, staffGallery.length - 1)}
            onIndexChange={setViewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
