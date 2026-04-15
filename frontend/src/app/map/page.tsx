'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
        (item.loginCode || '').toLowerCase().includes(search.toLowerCase()) ||
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

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Peta Sebaran Domba
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sebaran lokasi peternak dan ringkasan populasi ternak
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Titik Peternak</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {summary.farmers}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Total Ternak</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {summary.totalSheep}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Ternak Aktif</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {summary.active}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Layak Bibit</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {summary.eligible}
            </h2>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Filter Wilayah
            </h2>
            <p className="text-sm text-gray-500">
              Saring marker berdasarkan wilayah atau nama peternak
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              placeholder="Cari nama, ID, kelompok, alamat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
              value={regencyFilter}
              onChange={(e) => {
                setRegencyFilter(e.target.value);
                setDistrictFilter('ALL');
                setVillageFilter('ALL');
              }}
            >
              <option value="ALL">Semua Kabupaten</option>
              {regencyOptions.map((option) => (
                <option key={option} value={option || ''}>
                  {option}
                </option>
              ))}
            </select>

            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setVillageFilter('ALL');
              }}
            >
              <option value="ALL">Semua Kecamatan</option>
              {districtOptions.map((option) => (
                <option key={option} value={option || ''}>
                  {option}
                </option>
              ))}
            </select>

            <select
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
            >
              <option value="ALL">Semua Desa</option>
              {villageOptions.map((option) => (
                <option key={option} value={option || ''}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="mb-6">
          {loading ? (
            <p className="text-sm text-gray-500">Memuat peta distribusi...</p>
          ) : (
            <DistributionMap items={filteredItems} />
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.userId}>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.loginCode || '-'} • {item.groupName || '-'}
                  </p>
                </div>
                <Badge variant="info">{labelSumberLokasi(item.locationSource)}</Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">Wilayah:</span>{' '}
                  {[item.village, item.district, item.regency]
                    .filter(Boolean)
                    .join(', ') || '-'}
                </p>
                <p>
                  <span className="font-medium">Alamat:</span>{' '}
                  {item.addressDetail || '-'}
                </p>
                <p>
                  <span className="font-medium">Ternak:</span> {item.totalSheep}
                </p>
                <p>
                  <span className="font-medium">Aktif:</span> {item.activeSheep}
                </p>
                <p>
                  <span className="font-medium">Layak Bibit:</span>{' '}
                  {item.eligibleBreeding}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
