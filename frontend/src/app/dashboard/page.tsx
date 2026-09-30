'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ClipboardPlus, Map, PawPrint, RefreshCw } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button, buttonClassName } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { api } from '@/lib/api';
import { getMe, getMySheep, type MeResponse, type MySheepResponse } from '@/lib/me';
import { getEvaluationSummary, type EvaluationSummaryResponse } from '@/lib/evaluation';
import { getRecordingHistory, type RecordingHistoryResponse } from '@/lib/recording';
import {
  labelJenisCatatan,
  labelJenisKelamin,
  labelStatusKesehatan,
  labelStatusTernak,
} from '@/lib/labels';
import { todayLocal } from '@/lib/utils';

type DashboardResponse = {
  message: string;
  data: {
    sheep: {
      total: number;
      male: number;
      female: number;
      active: number;
    };
    records: {
      weights: number;
      bcs: number;
      health: number;
      reproduction: number;
    };
    recentSheep: Array<{
      id: string;
      sheepCode: string;
      name?: string;
      breed: string;
      gender: string;
      status: string;
      createdAt: string;
    }>;
  };
};

type HistoryItem = RecordingHistoryResponse['data'][number];

function historyVariant(type: HistoryItem['type']) {
  switch (type) {
    case 'STATUS':
      return 'danger' as const;
    case 'HEALTH':
      return 'success' as const;
    case 'REPRODUCTION':
      return 'warning' as const;
    default:
      return 'info' as const;
  }
}

function SectionCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </Card>
  );
}

const rowLink =
  'block rounded-xl border border-line p-3 transition active:bg-primary-soft/40 sm:p-4';

function ActivityRow({ item, variant }: { item: HistoryItem; variant: 'danger' | 'success' | 'warning' | 'info' }) {
  return (
    <Link href={`/sheep/${item.sheep.id}`} className={rowLink}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{item.title}</p>
          <p className="truncate text-sm text-ink-muted">
            {item.sheep.sheepCode}
            {item.sheep.name ? ` - ${item.sheep.name}` : ''}
          </p>
        </div>
        <Badge variant={variant}>{labelJenisCatatan(item.type)}</Badge>
      </div>
      <p className="mt-1.5 text-sm text-ink/80">{item.description}</p>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat dasbor">
      <Skeleton className="h-24 rounded-[var(--radius-card)]" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-[var(--radius-card)]" />
    </div>
  );
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [summary, setSummary] = useState<DashboardResponse['data'] | null>(null);
  const [evaluationSummary, setEvaluationSummary] =
    useState<EvaluationSummaryResponse['data'] | null>(null);
  const [mySheep, setMySheep] = useState<MySheepResponse['data']>([]);
  const [recentHistory, setRecentHistory] = useState<RecordingHistoryResponse['data']>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setFailed(false);
      const meData = await getMe();
      setMe(meData);

      if (meData.role === 'ADMIN' || meData.role === 'OFFICER') {
        const [dashboardRes, evaluationRes] = await Promise.all([
          api.get('/dashboard/summary'),
          getEvaluationSummary(),
        ]);

        setSummary(dashboardRes.data.data);
        setEvaluationSummary(evaluationRes.data);
      } else {
        const [mySheepRes, historyRes] = await Promise.all([
          getMySheep(),
          getRecordingHistory(),
        ]);

        setMySheep(mySheepRes.data);
        setRecentHistory(historyRes.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Gagal memuat dashboard:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const retry = (
    <Button
      variant="outline"
      onClick={() => {
        setLoading(true);
        void fetchDashboard();
      }}
    >
      <RefreshCw size={18} aria-hidden="true" />
      Coba lagi
    </Button>
  );

  if (loading) {
    return (
      <DashboardShell>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  if (!me) {
    return (
      <DashboardShell>
        <EmptyState
          title="Gagal memuat profil pengguna"
          description="Periksa sambungan internet Anda lalu coba lagi."
          action={retry}
        />
      </DashboardShell>
    );
  }

  const dateLabel = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (me.role === 'FARMER') {
    const activeSheep = mySheep.filter((item) => item.status === 'ACTIVE');
    const todayKey = todayLocal();
    const todayEvents = recentHistory.filter(
      (item) => item.recordDate.slice(0, 10) === todayKey,
    );
    const todayStatusEvents = todayEvents.filter((item) => item.type === 'STATUS');
    const todayHealthEvents = todayEvents.filter(
      (item) => item.type === 'HEALTH' || item.title === 'SICK',
    );
    const pregnantSheep = mySheep.filter(
      (item) => item.latestReproduction?.status === 'PREGNANT',
    );
    const sickSheep = mySheep.filter(
      (item) => item.latestHealth?.healthStatus === 'SICK',
    );
    const actionQueue = [
      ...sickSheep.map((item) => ({
        id: item.id,
        href: `/recording?sheepId=${item.id}&event=SICK`,
        label: 'Butuh cek kesehatan',
        detail: item.sheepCode,
        variant: 'danger' as const,
      })),
      ...pregnantSheep.map((item) => ({
        id: item.id,
        href: `/recording?sheepId=${item.id}&event=LAMBED`,
        label: 'Perlu pantau bunting',
        detail: item.sheepCode,
        variant: 'warning' as const,
      })),
    ].slice(0, 5);

    return (
      <DashboardShell>
        <PageHeader
          title={`Halo, ${me.name.split(' ')[0]}`}
          description={[dateLabel, me.loginCode && `ID ${me.loginCode}`, me.groupName]
            .filter(Boolean)
            .join(' · ')}
        />

        {failed && (
          <Card className="mb-4 flex flex-col gap-2 border-[color:var(--danger-border)] bg-danger-soft sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-danger">Sebagian data gagal dimuat.</p>
            {retry}
          </Card>
        )}

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/recording"
            className={buttonClassName({ size: 'lg', className: 'w-full justify-start' })}
          >
            <ClipboardPlus size={22} aria-hidden="true" />
            Mulai Rekording
          </Link>
          <Link
            href="/sheep"
            className={buttonClassName({
              variant: 'outline',
              size: 'lg',
              className: 'w-full justify-start',
            })}
          >
            <PawPrint size={22} aria-hidden="true" />
            Ternak Saya
          </Link>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Ternak aktif" value={activeSheep.length} />
          <StatTile label="Total ternak" value={mySheep.length} />
          <StatTile label="Kejadian hari ini" value={todayEvents.length} tone="info" />
          <StatTile label="Sakit hari ini" value={todayHealthEvents.length} tone="danger" />
          <StatTile label="Bunting dipantau" value={pregnantSheep.length} tone="warning" />
          <StatTile label="Keluar hari ini" value={todayStatusEvents.length} />
        </div>

        <div className="mb-4 grid gap-4 lg:grid-cols-2">
          <SectionCard
            title="Prioritas hari ini"
            subtitle="Ternak yang perlu tindakan lebih dulu"
            badge={<Badge variant="warning">{actionQueue.length} antrean</Badge>}
          >
            {actionQueue.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Belum ada prioritas mendesak. Lanjutkan rekording rutin hari ini.
              </p>
            ) : (
              <div className="space-y-2">
                {actionQueue.map((item) => (
                  <Link
                    key={`${item.label}-${item.id}`}
                    href={item.href}
                    className={`${rowLink} flex items-center justify-between gap-3`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{item.label}</p>
                      <p className="text-sm text-ink-muted">{item.detail}</p>
                    </div>
                    <Badge variant={item.variant}>Tindak lanjuti</Badge>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Ringkasan hari ini"
            subtitle="Aktivitas lapangan hari ini"
            badge={<Badge variant="info">{todayEvents.length} kejadian</Badge>}
          >
            {todayEvents.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Belum ada rekording hari ini. Mulai dari timbang, cek kondisi, atau catat kejadian penting.
              </p>
            ) : (
              <div className="space-y-2">
                {todayEvents.map((item) => (
                  <ActivityRow
                    key={`today-${item.type}-${item.id}`}
                    item={item}
                    variant={historyVariant(item.type)}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Ternak siap dicatat">
            {activeSheep.length === 0 ? (
              <p className="text-sm text-ink-muted">
                Belum ada ternak aktif yang terhubung ke akun ini.
              </p>
            ) : (
              <div className="space-y-2">
                {activeSheep.slice(0, 4).map((item) => (
                  <Link key={item.id} href={`/recording?sheepId=${item.id}`} className={rowLink}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{item.sheepCode}</p>
                        <p className="truncate text-sm text-ink-muted">{item.name || item.breed}</p>
                      </div>
                      <Badge variant="success">Rekord</Badge>
                    </div>
                    <p className="mt-1.5 text-sm text-ink/80">
                      {item.latestWeight ? `${item.latestWeight.weightKg} kg` : 'Bobot -'} ·{' '}
                      {labelStatusKesehatan(item.latestHealth?.healthStatus)}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Aktivitas terakhir">
            {recentHistory.length === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada aktivitas rekording terakhir.</p>
            ) : (
              <div className="space-y-2">
                {recentHistory.map((item) => (
                  <ActivityRow key={`${item.type}-${item.id}`} item={item} variant="info" />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </DashboardShell>
    );
  }

  const totalRecords = summary
    ? summary.records.weights +
      summary.records.bcs +
      summary.records.health +
      summary.records.reproduction
    : 0;
  const activePercent =
    summary && summary.sheep.total > 0
      ? Math.round((summary.sheep.active / summary.sheep.total) * 100)
      : 0;

  return (
    <DashboardShell>
      <PageHeader
        title="Ruang Kerja"
        description={`${dateLabel} · ${me.name}`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Link
          href="/sheep"
          className={buttonClassName({ size: 'lg', className: 'w-full justify-start' })}
        >
          <PawPrint size={22} aria-hidden="true" />
          Kelola Ternak
        </Link>
        <Link
          href="/map"
          className={buttonClassName({
            variant: 'outline',
            size: 'lg',
            className: 'w-full justify-start',
          })}
        >
          <Map size={22} aria-hidden="true" />
          Lihat Distribusi
        </Link>
      </div>

      {!summary ? (
        <EmptyState
          title="Gagal memuat data dasbor"
          description="Periksa sambungan internet Anda lalu coba lagi."
          action={retry}
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Populasi ternak"
              value={summary.sheep.total}
              hint={`${summary.sheep.active} aktif · ${summary.sheep.male} jantan · ${summary.sheep.female} betina`}
            />
            <StatTile
              label="Total rekording"
              value={totalRecords}
              hint={`Bobot ${summary.records.weights} · BCS ${summary.records.bcs} · Sehat ${summary.records.health}`}
            />
            <StatTile
              label="Layak bibit"
              value={evaluationSummary?.eligible ?? 0}
              tone="success"
              hint={`${evaluationSummary?.monitoring ?? 0} perlu dipantau`}
            />
            <StatTile label="Ternak aktif" value={`${activePercent}%`} hint="Dari seluruh data ternak" />
          </div>

          {evaluationSummary && (
            <div className="mb-5">
              <h2 className="mb-3 text-lg font-semibold text-ink">Ringkasan evaluasi</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatTile label="Layak bibit" value={evaluationSummary.eligible} tone="success" />
                <StatTile label="Perlu pemantauan" value={evaluationSummary.monitoring} tone="warning" />
                <StatTile label="Belum direkomendasikan" value={evaluationSummary.notRecommended} tone="danger" />
                <StatTile label="Data lengkap" value={evaluationSummary.completeRecords} tone="info" />
              </div>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
            <SectionCard title="Ternak terbaru">
              {summary.recentSheep.length === 0 ? (
                <p className="text-sm text-ink-muted">Belum ada data ternak.</p>
              ) : (
                <div className="space-y-2">
                  {summary.recentSheep.map((item) => (
                    <Link key={item.id} href={`/sheep/${item.id}`} className={rowLink}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{item.sheepCode}</p>
                          <p className="truncate text-sm text-ink-muted">
                            {item.name || 'Tanpa nama'}
                          </p>
                        </div>
                        <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
                          {labelStatusTernak(item.status)}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-sm text-ink/80">
                        {item.breed} · {labelJenisKelamin(item.gender)} · ditambahkan{' '}
                        {new Date(item.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Kualitas data">
              <dl className="space-y-3 text-sm">
                {[
                  ['Total data ternak', summary.sheep.total],
                  ['Total rekording', totalRecords],
                  ['Reproduksi tercatat', summary.records.reproduction],
                  ['Persentase aktif', `${activePercent}%`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
