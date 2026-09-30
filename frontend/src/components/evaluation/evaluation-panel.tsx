'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EvaluationDetailResponse } from '@/lib/evaluation';
import { labelStatusData } from '@/lib/labels';
import { cn } from '@/lib/utils';

type Props = {
  evaluation: EvaluationDetailResponse['data'];
};

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

function getStatusVariant(status?: string): Variant {
  switch (status) {
    case 'COMPLETE':
    case 'LAYAK_BIBIT':
    case 'GOOD':
    case 'IDEAL':
    case 'UP':
      return 'success';
    case 'PARTIAL':
    case 'PERLU_PEMANTAUAN':
    case 'FAIR':
    case 'STABLE':
    case 'CAUTION':
      return 'warning';
    case 'MINIMAL':
    case 'BELUM_DIREKOMENDASIKAN':
    case 'POOR':
    case 'DOWN':
    case 'BAD':
    case 'LOW':
    case 'HIGH':
      return 'danger';
    case 'INSUFFICIENT_DATA':
      return 'info';
    default:
      return 'default';
  }
}

const barColor: Record<Variant, string> = {
  success: 'bg-success',
  warning: 'bg-[color:var(--warning-fill)]',
  danger: 'bg-danger',
  info: 'bg-info',
  default: 'bg-primary',
};

const verdictText: Record<string, string> = {
  LAYAK_BIBIT: 'Ternak ini layak dipertimbangkan sebagai bibit.',
  PERLU_PEMANTAUAN: 'Ternak ini perlu dipantau lebih lanjut sebelum dijadikan bibit.',
  BELUM_DIREKOMENDASIKAN: 'Ternak ini belum direkomendasikan sebagai bibit.',
};

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-xs text-ink-muted sm:text-sm">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function EvaluationPanel({ evaluation }: Props) {
  const { evaluation: result, completeness, trend, latestRecords } = evaluation;
  const variant = getStatusVariant(result.breedingStatus);
  const score = Math.max(0, Math.min(100, result.breedingScore));

  const dataChecks = [
    { label: 'Identitas', ok: completeness.identity },
    { label: 'Bobot', ok: completeness.weights },
    { label: 'BCS', ok: completeness.bcs },
    { label: 'Kesehatan', ok: completeness.health },
    { label: 'Reproduksi', ok: completeness.reproduction },
  ];

  return (
    <Card className="mb-5">
      <h3 className="text-lg font-semibold text-ink">Evaluasi ternak</h3>
      <p className="mb-4 text-sm text-ink-muted">
        Hasil olah data rekording untuk menilai performa ternak
      </p>

      {/* Skor utama */}
      <div className="mb-4 rounded-[var(--radius-card)] bg-primary-soft/40 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink-muted">Skor kelayakan bibit</p>
            <p className="text-5xl font-bold leading-none text-ink">
              {result.breedingScore}
              <span className="ml-1 text-lg font-medium text-ink-muted">/100</span>
            </p>
          </div>
          <Badge variant={variant} className="mb-1 text-sm">
            {labelStatusData(result.breedingStatus)}
          </Badge>
        </div>

        <div
          role="progressbar"
          aria-label="Skor kelayakan bibit"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={score}
          className="mt-3 h-3 overflow-hidden rounded-full bg-surface"
        >
          <div className={cn('h-full rounded-full', barColor[variant])} style={{ width: `${score}%` }} />
        </div>

        <p className="mt-3 text-sm font-medium text-ink">
          {verdictText[result.breedingStatus] ?? 'Belum ada kesimpulan.'}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          Kondisi umum:{' '}
          <span className="font-semibold text-ink">{labelStatusData(result.overallCondition)}</span>
        </p>
      </div>

      {/* Alasan dan peringatan */}
      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <CheckCircle2 size={18} className="text-success" aria-hidden="true" />
            Alasan utama
          </h4>
          {result.reasons.length === 0 ? (
            <p className="text-sm text-ink-muted">Belum ada alasan utama.</p>
          ) : (
            <ul className="space-y-2 text-sm text-ink">
              {result.reasons.map((reason, index) => (
                <li key={index} className="rounded-xl bg-success-soft px-3 py-2">
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <AlertTriangle size={18} className="text-warning" aria-hidden="true" />
            Peringatan
          </h4>
          {result.warnings.length === 0 ? (
            <p className="text-sm text-ink-muted">Tidak ada peringatan.</p>
          ) : (
            <ul className="space-y-2 text-sm text-ink">
              {result.warnings.map((warning, index) => (
                <li key={index} className="rounded-xl bg-warning-soft px-3 py-2">
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Metrik pendukung */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Kelengkapan data">
          <span className="text-xl font-bold text-ink">{completeness.score}</span>
          <Badge variant={getStatusVariant(completeness.status)}>
            {labelStatusData(completeness.status)}
          </Badge>
        </Metric>
        <Metric label="Tren bobot">
          <Badge variant={getStatusVariant(trend.weight.status)}>
            {labelStatusData(trend.weight.status)}
          </Badge>
          <span className="text-sm text-ink-muted">{trend.weight.difference ?? '-'}</span>
        </Metric>
        <Metric label="Tren BCS">
          <Badge variant={getStatusVariant(trend.bcs.status)}>
            {labelStatusData(trend.bcs.status)}
          </Badge>
          <span className="text-sm text-ink-muted">{trend.bcs.difference ?? '-'}</span>
        </Metric>
        <Metric label="Tren kesehatan">
          <Badge variant={getStatusVariant(trend.health.status)}>
            {labelStatusData(trend.health.status)}
          </Badge>
        </Metric>
        <Metric label="Kategori BCS">
          <Badge variant={getStatusVariant(latestRecords.bcs?.category)}>
            {labelStatusData(latestRecords.bcs?.category)}
          </Badge>
        </Metric>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-ink">Data yang sudah tercatat</p>
        <div className="flex flex-wrap gap-2">
          {dataChecks.map((item) => (
            <Badge key={item.label} variant={item.ok ? 'success' : 'danger'}>
              {item.ok ? '✓' : '✕'} {item.label}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
