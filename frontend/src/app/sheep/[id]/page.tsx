'use client';
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PhotoUploadField } from '@/components/ui/photo-upload-field';
import { api, getApiErrorMessage } from '@/lib/api';
import { getMe, type MeResponse } from '@/lib/me';
import { getSheepEvaluation, type EvaluationDetailResponse } from '@/lib/evaluation';
import { getFarmers, type FarmerOption } from '@/lib/farmers';
import { EvaluationPanel } from '@/components/evaluation/evaluation-panel';
import {
  labelJenisKelamin,
  labelPeran,
  labelStatusData,
  labelStatusKesehatan,
  labelStatusReproduksi,
  labelStatusTernak,
} from '@/lib/labels';

type SheepDetail = {
  id: string;
  sheepCode: string;
  name?: string;
  breed: string;
  gender: string;
  birthDate?: string;
  color?: string;
  physicalMark?: string;
  sireId?: string;
  damId?: string;
  location?: string;
  status: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id?: string;
    name: string;
    email?: string;
    loginCode?: string | null;
    role?: string;
  };
  ownerUser?: {
    id: string;
    name: string;
    loginCode?: string | null;
    groupName?: string | null;
    phone?: string | null;
  } | null;
  _count?: {
    weights: number;
    bcsRecords: number;
    healthRecords: number;
    reproductions: number;
    activityLogs: number;
  };
};

type Weight = {
  id: string;
  recordDate: string;
  weightKg: number;
  note?: string;
};

type Bcs = {
  id: string;
  recordDate: string;
  bcsScore: number;
  note?: string;
};

type Health = {
  id: string;
  checkDate: string;
  diseaseName?: string;
  treatment?: string;
  medicine?: string;
  healthStatus: string;
  note?: string;
};

type Reproduction = {
  id: string;
  matingDate?: string;
  estimatedBirthDate?: string;
  lambingDate?: string;
  maleParent?: string;
  totalLambBorn?: number;
  totalLambWeaned?: number;
  totalBirthWeight?: number;
  totalWeaningWeight?: number;
  status: string;
  note?: string;
};

type TabKey = 'weights' | 'bcs' | 'health' | 'reproduction';

export default function SheepDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [me, setMe] = useState<MeResponse | null>(null);
  const [sheep, setSheep] = useState<SheepDetail | null>(null);
  const [weights, setWeights] = useState<Weight[]>([]);
  const [bcs, setBcs] = useState<Bcs[]>([]);
  const [health, setHealth] = useState<Health[]>([]);
  const [reproduction, setReproduction] = useState<Reproduction[]>([]);
  const [evaluation, setEvaluation] =
    useState<EvaluationDetailResponse['data'] | null>(null);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('weights');

  const [editForm, setEditForm] = useState({
    sheepCode: '',
    name: '',
    breed: '',
    gender: 'MALE',
    color: '',
    location: '',
    physicalMark: '',
    photoUrl: '',
    status: 'ACTIVE',
    ownerUserId: '',
  });

  const [weightForm, setWeightForm] = useState({
    recordDate: '',
    weightKg: '',
    note: '',
  });

  const [bcsForm, setBcsForm] = useState({
    recordDate: '',
    bcsScore: '3',
    note: '',
  });

  const [healthForm, setHealthForm] = useState({
    checkDate: '',
    diseaseName: '',
    treatment: '',
    medicine: '',
    healthStatus: 'HEALTHY',
    note: '',
  });

  const [reproForm, setReproForm] = useState({
    matingDate: '',
    estimatedBirthDate: '',
    lambingDate: '',
    maleParent: '',
    totalLambBorn: '',
    totalLambWeaned: '',
    totalBirthWeight: '',
    totalWeaningWeight: '',
    status: 'OPEN',
    note: '',
  });

  const fetchAll = useCallback(async () => {
    try {
      const [meRes, sheepRes, weightsRes, bcsRes, healthRes, reproRes, evalRes] =
        await Promise.all([
          getMe(),
          api.get(`/sheep/${id}`),
          api.get(`/weights/sheep/${id}`),
          api.get(`/bcs/sheep/${id}`),
          api.get(`/health/sheep/${id}`),
          api.get(`/reproduction/sheep/${id}`),
          getSheepEvaluation(id),
        ]);

      const sheepData = sheepRes.data.data as SheepDetail;

      setMe(meRes);
      setSheep(sheepData);
      setWeights(weightsRes.data.data || []);
      setBcs(bcsRes.data.data || []);
      setHealth(healthRes.data.data || []);
      setReproduction(reproRes.data.data || []);
      setEvaluation(evalRes.data);

      if (meRes.role === 'ADMIN' || meRes.role === 'OFFICER') {
        const farmerRes = await getFarmers();
        setFarmers(farmerRes.data || []);
      }

      setEditForm({
        sheepCode: sheepData.sheepCode || '',
        name: sheepData.name || '',
        breed: sheepData.breed || '',
        gender: sheepData.gender || 'MALE',
        color: sheepData.color || '',
        location: sheepData.location || '',
        physicalMark: sheepData.physicalMark || '',
        photoUrl: sheepData.photoUrl || '',
        status: sheepData.status || 'ACTIVE',
        ownerUserId: sheepData.ownerUser?.id || '',
      });
    } catch (error) {
      console.error('Gagal memuat detail ternak:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      void fetchAll();
    }
  }, [id, fetchAll]);

  const latestWeight = useMemo(() => weights[0], [weights]);
  const latestBcs = useMemo(() => bcs[0], [bcs]);
  const latestHealth = useMemo(() => health[0], [health]);
  const latestReproduction = useMemo(() => reproduction[0], [reproduction]);

  const canManageIdentity = me?.role === 'ADMIN' || me?.role === 'OFFICER';
  const canRecord =
    me?.role === 'ADMIN' || me?.role === 'OFFICER' || me?.role === 'FARMER';

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'HEALTHY':
      case 'OPEN':
      case 'COMPLETE':
      case 'LAYAK_BIBIT':
      case 'GOOD':
      case 'IDEAL':
      case 'UP':
        return 'success';
      case 'RECOVERING':
      case 'PREGNANT':
      case 'MATED':
      case 'PARTIAL':
      case 'PERLU_PEMANTAUAN':
      case 'FAIR':
      case 'STABLE':
      case 'CAUTION':
        return 'warning';
      case 'SICK':
      case 'DEAD':
      case 'MINIMAL':
      case 'BELUM_DIREKOMENDASIKAN':
      case 'POOR':
      case 'DOWN':
      case 'BAD':
      case 'LOW':
      case 'HIGH':
        return 'danger';
      case 'LAMBED':
      case 'SOLD':
      case 'INSUFFICIENT_DATA':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleDeleteSheep = async () => {
    try {
      if (!canManageIdentity) {
        alert('Hanya admin/petugas yang dapat menghapus ternak');
        return;
      }

      const ok = window.confirm('Yakin ingin menghapus data ternak ini?');
      if (!ok) return;

      await api.delete(`/sheep/${id}`);
      alert('Data ternak berhasil dihapus');
      router.push('/sheep');
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal menghapus ternak'));
    }
  };

  const handleUpdateIdentity = async () => {
    try {
      if (!canManageIdentity) {
        alert('Hanya admin/petugas yang dapat mengubah identitas ternak');
        return;
      }

      await api.patch(`/sheep/${id}`, {
        sheepCode: editForm.sheepCode,
        name: editForm.name || undefined,
        breed: editForm.breed,
        gender: editForm.gender,
        color: editForm.color || undefined,
        location: editForm.location || undefined,
        physicalMark: editForm.physicalMark || undefined,
        photoUrl: editForm.photoUrl || undefined,
        status: editForm.status,
        ownerUserId: editForm.ownerUserId || undefined,
      });

      alert('Identitas ternak berhasil diperbarui');
      await fetchAll();
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal memperbarui identitas ternak'));
    }
  };

  const handleAddWeight = async () => {
    try {
      if (!canRecord) return;

      await api.post('/weights', {
        sheepId: id,
        recordDate: weightForm.recordDate,
        weightKg: Number(weightForm.weightKg),
        note: weightForm.note || undefined,
      });

      setWeightForm({ recordDate: '', weightKg: '', note: '' });
      await fetchAll();
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal menambahkan bobot'));
    }
  };

  const handleAddBcs = async () => {
    try {
      if (!canRecord) return;

      await api.post('/bcs', {
        sheepId: id,
        recordDate: bcsForm.recordDate,
        bcsScore: Number(bcsForm.bcsScore),
        note: bcsForm.note || undefined,
      });

      setBcsForm({ recordDate: '', bcsScore: '3', note: '' });
      await fetchAll();
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal menambahkan BCS'));
    }
  };

  const handleAddHealth = async () => {
    try {
      if (!canRecord) return;

      await api.post('/health', {
        sheepId: id,
        checkDate: healthForm.checkDate,
        diseaseName: healthForm.diseaseName || undefined,
        treatment: healthForm.treatment || undefined,
        medicine: healthForm.medicine || undefined,
        healthStatus: healthForm.healthStatus,
        note: healthForm.note || undefined,
      });

      setHealthForm({
        checkDate: '',
        diseaseName: '',
        treatment: '',
        medicine: '',
        healthStatus: 'HEALTHY',
        note: '',
      });

      await fetchAll();
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal menambahkan data kesehatan'));
    }
  };

  const handleAddReproduction = async () => {
    try {
      if (!canRecord) return;

      await api.post('/reproduction', {
        sheepId: id,
        matingDate: reproForm.matingDate || undefined,
        estimatedBirthDate: reproForm.estimatedBirthDate || undefined,
        lambingDate: reproForm.lambingDate || undefined,
        maleParent: reproForm.maleParent || undefined,
        totalLambBorn: reproForm.totalLambBorn
          ? Number(reproForm.totalLambBorn)
          : undefined,
        totalLambWeaned: reproForm.totalLambWeaned
          ? Number(reproForm.totalLambWeaned)
          : undefined,
        totalBirthWeight: reproForm.totalBirthWeight
          ? Number(reproForm.totalBirthWeight)
          : undefined,
        totalWeaningWeight: reproForm.totalWeaningWeight
          ? Number(reproForm.totalWeaningWeight)
          : undefined,
        status: reproForm.status,
        note: reproForm.note || undefined,
      });

      setReproForm({
        matingDate: '',
        estimatedBirthDate: '',
        lambingDate: '',
        maleParent: '',
        totalLambBorn: '',
        totalLambWeaned: '',
        totalBirthWeight: '',
        totalWeaningWeight: '',
        status: 'OPEN',
        note: '',
      });

      await fetchAll();
    } catch (error) {
      console.error(error);
      alert(getApiErrorMessage(error, 'Gagal menambahkan data reproduksi'));
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <p>Memuat data ternak...</p>
        </DashboardShell>
      </RoleGuard>
    );
  }

  if (!sheep) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <Card>
            <p className="text-sm text-red-500">Data ternak tidak ditemukan.</p>
          </Card>
        </DashboardShell>
      </RoleGuard>
    );
  }

  if (me?.role === 'FARMER') {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <div className="mb-6">
            <Link
              href="/sheep"
              className="mb-4 inline-flex items-center gap-2 text-sm text-[color:var(--ink-muted)] transition hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              Kembali ke ternak saya
            </Link>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {sheep.photoUrl ? (
                  <img
                    src={sheep.photoUrl}
                    alt={sheep.name || sheep.sheepCode}
                    className="h-20 w-20 rounded-[24px] border border-[color:rgba(86,74,50,0.12)] object-cover shadow-[0_14px_28px_rgba(53,43,24,0.08)]"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[rgba(33,73,61,0.12)] text-xl font-semibold text-[color:var(--accent)]">
                    {sheep.sheepCode.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold">{sheep.sheepCode}</h1>
                  <p className="text-sm text-[color:var(--ink-muted)]">
                    Ringkasan ternak untuk kerja lapangan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(sheep.status)}>{labelStatusTernak(sheep.status)}</Badge>
                {evaluation && (
                  <Badge variant={getStatusVariant(evaluation.evaluation.breedingStatus)}>
                    {labelStatusData(evaluation.evaluation.breedingStatus)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="min-h-[112px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Nama</p>
              <h2 className="mt-2 text-lg font-semibold">{sheep.name || '-'}</h2>
            </Card>
            <Card className="min-h-[112px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Breed</p>
              <h2 className="mt-2 text-lg font-semibold">{sheep.breed}</h2>
            </Card>
            <Card className="min-h-[112px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Bobot Terakhir</p>
              <h2 className="mt-2 text-lg font-semibold">
                {latestWeight ? `${latestWeight.weightKg} kg` : '-'}
              </h2>
            </Card>
            <Card className="min-h-[112px] bg-[color:var(--surface-strong)]">
              <p className="text-sm text-[color:var(--ink-muted)]">Kondisi Terakhir</p>
              <div className="mt-2">
                <Badge variant={getStatusVariant(latestHealth?.healthStatus)}>
                  {labelStatusKesehatan(latestHealth?.healthStatus)}
                </Badge>
              </div>
            </Card>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="bg-[color:var(--surface-strong)]">
              <h3 className="mb-4 text-lg font-semibold">Aksi Cepat</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <Link href={`/recording?sheepId=${sheep.id}`}>
                  <Button className="w-full">Rekord Bobot / BCS / Kesehatan</Button>
                </Link>
                <Link href={`/recording?sheepId=${sheep.id}&event=SICK`}>
                  <Button variant="dangerOutline" className="w-full">
                    Catat Sakit
                  </Button>
                </Link>
                <Link href={`/recording?sheepId=${sheep.id}&event=MATED`}>
                  <Button variant="outline" className="w-full">
                    Catat Kawin
                  </Button>
                </Link>
                <Link href={`/recording?sheepId=${sheep.id}&event=PREGNANT`}>
                  <Button variant="outline" className="w-full">
                    Catat Bunting
                  </Button>
                </Link>
                <Link href={`/recording?sheepId=${sheep.id}&event=LAMBED`}>
                  <Button variant="outline" className="w-full">
                    Catat Beranak
                  </Button>
                </Link>
                <Link href={`/recording?sheepId=${sheep.id}&event=DEAD`}>
                  <Button variant="dangerOutline" className="w-full">
                    Catat Mati
                  </Button>
                </Link>
                <Link href={`/recording?sheepId=${sheep.id}&event=SOLD`}>
                  <Button variant="successOutline" className="w-full">
                    Catat Terjual
                  </Button>
                </Link>
                <Link href="/history">
                  <Button variant="outline" className="w-full">
                    Lihat Riwayat
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="bg-[color:var(--surface-strong)]">
              <h3 className="mb-4 text-lg font-semibold">Status Terbaru</h3>
              <div className="space-y-3 text-sm text-gray-800">
                <div className="flex items-center justify-between">
                  <span>BCS terakhir</span>
                  <span className="font-medium">{latestBcs ? `BCS ${latestBcs.bcsScore}` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kesehatan</span>
                  <span className="font-medium">{labelStatusKesehatan(latestHealth?.healthStatus)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Reproduksi</span>
                  <span className="font-medium">{labelStatusReproduksi(latestReproduction?.status)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Catatan evaluasi</span>
                  <span className="font-medium">
                    {labelStatusData(evaluation?.evaluation.overallCondition)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="bg-[color:var(--surface-strong)]">
              <h3 className="mb-4 text-lg font-semibold">Bobot Terakhir</h3>
              <div className="space-y-3">
                {weights.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                    <p className="font-medium">{item.weightKg} kg</p>
                    <p className="text-[color:var(--ink-muted)]">
                      {new Date(item.recordDate).toLocaleDateString('id-ID')}
                    </p>
                    <p className="mt-2 text-gray-600">{item.note || '-'}</p>
                  </div>
                ))}
                {weights.length === 0 && (
                  <p className="text-sm text-[color:var(--ink-muted)]">Belum ada data bobot.</p>
                )}
              </div>
            </Card>

            <Card className="bg-[color:var(--surface-strong)]">
              <h3 className="mb-4 text-lg font-semibold">Kesehatan Terakhir</h3>
              <div className="space-y-3">
                {health.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{item.diseaseName || 'Kondisi umum'}</p>
                      <Badge variant={getStatusVariant(item.healthStatus)}>{labelStatusKesehatan(item.healthStatus)}</Badge>
                    </div>
                    <p className="mt-2 text-[color:var(--ink-muted)]">
                      {new Date(item.checkDate).toLocaleDateString('id-ID')}
                    </p>
                    <p className="mt-2 text-gray-600">{item.note || item.treatment || '-'}</p>
                  </div>
                ))}
                {health.length === 0 && (
                  <p className="text-sm text-[color:var(--ink-muted)]">Belum ada data kesehatan.</p>
                )}
              </div>
            </Card>

            <Card className="bg-[color:var(--surface-strong)]">
              <h3 className="mb-4 text-lg font-semibold">Reproduksi Terakhir</h3>
              <div className="space-y-3">
                {reproduction.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{labelStatusReproduksi(item.status)}</p>
                      <Badge variant={getStatusVariant(item.status)}>{labelStatusReproduksi(item.status)}</Badge>
                    </div>
                    <p className="mt-2 text-[color:var(--ink-muted)]">
                      {item.matingDate
                        ? new Date(item.matingDate).toLocaleDateString('id-ID')
                        : item.lambingDate
                          ? new Date(item.lambingDate).toLocaleDateString('id-ID')
                          : '-'}
                    </p>
                    <p className="mt-2 text-gray-600">{item.note || item.maleParent || '-'}</p>
                  </div>
                ))}
                {reproduction.length === 0 && (
                  <p className="text-sm text-[color:var(--ink-muted)]">Belum ada data reproduksi.</p>
                )}
              </div>
            </Card>
          </div>
        </DashboardShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="mb-6">
          <Link
            href="/sheep"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar ternak
          </Link>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {sheep.photoUrl ? (
                <img
                  src={sheep.photoUrl}
                  alt={sheep.name || sheep.sheepCode}
                  className="h-20 w-20 rounded-[24px] border border-[color:rgba(86,74,50,0.12)] object-cover shadow-[0_14px_28px_rgba(53,43,24,0.08)]"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[rgba(33,73,61,0.12)] text-xl font-semibold text-[color:var(--accent)]">
                  {sheep.sheepCode.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{sheep.sheepCode}</h1>
                <p className="text-sm text-gray-500">
                  Detail ternak dan rekording terintegrasi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {me?.role && <Badge variant="info">{labelPeran(me.role)}</Badge>}
              <Badge variant={getStatusVariant(sheep.status)}>{labelStatusTernak(sheep.status)}</Badge>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Nama</p>
            <h2 className="mt-2 text-lg font-semibold">{sheep.name || '-'}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Breed</p>
            <h2 className="mt-2 text-lg font-semibold">{sheep.breed}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Jenis Kelamin</p>
            <h2 className="mt-2 text-lg font-semibold">{labelJenisKelamin(sheep.gender)}</h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Lokasi</p>
            <h2 className="mt-2 text-lg font-semibold">{sheep.location || '-'}</h2>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-lg font-semibold">Informasi Umum</h3>
            <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              <p><span className="font-medium">Warna:</span> {sheep.color || '-'}</p>
              <p><span className="font-medium">Tanggal lahir:</span> {sheep.birthDate ? new Date(sheep.birthDate).toLocaleDateString('id-ID') : '-'}</p>
              <p><span className="font-medium">Tanda fisik:</span> {sheep.physicalMark || '-'}</p>
              <p><span className="font-medium">Sire ID:</span> {sheep.sireId || '-'}</p>
              <p><span className="font-medium">Dam ID:</span> {sheep.damId || '-'}</p>
              <p><span className="font-medium">Dibuat oleh:</span> {sheep.createdBy?.name || '-'}</p>
              <p><span className="font-medium">Pemilik ternak:</span> {sheep.ownerUser?.name || '-'}</p>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-lg font-semibold">Ringkasan Cepat</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Bobot terakhir</span>
                <span className="font-medium">{latestWeight ? `${latestWeight.weightKg} kg` : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">BCS terakhir</span>
                <span className="font-medium">{latestBcs ? latestBcs.bcsScore : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Kesehatan terakhir</span>
                <Badge variant={getStatusVariant(latestHealth?.healthStatus)}>
                  {labelStatusKesehatan(latestHealth?.healthStatus)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Reproduksi terakhir</span>
                <Badge variant={getStatusVariant(latestReproduction?.status)}>
                  {labelStatusReproduksi(latestReproduction?.status)}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {evaluation && <EvaluationPanel evaluation={evaluation} />}

        {canManageIdentity && (
          <Card className="mb-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Edit Identitas Ternak</h3>
                <p className="text-sm text-gray-500">
                  Hanya admin/petugas yang dapat mengubah identitas utama ternak
                </p>
              </div>
              <Badge variant="warning">HANYA ADMIN / PETUGAS</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                placeholder="Kode Ternak"
                value={editForm.sheepCode}
                onChange={(e) => setEditForm({ ...editForm, sheepCode: e.target.value })}
              />
              <Input
                placeholder="Nama"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
              <Input
                placeholder="Breed"
                value={editForm.breed}
                onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
              />
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={editForm.gender}
                onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
              >
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
              <Input
                placeholder="Warna"
                value={editForm.color}
                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
              />
              <Input
                placeholder="Lokasi"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
              <Input
                placeholder="Tanda fisik"
                value={editForm.physicalMark}
                onChange={(e) => setEditForm({ ...editForm, physicalMark: e.target.value })}
              />
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={editForm.ownerUserId}
                onChange={(e) => setEditForm({ ...editForm, ownerUserId: e.target.value })}
              >
                <option value="">Pilih Pemilik Peternak</option>
                {farmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.name} {farmer.loginCode ? `- ${farmer.loginCode}` : ''}
                  </option>
                ))}
              </select>
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="ACTIVE">Aktif</option>
                <option value="SOLD">Terjual</option>
                <option value="DEAD">Mati</option>
                <option value="CULLED">Afkir</option>
              </select>
            </div>

            <div className="mt-4">
              <PhotoUploadField
                label="Foto ternak"
                value={editForm.photoUrl}
                onChange={(value) => setEditForm({ ...editForm, photoUrl: value })}
                helperText="Unggah foto agar identifikasi ternak di lapangan lebih cepat."
                emptyLabel="FOTO TERNAK"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleUpdateIdentity}>Simpan Perubahan Identitas</Button>
              <Button type="button" variant="dangerOutline" onClick={handleDeleteSheep}>
                Hapus Ternak
              </Button>
            </div>
          </Card>
        )}

        {!canManageIdentity && (
          <Card className="mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Akses Peternak</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Anda dapat melakukan rekording bobot, BCS, kesehatan, dan reproduksi,
                  tetapi tidak dapat mengubah identitas utama ternak.
                </p>
              </div>
              <Badge variant="info">HANYA PENCATATAN</Badge>
            </div>
          </Card>
        )}

        <Card className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'weights', label: 'Bobot' },
              { key: 'bcs', label: 'BCS' },
              { key: 'health', label: 'Kesehatan' },
              { key: 'reproduction', label: 'Reproduksi' },
            ].map((tab) => (
              <Button
                key={tab.key}
                type="button"
                variant={activeTab === tab.key ? 'solid' : 'outline'}
                onClick={() => setActiveTab(tab.key as TabKey)}
                className="h-10"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>

        {activeTab === 'weights' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Tambah Bobot</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="date" value={weightForm.recordDate} onChange={(e) => setWeightForm({ ...weightForm, recordDate: e.target.value })} />
              <Input type="number" step="0.1" placeholder="Bobot (kg)" value={weightForm.weightKg} onChange={(e) => setWeightForm({ ...weightForm, weightKg: e.target.value })} />
              <Input placeholder="Catatan" value={weightForm.note} onChange={(e) => setWeightForm({ ...weightForm, note: e.target.value })} />
            </div>
            <div className="mt-3">
              <Button onClick={handleAddWeight}>Simpan Bobot</Button>
            </div>

            <h3 className="mb-4 mt-8 text-lg font-semibold">Riwayat Bobot</h3>
            <div className="space-y-3">
              {weights.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada data bobot.</p>
              ) : (
                weights.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.weightKg} kg</p>
                        <p className="text-gray-500">{new Date(item.recordDate).toLocaleDateString('id-ID')}</p>
                      </div>
                      <Badge variant="info">Bobot</Badge>
                    </div>
                    <p className="mt-2 text-gray-600">{item.note || '-'}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'bcs' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Tambah BCS</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <Input type="date" value={bcsForm.recordDate} onChange={(e) => setBcsForm({ ...bcsForm, recordDate: e.target.value })} />
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={bcsForm.bcsScore}
                onChange={(e) => setBcsForm({ ...bcsForm, bcsScore: e.target.value })}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
              <Input placeholder="Catatan" value={bcsForm.note} onChange={(e) => setBcsForm({ ...bcsForm, note: e.target.value })} />
            </div>
            <div className="mt-3">
              <Button onClick={handleAddBcs}>Simpan BCS</Button>
            </div>

            <h3 className="mb-4 mt-8 text-lg font-semibold">Riwayat BCS</h3>
            <div className="space-y-3">
              {bcs.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada data BCS.</p>
              ) : (
                bcs.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">BCS {item.bcsScore}</p>
                        <p className="text-gray-500">{new Date(item.recordDate).toLocaleDateString('id-ID')}</p>
                      </div>
                      <Badge variant="warning">BCS</Badge>
                    </div>
                    <p className="mt-2 text-gray-600">{item.note || '-'}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'health' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Tambah Kesehatan</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="date" value={healthForm.checkDate} onChange={(e) => setHealthForm({ ...healthForm, checkDate: e.target.value })} />
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={healthForm.healthStatus}
                onChange={(e) => setHealthForm({ ...healthForm, healthStatus: e.target.value })}
              >
                <option value="HEALTHY">Sehat</option>
                <option value="SICK">Sakit</option>
                <option value="RECOVERING">Pemulihan</option>
              </select>
              <Input placeholder="Penyakit" value={healthForm.diseaseName} onChange={(e) => setHealthForm({ ...healthForm, diseaseName: e.target.value })} />
              <Input placeholder="Tindakan" value={healthForm.treatment} onChange={(e) => setHealthForm({ ...healthForm, treatment: e.target.value })} />
              <Input placeholder="Obat" value={healthForm.medicine} onChange={(e) => setHealthForm({ ...healthForm, medicine: e.target.value })} />
              <Input placeholder="Catatan" value={healthForm.note} onChange={(e) => setHealthForm({ ...healthForm, note: e.target.value })} />
            </div>
            <div className="mt-3">
              <Button onClick={handleAddHealth}>Simpan Kesehatan</Button>
            </div>

            <h3 className="mb-4 mt-8 text-lg font-semibold">Riwayat Kesehatan</h3>
            <div className="space-y-3">
              {health.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada data kesehatan.</p>
              ) : (
                health.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.diseaseName || 'Kondisi umum'}</p>
                        <p className="text-gray-500">{new Date(item.checkDate).toLocaleDateString('id-ID')}</p>
                      </div>
                      <Badge variant={getStatusVariant(item.healthStatus)}>{labelStatusKesehatan(item.healthStatus)}</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <p>Tindakan: {item.treatment || '-'}</p>
                      <p>Obat: {item.medicine || '-'}</p>
                      <p>Catatan: {item.note || '-'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}

        {activeTab === 'reproduction' && (
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Tambah Reproduksi</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Input type="date" value={reproForm.matingDate} onChange={(e) => setReproForm({ ...reproForm, matingDate: e.target.value })} />
              <Input type="date" value={reproForm.estimatedBirthDate} onChange={(e) => setReproForm({ ...reproForm, estimatedBirthDate: e.target.value })} />
              <Input type="date" value={reproForm.lambingDate} onChange={(e) => setReproForm({ ...reproForm, lambingDate: e.target.value })} />
              <Input placeholder="Pejantan" value={reproForm.maleParent} onChange={(e) => setReproForm({ ...reproForm, maleParent: e.target.value })} />
              <Input type="number" placeholder="Jumlah anak lahir" value={reproForm.totalLambBorn} onChange={(e) => setReproForm({ ...reproForm, totalLambBorn: e.target.value })} />
              <Input type="number" placeholder="Jumlah anak sapih" value={reproForm.totalLambWeaned} onChange={(e) => setReproForm({ ...reproForm, totalLambWeaned: e.target.value })} />
              <Input type="number" step="0.1" placeholder="Total bobot lahir" value={reproForm.totalBirthWeight} onChange={(e) => setReproForm({ ...reproForm, totalBirthWeight: e.target.value })} />
              <Input type="number" step="0.1" placeholder="Total bobot sapih" value={reproForm.totalWeaningWeight} onChange={(e) => setReproForm({ ...reproForm, totalWeaningWeight: e.target.value })} />
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={reproForm.status}
                onChange={(e) => setReproForm({ ...reproForm, status: e.target.value })}
              >
                <option value="OPEN">Siap kawin</option>
                <option value="MATED">Sudah kawin</option>
                <option value="PREGNANT">Bunting</option>
                <option value="LAMBED">Sudah beranak</option>
              </select>
              <Input placeholder="Catatan" value={reproForm.note} onChange={(e) => setReproForm({ ...reproForm, note: e.target.value })} />
            </div>
            <div className="mt-3">
              <Button onClick={handleAddReproduction}>Simpan Reproduksi</Button>
            </div>

            <h3 className="mb-4 mt-8 text-lg font-semibold">Riwayat Reproduksi</h3>
            <div className="space-y-3">
              {reproduction.length === 0 ? (
                <p className="text-sm text-gray-500">Belum ada data reproduksi.</p>
              ) : (
                reproduction.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.maleParent || 'Data reproduksi'}</p>
                        <p className="text-gray-500">
                          {item.matingDate ? new Date(item.matingDate).toLocaleDateString('id-ID') : '-'}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(item.status)}>{labelStatusReproduksi(item.status)}</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-gray-600">
                      <p>Estimasi beranak: {item.estimatedBirthDate ? new Date(item.estimatedBirthDate).toLocaleDateString('id-ID') : '-'}</p>
                      <p>Tanggal beranak: {item.lambingDate ? new Date(item.lambingDate).toLocaleDateString('id-ID') : '-'}</p>
                      <p>Anak lahir: {item.totalLambBorn ?? '-'}</p>
                      <p>Anak sapih: {item.totalLambWeaned ?? '-'}</p>
                      <p>Total bobot lahir: {item.totalBirthWeight ?? '-'}</p>
                      <p>Total bobot sapih: {item.totalWeaningWeight ?? '-'}</p>
                      <p>Catatan: {item.note || '-'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
