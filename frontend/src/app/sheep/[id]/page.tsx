'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardPlus, PencilLine, PawPrint } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button, buttonClassName } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Segmented } from '@/components/ui/segmented';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Toast, useToast } from '@/components/ui/toast';
import { SheepAvatar } from '@/components/sheep/sheep-avatar';
import { PhotoUploadField } from '@/components/ui/photo-upload-field';
import { api, getApiErrorMessage } from '@/lib/api';
import { cn, sanitizeDecimal } from '@/lib/utils';
import { getMe, type MeResponse } from '@/lib/me';
import { getSheepEvaluation, type EvaluationDetailResponse } from '@/lib/evaluation';
import { getFarmers, type FarmerOption } from '@/lib/farmers';
import { EvaluationPanel } from '@/components/evaluation/evaluation-panel';
import {
  labelJenisKelamin,
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function HistoryItem({
  title,
  date,
  badge,
  children,
}: {
  title: string;
  date: string;
  badge: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line p-3 text-sm sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">{title}</p>
          <p className="text-ink-muted">{date}</p>
        </div>
        {badge}
      </div>
      {children && <div className="mt-2 space-y-1 text-ink/80">{children}</div>}
    </div>
  );
}

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
  const [showEdit, setShowEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast, notify } = useToast();

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

  const submit = async (
    action: () => Promise<void>,
    success: string,
    failure: string,
  ) => {
    if (busy) return;
    try {
      setBusy(true);
      await action();
      notify('success', success);
      await fetchAll();
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSheep = async () => {
    try {
      if (!canManageIdentity) {
        notify('error', 'Hanya admin/petugas yang dapat menghapus ternak');
        return;
      }

      const ok = window.confirm('Yakin ingin menghapus data ternak ini?');
      if (!ok) return;

      await api.delete(`/sheep/${id}`);
      router.push('/sheep');
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal menghapus ternak'));
    }
  };

  const handleUpdateIdentity = () => {
    if (!canManageIdentity) {
      notify('error', 'Hanya admin/petugas yang dapat mengubah identitas ternak');
      return;
    }

    return submit(
      async () => {
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
      },
      'Identitas ternak berhasil diperbarui',
      'Gagal memperbarui identitas ternak',
    );
  };

  const handleAddWeight = () => {
    if (!canRecord) return;

    return submit(
      async () => {
        await api.post('/weights', {
          sheepId: id,
          recordDate: weightForm.recordDate,
          weightKg: Number(weightForm.weightKg),
          note: weightForm.note || undefined,
        });
        setWeightForm({ recordDate: '', weightKg: '', note: '' });
      },
      'Bobot berhasil disimpan',
      'Gagal menambahkan bobot',
    );
  };

  const handleAddBcs = () => {
    if (!canRecord) return;

    return submit(
      async () => {
        await api.post('/bcs', {
          sheepId: id,
          recordDate: bcsForm.recordDate,
          bcsScore: Number(bcsForm.bcsScore),
          note: bcsForm.note || undefined,
        });
        setBcsForm({ recordDate: '', bcsScore: '3', note: '' });
      },
      'BCS berhasil disimpan',
      'Gagal menambahkan BCS',
    );
  };

  const handleAddHealth = () => {
    if (!canRecord) return;

    return submit(
      async () => {
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
      },
      'Data kesehatan berhasil disimpan',
      'Gagal menambahkan data kesehatan',
    );
  };

  const handleAddReproduction = () => {
    if (!canRecord) return;

    return submit(
      async () => {
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
      },
      'Data reproduksi berhasil disimpan',
      'Gagal menambahkan data reproduksi',
    );
  };

  const fmtDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString('id-ID') : '-';

  const shell = (content: React.ReactNode) => (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        {content}
        <Toast toast={toast} />
      </DashboardShell>
    </RoleGuard>
  );

  if (loading) {
    return shell(
      <div className="space-y-4" aria-busy="true" aria-label="Memuat data ternak">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>,
    );
  }

  if (!sheep) {
    return shell(
      <>
        <Link href="/sheep" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted">
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke daftar ternak
        </Link>
        <EmptyState
          icon={PawPrint}
          title="Data ternak tidak ditemukan"
          description="Ternak mungkin sudah dihapus atau Anda tidak punya akses."
        />
      </>,
    );
  }

  const isFarmer = me?.role === 'FARMER';

  const hero = (
    <div className="mb-5">
      <Link
        href="/sheep"
        className="mb-2 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-muted transition hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {isFarmer ? 'Kembali ke ternak saya' : 'Kembali ke daftar ternak'}
      </Link>

      <div className="flex items-center gap-4">
        <SheepAvatar
          sheepCode={sheep.sheepCode}
          name={sheep.name}
          photoUrl={sheep.photoUrl}
          className="h-20 w-20 rounded-[24px] text-xl"
        />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-ink">{sheep.sheepCode}</h1>
          <p className="truncate text-sm text-ink-muted">
            {sheep.name || sheep.breed}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(sheep.status)}>
              {labelStatusTernak(sheep.status)}
            </Badge>
            {isFarmer && evaluation && (
              <Badge variant={getStatusVariant(evaluation.evaluation.breedingStatus)}>
                {labelStatusData(evaluation.evaluation.breedingStatus)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const summaryTiles = (
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card className="p-3 sm:p-4">
        <p className="text-xs text-ink-muted sm:text-sm">Bobot terakhir</p>
        <p className="mt-1 text-xl font-bold text-ink">
          {latestWeight ? `${latestWeight.weightKg} kg` : '-'}
        </p>
      </Card>
      <Card className="p-3 sm:p-4">
        <p className="text-xs text-ink-muted sm:text-sm">BCS terakhir</p>
        <p className="mt-1 text-xl font-bold text-ink">
          {latestBcs ? latestBcs.bcsScore : '-'}
        </p>
      </Card>
      <Card className="p-3 sm:p-4">
        <p className="text-xs text-ink-muted sm:text-sm">Kesehatan</p>
        <div className="mt-2">
          <Badge variant={getStatusVariant(latestHealth?.healthStatus)}>
            {labelStatusKesehatan(latestHealth?.healthStatus)}
          </Badge>
        </div>
      </Card>
      <Card className="p-3 sm:p-4">
        <p className="text-xs text-ink-muted sm:text-sm">Reproduksi</p>
        <div className="mt-2">
          <Badge variant={getStatusVariant(latestReproduction?.status)}>
            {labelStatusReproduksi(latestReproduction?.status)}
          </Badge>
        </div>
      </Card>
    </div>
  );

  if (isFarmer) {
    const quickActions = [
      { event: 'SICK', label: 'Catat Sakit', variant: 'dangerOutline' as const },
      { event: 'MATED', label: 'Catat Kawin', variant: 'outline' as const },
      { event: 'PREGNANT', label: 'Catat Bunting', variant: 'outline' as const },
      { event: 'LAMBED', label: 'Catat Beranak', variant: 'outline' as const },
      { event: 'DEAD', label: 'Catat Mati', variant: 'dangerOutline' as const },
      { event: 'SOLD', label: 'Catat Terjual', variant: 'successOutline' as const },
    ];

    return shell(
      <>
        {hero}
        {summaryTiles}

        <Card className="mb-5">
          <h2 className="mb-3 text-lg font-semibold text-ink">Aksi cepat</h2>
          <Link
            href={`/recording?sheepId=${sheep.id}`}
            className={buttonClassName({ size: 'lg', className: 'mb-3 w-full' })}
          >
            <ClipboardPlus size={20} aria-hidden="true" />
            Rekord Bobot / BCS / Kesehatan
          </Link>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.event}
                href={`/recording?sheepId=${sheep.id}&event=${action.event}`}
                className={buttonClassName({ variant: action.variant, className: 'h-12' })}
              >
                {action.label}
              </Link>
            ))}
            <Link
              href="/history"
              className={buttonClassName({ variant: 'outline', className: 'h-12' })}
            >
              Lihat Riwayat
            </Link>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-ink">Bobot terakhir</h3>
            <div className="space-y-2">
              {weights.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-line p-3 text-sm">
                  <p className="text-base font-semibold text-ink">{item.weightKg} kg</p>
                  <p className="text-ink-muted">{fmtDate(item.recordDate)}</p>
                  {item.note && <p className="mt-1 text-ink/80">{item.note}</p>}
                </div>
              ))}
              {weights.length === 0 && (
                <p className="text-sm text-ink-muted">Belum ada data bobot.</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-lg font-semibold text-ink">Kesehatan terakhir</h3>
            <div className="space-y-2">
              {health.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-line p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ink">{item.diseaseName || 'Kondisi umum'}</p>
                    <Badge variant={getStatusVariant(item.healthStatus)}>
                      {labelStatusKesehatan(item.healthStatus)}
                    </Badge>
                  </div>
                  <p className="text-ink-muted">{fmtDate(item.checkDate)}</p>
                  {(item.note || item.treatment) && (
                    <p className="mt-1 text-ink/80">{item.note || item.treatment}</p>
                  )}
                </div>
              ))}
              {health.length === 0 && (
                <p className="text-sm text-ink-muted">Belum ada data kesehatan.</p>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-lg font-semibold text-ink">Reproduksi terakhir</h3>
            <div className="space-y-2">
              {reproduction.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-line p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-ink">{labelStatusReproduksi(item.status)}</p>
                    <Badge variant={getStatusVariant(item.status)}>
                      {labelStatusReproduksi(item.status)}
                    </Badge>
                  </div>
                  <p className="text-ink-muted">
                    {fmtDate(item.matingDate || item.lambingDate)}
                  </p>
                  {(item.note || item.maleParent) && (
                    <p className="mt-1 text-ink/80">{item.note || item.maleParent}</p>
                  )}
                </div>
              ))}
              {reproduction.length === 0 && (
                <p className="text-sm text-ink-muted">Belum ada data reproduksi.</p>
              )}
            </div>
          </Card>
        </div>
      </>,
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'weights', label: 'Bobot' },
    { key: 'bcs', label: 'BCS' },
    { key: 'health', label: 'Kesehatan' },
    { key: 'reproduction', label: 'Reproduksi' },
  ];

  const saveButton = (label: string, onClick: () => unknown) => (
    <Button
      size="lg"
      className="mt-5 w-full sm:w-auto sm:min-w-56"
      disabled={busy}
      onClick={() => void onClick()}
    >
      {busy ? 'Menyimpan...' : label}
    </Button>
  );

  return shell(
    <>
      {hero}

      <Link
        href={`/recording?sheepId=${sheep.id}`}
        className={buttonClassName({ size: 'lg', className: 'mb-5 w-full sm:w-auto' })}
      >
        <ClipboardPlus size={20} aria-hidden="true" />
        Rekord ternak ini
      </Link>

      {summaryTiles}

      <Card className="mb-5">
        <h3 className="mb-3 text-lg font-semibold text-ink">Informasi umum</h3>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ['Jenis', sheep.breed],
            ['Jenis kelamin', labelJenisKelamin(sheep.gender)],
            ['Lokasi', sheep.location || '-'],
            ['Warna', sheep.color || '-'],
            ['Tanggal lahir', fmtDate(sheep.birthDate)],
            ['Tanda fisik', sheep.physicalMark || '-'],
            ['Sire ID', sheep.sireId || '-'],
            ['Dam ID', sheep.damId || '-'],
            ['Dibuat oleh', sheep.createdBy?.name || '-'],
            ['Pemilik', sheep.ownerUser?.name || '-'],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="w-28 shrink-0 text-ink-muted">{label}</dt>
              <dd className="min-w-0 break-words font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {evaluation && <EvaluationPanel evaluation={evaluation} />}

      {canManageIdentity && (
        <Card className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink">Ubah identitas ternak</h3>
              <p className="text-sm text-ink-muted">Khusus admin dan petugas</p>
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
                <Field label="Kode ternak">
                  <Input value={editForm.sheepCode} onChange={(e) => setEditForm({ ...editForm, sheepCode: e.target.value })} />
                </Field>
                <Field label="Nama">
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </Field>
                <Field label="Jenis / rumpun">
                  <Input value={editForm.breed} onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })} />
                </Field>
                <Field label="Warna">
                  <Input value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} />
                </Field>
                <Field label="Lokasi">
                  <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                </Field>
                <Field label="Tanda fisik">
                  <Input value={editForm.physicalMark} onChange={(e) => setEditForm({ ...editForm, physicalMark: e.target.value })} />
                </Field>
                <Field label="Pemilik">
                  <Select value={editForm.ownerUserId} onChange={(e) => setEditForm({ ...editForm, ownerUserId: e.target.value })}>
                    <option value="">Pilih pemilik peternak</option>
                    {farmers.map((farmer) => (
                      <option key={farmer.id} value={farmer.id}>
                        {farmer.name} {farmer.loginCode ? `- ${farmer.loginCode}` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="ACTIVE">Aktif</option>
                    <option value="SOLD">Terjual</option>
                    <option value="DEAD">Mati</option>
                    <option value="CULLED">Afkir</option>
                  </Select>
                </Field>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-ink">Jenis kelamin</p>
                <Segmented
                  label="Jenis kelamin"
                  className="md:max-w-sm"
                  value={editForm.gender}
                  onChange={(value) => setEditForm({ ...editForm, gender: value })}
                  options={[
                    { value: 'MALE', label: 'Jantan' },
                    { value: 'FEMALE', label: 'Betina' },
                  ]}
                />
              </div>

              <PhotoUploadField
                label="Foto ternak"
                value={editForm.photoUrl}
                onChange={(value) => setEditForm({ ...editForm, photoUrl: value })}
                helperText="Foto membantu mengenali ternak dengan cepat di kandang."
                emptyLabel="FOTO"
              />

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="lg" disabled={busy} onClick={() => void handleUpdateIdentity()}>
                  {busy ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
                <Button size="lg" variant="dangerOutline" onClick={handleDeleteSheep}>
                  Hapus Ternak
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <div
        role="tablist"
        aria-label="Riwayat rekording"
        className="mb-4 grid grid-cols-4 gap-1 rounded-[var(--radius-control)] border border-line bg-white p-1"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`tab-${tab.key}`}
              aria-selected={active}
              aria-controls={`panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'min-h-11 rounded-[10px] px-1 text-sm font-semibold transition',
                active ? 'bg-primary text-white' : 'text-ink-muted hover:bg-primary-soft/50',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'weights' && (
        <Card role="tabpanel" id="panel-weights" aria-labelledby="tab-weights">
          <h3 className="mb-4 text-lg font-semibold text-ink">Tambah bobot</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Tanggal">
              <Input type="date" value={weightForm.recordDate} onChange={(e) => setWeightForm({ ...weightForm, recordDate: e.target.value })} />
            </Field>
            <Field label="Bobot (kg)">
              <Input type="text" inputMode="decimal" placeholder="0" value={weightForm.weightKg} onChange={(e) => setWeightForm({ ...weightForm, weightKg: sanitizeDecimal(e.target.value) })} />
            </Field>
            <Field label="Catatan (opsional)">
              <Input value={weightForm.note} onChange={(e) => setWeightForm({ ...weightForm, note: e.target.value })} />
            </Field>
          </div>
          {saveButton('Simpan Bobot', handleAddWeight)}

          <h3 className="mb-3 mt-8 text-lg font-semibold text-ink">Riwayat bobot</h3>
          <div className="space-y-2">
            {weights.length === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada data bobot.</p>
            ) : (
              weights.map((item) => (
                <HistoryItem
                  key={item.id}
                  title={`${item.weightKg} kg`}
                  date={fmtDate(item.recordDate)}
                  badge={<Badge variant="info">Bobot</Badge>}
                >
                  {item.note && <p>{item.note}</p>}
                </HistoryItem>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'bcs' && (
        <Card role="tabpanel" id="panel-bcs" aria-labelledby="tab-bcs">
          <h3 className="mb-4 text-lg font-semibold text-ink">Tambah BCS</h3>
          <div className="space-y-4">
            <Field label="Tanggal">
              <Input type="date" className="md:max-w-xs" value={bcsForm.recordDate} onChange={(e) => setBcsForm({ ...bcsForm, recordDate: e.target.value })} />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Kondisi tubuh (BCS)</p>
              <Segmented
                label="Kondisi tubuh (BCS)"
                className="md:max-w-md"
                value={bcsForm.bcsScore}
                onChange={(value) => setBcsForm({ ...bcsForm, bcsScore: value })}
                options={[
                  { value: '1', label: '1', hint: 'Kurus' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3', hint: 'Ideal' },
                  { value: '4', label: '4' },
                  { value: '5', label: '5', hint: 'Gemuk' },
                ]}
              />
            </div>
            <Field label="Catatan (opsional)">
              <Input value={bcsForm.note} onChange={(e) => setBcsForm({ ...bcsForm, note: e.target.value })} />
            </Field>
          </div>
          {saveButton('Simpan BCS', handleAddBcs)}

          <h3 className="mb-3 mt-8 text-lg font-semibold text-ink">Riwayat BCS</h3>
          <div className="space-y-2">
            {bcs.length === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada data BCS.</p>
            ) : (
              bcs.map((item) => (
                <HistoryItem
                  key={item.id}
                  title={`BCS ${item.bcsScore}`}
                  date={fmtDate(item.recordDate)}
                  badge={<Badge variant="warning">BCS</Badge>}
                >
                  {item.note && <p>{item.note}</p>}
                </HistoryItem>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'health' && (
        <Card role="tabpanel" id="panel-health" aria-labelledby="tab-health">
          <h3 className="mb-4 text-lg font-semibold text-ink">Tambah data kesehatan</h3>
          <div className="space-y-4">
            <Field label="Tanggal pemeriksaan">
              <Input type="date" className="md:max-w-xs" value={healthForm.checkDate} onChange={(e) => setHealthForm({ ...healthForm, checkDate: e.target.value })} />
            </Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Kesehatan</p>
              <Segmented
                label="Kesehatan"
                className="md:max-w-md"
                value={healthForm.healthStatus}
                onChange={(value) => setHealthForm({ ...healthForm, healthStatus: value })}
                options={[
                  { value: 'HEALTHY', label: 'Sehat' },
                  { value: 'SICK', label: 'Sakit' },
                  { value: 'RECOVERING', label: 'Pemulihan' },
                ]}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Penyakit (opsional)">
                <Input value={healthForm.diseaseName} onChange={(e) => setHealthForm({ ...healthForm, diseaseName: e.target.value })} />
              </Field>
              <Field label="Tindakan (opsional)">
                <Input value={healthForm.treatment} onChange={(e) => setHealthForm({ ...healthForm, treatment: e.target.value })} />
              </Field>
              <Field label="Obat (opsional)">
                <Input value={healthForm.medicine} onChange={(e) => setHealthForm({ ...healthForm, medicine: e.target.value })} />
              </Field>
              <Field label="Catatan (opsional)">
                <Input value={healthForm.note} onChange={(e) => setHealthForm({ ...healthForm, note: e.target.value })} />
              </Field>
            </div>
          </div>
          {saveButton('Simpan Kesehatan', handleAddHealth)}

          <h3 className="mb-3 mt-8 text-lg font-semibold text-ink">Riwayat kesehatan</h3>
          <div className="space-y-2">
            {health.length === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada data kesehatan.</p>
            ) : (
              health.map((item) => (
                <HistoryItem
                  key={item.id}
                  title={item.diseaseName || 'Kondisi umum'}
                  date={fmtDate(item.checkDate)}
                  badge={
                    <Badge variant={getStatusVariant(item.healthStatus)}>
                      {labelStatusKesehatan(item.healthStatus)}
                    </Badge>
                  }
                >
                  <p>Tindakan: {item.treatment || '-'}</p>
                  <p>Obat: {item.medicine || '-'}</p>
                  <p>Catatan: {item.note || '-'}</p>
                </HistoryItem>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'reproduction' && (
        <Card role="tabpanel" id="panel-reproduction" aria-labelledby="tab-reproduction">
          <h3 className="mb-4 text-lg font-semibold text-ink">Tambah data reproduksi</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Status">
              <Select value={reproForm.status} onChange={(e) => setReproForm({ ...reproForm, status: e.target.value })}>
                <option value="OPEN">Siap kawin</option>
                <option value="MATED">Sudah kawin</option>
                <option value="PREGNANT">Bunting</option>
                <option value="LAMBED">Sudah beranak</option>
              </Select>
            </Field>
            <Field label="Pejantan (opsional)">
              <Input value={reproForm.maleParent} onChange={(e) => setReproForm({ ...reproForm, maleParent: e.target.value })} />
            </Field>
            <Field label="Tanggal kawin">
              <Input type="date" value={reproForm.matingDate} onChange={(e) => setReproForm({ ...reproForm, matingDate: e.target.value })} />
            </Field>
            <Field label="Perkiraan beranak">
              <Input type="date" value={reproForm.estimatedBirthDate} onChange={(e) => setReproForm({ ...reproForm, estimatedBirthDate: e.target.value })} />
            </Field>
            <Field label="Tanggal beranak">
              <Input type="date" value={reproForm.lambingDate} onChange={(e) => setReproForm({ ...reproForm, lambingDate: e.target.value })} />
            </Field>
            <Field label="Jumlah anak lahir">
              <Input type="text" inputMode="numeric" value={reproForm.totalLambBorn} onChange={(e) => setReproForm({ ...reproForm, totalLambBorn: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Jumlah anak disapih">
              <Input type="text" inputMode="numeric" value={reproForm.totalLambWeaned} onChange={(e) => setReproForm({ ...reproForm, totalLambWeaned: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Total bobot lahir (kg)">
              <Input type="text" inputMode="decimal" value={reproForm.totalBirthWeight} onChange={(e) => setReproForm({ ...reproForm, totalBirthWeight: sanitizeDecimal(e.target.value) })} />
            </Field>
            <Field label="Total bobot sapih (kg)">
              <Input type="text" inputMode="decimal" value={reproForm.totalWeaningWeight} onChange={(e) => setReproForm({ ...reproForm, totalWeaningWeight: sanitizeDecimal(e.target.value) })} />
            </Field>
            <Field label="Catatan (opsional)">
              <Input value={reproForm.note} onChange={(e) => setReproForm({ ...reproForm, note: e.target.value })} />
            </Field>
          </div>
          {saveButton('Simpan Reproduksi', handleAddReproduction)}

          <h3 className="mb-3 mt-8 text-lg font-semibold text-ink">Riwayat reproduksi</h3>
          <div className="space-y-2">
            {reproduction.length === 0 ? (
              <p className="text-sm text-ink-muted">Belum ada data reproduksi.</p>
            ) : (
              reproduction.map((item) => (
                <HistoryItem
                  key={item.id}
                  title={item.maleParent || 'Data reproduksi'}
                  date={fmtDate(item.matingDate)}
                  badge={
                    <Badge variant={getStatusVariant(item.status)}>
                      {labelStatusReproduksi(item.status)}
                    </Badge>
                  }
                >
                  <p>Perkiraan beranak: {fmtDate(item.estimatedBirthDate)}</p>
                  <p>Tanggal beranak: {fmtDate(item.lambingDate)}</p>
                  <p>Anak lahir: {item.totalLambBorn ?? '-'}</p>
                  <p>Anak disapih: {item.totalLambWeaned ?? '-'}</p>
                  <p>Total bobot lahir: {item.totalBirthWeight ?? '-'}</p>
                  <p>Total bobot sapih: {item.totalWeaningWeight ?? '-'}</p>
                  <p>Catatan: {item.note || '-'}</p>
                </HistoryItem>
              ))
            )}
          </div>
        </Card>
      )}
    </>,
  );
}
