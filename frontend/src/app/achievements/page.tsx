'use client';

import { useCallback, useEffect, useState } from 'react';
import { Award, CalendarCheck, Flame, PawPrint, Share2, Sprout, TrendingUp } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { ShareSheet } from '@/components/share/share-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadError } from '@/components/ui/load-error';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { getAchievements, type Achievements } from '@/lib/achievements';
import { renderFarmerCard } from '@/lib/share-card';
import { formatDayLong } from '@/lib/format';
import { cn, todayLocal } from '@/lib/utils';

function shiftDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function encouragement(a: Achievements) {
  if (a.records.total === 0) return 'Catat timbangan pertama hari ini untuk memulai runtun Anda.';
  if (a.streakDays >= 30) return 'Sebulan penuh tanpa putus. Data Anda sangat berharga.';
  if (a.streakDays >= 7) return 'Seminggu berturut-turut. Pertahankan, sedikit lagi lencana berikutnya.';
  if (a.streakDays >= 1) return 'Bagus, runtun Anda sedang berjalan. Catat lagi besok untuk melanjutkannya.';
  return 'Runtun terputus, tidak apa-apa. Catat hari ini untuk memulai lagi.';
}

export default function AchievementsPage() {
  const [from, setFrom] = useState(() => shiftDays(todayLocal(), -90));
  const [to, setTo] = useState(() => todayLocal());
  const [data, setData] = useState<Achievements | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showCard, setShowCard] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await getAchievements({ from, to }));
    } catch (error) {
      console.error('Gagal memuat prestasi:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const preset = (days: number) => {
    const end = todayLocal();
    setTo(end);
    setFrom(shiftDays(end, -days));
  };

  const periodLabel = data
    ? `${formatDayLong(data.period.from)} – ${formatDayLong(data.period.to)}`
    : '';

  return (
    <RoleGuard allowedRoles={['FARMER']}>
      <DashboardShell>
        <PageHeader
          title="Prestasi"
          description="Penghargaan atas data yang sudah Anda catat. Bagikan ke sesama peternak atau peneliti."
          actions={
            <Button onClick={() => setShowCard(true)} disabled={!data || loading}>
              <Share2 size={18} aria-hidden="true" /> Bagikan rapor
            </Button>
          }
        />

        <Card className="mb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dari tanggal">
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Sampai tanggal">
              <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: '30 hari', days: 30 },
              { label: '90 hari', days: 90 },
              { label: '1 tahun', days: 365 },
            ].map((p) => (
              <Button key={p.days} variant="tinted" onClick={() => preset(p.days)}>
                {p.label}
              </Button>
            ))}
          </div>
        </Card>

        {loading && !data ? (
          <div className="grid gap-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-40" />
          </div>
        ) : failed || !data ? (
          <LoadError onRetry={load} title="Gagal memuat prestasi" />
        ) : (
          <div className={cn('grid gap-5 transition-opacity', loading && 'opacity-60')}>
            {/* Runtun */}
            <Card className="flex items-center gap-4 p-5 lg:p-7">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong lg:h-20 lg:w-20">
                <Flame size={34} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-ink-muted">Runtun mengisi data</p>
                <p className="text-4xl font-bold tabular-nums text-ink lg:text-5xl">
                  {data.streakDays} <span className="text-lg font-medium text-ink-muted">hari berturut-turut</span>
                </p>
                <p className="mt-1 text-[15px] leading-snug text-ink-soft">{encouragement(data)}</p>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Ternak aktif" value={data.sheep.active} hint={`${data.sheep.recordedInPeriod} dicatat di periode ini`} />
              <StatTile label="Catatan masuk" value={data.records.total} hint={`${data.records.weights} timbang`} />
              <StatTile label="Hari mengisi" value={data.activeDays} hint="hari berbeda" />
              <StatTile
                label="Rata-rata tumbuh"
                value={data.growth.averageAdgGrams != null ? `${data.growth.averageAdgGrams} g` : '-'}
                hint="per hari"
              />
            </div>

            {/* Lencana */}
            <section aria-labelledby="sec-lencana">
              <h2 id="sec-lencana" className="mb-2 px-1 text-[20px] font-bold tracking-tight text-ink">
                Lencana <span className="text-base font-medium text-ink-muted">{data.earnedBadges} dari {data.badges.length}</span>
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.badges.map((b) => {
                  const pct = Math.min(100, Math.round((b.value / b.target) * 100));
                  return (
                    <li key={b.id}>
                      <Card className={cn('h-full p-4', b.earned ? '' : 'opacity-80')}>
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                              b.earned ? 'bg-success-soft text-success' : 'bg-tint text-ink-muted',
                            )}
                          >
                            {b.id === 'tumbuh' ? <TrendingUp size={22} aria-hidden="true" /> : b.id.startsWith('rutin') ? <Flame size={22} aria-hidden="true" /> : b.id === 'aktif' ? <CalendarCheck size={22} aria-hidden="true" /> : b.id === 'lengkap' ? <PawPrint size={22} aria-hidden="true" /> : b.id === 'sehat' ? <Sprout size={22} aria-hidden="true" /> : <Award size={22} aria-hidden="true" />}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink">{b.title}</p>
                            <p className="text-[13px] leading-snug text-ink-muted">{b.description}</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-tint" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Kemajuan ${b.title}`}>
                          <div className={cn('h-full rounded-full', b.earned ? 'bg-success' : 'bg-primary')} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-1.5 text-[13px] text-ink-muted">
                          {b.earned ? 'Diraih' : b.target > 1 ? `${Math.round(b.value)} dari ${b.target}` : 'Belum diraih'}
                        </p>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>

            {data.topGrowers.length > 0 && (
              <section aria-labelledby="sec-tumbuh">
                <h2 id="sec-tumbuh" className="mb-2 px-1 text-[20px] font-bold tracking-tight text-ink">
                  Pertumbuhan terbaik
                </h2>
                <Card className="p-0">
                  <ol>
                    {data.topGrowers.map((g, i) => (
                      <li key={g.sheepCode} className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 first:border-t-0">
                        <span className="min-w-0 truncate text-ink">
                          <span className="mr-2 font-semibold text-primary-strong">{i + 1}</span>
                          {g.sheepCode}
                          {g.name ? ` · ${g.name}` : ''}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-ink">
                          {g.adgGrams} g/hari
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </section>
            )}

            <p className="text-sm text-ink-muted">Periode {periodLabel}</p>
          </div>
        )}

        {data && (
          <ShareSheet
            open={showCard}
            onClose={() => setShowCard(false)}
            title="Rapor peternak"
            filename={`rapor-${data.period.from}_${data.period.to}.png`}
            message={`Rapor peternak ${data.farmer?.name ?? ''} di Sheep-In`}
            renderKey={`${data.period.from}|${data.period.to}|${data.records.total}|${data.earnedBadges}`}
            render={() =>
              renderFarmerCard({
                name: data.farmer?.name ?? 'Peternak',
                groupLine: [data.farmer?.groupName, data.farmer?.village, data.farmer?.regency]
                  .filter(Boolean)
                  .join(' · ') || null,
                periodLabel: `${formatDayLong(data.period.from)} – ${formatDayLong(data.period.to)}`,
                sheepActive: data.sheep.active,
                totalRecords: data.records.total,
                activeDays: data.activeDays,
                streakDays: data.streakDays,
                averageAdgGrams: data.growth.averageAdgGrams,
                badges: data.badges.map((b) => ({ title: b.title, earned: b.earned })),
                topGrowers: data.topGrowers.map((g) => ({
                  label: `${g.sheepCode}${g.name ? ` · ${g.name}` : ''}`,
                  adgGrams: g.adgGrams,
                })),
              })
            }
          />
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
