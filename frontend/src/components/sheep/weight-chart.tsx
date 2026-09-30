'use client';

import { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { Segmented } from '@/components/ui/segmented';
import { daysBetween, averageDailyGainGrams, niceScale, type WeightRecord } from '@/lib/progress';
import { formatDayLong, formatDayShort, formatKg } from '@/lib/format';
import { cn } from '@/lib/utils';

const W = 320;
const H = 170;
const PAD = { left: 38, right: 14, top: 14, bottom: 26 };

type Props = {
  weights: WeightRecord[];
  /** Tautan untuk ajakan saat belum ada data. */
  recordHref: string;
};

/** Grafik bobot dari waktu ke waktu. Sentuh atau geser untuk melihat tiap penimbangan. */
export function WeightChart({ weights, recordHref }: Props) {
  const [range, setRange] = useState<'all' | '90'>('all');
  const [active, setActive] = useState<number | null>(null);

  const all = useMemo(
    () =>
      [...weights]
        .map((w) => ({ date: w.recordDate.slice(0, 10), weightKg: w.weightKg }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [weights],
  );

  const spanDays = all.length > 1 ? daysBetween(all[0].date, all[all.length - 1].date) : 0;
  const canFilter = spanDays > 100;

  const points = useMemo(() => {
    if (range === '90' && canFilter) {
      const last = all[all.length - 1].date;
      return all.filter((p) => daysBetween(p.date, last) <= 90);
    }
    return all;
  }, [all, range, canFilter]);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;

    const values = points.map((p) => p.weightKg);
    const scale = niceScale(Math.min(...values), Math.max(...values));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const t0 = points[0].date;
    const total = Math.max(1, daysBetween(t0, points[points.length - 1].date));

    const xs = points.map((p) =>
      points.length === 1 ? PAD.left + innerW / 2 : PAD.left + (daysBetween(t0, p.date) / total) * innerW,
    );
    const y = (value: number) =>
      PAD.top + innerH - ((value - scale.min) / (scale.max - scale.min)) * innerH;
    const ys = points.map((p) => y(p.weightKg));

    const line = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
    const area = `${line} L${xs[xs.length - 1].toFixed(1)},${PAD.top + innerH} L${xs[0].toFixed(1)},${PAD.top + innerH} Z`;

    return { scale, xs, ys, y, line, area, innerH };
  }, [points]);

  if (all.length === 0 || !geometry) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
          <Scale size={22} aria-hidden="true" />
        </span>
        <p className="text-[17px] font-semibold text-ink">Belum ada data bobot</p>
        <p className="max-w-xs text-[15px] text-ink-muted">
          Timbang ternak ini dan catat hasilnya. Grafik perkembangan muncul setelah penimbangan pertama.
        </p>
        <a
          href={recordHref}
          className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4"
        >
          Catat penimbangan
        </a>
      </div>
    );
  }

  const selectedIndex = active ?? points.length - 1;
  const selected = points[selectedIndex];
  const previous = points[selectedIndex - 1];
  const diff = previous ? Math.round((selected.weightKg - previous.weightKg) * 10) / 10 : null;
  const gain = averageDailyGainGrams(points);

  const pickNearest = (clientX: number, rect: DOMRect) => {
    const x = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    geometry.xs.forEach((px, i) => {
      if (Math.abs(px - x) < Math.abs(geometry.xs[best] - x)) best = i;
    });
    setActive(best);
  };

  return (
    <div>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[32px] font-bold leading-none tracking-tight text-ink">
            {formatKg(selected.weightKg)}
          </p>
          <p className="mt-1.5 text-[14px] text-ink-muted">
            {formatDayLong(selected.date)}
            {diff !== null && Math.abs(diff) > 0.1 && (
              <span className={cn('ml-2 font-medium', diff > 0 ? 'text-success' : 'text-danger')}>
                <span aria-hidden="true">{diff > 0 ? '▲' : '▼'}</span>{' '}
                {Math.abs(diff).toLocaleString('id-ID', { maximumFractionDigits: 1 })} kg
              </span>
            )}
          </p>
        </div>

        {canFilter && (
          <Segmented
            label="Rentang waktu"
            className="w-44 shrink-0"
            value={range}
            onChange={(value) => {
              setRange(value as 'all' | '90');
              setActive(null);
            }}
            options={[
              { value: '90', label: '90 hari' },
              { value: 'all', label: 'Semua' },
            ]}
          />
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Grafik bobot. ${points.length} penimbangan, terakhir ${formatKg(points[points.length - 1].weightKg)}.`}
        className="block h-auto w-full select-none"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => pickNearest(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerMove={(e) => pickNearest(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
      >
        {geometry.scale.ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={geometry.y(tick)}
              y2={geometry.y(tick)}
              stroke="var(--border-soft)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={geometry.y(tick) + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--ink-muted)"
            >
              {tick.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
            </text>
          </g>
        ))}

        <text x={PAD.left} y={H - 6} fontSize={11} fill="var(--ink-muted)">
          {formatDayShort(points[0].date)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize={11} fill="var(--ink-muted)">
            {formatDayShort(points[points.length - 1].date)}
          </text>
        )}

        {points.length > 1 && (
          <>
            <path d={geometry.area} fill="var(--accent-soft)" opacity={0.55} />
            <path
              d={geometry.line}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        )}

        {active !== null && (
          <line
            x1={geometry.xs[selectedIndex]}
            x2={geometry.xs[selectedIndex]}
            y1={PAD.top}
            y2={PAD.top + geometry.innerH}
            stroke="var(--accent-icon)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {points.map((point, i) => (
          <circle
            key={point.date + i}
            cx={geometry.xs[i]}
            cy={geometry.ys[i]}
            r={i === selectedIndex ? 5.5 : 3.5}
            fill={i === selectedIndex ? 'var(--accent)' : 'var(--surface-strong)'}
            stroke="var(--accent)"
            strokeWidth={2}
          />
        ))}
      </svg>

      <table className="sr-only">
        <caption>Riwayat bobot</caption>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Bobot</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point, i) => (
            <tr key={point.date + i}>
              <td>{formatDayLong(point.date)}</td>
              <td>{formatKg(point.weightKg)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {points.length > 1 && (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-tint px-2 py-2">
            <dt className="text-[12px] text-ink-muted">Awal</dt>
            <dd className="text-[15px] font-semibold text-ink">{formatKg(points[0].weightKg)}</dd>
          </div>
          <div className="rounded-xl bg-tint px-2 py-2">
            <dt className="text-[12px] text-ink-muted">Terakhir</dt>
            <dd className="text-[15px] font-semibold text-ink">
              {formatKg(points[points.length - 1].weightKg)}
            </dd>
          </div>
          <div className="rounded-xl bg-tint px-2 py-2">
            <dt className="text-[12px] text-ink-muted">Rata-rata/hari</dt>
            <dd className="text-[15px] font-semibold text-ink">
              {gain === null ? '-' : `${gain > 0 ? '+' : ''}${gain} g`}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
