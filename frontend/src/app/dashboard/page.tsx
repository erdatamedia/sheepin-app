'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  ClipboardPlus,
  FileCheck,
  FileClock,
  Layers3,
  MapPin,
  Users,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { getMe, getMySheep, type MeResponse, type MySheepResponse } from '@/lib/me';
import { getEvaluationSummary, type EvaluationSummaryResponse } from '@/lib/evaluation';
import { getRecordingHistory, type RecordingHistoryResponse } from '@/lib/recording';
import {
  labelJenisCatatan,
  labelStatusKesehatan,
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

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [summary, setSummary] = useState<DashboardResponse['data'] | null>(null);
  const [evaluationSummary, setEvaluationSummary] =
    useState<EvaluationSummaryResponse['data'] | null>(null);
  const [mySheep, setMySheep] = useState<MySheepResponse['data']>([]);
  const [recentHistory, setRecentHistory] = useState<RecordingHistoryResponse['data']>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
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
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <p className="text-sm text-gray-500">Memuat dashboard...</p>
      </DashboardShell>
    );
  }

  if (!me) {
    return (
      <DashboardShell>
        <Card>
          <p className="text-sm text-red-500">Gagal memuat profil pengguna.</p>
        </Card>
      </DashboardShell>
    );
  }

  if (me.role === 'FARMER') {
    const activeSheep = mySheep.filter((item) => item.status === 'ACTIVE');
    const todayKey = new Date().toISOString().slice(0, 10);
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
        <div className="mb-8 rounded-[32px] border border-[color:rgba(86,74,50,0.12)] bg-[linear-gradient(135deg,rgba(255,252,245,0.92),rgba(223,236,229,0.9))] px-6 py-7 shadow-[0_22px_52px_rgba(39,33,21,0.08)] md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-[color:rgba(33,73,61,0.12)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                Dasbor Peternak
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-gray-900 md:text-4xl">
                Kerja harian peternak dibuat lebih cepat dan lebih fokus.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--ink-muted)] md:text-base">
                Pilih ternak, catat kejadian penting, dan pantau tindak lanjut tanpa tenggelam di struktur data.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link href="/recording">
                <Card className="min-w-[200px] cursor-pointer border-[color:rgba(33,73,61,0.16)] bg-[linear-gradient(180deg,#eef6f1,#e4efe8)] shadow-[0_14px_28px_rgba(33,73,61,0.10)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    Aksi Utama
                  </p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">Mulai Rekording</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
                    Masuk ke alur kerja hari ini untuk timbang, cek kondisi, atau catat kejadian.
                  </p>
                </Card>
              </Link>
              <Link href="/sheep">
                <Card className="min-w-[200px] cursor-pointer bg-[color:var(--surface-strong)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
                    Fokus Cepat
                  </p>
                  <p className="mt-3 text-xl font-semibold text-gray-900">Lihat Ternak Saya</p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
                    Buka daftar ternak aktif dan langsung pilih yang perlu dicatat.
                  </p>
                </Card>
              </Link>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="min-h-[128px] bg-[color:var(--surface-strong)]">
            <p className="text-sm text-gray-500">Ternak Aktif</p>
            <h2 className="mt-4 text-3xl font-semibold text-gray-900">
              {activeSheep.length}
            </h2>
            <p className="mt-3 text-sm text-[color:var(--ink-muted)]">Masih aktif dalam kerja harian kandang.</p>
          </Card>

          <Card className="min-h-[128px] bg-[color:var(--surface-strong)]">
            <p className="text-sm text-gray-500">Total Ternak</p>
            <h2 className="mt-4 text-3xl font-semibold text-gray-900">
              {mySheep.length}
            </h2>
            <p className="mt-3 text-sm text-[color:var(--ink-muted)]">Semua ternak yang terhubung ke akun peternak ini.</p>
          </Card>

          <Card className="min-h-[128px] bg-[color:var(--surface-strong)]">
            <p className="text-sm text-gray-500">ID Peternak</p>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              {me.loginCode || '-'}
            </h2>
            <p className="mt-3 text-sm text-[color:var(--ink-muted)]">Identitas singkat untuk login dan koordinasi lapangan.</p>
          </Card>

          <Card className="min-h-[128px] bg-[color:var(--surface-strong)]">
            <p className="text-sm text-gray-500">Kelompok</p>
            <h2 className="mt-4 text-2xl font-semibold text-gray-900">
              {me.groupName || '-'}
            </h2>
            <p className="mt-3 text-sm text-[color:var(--ink-muted)]">Kelompok peternak yang sedang aktif dipantau.</p>
          </Card>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Link href="/recording">
            <Card className="cursor-pointer border-[color:rgba(33,73,61,0.16)] bg-[linear-gradient(180deg,#eef6f1,#ddebe3)] transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[color:var(--accent)]">Aksi Utama</p>
                  <h2 className="mt-2 text-xl font-semibold text-gray-900">Rekording Cepat</h2>
                  <p className="mt-2 text-sm text-[color:var(--ink-muted)]">
                    Buka kerja hari ini dan catat kondisi ternak secepat mungkin
                  </p>
                </div>
                <ClipboardPlus size={28} className="text-[color:var(--accent)]" />
              </div>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="cursor-pointer bg-[color:var(--surface-strong)] transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Aksi Utama</p>
                  <h2 className="mt-2 text-xl font-semibold text-gray-900">
                    Riwayat Rekording
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Lihat hasil input terakhir dengan cepat
                  </p>
                </div>
                <FileClock size={28} className="text-[color:var(--accent)]" />
              </div>
            </Card>
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="min-h-[124px] border-red-100 bg-[linear-gradient(180deg,#fff5f2,#fffaf8)]">
            <p className="text-sm text-red-700">Sakit Hari Ini</p>
            <h2 className="mt-2 text-2xl font-bold text-red-900">
              {todayHealthEvents.length}
            </h2>
            <p className="mt-2 text-sm text-red-700">
              Kejadian kesehatan yang dicatat hari ini
            </p>
          </Card>

          <Card className="min-h-[124px] border-yellow-100 bg-[linear-gradient(180deg,#fff9eb,#fffdf7)]">
            <p className="text-sm text-yellow-700">Bunting Dipantau</p>
            <h2 className="mt-2 text-2xl font-bold text-yellow-900">
              {pregnantSheep.length}
            </h2>
            <p className="mt-2 text-sm text-yellow-700">
              Ternak yang perlu pengamatan lanjutan
            </p>
          </Card>

          <Card className="min-h-[124px] border-gray-200 bg-[linear-gradient(180deg,#fbfaf7,#ffffff)]">
            <p className="text-sm text-gray-600">Keluar Hari Ini</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {todayStatusEvents.length}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Mati, terjual, atau perubahan status lain hari ini
            </p>
          </Card>

          <Card className="min-h-[124px] border-blue-100 bg-[linear-gradient(180deg,#edf7ff,#fbfeff)]">
            <p className="text-sm text-blue-700">Total Kejadian Hari Ini</p>
            <h2 className="mt-2 text-2xl font-bold text-blue-900">
              {todayEvents.length}
            </h2>
            <p className="mt-2 text-sm text-blue-700">
              Semua rekording dan kejadian lapangan hari ini
            </p>
          </Card>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link href="/sheep">
            <Card className="cursor-pointer transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ternak Saya</p>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900">
                    Pilih ternak untuk dicatat
                  </h2>
                </div>
                <ClipboardList className="text-gray-400" size={22} />
              </div>
            </Card>
          </Link>

          <Link href="/location">
            <Card className="cursor-pointer transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Lokasi Saya</p>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900">
                    Perbarui titik lokasi
                  </h2>
                </div>
                <MapPin className="text-gray-400" size={22} />
              </div>
            </Card>
          </Link>

          <Link href="/recording">
            <Card className="cursor-pointer transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Input Hari Ini</p>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900">
                    Bobot, kondisi, reproduksi
                  </h2>
                </div>
                <ArrowRight className="text-gray-400" size={22} />
              </div>
            </Card>
          </Link>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="bg-[color:var(--surface-strong)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Prioritas Hari Ini
                </h2>
                <p className="text-sm text-gray-500">
                  Ternak yang perlu tindakan lebih dulu
                </p>
              </div>
              <Badge variant="warning">{actionQueue.length} antrean</Badge>
            </div>

            {actionQueue.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada prioritas mendesak. Lanjutkan rekording rutin hari ini.
              </p>
            ) : (
              <div className="space-y-3">
                {actionQueue.map((item) => (
                  <Link
                    key={`${item.label}-${item.id}`}
                    href={item.href}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.detail}</p>
                    </div>
                    <Badge variant={item.variant}>Tindak lanjuti</Badge>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-[color:var(--surface-strong)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Ringkasan Hari Ini
                </h2>
                <p className="text-sm text-gray-500">
                  Aktivitas lapangan tanggal {new Date().toLocaleDateString('id-ID')}
                </p>
              </div>
              <Badge variant="info">{todayEvents.length} kejadian</Badge>
            </div>

            {todayEvents.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada rekording hari ini. Mulai dari timbang, cek kondisi, atau catat kejadian penting.
              </p>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((item) => (
                  <Link
                    key={`today-${item.type}-${item.id}`}
                    href={`/sheep/${item.sheep.id}`}
                    className="block rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.sheep.sheepCode}
                          {item.sheep.name ? ` - ${item.sheep.name}` : ''}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.type === 'STATUS'
                            ? 'danger'
                            : item.type === 'HEALTH'
                              ? 'success'
                              : item.type === 'REPRODUCTION'
                                ? 'warning'
                                : 'info'
                        }
                      >
                        {labelJenisCatatan(item.type)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-[color:var(--surface-strong)]">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Ternak Siap Dicatat
            </h2>
            {activeSheep.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada ternak aktif yang terhubung ke akun peternak ini.
              </p>
            ) : (
              <div className="space-y-3">
                {activeSheep.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/recording?sheepId=${item.id}`}
                    className="block rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{item.sheepCode}</p>
                        <p className="text-sm text-gray-500">
                          {item.name || item.breed}
                        </p>
                      </div>
                      <Badge variant="success">Rekord</Badge>
                    </div>
                    <div className="mt-3 grid gap-1 text-sm text-gray-600">
                      <p>Bobot terakhir: {item.latestWeight ? `${item.latestWeight.weightKg} kg` : '-'}</p>
                      <p>Kesehatan: {labelStatusKesehatan(item.latestHealth?.healthStatus)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="bg-[color:var(--surface-strong)]">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Aktivitas Terakhir
            </h2>
            {recentHistory.length === 0 ? (
              <p className="text-sm text-gray-500">
                Belum ada aktivitas rekording terakhir.
              </p>
            ) : (
              <div className="space-y-3">
                {recentHistory.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={`/sheep/${item.sheep.id}`}
                    className="block rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-500">
                          {item.sheep.sheepCode}
                          {item.sheep.name ? ` - ${item.sheep.name}` : ''}
                        </p>
                      </div>
                      <Badge variant="info">{labelJenisCatatan(item.type)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-8 rounded-[32px] border border-[color:rgba(86,74,50,0.12)] bg-[linear-gradient(135deg,rgba(255,252,245,0.94),rgba(230,236,246,0.92))] px-6 py-7 shadow-[0_22px_52px_rgba(39,33,21,0.08)] md:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex rounded-full border border-[color:rgba(33,73,61,0.12)] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              Ruang Kerja Admin
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-gray-900 md:text-4xl">
              Kendali data, evaluasi, dan distribusi ternak dalam satu layar.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[color:var(--ink-muted)] md:text-base">
              Gunakan dashboard ini untuk membaca kepadatan data, kualitas rekording, dan titik fokus operasional tim.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/sheep">
              <Card className="min-w-[200px] cursor-pointer border-[color:rgba(33,73,61,0.16)] bg-[linear-gradient(180deg,#eef6f1,#e4efe8)] shadow-[0_14px_28px_rgba(33,73,61,0.10)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  Kontrol Utama
                </p>
                <p className="mt-3 text-lg font-semibold text-gray-900">Kelola Ternak</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
                  Buka data ternak untuk input baru, koreksi, dan audit status.
                </p>
              </Card>
            </Link>
            <Link href="/map">
              <Card className="min-w-[200px] cursor-pointer bg-[color:var(--surface-strong)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-muted)]">
                  Pemantauan
                </p>
                <p className="mt-3 text-xl font-semibold text-gray-900">Lihat Distribusi</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-muted)]">
                  Pantau sebaran peternak dan konsentrasi ternak per wilayah.
                </p>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {!summary ? (
        <Card>
          <p className="text-sm text-red-500">Gagal memuat data dashboard.</p>
        </Card>
      ) : (
        <>
          <div className="mb-8 grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            <Card className="min-h-[132px] bg-[linear-gradient(180deg,#f8f5ec,#fffdfa)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[color:var(--ink-muted)]">
                    Populasi Ternak
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-gray-900">
                    {summary.sheep.total}
                  </h2>
                  <p className="mt-3 text-sm text-[color:var(--ink-muted)]">
                    {summary.sheep.active} aktif, {summary.sheep.male} jantan, {summary.sheep.female} betina
                  </p>
                </div>
                <div className="rounded-2xl bg-[rgba(33,73,61,0.08)] p-3 text-[color:var(--accent)]">
                  <Layers3 size={22} />
                </div>
              </div>
            </Card>

            <Card className="min-h-[132px] bg-[linear-gradient(180deg,#f4f8f6,#fffdfa)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[color:var(--ink-muted)]">
                    Rekording
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-gray-900">
                    {summary.records.weights +
                      summary.records.bcs +
                      summary.records.health +
                      summary.records.reproduction}
                  </h2>
                  <p className="mt-3 text-sm text-[color:var(--ink-muted)]">
                    Bobot {summary.records.weights}, BCS {summary.records.bcs}, kesehatan {summary.records.health}
                  </p>
                </div>
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <ClipboardPlus size={22} />
                </div>
              </div>
            </Card>

            <Card className="min-h-[132px] bg-[linear-gradient(180deg,#fff8ed,#fffdfa)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[color:var(--ink-muted)]">
                    Evaluasi
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold text-gray-900">
                    {evaluationSummary?.eligible ?? 0}
                  </h2>
                  <p className="mt-3 text-sm text-[color:var(--ink-muted)]">
                    Layak bibit, {evaluationSummary?.monitoring ?? 0} perlu pantau
                  </p>
                </div>
                <div className="rounded-2xl bg-yellow-50 p-3 text-yellow-700">
                  <BadgeCheck size={22} />
                </div>
              </div>
            </Card>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <Link href="/sheep">
              <Card className="min-h-[112px] cursor-pointer bg-[color:var(--surface-strong)] transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--ink-muted)]">
                      Ternak
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900">
                      Kelola data ternak
                    </h2>
                  </div>
                  <ClipboardList className="text-[color:var(--accent)]" size={20} />
                </div>
              </Card>
            </Link>

            <Link href="/map">
              <Card className="min-h-[112px] cursor-pointer bg-[color:var(--surface-strong)] transition hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--ink-muted)]">
                      Distribusi
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900">
                      Pantau sebaran peternak
                    </h2>
                  </div>
                  <ArrowRight className="text-[color:var(--accent)]" size={20} />
                </div>
              </Card>
            </Link>
          </div>

          {evaluationSummary && (
            <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <Card className="bg-[color:var(--surface-strong)]">
                <div className="mb-4 flex items-center gap-2">
                  <BadgeCheck size={18} className="text-[color:var(--accent)]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Ringkasan Evaluasi
                  </h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-green-50 px-4 py-4">
                    <p className="text-sm text-green-700">Layak Bibit</p>
                    <p className="mt-2 text-2xl font-semibold text-green-900">
                      {evaluationSummary.eligible}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-yellow-50 px-4 py-4">
                    <p className="text-sm text-yellow-700">Perlu Pemantauan</p>
                    <p className="mt-2 text-2xl font-semibold text-yellow-900">
                      {evaluationSummary.monitoring}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-red-50 px-4 py-4">
                    <p className="text-sm text-red-700">Belum Direkomendasikan</p>
                    <p className="mt-2 text-2xl font-semibold text-red-900">
                      {evaluationSummary.notRecommended}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 px-4 py-4">
                    <p className="text-sm text-blue-700">Data Lengkap</p>
                    <p className="mt-2 text-2xl font-semibold text-blue-900">
                      {evaluationSummary.completeRecords}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-[color:var(--surface-strong)]">
                <div className="mb-4 flex items-center gap-2">
                  <FileCheck size={18} className="text-[color:var(--accent)]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Kualitas Data
                  </h2>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>Total rekording</span>
                    <span className="font-semibold">
                      {summary.records.weights +
                        summary.records.bcs +
                        summary.records.health +
                        summary.records.reproduction}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reproduksi tercatat</span>
                    <span className="font-semibold">{summary.records.reproduction}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Persentase aktif</span>
                    <span className="font-semibold">
                      {summary.sheep.total > 0
                        ? Math.round((summary.sheep.active / summary.sheep.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
            <Card className="bg-[color:var(--surface-strong)]">
              <div className="mb-4 flex items-center gap-2">
                <Users size={18} className="text-[color:var(--accent)]" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Ternak Terbaru
                </h2>
              </div>

              <div className="space-y-3">
                {summary.recentSheep.length === 0 ? (
                  <p className="text-sm text-gray-500">Belum ada data ternak.</p>
                ) : (
                  summary.recentSheep.map((item) => (
                    <Link key={item.id} href={`/sheep/${item.id}`}>
                      <div className="rounded-xl border border-gray-100 p-4 transition hover:border-gray-200 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {item.sheepCode}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.name || 'Tanpa nama'}
                            </p>
                          </div>
                          <Badge
                            variant={
                              item.status === 'ACTIVE' ? 'success' : 'default'
                            }
                          >
                            {labelStatusTernak(item.status)}
                          </Badge>
                        </div>

                        <div className="mt-3 grid gap-1 text-sm text-gray-600 md:grid-cols-2">
                          <p>Breed: {item.breed}</p>
                          <p>Jenis kelamin: {item.gender === 'MALE' ? 'Jantan' : item.gender === 'FEMALE' ? 'Betina' : item.gender}</p>
                          <p>
                            Ditambahkan:{' '}
                            {new Date(item.createdAt).toLocaleDateString(
                              'id-ID',
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            <Card className="bg-[color:var(--surface-strong)]">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Ringkasan Sistem
              </h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Total data ternak</span>
                  <span className="font-semibold">{summary.sheep.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total rekording</span>
                  <span className="font-semibold">
                    {summary.records.weights +
                      summary.records.bcs +
                      summary.records.health +
                      summary.records.reproduction}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Persentase aktif</span>
                  <span className="font-semibold">
                    {summary.sheep.total > 0
                      ? Math.round(
                          (summary.sheep.active / summary.sheep.total) * 100,
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
