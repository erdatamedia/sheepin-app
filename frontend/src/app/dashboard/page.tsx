'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Award, ChevronRight, CirclePlus, PawPrint, RefreshCw } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button, buttonClassName } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { PageHeader } from '@/components/ui/page-header';
import { InstallBanner } from '@/components/pwa/install-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { SheepStatusRow } from '@/components/sheep/sheep-status-row';
import { api } from '@/lib/api';
import { getMe, getMySheep, type MeResponse, type MySheepResponse } from '@/lib/me';
import { getEvaluationSummary, type EvaluationSummaryResponse } from '@/lib/evaluation';
import { getRecordingHistory, type RecordingHistoryResponse } from '@/lib/recording';
import { daysSince, labelTimeAgo } from '@/lib/format';
import {
  labelJenisCatatan,
  labelJenisKelamin,
  labelStatusTernak,
} from '@/lib/labels';

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

/** Ternak aktif yang sudah selama ini belum dicatat dianggap perlu diingatkan. */
const STALE_AFTER_DAYS = 14;
const SHEEP_PREVIEW = 8;

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

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat beranda">
      <Skeleton className="h-[52px] rounded-[14px]" />
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-[var(--radius-card)]" />
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
      variant="tinted"
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
          title="Gagal memuat profil"
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
  });

  if (me.role === 'FARMER') {
    const activeSheep = mySheep.filter((item) => item.status === 'ACTIVE');

    // Satu alasan per ternak, urut dari yang paling mendesak.
    const attention = activeSheep
      .map((item) => {
        if (item.latestHealth?.healthStatus === 'SICK') {
          return {
            item,
            reason: 'Sedang sakit',
            hint: 'Catat kondisi dan tindakan',
            href: `/recording?sheepId=${item.id}&event=SICK`,
            rank: 0,
          };
        }
        if (item.latestReproduction?.status === 'PREGNANT') {
          return {
            item,
            reason: 'Bunting',
            hint: 'Pantau menjelang beranak',
            href: `/recording?sheepId=${item.id}&event=LAMBED`,
            rank: 1,
          };
        }
        const idle = daysSince(item.lastRecordedAt);
        if (idle === null || idle >= STALE_AFTER_DAYS) {
          return {
            item,
            reason: `Dicatat ${labelTimeAgo(item.lastRecordedAt)}`,
            hint: 'Saatnya timbang dan cek kondisi',
            href: `/recording?sheepId=${item.id}`,
            rank: 2,
          };
        }
        return null;
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 5);

    const sickCount = activeSheep.filter((i) => i.latestHealth?.healthStatus === 'SICK').length;
    const pregnantCount = activeSheep.filter(
      (i) => i.latestReproduction?.status === 'PREGNANT',
    ).length;

    return (
      <DashboardShell>
        <PageHeader
          title={`Halo, ${me.name.split(' ')[0]}`}
          description={[dateLabel, me.groupName].filter(Boolean).join(' · ')}
        />

        {failed && (
          <Card className="mb-4 flex flex-col gap-2 border-[color:var(--danger-border)] bg-danger-soft sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-danger">Sebagian data gagal dimuat.</p>
            {retry}
          </Card>
        )}

        <Link
          href="/recording"
          className={buttonClassName({ size: 'lg', className: 'mb-5 w-full' })}
        >
          <CirclePlus size={22} aria-hidden="true" />
          Catat perkembangan hari ini
        </Link>

        <Link
          href="/achievements"
          className="glass mb-5 flex items-center gap-3 rounded-[var(--radius-card)] p-4 transition active:brightness-95"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
            <Award size={22} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-ink">Prestasi saya</span>
            <span className="block text-[13px] text-ink-muted">Lencana, runtun, dan kartu untuk dibagikan</span>
          </span>
          <ChevronRight size={20} className="text-ink-muted" aria-hidden="true" />
        </Link>

        <div className="mb-6 grid grid-cols-3 gap-3">
          <StatTile label="Ternak aktif" value={activeSheep.length} />
          <StatTile label="Sakit" value={sickCount} tone={sickCount ? 'danger' : 'default'} />
          <StatTile label="Bunting" value={pregnantCount} tone={pregnantCount ? 'warning' : 'default'} />
        </div>

        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
          <div className="space-y-6">
            {attention.length > 0 && (
              <ListGroup header="Perlu perhatian">
                {attention.map(({ item, reason, hint, href }) => (
                  <ListRow
                    key={item.id}
                    href={href}
                    leading={<Avatar name={item.name || item.sheepCode} photoUrl={item.photoUrl} size="md" />}
                    title={item.name ? `${item.sheepCode} · ${item.name}` : item.sheepCode}
                    subtitle={`${reason} · ${hint}`}
                  />
                ))}
              </ListGroup>
            )}

            <ListGroup
              header={`Ternak saya${mySheep.length ? ` (${activeSheep.length} aktif)` : ''}`}
            >
              {mySheep.length === 0 ? (
                <li className="px-4 py-6 text-center">
                  <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                    <PawPrint size={22} aria-hidden="true" />
                  </span>
                  <p className="text-[17px] font-semibold text-ink">Belum ada ternak</p>
                  <p className="mt-1 text-[15px] text-ink-muted">
                    Tambahkan ternak pertama Anda untuk mulai mencatat perkembangannya.
                  </p>
                  <Link
                    href="/sheep"
                    className={buttonClassName({ className: 'mt-4' })}
                  >
                    Tambah ternak
                  </Link>
                </li>
              ) : (
                <>
                  {activeSheep.slice(0, SHEEP_PREVIEW).map((item) => (
                    <SheepStatusRow key={item.id} item={item} />
                  ))}
                  {activeSheep.length > SHEEP_PREVIEW && (
                    <ListRow
                      href="/sheep"
                      title={`Lihat semua (${activeSheep.length})`}
                      tone="accent"
                    />
                  )}
                </>
              )}
            </ListGroup>
          </div>

          <ListGroup header="Aktivitas terakhir">
            {recentHistory.length === 0 ? (
              <li className="px-4 py-6 text-center text-[15px] text-ink-muted">
                Belum ada catatan. Mulai dengan menimbang salah satu ternak.
              </li>
            ) : (
              recentHistory.map((item) => (
                <ListRow
                  key={`${item.type}-${item.id}`}
                  href={`/sheep/${item.sheep.id}`}
                  title={item.title}
                  subtitle={`${item.sheep.sheepCode}${item.sheep.name ? ` - ${item.sheep.name}` : ''} · ${item.description}`}
                  trailing={
                    <Badge variant={historyVariant(item.type)}>{labelJenisCatatan(item.type)}</Badge>
                  }
                />
              ))
            )}
          </ListGroup>
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
      <PageHeader title="Beranda" description={`${dateLabel} · ${me.name}`} />
      <InstallBanner />

      {!summary ? (
        <EmptyState
          title="Gagal memuat data beranda"
          description="Periksa sambungan internet Anda lalu coba lagi."
          action={retry}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

          <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
            <div className="space-y-6">
              {evaluationSummary && (
                <ListGroup header="Evaluasi bibit">
                  <ListRow title="Layak bibit" value={evaluationSummary.eligible} />
                  <ListRow title="Perlu pemantauan" value={evaluationSummary.monitoring} />
                  <ListRow title="Belum direkomendasikan" value={evaluationSummary.notRecommended} />
                  <ListRow title="Data lengkap" value={evaluationSummary.completeRecords} />
                </ListGroup>
              )}

              <ListGroup header="Kualitas data">
                <ListRow title="Total data ternak" value={summary.sheep.total} />
                <ListRow title="Total rekording" value={totalRecords} />
                <ListRow title="Reproduksi tercatat" value={summary.records.reproduction} />
                <ListRow title="Persentase aktif" value={`${activePercent}%`} />
              </ListGroup>
            </div>

            <ListGroup header="Ternak terbaru">
              {summary.recentSheep.length === 0 ? (
                <li className="px-4 py-6 text-center text-[15px] text-ink-muted">
                  Belum ada data ternak.
                </li>
              ) : (
                summary.recentSheep.map((item) => (
                  <ListRow
                    key={item.id}
                    href={`/sheep/${item.id}`}
                    leading={<Avatar name={item.name || item.sheepCode} size="md" />}
                    title={item.name ? `${item.sheepCode} · ${item.name}` : item.sheepCode}
                    subtitle={`${item.breed} · ${labelJenisKelamin(item.gender)} · ${new Date(item.createdAt).toLocaleDateString('id-ID')}`}
                    trailing={
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
                        {labelStatusTernak(item.status)}
                      </Badge>
                    }
                  />
                ))
              )}
            </ListGroup>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
