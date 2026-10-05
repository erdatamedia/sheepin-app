'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Mail, Printer, Send } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadError } from '@/components/ui/load-error';
import { PageHeader } from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { getFarmers, farmerLabel, type FarmerOption } from '@/lib/farmers';
import {
  describeSchedule,
  downloadCsv,
  downloadReportExcel,
  getReportOverview,
  getReportSchedule,
  sendReportNow,
  toCsv,
  type ReportOverview,
  type ReportSchedule,
} from '@/lib/reports';
import { getApiErrorMessage } from '@/lib/api';
import { getMe } from '@/lib/me';
import {
  labelJenisKelamin,
  labelPeran,
  labelStatusKesehatan,
  labelStatusReproduksi,
  labelStatusTernak,
} from '@/lib/labels';
import { formatDayLong } from '@/lib/format';
import { cn, todayLocal } from '@/lib/utils';

type TabKey = 'ringkasan' | 'pertumbuhan' | 'kesehatan' | 'reproduksi' | 'peternak';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'pertumbuhan', label: 'Pertumbuhan' },
  { key: 'kesehatan', label: 'Kesehatan' },
  { key: 'reproduksi', label: 'Reproduksi' },
  { key: 'peternak', label: 'Per peternak' },
];

const num = (v: number | null | undefined, suffix = '') =>
  v === null || v === undefined ? '-' : `${v.toLocaleString('id-ID')}${suffix}`;

function shiftDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function DataTable({
  caption,
  headers,
  rows,
  empty = 'Belum ada data pada periode ini.',
}: {
  caption: string;
  headers: string[];
  rows: React.ReactNode[][];
  empty?: string;
}) {
  return (
    <Card className="p-0 sm:p-0">
      <h3 className="px-4 pt-4 text-base font-semibold text-ink sm:px-5">{caption}</h3>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-muted sm:px-5">{empty}</p>
      ) : (
        <div className="overflow-x-auto px-2 pb-2 pt-2 sm:px-3">
          <table className="w-full min-w-[32rem] text-left text-[15px]">
            <thead>
              <tr className="text-[13px] text-ink-muted">
                {headers.map((h) => (
                  <th key={h} scope="col" className="px-2 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-line">
                  {row.map((cellValue, j) => (
                    <td key={j} className={cn('px-2 py-2.5 text-ink', j > 0 && 'tabular-nums')}>
                      {cellValue}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export default function ReportsPage() {
  const [from, setFrom] = useState(() => shiftDays(todayLocal(), -90));
  const [to, setTo] = useState(() => todayLocal());
  const [farmerId, setFarmerId] = useState('');
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [data, setData] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState<TabKey>('ringkasan');
  const [schedule, setSchedule] = useState<ReportSchedule | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [busy, setBusy] = useState<'excel' | 'send' | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await getReportOverview({ from, to, farmerId }));
    } catch (error) {
      console.error('Gagal memuat laporan:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [from, to, farmerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    getReportSchedule()
      .then(setSchedule)
      .catch(() => undefined);
    getMe()
      .then((me) => setIsAdmin(me.role === 'ADMIN'))
      .catch(() => undefined);
  }, []);

  const downloadExcel = async () => {
    try {
      setBusy('excel');
      setNotice(null);
      await downloadReportExcel({ farmerId });
    } catch (error) {
      setNotice({ tone: 'error', text: getApiErrorMessage(error, 'Gagal mengunduh laporan Excel') });
    } finally {
      setBusy(null);
    }
  };

  const sendNow = async () => {
    if (!window.confirm(`Kirim laporan sekarang ke ${schedule?.recipients.length ?? 0} penerima?`)) return;
    try {
      setBusy('send');
      setNotice(null);
      const result = await sendReportNow();
      setNotice({ tone: 'ok', text: result.message });
      setSchedule(await getReportSchedule());
    } catch (error) {
      setNotice({ tone: 'error', text: getApiErrorMessage(error, 'Gagal mengirim laporan') });
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    getFarmers()
      .then((res) => setFarmers(res.data || []))
      .catch(() => undefined);
  }, []);

  const preset = (days: number) => {
    const end = todayLocal();
    setTo(end);
    setFrom(shiftDays(end, -days));
  };

  const exportCsv = () => {
    if (!data) return;
    const stamp = `${data.period.from}_${data.period.to}`;
    switch (tab) {
      case 'ringkasan':
        downloadCsv(
          `laporan-ringkasan_${stamp}.csv`,
          toCsv(
            ['Kelompok', 'Keterangan', 'Jumlah'],
            [
              ...data.population.byStatus.map((r) => ['Status ternak', labelStatusTernak(r.label), r.total]),
              ...data.population.byGender.map((r) => ['Jenis kelamin', labelJenisKelamin(r.label), r.total]),
              ...data.population.byBreed.map((r) => ['Ras', r.label, r.total]),
              ['Rekording', 'Penimbangan', data.activity.totals.weights],
              ['Rekording', 'Skor kondisi tubuh (BCS)', data.activity.totals.bcs],
              ['Rekording', 'Pemeriksaan kesehatan', data.activity.totals.health],
              ...data.activity.byMonth.map((r) => [
                'Per bulan',
                r.month,
                r.weights + r.bcs + r.health,
              ]),
              ...data.activity.byRecorder.map((r) => ['Pencatat', r.name, r.total]),
            ],
          ),
        );
        break;
      case 'pertumbuhan':
        downloadCsv(
          `laporan-pertumbuhan_${stamp}.csv`,
          toCsv(
            ['Kode', 'Nama', 'Peternak', 'Kelamin', 'Status', 'Usia (bulan)', 'Penimbangan', 'Bobot awal (kg)', 'Bobot akhir (kg)', 'Selisih (kg)', 'PBBH (g/hari)', 'BCS terakhir'],
            data.growth.rows.map((r) => [
              r.sheepCode,
              r.name,
              r.farmer,
              labelJenisKelamin(r.gender),
              labelStatusTernak(r.status),
              r.ageMonths,
              r.weighings,
              r.firstWeightKg,
              r.lastWeightKg,
              r.gainKg,
              r.adgGrams,
              r.latestBcs,
            ]),
          ),
        );
        break;
      case 'kesehatan':
        downloadCsv(
          `laporan-kesehatan_${stamp}.csv`,
          toCsv(
            ['Kelompok', 'Keterangan', 'Jumlah / sejak'],
            [
              ...data.health.byStatus.map((r) => ['Status pemeriksaan', labelStatusKesehatan(r.label), r.total]),
              ...data.health.topDiseases.map((r) => ['Penyakit', r.label, r.total]),
              ...data.health.sickNow.map((r) => [
                'Sedang sakit',
                `${r.sheepCode}${r.name ? ` ${r.name}` : ''} (${r.farmer ?? '-'})`,
                r.since,
              ]),
            ],
          ),
        );
        break;
      case 'reproduksi':
        downloadCsv(
          `laporan-reproduksi_${stamp}.csv`,
          toCsv(
            ['Keterangan', 'Nilai'],
            [
              ...data.reproduction.byStatus.map((r) => [`Status: ${labelStatusReproduksi(r.label)}`, r.total]),
              ['Kelahiran pada periode', data.reproduction.lambings],
              ['Anak lahir', data.reproduction.lambBorn],
              ['Anak disapih', data.reproduction.lambWeaned],
              ['Tingkat sapih (%)', data.reproduction.weaningRatePercent],
              ['Rata-rata bobot lahir (kg)', data.reproduction.averageBirthWeightKg],
            ],
          ),
        );
        break;
      case 'peternak':
        downloadCsv(
          `laporan-peternak_${stamp}.csv`,
          toCsv(
            ['Peternak', 'Kelompok', 'Kabupaten', 'Total ternak', 'Aktif', 'Jantan', 'Betina', 'Rekording pada periode'],
            data.farmers.map((r) => [r.name, r.groupName, r.regency, r.total, r.active, r.male, r.female, r.records]),
          ),
        );
        break;
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <PageHeader
          title="Laporan"
          description="Ringkasan populasi, pertumbuhan, kesehatan, dan reproduksi ternak."
          actions={
            <div className="print:hidden flex gap-2">
              <Button variant="tinted" onClick={exportCsv} disabled={!data || loading}>
                <Download size={18} aria-hidden="true" /> Unduh CSV
              </Button>
              <Button variant="outline" onClick={() => window.print()} disabled={!data || loading}>
                <Printer size={18} aria-hidden="true" /> Cetak
              </Button>
            </div>
          }
        />

        <Card className="print:hidden mb-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
              <FileSpreadsheet size={22} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-semibold text-ink">Laporan untuk peneliti dan dinas</h2>
              <p className="mt-0.5 text-[14px] leading-snug text-ink-muted">
                Rekap Excel seluruh peternak dan ternak yang sudah terisi sampai saat ini (lembar Ringkasan, Peternak,
                Ternak, Penimbangan, Kesehatan). Tanpa nomor HP dan alamat rinci.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={downloadExcel} disabled={busy !== null}>
                  <Download size={18} aria-hidden="true" /> {busy === 'excel' ? 'Menyiapkan...' : 'Unduh rekap Excel'}
                </Button>
                {isAdmin && schedule?.smtpConfigured && schedule.recipients.length > 0 && (
                  <Button variant="tinted" onClick={sendNow} disabled={busy !== null}>
                    <Send size={18} aria-hidden="true" /> {busy === 'send' ? 'Mengirim...' : 'Kirim sekarang'}
                  </Button>
                )}
              </div>
              {notice && (
                <p
                  role="status"
                  className={cn('mt-3 text-[14px] font-medium', notice.tone === 'ok' ? 'text-success' : 'text-danger')}
                >
                  {notice.text}
                </p>
              )}
              {schedule && (
                <div className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-[14px] text-ink-muted">
                  <Mail size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    {schedule.active ? (
                      <>
                        <p className="text-ink">
                          Dikirim otomatis: {describeSchedule(schedule.schedule)}
                          {schedule.nextRun ? ` · berikutnya ${formatDayLong(schedule.nextRun.slice(0, 10))}` : ''}
                        </p>
                        <p className="break-words">Penerima: {schedule.recipients.join(', ')}</p>
                      </>
                    ) : (
                      <p>
                        Pengiriman berkala belum aktif. Atur <code>SMTP_HOST</code>, <code>SMTP_USER</code>,{' '}
                        <code>SMTP_PASS</code>, dan <code>REPORT_RECIPIENTS</code> di server (lihat panduan deploy).
                      </p>
                    )}
                    {schedule.lastRun && (
                      <p className={schedule.lastRun.ok ? '' : 'text-danger'}>
                        Terakhir: {schedule.lastRun.message} ({formatDayLong(schedule.lastRun.at.slice(0, 10))})
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="print:hidden mb-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Dari tanggal">
              <Input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Sampai tanggal">
              <Input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Peternak">
                <Select value={farmerId} onChange={(e) => setFarmerId(e.target.value)}>
                  <option value="">Semua peternak</option>
                  {farmers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {farmerLabel(f)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
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

        <div
          role="tablist"
          aria-label="Jenis laporan"
          className="print:hidden -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'min-h-11 shrink-0 rounded-full border px-4 text-[15px] font-medium transition',
                tab === t.key
                  ? 'border-transparent bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] text-white'
                  : 'glass text-ink-soft',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && !data ? (
          <div className="grid gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
          </div>
        ) : failed || !data ? (
          <LoadError onRetry={load} title="Gagal memuat laporan" />
        ) : (
          <div className={cn('grid gap-4 transition-opacity', loading && 'opacity-60')}>
            <p className="text-sm text-ink-muted">
              Periode {formatDayLong(data.period.from)} – {formatDayLong(data.period.to)}
              {data.farmerId ? ' · satu peternak' : ' · semua peternak'}
            </p>

            {tab === 'ringkasan' && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="Total ternak" value={num(data.population.total)} />
                  <StatTile label="Penimbangan" value={num(data.activity.totals.weights)} />
                  <StatTile label="Skor kondisi (BCS)" value={num(data.activity.totals.bcs)} />
                  <StatTile label="Pemeriksaan kesehatan" value={num(data.activity.totals.health)} />
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <DataTable
                    caption="Status ternak"
                    headers={['Status', 'Jumlah']}
                    rows={data.population.byStatus.map((r) => [labelStatusTernak(r.label), r.total])}
                  />
                  <DataTable
                    caption="Jenis kelamin"
                    headers={['Jenis', 'Jumlah']}
                    rows={data.population.byGender.map((r) => [labelJenisKelamin(r.label), r.total])}
                  />
                  <DataTable
                    caption="Ras"
                    headers={['Ras', 'Jumlah']}
                    rows={data.population.byBreed.map((r) => [r.label, r.total])}
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <DataTable
                    caption="Rekording per bulan"
                    headers={['Bulan', 'Timbang', 'BCS', 'Kesehatan']}
                    rows={data.activity.byMonth.map((r) => [r.month, r.weights, r.bcs, r.health])}
                  />
                  <DataTable
                    caption="Pencatat terbanyak"
                    headers={['Nama', 'Peran', 'Catatan']}
                    rows={data.activity.byRecorder.map((r) => [r.name, labelPeran(r.role), r.total])}
                  />
                </div>
              </>
            )}

            {tab === 'pertumbuhan' && (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <StatTile label="Ternak ditimbang" value={num(data.growth.summary.sheepWeighed)} />
                  <StatTile
                    label="Rata-rata PBBH"
                    value={num(data.growth.summary.averageAdgGrams, ' g/hari')}
                    hint="Pertambahan bobot badan harian"
                  />
                  <StatTile
                    label="Rata-rata bobot terakhir"
                    value={num(data.growth.summary.averageLatestWeightKg, ' kg')}
                  />
                </div>
                <DataTable
                  caption="Pertumbuhan per ternak"
                  headers={['Ternak', 'Peternak', 'Usia', 'Awal', 'Akhir', 'Selisih', 'PBBH', 'BCS']}
                  rows={data.growth.rows.map((r) => [
                    `${r.sheepCode}${r.name ? ` · ${r.name}` : ''}`,
                    r.farmer ?? '-',
                    r.ageMonths === null ? '-' : `${r.ageMonths} bln`,
                    `${r.firstWeightKg} kg`,
                    `${r.lastWeightKg} kg`,
                    `${r.gainKg > 0 ? '+' : ''}${r.gainKg} kg`,
                    num(r.adgGrams, ' g'),
                    r.latestBcs ?? '-',
                  ])}
                  empty="Belum ada ternak yang ditimbang pada periode ini. PBBH butuh minimal dua penimbangan."
                />
              </>
            )}

            {tab === 'kesehatan' && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="Pemeriksaan" value={num(data.health.checks)} />
                  <StatTile
                    label="Sedang sakit"
                    value={num(data.health.sickNow.length)}
                    tone={data.health.sickNow.length > 0 ? 'danger' : 'default'}
                    hint="Pemeriksaan terakhir: sakit"
                  />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <DataTable
                    caption="Status pemeriksaan"
                    headers={['Status', 'Jumlah']}
                    rows={data.health.byStatus.map((r) => [labelStatusKesehatan(r.label), r.total])}
                  />
                  <DataTable
                    caption="Penyakit tercatat"
                    headers={['Penyakit', 'Kasus']}
                    rows={data.health.topDiseases.map((r) => [r.label, r.total])}
                    empty="Tidak ada penyakit tercatat pada periode ini."
                  />
                </div>
                <DataTable
                  caption="Ternak yang sedang sakit"
                  headers={['Ternak', 'Peternak', 'Sejak']}
                  rows={data.health.sickNow.map((r) => [
                    `${r.sheepCode}${r.name ? ` · ${r.name}` : ''}`,
                    r.farmer ?? '-',
                    formatDayLong(r.since),
                  ])}
                  empty="Tidak ada ternak yang sedang sakit."
                />
              </>
            )}

            {tab === 'reproduksi' && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <StatTile label="Kelahiran" value={num(data.reproduction.lambings)} />
                  <StatTile label="Anak lahir" value={num(data.reproduction.lambBorn)} />
                  <StatTile label="Anak disapih" value={num(data.reproduction.lambWeaned)} />
                  <StatTile
                    label="Tingkat sapih"
                    value={num(data.reproduction.weaningRatePercent, '%')}
                    hint={`Rata-rata bobot lahir ${num(data.reproduction.averageBirthWeightKg, ' kg')}`}
                  />
                </div>
                <DataTable
                  caption="Status reproduksi terkini"
                  headers={['Status', 'Jumlah ternak']}
                  rows={data.reproduction.byStatus.map((r) => [labelStatusReproduksi(r.label), r.total])}
                  empty="Belum ada catatan reproduksi."
                />
              </>
            )}

            {tab === 'peternak' && (
              <DataTable
                caption="Ternak dan rekording per peternak"
                headers={['Peternak', 'Kelompok', 'Total', 'Aktif', 'Jantan', 'Betina', 'Catatan']}
                rows={data.farmers.map((r) => [
                  r.name,
                  r.groupName ?? '-',
                  r.total,
                  r.active,
                  r.male,
                  r.female,
                  r.records,
                ])}
                empty="Belum ada ternak terdaftar."
              />
            )}

            {data.population.total === 0 && (
              <EmptyState title="Belum ada ternak" description="Laporan terisi setelah ternak dan rekording tercatat." />
            )}
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
