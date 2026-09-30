import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ListRow } from '@/components/ui/list-group';
import type { MySheepResponse } from '@/lib/me';
import { formatDiff, formatKg, labelTimeAgo } from '@/lib/format';
import { labelStatusKesehatan } from '@/lib/labels';
import { cn } from '@/lib/utils';

export type MySheepItem = MySheepResponse['data'][number];

const healthVariant = {
  HEALTHY: 'success',
  SICK: 'danger',
  RECOVERING: 'warning',
} as const;

/** Bobot terakhir + tren (▲ naik, ▼ turun). Arah juga dibaca pembaca layar. */
export function WeightWithTrend({ item }: { item: MySheepItem }) {
  if (!item.latestWeight) return <span>Belum ditimbang</span>;

  const trend = item.weightTrend;
  const diff = item.weightDiffKg;

  return (
    <span>
      {formatKg(item.latestWeight.weightKg)}
      {trend && trend !== 'STABLE' && diff != null && (
        <span
          className={cn('ml-1 font-medium', trend === 'UP' ? 'text-success' : 'text-danger')}
        >
          <span aria-hidden="true">{trend === 'UP' ? '▲' : '▼'}</span>{' '}
          {formatDiff(diff)}
          <span className="sr-only">{trend === 'UP' ? ' naik' : ' turun'} dari penimbangan sebelumnya</span>
        </span>
      )}
      {trend === 'STABLE' && <span className="ml-1 text-ink-muted">stabil</span>}
    </span>
  );
}

/** Satu ternak: nama, bobot + tren, kapan terakhir dicatat, dan status kesehatan. */
export function SheepStatusRow({ item }: { item: MySheepItem }) {
  const health = item.latestHealth?.healthStatus;

  return (
    <ListRow
      href={`/sheep/${item.id}`}
      leading={<Avatar name={item.name || item.sheepCode} photoUrl={item.photoUrl} size="md" />}
      title={item.name ? `${item.sheepCode} · ${item.name}` : item.sheepCode}
      subtitle={
        <>
          <WeightWithTrend item={item} /> · {labelTimeAgo(item.lastRecordedAt)}
        </>
      }
      trailing={
        <Badge variant={health ? healthVariant[health] : 'default'}>
          {health ? labelStatusKesehatan(health) : 'Belum dicek'}
        </Badge>
      }
    />
  );
}
