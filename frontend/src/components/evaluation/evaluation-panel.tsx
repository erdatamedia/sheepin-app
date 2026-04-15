'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EvaluationDetailResponse } from '@/lib/evaluation';
import { labelStatusData } from '@/lib/labels';

type Props = {
  evaluation: EvaluationDetailResponse['data'];
};

export function EvaluationPanel({ evaluation }: Props) {
  const getStatusVariant = (status?: string) => {
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
  };

  return (
    <Card className="mb-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Evaluasi Ternak</h3>
          <p className="text-sm text-gray-500">
            Hasil pengolahan data sederhana untuk evaluasi performa ternak
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={getStatusVariant(evaluation.evaluation.breedingStatus)}>
            {labelStatusData(evaluation.evaluation.breedingStatus)}
          </Badge>
          <Badge variant={getStatusVariant(evaluation.evaluation.overallCondition)}>
            {labelStatusData(evaluation.evaluation.overallCondition)}
          </Badge>
        </div>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Skor Kelayakan</p>
          <h4 className="mt-2 text-2xl font-bold text-gray-900">
            {evaluation.evaluation.breedingScore}
          </h4>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Kelengkapan Data</p>
          <div className="mt-2 flex items-center gap-2">
            <h4 className="text-2xl font-bold text-gray-900">
              {evaluation.completeness.score}
            </h4>
            <Badge variant={getStatusVariant(evaluation.completeness.status)}>
              {labelStatusData(evaluation.completeness.status)}
            </Badge>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Tren Bobot</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={getStatusVariant(evaluation.trend.weight.status)}>
              {labelStatusData(evaluation.trend.weight.status)}
            </Badge>
            <span className="text-sm text-gray-600">
              {evaluation.trend.weight.difference ?? '-'}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Kategori BCS</p>
          <div className="mt-2">
            <Badge variant={getStatusVariant(evaluation.latestRecords.bcs?.category)}>
              {labelStatusData(evaluation.latestRecords.bcs?.category)}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 p-4">
          <h4 className="mb-3 text-base font-semibold">Alasan Utama</h4>
          {evaluation.evaluation.reasons.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada alasan utama.</p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-700">
              {evaluation.evaluation.reasons.map((reason, index) => (
                <li key={index} className="rounded-lg bg-green-50 px-3 py-2">
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-100 p-4">
          <h4 className="mb-3 text-base font-semibold">Peringatan</h4>
          {evaluation.evaluation.warnings.length === 0 ? (
            <p className="text-sm text-gray-500">Tidak ada peringatan.</p>
          ) : (
            <ul className="space-y-2 text-sm text-gray-700">
              {evaluation.evaluation.warnings.map((warning, index) => (
                <li key={index} className="rounded-lg bg-yellow-50 px-3 py-2">
                  {warning}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Trend BCS</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={getStatusVariant(evaluation.trend.bcs.status)}>
              {labelStatusData(evaluation.trend.bcs.status)}
            </Badge>
            <span className="text-sm text-gray-600">
              {evaluation.trend.bcs.difference ?? '-'}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Trend Kesehatan</p>
          <div className="mt-2">
            <Badge variant={getStatusVariant(evaluation.trend.health.status)}>
              {labelStatusData(evaluation.trend.health.status)}
            </Badge>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Status Data</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={evaluation.completeness.identity ? 'success' : 'danger'}>
              Identitas
            </Badge>
            <Badge variant={evaluation.completeness.weights ? 'success' : 'danger'}>
              Bobot
            </Badge>
            <Badge variant={evaluation.completeness.bcs ? 'success' : 'danger'}>
              BCS
            </Badge>
            <Badge variant={evaluation.completeness.health ? 'success' : 'danger'}>
              Kesehatan
            </Badge>
            <Badge variant={evaluation.completeness.reproduction ? 'success' : 'danger'}>
              Reproduksi
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
