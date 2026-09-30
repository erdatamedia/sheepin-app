'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { LoadError } from '@/components/ui/load-error';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Avatar } from '@/components/ui/avatar';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { Sheet } from '@/components/ui/sheet';
import { StatTile } from '@/components/ui/stat-tile';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { getMapDistribution, type MapDistributionResponse } from '@/lib/location';

const DistributionMap = dynamic(() => import('@/components/map/distribution-map'), { ssr: false });

export default function MapPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [items, setItems] = useState<MapDistributionResponse['data']>([]);

  const [search, setSearch] = useState('');
  const [regencyFilter, setRegencyFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const res = await getMapDistribution();
      setItems(res.data || []);
    } catch (error) {
      console.error('Gagal memuat data distribusi:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const regencyOptions = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.regency).filter(Boolean))).sort();
  }, [items]);

  const districtOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .filter((item) => (regencyFilter === 'ALL' ? true : item.regency === regencyFilter))
          .map((item) => item.district)
          .filter(Boolean),
      ),
    ).sort();
  }, [items, regencyFilter]);

  const villageOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .filter((item) => (regencyFilter === 'ALL' ? true : item.regency === regencyFilter))
          .filter((item) => (districtFilter === 'ALL' ? true : item.district === districtFilter))
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

      const matchesRegency = regencyFilter === 'ALL' || item.regency === regencyFilter;

      const matchesDistrict = districtFilter === 'ALL' || item.district === districtFilter;

      const matchesVillage = villageFilter === 'ALL' || item.village === villageFilter;

      return matchesSearch && matchesRegency && matchesDistrict && matchesVillage;
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

  const selectField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    allLabel: string,
    options: Array<string | null | undefined>,
  ) => (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-ink">{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="ALL">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option || ''}>
            {option}
          </option>
        ))}
      </Select>
    </label>
  );

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <PageHeader title="Peta" description="Lokasi peternak dan sebaran populasi ternak" />

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <StatTile key={tile.label} label={tile.label} value={tile.value} />
          ))}
        </div>

        <div className="mb-4 flex gap-2">
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
            variant={activeFilterCount ? 'solid' : 'tinted'}
            className="h-12"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={18} aria-hidden="true" />
            Wilayah{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </Button>
        </div>

        <Sheet open={showFilters} onClose={() => setShowFilters(false)} title="Filter wilayah">
          <div className="space-y-4">
            {selectField(
              'Kabupaten',
              regencyFilter,
              (value) => {
                setRegencyFilter(value);
                setDistrictFilter('ALL');
                setVillageFilter('ALL');
              },
              'Semua kabupaten',
              regencyOptions,
            )}
            {selectField(
              'Kecamatan',
              districtFilter,
              (value) => {
                setDistrictFilter(value);
                setVillageFilter('ALL');
              },
              'Semua kecamatan',
              districtOptions,
            )}
            {selectField('Desa', villageFilter, setVillageFilter, 'Semua desa', villageOptions)}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button variant="tinted" size="lg" onClick={resetFilters}>
                Reset
              </Button>
              <Button size="lg" onClick={() => setShowFilters(false)}>
                Lihat {filteredItems.length} peternak
              </Button>
            </div>
          </div>
        </Sheet>

        <div className="mb-6">
          {loading ? (
            <Skeleton
              aria-label="Memuat peta distribusi"
              className="h-[60vh] min-h-[320px] rounded-2xl md:h-[480px]"
            />
          ) : failed ? (
            <LoadError
              onRetry={() => {
                setLoading(true);
                void load();
              }}
            />
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={items.length === 0 ? MapPin : Search}
              title={
                items.length === 0 ? 'Belum ada titik lokasi' : 'Tidak ada peternak yang cocok'
              }
              description={
                items.length === 0
                  ? 'Titik akan muncul setelah peternak mengisi lokasinya.'
                  : 'Coba ubah kata kunci atau filter wilayah.'
              }
              action={
                items.length > 0 && (
                  <Button variant="tinted" onClick={resetFilters}>
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
          <ListGroup header={`Daftar peternak (${filteredItems.length})`} className="lg:max-w-3xl">
            {filteredItems.map((item) => (
              <ListRow
                key={item.userId}
                href={`/farmers/${item.userId}`}
                leading={<Avatar name={item.name} size="md" />}
                title={item.name}
                subtitle={
                  [
                    item.groupName,
                    [item.village, item.district, item.regency].filter(Boolean).join(', '),
                  ]
                    .filter(Boolean)
                    .join(' · ') || '-'
                }
                trailing={
                  <span className="text-right text-[13px] leading-tight text-ink-muted">
                    <span className="block text-[17px] font-semibold text-ink">
                      {item.totalSheep}
                    </span>
                    ternak
                  </span>
                }
              />
            ))}
          </ListGroup>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
