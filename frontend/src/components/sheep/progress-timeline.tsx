'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Baby, Gauge, HeartPulse, Scale, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { formatDayShort } from '@/lib/format';
import {
  buildTimeline,
  groupByMonth,
  type BcsRecord,
  type HealthRecord,
  type ReproductionRecord,
  type TimelineKind,
  type TimelineTone,
  type WeightRecord,
} from '@/lib/progress';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

const kindMeta: Record<TimelineKind, { icon: LucideIcon; label: string }> = {
  WEIGHT: { icon: Scale, label: 'Bobot' },
  BCS: { icon: Gauge, label: 'Kondisi' },
  HEALTH: { icon: HeartPulse, label: 'Kesehatan' },
  REPRODUCTION: { icon: Baby, label: 'Kawin & beranak' },
};

const toneClass: Record<TimelineTone, string> = {
  default: 'bg-primary-soft text-primary-strong',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

type Props = {
  weights: WeightRecord[];
  bcs: BcsRecord[];
  health: HealthRecord[];
  reproduction: ReproductionRecord[];
  recordHref: string;
};

type Filter = 'ALL' | TimelineKind;

/** Semua catatan satu ternak dalam satu linimasa, dikelompokkan per bulan. */
export function ProgressTimeline({ weights, bcs, health, reproduction, recordHref }: Props) {
  const [filter, setFilter] = useState<Filter>('ALL');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const all = useMemo(
    () => buildTimeline({ weights, bcs, health, reproduction }),
    [weights, bcs, health, reproduction],
  );

  const filtered = filter === 'ALL' ? all : all.filter((event) => event.kind === filter);
  const shown = filtered.slice(0, visible);
  const groups = groupByMonth(shown);

  const filters: Array<{ key: Filter; label: string }> = [
    { key: 'ALL', label: 'Semua' },
    ...(Object.keys(kindMeta) as TimelineKind[]).map((key) => ({ key, label: kindMeta[key].label })),
  ];

  if (all.length === 0) {
    return (
      <div className="glass rounded-[var(--radius-card)] px-4 py-8 text-center">
        <p className="text-[17px] font-semibold text-ink">Belum ada catatan</p>
        <p className="mx-auto mt-1 max-w-xs text-[15px] text-ink-muted">
          Setiap penimbangan, pemeriksaan, dan kejadian akan muncul di sini sebagai riwayat perkembangan.
        </p>
        <Link
          href={recordHref}
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
        >
          Catat sekarang
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Filter linimasa"
        className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setFilter(item.key);
                setVisible(PAGE_SIZE);
              }}
              className={cn(
                'min-h-11 shrink-0 rounded-full px-3.5 text-[14px] font-semibold transition',
                active
                  ? 'border border-white/30 bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] text-white'
                  : 'glass text-ink-soft active:brightness-95',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="glass rounded-[var(--radius-card)] px-4 py-6 text-center text-[15px] text-ink-muted">
          Belum ada catatan untuk jenis ini.
        </p>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <ListGroup key={group.key} header={group.label}>
              {group.events.map((event) => {
                const Icon = kindMeta[event.kind].icon;
                return (
                  <ListRow
                    key={event.id}
                    leading={
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-full',
                          toneClass[event.tone],
                        )}
                      >
                        <Icon size={18} />
                      </span>
                    }
                    leadingSize="circle"
                    title={event.title}
                    subtitle={event.detail}
                    value={formatDayShort(event.date)}
                  />
                );
              })}
            </ListGroup>
          ))}

          {filtered.length > visible && (
            <Button variant="tinted" className="w-full" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
              Tampilkan lebih banyak ({filtered.length - visible})
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
