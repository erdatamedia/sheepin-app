'use client';

import Link from 'next/link';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, MapPin, Navigation, PencilLine, PawPrint, Phone } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { BackLink } from '@/components/ui/back-link';
import { Field } from '@/components/ui/field';
import { ListGroup, ListRow, RowIcon } from '@/components/ui/list-group';
import { Sheet } from '@/components/ui/sheet';
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

      const message = getApiErrorMessage(error, 'Terjadi kesalahan saat memuat detail peternak.');

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
      (summary.eligibleBreeding || 0) + (summary.monitoring || 0) + (summary.notRecommended || 0)
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
        <Link
          href="/farmers"
          className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted"
        >
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
      <BackLink href="/farmers" label="Peternak" />

      <div className="mb-5 flex items-center gap-4">
        <Avatar name={farmer.name} size="xl" />
        <div className="min-w-0">
          <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight text-ink">
            {farmer.name}
          </h1>
          <p className="truncate text-[15px] text-ink-muted">{region || 'Wilayah belum diisi'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatTile label="Total ternak" value={summary.totalSheep} />
        <StatTile label="Ternak aktif" value={summary.activeSheep} />
      </div>

      <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <div className="space-y-6">
          <ListGroup header="Tindakan">
            <ListRow
              leading={<RowIcon icon={KeyRound} />}
              leadingSize="icon"
              title={farmer.hasPin ? 'Reset PIN' : 'Buat PIN'}
              subtitle={
                farmer.hasPin ? 'PIN sementara baru, sesi lama keluar' : 'PIN sementara untuk masuk'
              }
              chevron={false}
              onClick={resetting ? undefined : handleResetPin}
            />
            {farmer.phone && (
              <ListRow
                leading={<RowIcon icon={Phone} />}
                leadingSize="icon"
                title="Hubungi"
                value={farmer.phone}
                href={`tel:${farmer.phone}`}
              />
            )}
            {hasPoint && (
              <ListRow
                leading={<RowIcon icon={Navigation} />}
                leadingSize="icon"
                title="Buka rute"
                subtitle="Google Maps"
                href={`https://www.google.com/maps/dir/?api=1&destination=${farmer.latitude},${farmer.longitude}`}
              />
            )}
            {hasPoint && (
              <ListRow
                leading={<RowIcon icon={MapPin} />}
                leadingSize="icon"
                title="Lihat titik lokasi"
                href={`https://www.google.com/maps?q=${farmer.latitude},${farmer.longitude}`}
              />
            )}
            <ListRow
              leading={<RowIcon icon={PencilLine} />}
              leadingSize="icon"
              title="Ubah data peternak"
              onClick={() => setShowEdit(true)}
            />
          </ListGroup>

          <ListGroup header="Informasi">
            <ListRow title="Nomor HP" value={farmer.phone || '-'} />
            <ListRow title="Kelompok" value={farmer.groupName || '-'} />
            <ListRow title="Provinsi" value={farmer.province || '-'} />
            <ListRow title="Kabupaten" value={farmer.regency || '-'} />
            <ListRow title="Kecamatan" value={farmer.district || '-'} />
            <ListRow title="Desa" value={farmer.village || '-'} />
            <ListRow title="Alamat" value={farmer.addressDetail || farmer.address || '-'} />
            <ListRow title="Sumber lokasi" value={labelSumberLokasi(farmer.locationSource)} />
            <ListRow
              title="Koordinat"
              value={hasPoint ? `${farmer.latitude}, ${farmer.longitude}` : '-'}
            />
            <ListRow
              title="Lokasi diperbarui"
              value={
                farmer.locationUpdatedAt
                  ? new Date(farmer.locationUpdatedAt).toLocaleString('id-ID')
                  : '-'
              }
            />
          </ListGroup>

          <ListGroup header="Evaluasi bibit">
            <ListRow title="Total dievaluasi" value={totalEvaluated} />
            <ListRow title="Layak bibit" value={summary.eligibleBreeding} />
            <ListRow title="Perlu dipantau" value={summary.monitoring} />
            <ListRow title="Belum direkomendasikan" value={summary.notRecommended} />
            <ListRow title="Persentase layak bibit" value={`${eligiblePercent}%`} />
          </ListGroup>
        </div>

        <ListGroup header={`Ternak milik peternak (${sheep.length})`}>
          {sheep.length === 0 ? (
            <li className="px-4 py-8 text-center">
              <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary-strong">
                <PawPrint size={22} aria-hidden="true" />
              </span>
              <p className="text-[17px] font-semibold text-ink">Belum ada ternak</p>
              <p className="mt-1 text-[15px] text-ink-muted">
                Ternak akan tampil di sini setelah ditambahkan untuk peternak ini.
              </p>
            </li>
          ) : (
            sheep.map((item) => (
              <ListRow
                key={item.id}
                href={`/sheep/${item.id}`}
                leading={<Avatar name={item.name || item.sheepCode} size="md" />}
                title={item.name ? `${item.sheepCode} · ${item.name}` : item.sheepCode}
                subtitle={[item.breed, labelJenisKelamin(item.gender), item.location]
                  .filter(Boolean)
                  .join(' · ')}
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

      {tempPin && (
        <TempPinDialog
          title="PIN sementara dibuat"
          name={tempPin.name}
          pin={tempPin.pin}
          onClose={() => setTempPin(null)}
        />
      )}

      <Sheet open={showEdit} onClose={() => setShowEdit(false)} title="Ubah data peternak">
        <div className="space-y-4">
          <Field label="Nama">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="No. HP">
            <Input
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="Alamat">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Field>
          <Field label="Kelompok">
            <Input
              value={form.groupName}
              onChange={(e) => setForm({ ...form, groupName: e.target.value })}
            />
          </Field>
          <Field label="Provinsi">
            <Input
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
          </Field>
          <Field label="Kabupaten">
            <Input
              value={form.regency}
              onChange={(e) => setForm({ ...form, regency: e.target.value })}
            />
          </Field>
          <Field label="Kecamatan">
            <Input
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </Field>
          <Field label="Desa">
            <Input
              value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })}
            />
          </Field>
          <Field label="Alamat detail">
            <Input
              value={form.addressDetail}
              onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
            />
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

          <div className="flex flex-col gap-2 pt-1">
            <Button size="lg" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan perubahan'}
            </Button>
            <Button size="lg" variant="dangerOutline" onClick={handleDelete} disabled={saving}>
              Hapus peternak
            </Button>
          </div>
        </div>
      </Sheet>
    </>,
  );
}
