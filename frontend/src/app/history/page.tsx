'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Baby,
  CircleX,
  Gauge,
  HeartPulse,
  History,
  RefreshCw,
  Scale,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { getMe, type MeResponse } from '@/lib/me';
import { getRecordingHistory, type RecordingHistoryResponse } from '@/lib/recording';
import { labelStatusKesehatan } from '@/lib/labels';
import { daysSince, formatDayLong } from '@/lib/format';
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

  const typeIcon: Record<string, LucideIcon> = {
    WEIGHT: Scale,
    BCS: Gauge,
    HEALTH: HeartPulse,
    REPRODUCTION: Baby,
    STATUS: CircleX,
  };

  const toneClass = {
    info: 'bg-primary-soft text-primary-strong',
    warning: 'bg-warning-soft text-warning',
    success: 'bg-success-soft text-success',
    danger: 'bg-danger-soft text-danger',
    default: 'bg-tint text-ink-soft',
  } as const;

  const rowTitle = (item: HistoryItem) =>
    item.type === 'HEALTH' && ['SICK', 'HEALTHY', 'RECOVERING'].includes(item.title)
      ? labelStatusKesehatan(item.title)
      : item.title;

  // Kelompokkan per hari; urutan dari server dipertahankan (terbaru di atas).
  const dayGroups = useMemo(() => {
    const groups: Array<{ key: string; items: HistoryItem[] }> = [];
    for (const item of filteredItems) {
      const key = item.recordDate.slice(0, 10);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(item);
      else groups.push({ key, items: [item] });
    }
    return groups;
  }, [filteredItems]);

  const dayHeading = (key: string) => {
    const days = daysSince(key);
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    return formatDayLong(key);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <PageHeader
          title="Riwayat"
          description={
            isFarmer
              ? 'Catatan terbaru dan yang perlu ditindaklanjuti'
              : 'Bobot, kondisi, kesehatan, dan kejadian semua ternak'
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
                    'min-h-9 shrink-0 rounded-full px-3.5 text-[14px] font-semibold transition',
                    active ? 'bg-primary text-white' : 'bg-tint text-ink-soft active:brightness-95',
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
        </div>

        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Memuat riwayat">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-16 rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            title="Riwayat gagal dimuat"
            description="Periksa sambungan internet Anda lalu coba lagi."
            action={
              <Button
                variant="tinted"
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
                ? 'Catatan akan muncul di sini setelah Anda mulai mencatat.'
                : 'Coba ganti filter atau kata kunci pencarian.'
            }
            action={
              items.length > 0 && quickFilter !== 'ALL' ? (
                <Button variant="tinted" onClick={() => setQuickFilter('ALL')}>
                  Tampilkan semua
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-5 lg:max-w-3xl">
            {dayGroups.map((group) => (
              <ListGroup key={group.key} header={dayHeading(group.key)}>
                {group.items.map((item) => {
                  const Icon = typeIcon[item.type] ?? Scale;
                  const tone = getTypeVariant(item.type) as keyof typeof toneClass;
                  return (
                    <ListRow
                      key={`${item.type}-${item.id}`}
                      href={`/sheep/${item.sheep.id}`}
                      leadingSize="circle"
                      leading={
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full',
                            toneClass[tone] ?? toneClass.default,
                          )}
                        >
                          <Icon size={18} />
                        </span>
                      }
                      title={rowTitle(item)}
                      subtitle={[
                        `${item.sheep.sheepCode}${item.sheep.name ? ` - ${item.sheep.name}` : ''}`,
                        item.description,
                        !isFarmer && item.sheep.ownerUser?.name,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      trailing={
                        isFarmer && isFollowUp(item) ? (
                          <Badge variant={item.type === 'STATUS' ? 'danger' : 'warning'}>
                            Tindak lanjut
                          </Badge>
                        ) : undefined
                      }
                    />
                  );
                })}
              </ListGroup>
            ))}
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
