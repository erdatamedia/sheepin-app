'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { getMapDistribution, type MapDistributionResponse } from '@/lib/location';
import { labelSumberLokasi } from '@/lib/labels';

const DistributionMap = dynamic(
  () => import('@/components/map/distribution-map'),
  { ssr: false },
);

export default function MapPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MapDistributionResponse['data']>([]);

  const [search, setSearch] = useState('');
  const [regencyFilter, setRegencyFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMapDistribution();
        setItems(res.data || []);
      } catch (error) {
        console.error('Gagal memuat data distribusi:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const regencyOptions = useMemo(() => {
    return Array.from(
      new Set(items.map((item) => item.regency).filter(Boolean)),
    ).sort();
  }, [items]);

  const districtOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .filter((item) =>
            regencyFilter === 'ALL' ? true : item.regency === regencyFilter,
          )
          .map((item) => item.district)
          .filter(Boolean),
      ),
    ).sort();
  }, [items, regencyFilter]);

  const villageOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .filter((item) =>
            regencyFilter === 'ALL' ? true : item.regency === regencyFilter,
          )
          .filter((item) =>
            districtFilter === 'ALL' ? true : item.district === districtFilter,
          )
          .map((item) => item.village)
          .filter(Boolean),
      ),
    ).sort();
  }, [items, regencyFilter, districtFilter]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.groupName || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.addressDetail || '').toLowerCase().includes(search.toLowerCase());

      const matchesRegency =
        regencyFilter === 'ALL' || item.regency === regencyFilter;

      const matchesDistrict =
        districtFilter === 'ALL' || item.district === districtFilter;

      const matchesVillage =
        villageFilter === 'ALL' || item.village === villageFilter;

      return (
        matchesSearch &&
        matchesRegency &&
        matchesDistrict &&
        matchesVillage
      );
    });
  }, [items, search, regencyFilter, districtFilter, villageFilter]);

  const summary = useMemo(() => {
    return {
      farmers: filteredItems.length,
      totalSheep: filteredItems.reduce((a, b) => a + b.totalSheep, 0),
      eligible: filteredItems.reduce((a, b) => a + b.eligibleBreeding, 0),
      active: filteredItems.reduce((a, b) => a + b.activeSheep, 0),
    };
  }, [filteredItems]);

  const activeFilterCount = [regencyFilter, districtFilter, villageFilter].filter(
    (value) => value !== 'ALL',
  ).length;

  const resetFilters = () => {
    setSearch('');
    setRegencyFilter('ALL');
    setDistrictFilter('ALL');
    setVillageFilter('ALL');
  };

  const tiles = [
    { label: 'Titik peternak', value: summary.farmers },
    { label: 'Total ternak', value: summary.totalSheep },
    { label: 'Ternak aktif', value: summary.active },
    { label: 'Layak bibit', value: summary.eligible },
  ];

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <PageHeader
          title="Peta Sebaran Domba"
          description="Lokasi peternak dan ringkasan populasi ternak"
        />

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <Card key={tile.label} className="p-3 sm:p-4">
              <p className="text-xs text-ink-muted sm:text-sm">{tile.label}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{tile.value}</p>
            </Card>
          ))}
        </div>

        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
              />
              <Input
                className="pl-11"
                aria-label="Cari peternak"
                placeholder="Cari nama, kelompok, atau alamat"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button
              variant={activeFilterCount ? 'solid' : 'outline'}
              className="h-12 md:hidden"
              aria-expanded={showFilters}
              aria-controls="map-filters"
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
              Wilayah{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </Button>
          </div>

          <div
            id="map-filters"
            className={`${showFilters ? 'grid' : 'hidden'} gap-3 md:grid md:grid-cols-3`}
          >
            <Select
              aria-label="Filter kabupaten"
              value={regencyFilter}
              onChange={(e) => {
                setRegencyFilter(e.target.value);
                setDistrictFilter('ALL');
                setVillageFilter('ALL');
              }}
            >
              <option value="ALL">Semua kabupaten</option>
              {regencyOptions.map((option) => (
                <option key={option} value={option || ''}>
                  {option}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter kecamatan"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setVillageFilter('ALL');
              }}
            >
              <option value="ALL">Semua kecamatan</option>
              {districtOptions.map((option) => (
                <option key={option} value={option || ''}>
                  {option}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filter desa"
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
            >
              <option value="ALL">Semua desa</option>
              {villageOptions.map((option) => (
                <option key={option} value={option || ''}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mb-5">
          {loading ? (
            <Skeleton
              aria-label="Memuat peta distribusi"
              className="h-[60vh] min-h-[320px] rounded-2xl md:h-[480px]"
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={items.length === 0 ? MapPin : Search}
              title={items.length === 0 ? 'Belum ada titik lokasi' : 'Tidak ada peternak yang cocok'}
              description={
                items.length === 0
                  ? 'Titik akan muncul setelah peternak mengisi lokasinya.'
                  : 'Coba ubah kata kunci atau filter wilayah.'
              }
              action={
                items.length > 0 && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset pencarian dan filter
                  </Button>
                )
              }
            />
          ) : (
            <DistributionMap items={filteredItems} />
          )}
        </div>

        {filteredItems.length > 0 && (
          <>
            <h2 className="mb-3 text-lg font-semibold text-ink">
              Daftar peternak ({filteredItems.length})
            </h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <Card key={item.userId}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-ink">{item.name}</h3>
                      <p className="truncate text-sm text-ink-muted">
                        {item.groupName || 'Tanpa kelompok'}
                      </p>
                    </div>
                    <Badge variant="info">{labelSumberLokasi(item.locationSource)}</Badge>
                  </div>

                  <dl className="space-y-1 text-sm">
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-ink-muted">Wilayah</dt>
                      <dd className="min-w-0">
                        {[item.village, item.district, item.regency].filter(Boolean).join(', ') || '-'}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-ink-muted">Alamat</dt>
                      <dd className="min-w-0">{item.addressDetail || '-'}</dd>
                    </div>
                  </dl>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-primary-soft/50 px-2 py-2">
                      <p className="text-xs text-ink-muted">Ternak</p>
                      <p className="font-semibold text-ink">{item.totalSheep}</p>
                    </div>
                    <div className="rounded-xl bg-primary-soft/50 px-2 py-2">
                      <p className="text-xs text-ink-muted">Aktif</p>
                      <p className="font-semibold text-ink">{item.activeSheep}</p>
                    </div>
                    <div className="rounded-xl bg-primary-soft/50 px-2 py-2">
                      <p className="text-xs text-ink-muted">Layak bibit</p>
                      <p className="font-semibold text-ink">{item.eligibleBreeding}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
