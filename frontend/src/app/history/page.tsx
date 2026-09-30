'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { getMe, type MeResponse } from '@/lib/me';
import { getRecordingHistory, type RecordingHistoryResponse } from '@/lib/recording';
import { labelJenisCatatan, labelPeran } from '@/lib/labels';
import { cn, todayLocal } from '@/lib/utils';

type HistoryItem = RecordingHistoryResponse['data'][number];
type QuickFilter = 'TODAY' | 'FOLLOW_UP' | 'EXITED' | 'ALL';

const isFollowUp = (item: HistoryItem) =>
  item.type === 'STATUS' ||
  (item.type === 'HEALTH' && item.title === 'SICK') ||
  (item.type === 'REPRODUCTION' && /bunting|beranak/i.test(item.title));

const filters: { key: QuickFilter; label: string }[] = [
  { key: 'TODAY', label: 'Hari ini' },
  { key: 'FOLLOW_UP', label: 'Perlu tindak lanjut' },
  { key: 'EXITED', label: 'Ternak keluar' },
  { key: 'ALL', label: 'Semua' },
];

function getTypeVariant(type: string) {
  switch (type) {
    case 'WEIGHT':
      return 'info' as const;
    case 'BCS':
    case 'REPRODUCTION':
      return 'warning' as const;
    case 'HEALTH':
      return 'success' as const;
    case 'STATUS':
      return 'danger' as const;
    default:
      return 'default' as const;
  }
}

export default function HistoryPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('TODAY');

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const [meRes, historyRes] = await Promise.all([getMe(), getRecordingHistory()]);
      setMe(meRes);
      setItems(historyRes.data || []);
    } catch (error) {
      console.error('Gagal memuat riwayat rekording:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredItems = useMemo(() => {
    const todayKey = todayLocal();
    const q = search.toLowerCase();

    return items.filter((item) => {
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
              : isFollowUp(item);

      return matchesSearch && matchesQuickFilter;
    });
  }, [items, quickFilter, search]);

  const summary = useMemo(() => {
    const todayKey = todayLocal();
    return {
      today: items.filter((item) => item.recordDate.slice(0, 10) === todayKey).length,
      followUp: items.filter(isFollowUp).length,
      exited: items.filter((item) => item.type === 'STATUS').length,
    };
  }, [items]);

  const isFarmer = me?.role === 'FARMER';

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <PageHeader
          title="Riwayat Rekording"
          description={
            isFarmer
              ? 'Kejadian lapangan yang baru dicatat dan yang perlu tindak lanjut'
              : 'Riwayat bobot, BCS, kesehatan, reproduksi, dan status ternak'
          }
        />

        <div className="mb-5 grid grid-cols-3 gap-3">
          <StatTile label="Hari ini" value={summary.today} tone="info" />
          <StatTile label="Tindak lanjut" value={summary.followUp} tone="warning" />
          <StatTile label="Ternak keluar" value={summary.exited} />
        </div>

        <div className="mb-4 space-y-3">
          <div
            role="radiogroup"
            aria-label="Filter riwayat"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            {filters.map((item) => {
              const active = quickFilter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setQuickFilter(item.key)}
                  className={cn(
                    'min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition',
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-surface text-ink hover:border-primary/40',
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="relative">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <Input
              className="pl-11"
              aria-label="Cari riwayat"
              placeholder="Cari jenis, kode ternak, atau pemilik"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!loading && !failed && (
            <p className="text-sm text-ink-muted">
              Menampilkan {filteredItems.length} dari {items.length} catatan
            </p>
          )}
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Memuat riwayat">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-28 rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            title="Riwayat gagal dimuat"
            description="Periksa sambungan internet Anda lalu coba lagi."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  void load();
                }}
              >
                <RefreshCw size={18} aria-hidden="true" />
                Coba lagi
              </Button>
            }
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={items.length === 0 ? History : Search}
            title={items.length === 0 ? 'Belum ada riwayat' : 'Tidak ada catatan yang cocok'}
            description={
              items.length === 0
                ? 'Catatan akan muncul di sini setelah Anda mulai rekording.'
                : 'Coba ganti filter atau kata kunci pencarian.'
            }
            action={
              items.length > 0 && quickFilter !== 'ALL' ? (
                <Button variant="outline" onClick={() => setQuickFilter('ALL')}>
                  Tampilkan semua
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card
                key={`${item.type}-${item.id}`}
                className={cn(
                  item.type === 'STATUS' && 'border-[color:var(--danger-border)]',
                  item.type === 'HEALTH' &&
                    item.title === 'SICK' &&
                    'border-[color:var(--warning-border)]',
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={getTypeVariant(item.type)}>{labelJenisCatatan(item.type)}</Badge>
                  <p className="text-sm text-ink-muted">
                    {new Date(item.recordDate).toLocaleString('id-ID')}
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-1 text-sm text-ink/80">{item.description}</p>

                {isFarmer && isFollowUp(item) && (
                  <div className="mt-3">
                    {item.type === 'STATUS' ? (
                      <Badge variant="danger">Ternak sudah keluar dari ternak aktif</Badge>
                    ) : item.type === 'HEALTH' ? (
                      <Badge variant="warning">Perlu cek kesehatan lanjutan</Badge>
                    ) : (
                      <Badge variant="warning">Perlu tindak lanjut reproduksi</Badge>
                    )}
                  </div>
                )}

                <dl className="mt-3 space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-ink-muted">Ternak</dt>
                    <dd className="min-w-0">
                      <Link
                        href={`/sheep/${item.sheep.id}`}
                        className="inline-flex min-h-8 items-center font-semibold text-primary underline underline-offset-4"
                      >
                        {item.sheep.sheepCode}
                      </Link>
                      {item.sheep.name ? ` - ${item.sheep.name}` : ''}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-ink-muted">Pemilik</dt>
                    <dd className="min-w-0">{item.sheep.ownerUser?.name || '-'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-ink-muted">Dicatat oleh</dt>
                    <dd className="min-w-0">
                      {item.createdBy.name} ({labelPeran(item.createdBy.role)})
                    </dd>
                  </div>
                </dl>
              </Card>
            ))}
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
