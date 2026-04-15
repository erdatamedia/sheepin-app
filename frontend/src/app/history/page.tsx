'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getMe, type MeResponse } from '@/lib/me';
import { getRecordingHistory, type RecordingHistoryResponse } from '@/lib/recording';
import { labelJenisCatatan, labelPeran } from '@/lib/labels';

type HistoryItem = RecordingHistoryResponse['data'][number];

export default function HistoryPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [quickFilter, setQuickFilter] = useState<
    'TODAY' | 'FOLLOW_UP' | 'EXITED' | 'ALL'
  >('TODAY');

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, historyRes] = await Promise.all([
          getMe(),
          getRecordingHistory(),
        ]);
        setMe(meRes);
        setItems(historyRes.data || []);
      } catch (error) {
        console.error('Gagal memuat riwayat rekording:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredItems = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);

    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        item.type.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.sheep.sheepCode.toLowerCase().includes(q) ||
        (item.sheep.name || '').toLowerCase().includes(q) ||
        (item.sheep.ownerUser?.name || '').toLowerCase().includes(q);

      const matchesQuickFilter =
        quickFilter === 'ALL'
          ? true
          : quickFilter === 'TODAY'
            ? item.recordDate.slice(0, 10) === todayKey
            : quickFilter === 'EXITED'
              ? item.type === 'STATUS'
              : item.type === 'STATUS' ||
                (item.type === 'HEALTH' && item.title === 'SICK') ||
                (item.type === 'REPRODUCTION' &&
                  /bunting|beranak/i.test(item.title));

      return matchesSearch && matchesQuickFilter;
    });
  }, [items, quickFilter, search]);

  const summary = useMemo(() => {
    return {
      today: items.filter(
        (item) => item.recordDate.slice(0, 10) === new Date().toISOString().slice(0, 10),
      ).length,
      followUp: items.filter(
        (item) =>
          item.type === 'STATUS' ||
          (item.type === 'HEALTH' && item.title === 'SICK') ||
          (item.type === 'REPRODUCTION' && /bunting|beranak/i.test(item.title)),
      ).length,
      exited: items.filter((item) => item.type === 'STATUS').length,
    };
  }, [items]);

  const getTypeVariant = (type: string) => {
    switch (type) {
      case 'WEIGHT':
        return 'info';
      case 'BCS':
        return 'warning';
      case 'HEALTH':
        return 'success';
      case 'REPRODUCTION':
        return 'warning';
      case 'STATUS':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Riwayat Rekording</h1>
          <p className="mt-1 text-sm text-gray-500">
            {me?.role === 'FARMER'
              ? 'Fokus ke kejadian lapangan yang baru dicatat dan yang masih perlu tindak lanjut'
              : 'Lihat riwayat input bobot, BCS, kesehatan, reproduksi, dan status ternak'}
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Pengguna</p>
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
            <p className="text-sm text-gray-500">Total Riwayat</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {items.length}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Tampil</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {filteredItems.length}
            </h2>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card className="border-blue-100 bg-blue-50">
            <p className="text-sm text-blue-700">Hari Ini</p>
            <h2 className="mt-2 text-2xl font-bold text-blue-900">
              {summary.today}
            </h2>
            <p className="mt-2 text-sm text-blue-700">
              Aktivitas yang tercatat hari ini
            </p>
          </Card>

          <Card className="border-yellow-100 bg-yellow-50">
            <p className="text-sm text-yellow-700">Perlu Tindak Lanjut</p>
            <h2 className="mt-2 text-2xl font-bold text-yellow-900">
              {summary.followUp}
            </h2>
            <p className="mt-2 text-sm text-yellow-700">
              Status, sakit, bunting, atau beranak
            </p>
          </Card>

          <Card className="border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Ternak Keluar</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {summary.exited}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Riwayat mati, terjual, atau afkir
            </p>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'TODAY', label: 'Hari Ini' },
                { key: 'FOLLOW_UP', label: 'Perlu Tindak Lanjut' },
                { key: 'EXITED', label: 'Ternak Keluar' },
                { key: 'ALL', label: 'Semua' },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={quickFilter === item.key ? 'solid' : 'outline'}
                  onClick={() =>
                    setQuickFilter(
                      item.key as 'TODAY' | 'FOLLOW_UP' | 'EXITED' | 'ALL',
                    )
                  }
                  className="h-10 rounded-full px-4"
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <Input
              placeholder="Cari jenis rekording, kode ternak, pemilik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat riwayat rekording...</p>
        ) : filteredItems.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-500">Belum ada riwayat rekording.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card
                key={`${item.type}-${item.id}`}
                className={
                  item.type === 'STATUS'
                    ? 'border-red-100'
                    : item.type === 'HEALTH' && item.title === 'SICK'
                      ? 'border-yellow-100'
                      : ''
                }
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={getTypeVariant(item.type)}>
                        {labelJenisCatatan(item.type)}
                      </Badge>
                      <p className="text-sm text-gray-500">
                        {new Date(item.recordDate).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.description}
                    </p>

                    {me?.role === 'FARMER' && (
                      <div className="mt-3">
                        {item.type === 'STATUS' ? (
                          <Badge variant="danger">Ternak sudah keluar dari ternak aktif</Badge>
                        ) : item.type === 'HEALTH' && item.title === 'SICK' ? (
                          <Badge variant="warning">Perlu cek kesehatan lanjutan</Badge>
                        ) : item.type === 'REPRODUCTION' &&
                          /bunting|beranak/i.test(item.title) ? (
                          <Badge variant="warning">Perlu tindak lanjut reproduksi</Badge>
                        ) : null}
                      </div>
                    )}

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Ternak:</span>{' '}
                        <Link
                          href={`/sheep/${item.sheep.id}`}
                          className="text-gray-900 underline"
                        >
                          {item.sheep.sheepCode}
                        </Link>
                        {item.sheep.name ? ` - ${item.sheep.name}` : ''}
                      </p>
                      <p>
                        <span className="font-medium">Pemilik:</span>{' '}
                        {item.sheep.ownerUser?.name || '-'}
                      </p>
                      <p>
                        <span className="font-medium">Dicatat oleh:</span>{' '}
                        {item.createdBy.name} ({labelPeran(item.createdBy.role)})
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
