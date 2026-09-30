'use client';

import Link from 'next/link';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, MapPin, Navigation, PencilLine, PawPrint, Phone } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { StatTile } from '@/components/ui/stat-tile';
import { Toast, useToast } from '@/components/ui/toast';
import { TempPinDialog } from '@/components/farmers/temp-pin-dialog';
import { getMe } from '@/lib/me';
import { getApiErrorMessage } from '@/lib/api';
import { labelJenisKelamin, labelStatusTernak, labelSumberLokasi } from '@/lib/labels';
import {
  deleteFarmer,
  resetFarmerPin,
  getFarmerDetail,
  getFarmerSheep,
  getFarmerSummary,
  updateFarmer,
  type FarmerDetailResponse,
  type FarmerSheepResponse,
  type FarmerSummaryResponse,
} from '@/lib/farmers';

type FarmerDetail = FarmerDetailResponse['data'];
type FarmerSheepItem = FarmerSheepResponse['data']['sheep'][number];
type FarmerSummary = FarmerSummaryResponse['data']['summary'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export default function FarmerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPin, setTempPin] = useState<{ name: string; pin: string } | null>(null);
  const { toast, notify } = useToast();
  const [farmer, setFarmer] = useState<FarmerDetail | null>(null);
  const [summary, setSummary] = useState<FarmerSummary | null>(null);
  const [sheep, setSheep] = useState<FarmerSheepItem[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    groupName: '',
    province: '',
    regency: '',
    district: '',
    village: '',
    addressDetail: '',
    isActive: true,
  });

  const loadAll = useCallback(async () => {
    try {
      setErrorMessage('');

      const meRes = await getMe();
      if (meRes.role !== 'ADMIN' && meRes.role !== 'OFFICER') {
        setErrorMessage('Halaman ini hanya dapat diakses admin atau petugas.');
        return;
      }

      const [detailRes, summaryRes, sheepRes] = await Promise.all([
        getFarmerDetail(id),
        getFarmerSummary(id),
        getFarmerSheep(id),
      ]);

      setFarmer(detailRes.data);
      setSummary(summaryRes.data.summary);
      setSheep(sheepRes.data.sheep || []);
      setForm({
        name: detailRes.data.name || '',
        phone: detailRes.data.phone || '',
        address: detailRes.data.address || '',
        groupName: detailRes.data.groupName || '',
        province: detailRes.data.province || '',
        regency: detailRes.data.regency || '',
        district: detailRes.data.district || '',
        village: detailRes.data.village || '',
        addressDetail: detailRes.data.addressDetail || '',
        isActive: detailRes.data.isActive,
      });
    } catch (error) {
      console.error('Gagal memuat detail peternak:', error);

      const message = getApiErrorMessage(
        error,
        'Terjadi kesalahan saat memuat detail peternak.',
      );

      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setErrorMessage('Anda tidak memiliki akses ke halaman detail peternak.');
      } else if (axios.isAxiosError(error) && error.response?.status === 404) {
        setErrorMessage('Data peternak tidak ditemukan.');
      } else {
        setErrorMessage(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void loadAll();
    }
  }, [id, loadAll]);

  const totalEvaluated = useMemo(() => {
    if (!summary) return 0;
    return (
      (summary.eligibleBreeding || 0) +
      (summary.monitoring || 0) +
      (summary.notRecommended || 0)
    );
  }, [summary]);

  const eligiblePercent = useMemo(() => {
    if (!summary || totalEvaluated === 0) return 0;
    return Math.round((summary.eligibleBreeding / totalEvaluated) * 100);
  }, [summary, totalEvaluated]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateFarmer(id, form);
      notify('success', 'Data peternak berhasil diperbarui');
      await loadAll();
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal memperbarui peternak'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = async () => {
    const ok = window.confirm(
      farmer?.hasPin
        ? 'Reset PIN peternak ini? PIN lama tidak berlaku dan semua sesi peternak akan keluar.'
        : 'Buat PIN sementara untuk peternak ini?',
    );
    if (!ok) return;

    try {
      setResetting(true);
      const result = await resetFarmerPin(id);
      setTempPin({ name: result.data.name, pin: result.data.pin });
      await loadAll();
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal mereset PIN'));
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const ok = window.confirm('Yakin ingin menghapus peternak ini?');
      if (!ok) return;

      await deleteFarmer(id);
      router.push('/map');
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal menghapus peternak'));
    }
  };

  const shell = (content: React.ReactNode) => (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        {content}
        <Toast toast={toast} />
      </DashboardShell>
    </RoleGuard>
  );

  if (loading) {
    return shell(
      <div className="space-y-4" aria-busy="true" aria-label="Memuat detail peternak">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>,
    );
  }

  if (errorMessage || !farmer || !summary) {
    return shell(
      <>
        <Link href="/farmers" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted">
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke data peternak
        </Link>
        <EmptyState
          title="Data peternak tidak dapat ditampilkan"
          description={errorMessage || 'Data peternak tidak ditemukan.'}
        />
      </>,
    );
  }

  const region = [farmer.village, farmer.district, farmer.regency].filter(Boolean).join(', ');
  const hasPoint = farmer.latitude != null && farmer.longitude != null;

  return shell(
    <>
      <div className="mb-5">
        <Link
          href="/map"
          className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke peta sebaran
        </Link>

        <h1 className="text-2xl font-bold text-ink">{farmer.name}</h1>
        <p className="mt-1 text-sm text-ink-muted">{region || 'Wilayah belum diisi'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {farmer.hasPin ? (
            <Badge variant={farmer.mustChangePin ? 'warning' : 'success'}>
              {farmer.mustChangePin ? 'PIN sementara' : 'PIN aktif'}
            </Badge>
          ) : (
            <Badge variant="danger">Belum ada PIN</Badge>
          )}
          <Badge variant={farmer.isActive ? 'success' : 'danger'}>
            {farmer.isActive ? 'Aktif' : 'Tidak aktif'}
          </Badge>
          <Badge variant="default">{labelSumberLokasi(farmer.locationSource)}</Badge>
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <Button variant={farmer.hasPin ? 'outline' : 'solid'} disabled={resetting} onClick={handleResetPin}>
          <KeyRound size={18} aria-hidden="true" />
          {farmer.hasPin ? 'Reset PIN' : 'Buat PIN'}
        </Button>
        {farmer.phone && (
          <a href={`tel:${farmer.phone}`} className={buttonClassName({ className: 'w-full' })}>
            <Phone size={18} aria-hidden="true" />
            Hubungi
          </a>
        )}
        {hasPoint && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${farmer.latitude},${farmer.longitude}`}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ variant: 'outline', className: 'w-full' })}
          >
            <Navigation size={18} aria-hidden="true" />
            Buka Rute
          </a>
        )}
        {hasPoint && (
          <a
            href={`https://www.google.com/maps?q=${farmer.latitude},${farmer.longitude}`}
            target="_blank"
            rel="noreferrer"
            className={buttonClassName({ variant: 'outline', className: 'w-full' })}
          >
            <MapPin size={18} aria-hidden="true" />
            Lihat Titik
          </a>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total ternak" value={summary.totalSheep} />
        <StatTile label="Ternak aktif" value={summary.activeSheep} />
        <StatTile label="Kelompok" value={<span className="text-lg">{farmer.groupName || '-'}</span>} />
        <StatTile label="No. HP" value={<span className="text-lg">{farmer.phone || '-'}</span>} />
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-primary" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-ink">Informasi lokasi</h2>
          </div>

          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ['Provinsi', farmer.province || '-'],
              ['Kabupaten', farmer.regency || '-'],
              ['Kecamatan', farmer.district || '-'],
              ['Desa', farmer.village || '-'],
              ['Latitude', farmer.latitude ?? '-'],
              ['Longitude', farmer.longitude ?? '-'],
              [
                'Update lokasi',
                farmer.locationUpdatedAt
                  ? new Date(farmer.locationUpdatedAt).toLocaleString('id-ID')
                  : '-',
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <dt className="w-28 shrink-0 text-ink-muted">{label}</dt>
                <dd className="min-w-0 break-words font-medium text-ink">{value}</dd>
              </div>
            ))}
            <div className="flex gap-3 sm:col-span-2">
              <dt className="w-28 shrink-0 text-ink-muted">Alamat</dt>
              <dd className="min-w-0 break-words font-medium text-ink">
                {farmer.addressDetail || farmer.address || '-'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-ink">Ringkasan evaluasi</h2>
          <dl className="space-y-3 text-sm">
            {[
              ['Total dievaluasi', totalEvaluated],
              ['Layak bibit', summary.eligibleBreeding],
              ['Perlu dipantau', summary.monitoring],
              ['Belum direkomendasikan', summary.notRecommended],
              ['Persentase layak bibit', `${eligiblePercent}%`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="text-ink-muted">{label}</dt>
                <dd className="font-semibold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card className="mb-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Ubah data peternak</h2>
            <p className="text-sm text-ink-muted">Perbarui identitas dan alamat</p>
          </div>
          <Button
            variant="outline"
            aria-expanded={showEdit}
            onClick={() => setShowEdit((value) => !value)}
          >
            <PencilLine size={18} aria-hidden="true" />
            {showEdit ? 'Tutup' : 'Ubah'}
          </Button>
        </div>

        {showEdit && (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="No. HP">
                <Input type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Field>
              <Field label="Alamat">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <Field label="Kelompok">
                <Input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
              </Field>
              <Field label="Provinsi">
                <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
              </Field>
              <Field label="Kabupaten">
                <Input value={form.regency} onChange={(e) => setForm({ ...form, regency: e.target.value })} />
              </Field>
              <Field label="Kecamatan">
                <Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
              </Field>
              <Field label="Desa">
                <Input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
              </Field>
              <Field label="Alamat detail">
                <Input value={form.addressDetail} onChange={(e) => setForm({ ...form, addressDetail: e.target.value })} />
              </Field>
              <Field label="Status">
                <Select
                  value={String(form.isActive)}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Tidak aktif</option>
                </Select>
              </Field>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
              <Button size="lg" variant="dangerOutline" onClick={handleDelete} disabled={saving}>
                Hapus Peternak
              </Button>
            </div>
          </div>
        )}
      </Card>

      {tempPin && (
        <TempPinDialog
          title="PIN sementara dibuat"
          name={tempPin.name}
          pin={tempPin.pin}
          onClose={() => setTempPin(null)}
        />
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">Ternak milik peternak</h2>
            <p className="text-sm text-ink-muted">Ternak yang terhubung dengan peternak ini</p>
          </div>
          <Badge variant="info">Total: {sheep.length}</Badge>
        </div>

        {sheep.length === 0 ? (
          <EmptyState
            className="border-0 py-6 shadow-none"
            icon={PawPrint}
            title="Belum ada ternak"
            description="Ternak akan tampil di sini setelah ditambahkan untuk peternak ini."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sheep.map((item) => (
              <Link
                key={item.id}
                href={`/sheep/${item.id}`}
                className="block rounded-2xl border border-line p-3 transition active:bg-primary-soft/40 sm:p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-ink">{item.sheepCode}</h3>
                    <p className="truncate text-sm text-ink-muted">{item.name || 'Tanpa nama'}</p>
                  </div>
                  <Badge variant={item.status === 'ACTIVE' ? 'success' : 'default'}>
                    {labelStatusTernak(item.status)}
                  </Badge>
                </div>

                <p className="text-sm text-ink/80">
                  {item.breed} · {labelJenisKelamin(item.gender)}
                  {item.color ? ` · ${item.color}` : ''}
                </p>
                <p className="text-sm text-ink-muted">{item.location || '-'}</p>

                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs text-ink-muted">
                  <div className="rounded-lg bg-primary-soft/50 px-1 py-1.5">
                    Bobot
                    <p className="text-sm font-semibold text-ink">{item._count.weights}</p>
                  </div>
                  <div className="rounded-lg bg-primary-soft/50 px-1 py-1.5">
                    BCS
                    <p className="text-sm font-semibold text-ink">{item._count.bcsRecords}</p>
                  </div>
                  <div className="rounded-lg bg-primary-soft/50 px-1 py-1.5">
                    Sehat
                    <p className="text-sm font-semibold text-ink">{item._count.healthRecords}</p>
                  </div>
                  <div className="rounded-lg bg-primary-soft/50 px-1 py-1.5">
                    Repro
                    <p className="text-sm font-semibold text-ink">{item._count.reproductions}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>,
  );
}
