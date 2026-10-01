'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Baby,
  Check,
  ChevronLeft,
  CircleCheck,
  CircleX,
  Heart,
  PawPrint,
  Search,
  Sparkles,
  Stethoscope,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { LoadError } from '@/components/ui/load-error';
import { PhotoGrid, type GalleryItem } from '@/components/sheep/photo-gallery';
import { PhotoViewer } from '@/components/sheep/photo-viewer';
import { traitList } from '@/lib/sheep-photo';
import { Avatar } from '@/components/ui/avatar';
import { Button, buttonClassName } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ListGroup, ListRow, RowIcon } from '@/components/ui/list-group';
import { PageHeader } from '@/components/ui/page-header';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { api, getApiErrorMessage } from '@/lib/api';
import { formatDayLong, formatKg } from '@/lib/format';
import { labelStatusKesehatan } from '@/lib/labels';
import { BCS_GUIDE, bcsLabel } from '@/lib/progress';
import {
  getRecordingSheepOptions,
  submitQuickRecording,
  submitSheepStatusEvent,
  type RecordingSheepOptionResponse,
} from '@/lib/recording';
import { cn, sanitizeDecimal, todayLocal } from '@/lib/utils';

type SheepOption = RecordingSheepOptionResponse['data'][number];
type EventType = 'SICK' | 'MATED' | 'PREGNANT' | 'LAMBED' | 'DEAD' | 'SOLD';
type Mode = 'ROUTINE' | 'EVENT';
type Step = 1 | 2 | 3 | 'done';

const EVENTS: Array<{
  key: EventType;
  label: string;
  hint: string;
  icon: LucideIcon;
  danger?: boolean;
  submitLabel: string;
}> = [
  {
    key: 'SICK',
    label: 'Sakit',
    hint: 'Keluhan, tindakan, dan obat',
    icon: Stethoscope,
    submitLabel: 'Simpan kejadian sakit',
  },
  {
    key: 'MATED',
    label: 'Dikawinkan',
    hint: 'Catat pejantan bila diketahui',
    icon: Heart,
    submitLabel: 'Simpan kejadian kawin',
  },
  {
    key: 'PREGNANT',
    label: 'Bunting',
    hint: 'Saat sudah dipastikan bunting',
    icon: Sparkles,
    submitLabel: 'Simpan status bunting',
  },
  {
    key: 'LAMBED',
    label: 'Beranak',
    hint: 'Saat selesai beranak',
    icon: Baby,
    submitLabel: 'Simpan kejadian beranak',
  },
  {
    key: 'SOLD',
    label: 'Terjual',
    hint: 'Keluar dari daftar ternak aktif',
    icon: Tag,
    submitLabel: 'Simpan status terjual',
  },
  {
    key: 'DEAD',
    label: 'Mati',
    hint: 'Keluar dari daftar ternak aktif',
    icon: CircleX,
    danger: true,
    submitLabel: 'Simpan status mati',
  },
];

const emptyForm = (sheepId = '') => ({
  sheepId,
  recordDate: todayLocal(),
  weightKg: '',
  ageMonths: '',
  bcsScore: '',
  healthStatus: '',
  diseaseName: '',
  treatment: '',
  medicine: '',
  note: '',
});

const MAX_WEIGHT_KG = 300;

export default function RecordingPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sheepOptions, setSheepOptions] = useState<SheepOption[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>('ROUTINE');
  const [eventType, setEventType] = useState<EventType | ''>('');
  const [form, setForm] = useState(emptyForm());
  const [showBcsHelp, setShowBcsHelp] = useState(false);
  const [savedTitle, setSavedTitle] = useState('');
  // Pilih ternak lewat daftar atau foto; pilihan sama dengan halaman Ternak dan diingat di perangkat.
  const [pickView, setPickView] = useState<'LIST' | 'PHOTO'>('LIST');
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const sheepRes = await getRecordingSheepOptions();
      const options = sheepRes.data || [];
      setSheepOptions(options);

      const params = new URLSearchParams(window.location.search);
      const wantedSheep = params.get('sheepId');
      const wantedEvent = params.get('event') as EventType | null;

      // Ternak dari tautan, atau satu-satunya ternak yang dimiliki: langsung ke langkah isi.
      const preselected =
        options.find((item) => item.id === wantedSheep) ??
        (options.length === 1 ? options[0] : undefined);

      if (preselected) {
        setForm((prev) => ({ ...prev, sheepId: preselected.id }));
        setStep(2);
      }

      if (wantedEvent && EVENTS.some((event) => event.key === wantedEvent)) {
        setMode('EVENT');
        setEventType(wantedEvent);
      }
    } catch (err) {
      console.error('Gagal memuat rekording:', err);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sheepin:sheep-view');
      if (saved === 'PHOTO' || saved === 'LIST') setPickView(saved);
    } catch {
      // penyimpanan tidak tersedia: tetap daftar
    }
  }, []);

  const changePickView = (next: 'LIST' | 'PHOTO') => {
    setPickView(next);
    try {
      localStorage.setItem('sheepin:sheep-view', next);
    } catch {
      // abaikan
    }
  };

  const selectedSheep = useMemo(
    () => sheepOptions.find((item) => item.id === form.sheepId),
    [sheepOptions, form.sheepId],
  );

  const filteredSheep = useMemo(() => {
    const q = search.toLowerCase();
    return sheepOptions.filter(
      (item) =>
        !search ||
        item.sheepCode.toLowerCase().includes(q) ||
        (item.name || '').toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        (item.ownerUser?.name || '').toLowerCase().includes(q) ||
        (item.ownerUser?.groupName || '').toLowerCase().includes(q) ||
        traitList(item).join(' ').toLowerCase().includes(q),
    );
  }, [sheepOptions, search]);

  const pickGallery: GalleryItem[] = filteredSheep.map((item) => ({
    id: item.id,
    code: item.sheepCode,
    name: item.name,
    photoUrl: item.photoUrl,
    traits: traitList(item),
    subtitle: [item.breed, item.ownerUser?.name].filter(Boolean).join(' · '),
  }));

  const chooseSheep = (id: string) => {
    setForm((prev) => ({ ...prev, sheepId: id }));
    setZoomIndex(null);
    setStep(2);
  };

  const eventConfig = EVENTS.find((event) => event.key === eventType);
  const weightValue = form.weightKg ? Number(form.weightKg) : undefined;
  const weightInvalid =
    weightValue !== undefined &&
    (!Number.isFinite(weightValue) || weightValue <= 0 || weightValue > MAX_WEIGHT_KG);

  // Umur (bulan) hanya dikirim bila ternak belum punya tanggal lahir; bila sudah, umur dihitung dari tanggal lahir.
  const knownAgeMonths = selectedSheep?.birthDate
    ? Math.max(0, Math.floor((Date.now() - new Date(selectedSheep.birthDate).getTime()) / (30.44 * 86400000)))
    : null;
  const ageNumber = form.ageMonths ? Number(form.ageMonths) : undefined;
  const ageInvalid = ageNumber !== undefined && (!Number.isInteger(ageNumber) || ageNumber > 240);
  const ageToSend = knownAgeMonths === null && !ageInvalid ? ageNumber : undefined;

  const hasRoutineValue = !!(form.weightKg || form.bcsScore || form.healthStatus);
  const canContinue =
    !!form.sheepId && (mode === 'ROUTINE' ? hasRoutineValue && !weightInvalid && !ageInvalid : !!eventType);

  const sheepTitle = (item: SheepOption) =>
    item.name ? `${item.sheepCode} · ${item.name}` : item.sheepCode;

  const goBack = () => {
    setError('');
    setStep((current) => (current === 3 ? 2 : 1));
  };

  const resetForNext = () => {
    setForm(emptyForm());
    setMode('ROUTINE');
    setEventType('');
    setSearch('');
    setError('');
    setStep(1);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (!form.sheepId) {
        setError('Pilih ternak terlebih dahulu.');
        return;
      }

      if (mode === 'ROUTINE') {
        await submitQuickRecording({
          sheepId: form.sheepId,
          recordDate: form.recordDate,
          weightKg: weightValue,
          ageMonths: ageToSend,
          bcsScore: form.bcsScore ? Number(form.bcsScore) : undefined,
          healthStatus: form.healthStatus
            ? (form.healthStatus as 'HEALTHY' | 'SICK' | 'RECOVERING')
            : undefined,
          diseaseName: form.diseaseName || undefined,
          treatment: form.treatment || undefined,
          medicine: form.medicine || undefined,
          note: form.note || undefined,
        });
        setSavedTitle('Catatan perkembangan tersimpan');
      } else {
        if (!eventType) {
          setError('Pilih jenis kejadian terlebih dahulu.');
          return;
        }

        if (eventType === 'SICK') {
          await submitQuickRecording({
            sheepId: form.sheepId,
            recordDate: form.recordDate,
            healthStatus: 'SICK',
            diseaseName: form.diseaseName || undefined,
            treatment: form.treatment || undefined,
            medicine: form.medicine || undefined,
            note: form.note || undefined,
          });
        } else if (eventType === 'DEAD' || eventType === 'SOLD') {
          await submitSheepStatusEvent(form.sheepId, {
            status: eventType,
            eventDate: form.recordDate,
            note: form.note || undefined,
          });
        } else {
          await api.post('/reproduction', {
            sheepId: form.sheepId,
            status: eventType,
            matingDate: eventType === 'MATED' ? form.recordDate : undefined,
            lambingDate: eventType === 'LAMBED' ? form.recordDate : undefined,
            note: form.note || undefined,
            maleParent: form.diseaseName || undefined,
          });
        }
        setSavedTitle(`Kejadian "${eventConfig?.label ?? ''}" tercatat`);
      }

      setStep('done');
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Gagal menyimpan. Coba lagi.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <PageHeader title="Catat" />
          <div className="space-y-3" aria-busy="true" aria-label="Memuat">
            <Skeleton className="h-12" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </DashboardShell>
      </RoleGuard>
    );
  }

  const stepTitle =
    step === 1
      ? 'Pilih ternak'
      : step === 2
        ? mode === 'EVENT'
          ? 'Catat kejadian'
          : 'Catat perkembangan'
        : step === 3
          ? 'Periksa dan simpan'
          : 'Tersimpan';

  const stepDescription =
    step === 1
      ? 'Ternak mana yang mau dicatat?'
      : step === 'done'
        ? undefined
        : selectedSheep
          ? sheepTitle(selectedSheep)
          : undefined;

  const isReproductionEvent =
    eventType === 'MATED' || eventType === 'PREGNANT' || eventType === 'LAMBED';

  const summaryRows: Array<[string, string]> = [];
  if (selectedSheep) summaryRows.push(['Ternak', sheepTitle(selectedSheep)]);
  summaryRows.push(['Tanggal', formatDayLong(form.recordDate)]);
  if (mode === 'ROUTINE') {
    summaryRows.push([
      'Bobot',
      weightValue !== undefined && !weightInvalid ? formatKg(weightValue) : 'Tidak diisi',
    ]);
    if (knownAgeMonths !== null || ageToSend !== undefined) {
      summaryRows.push(['Umur', `${knownAgeMonths ?? ageToSend} bulan`]);
    }
    summaryRows.push([
      'Kondisi tubuh',
      form.bcsScore ? `${form.bcsScore} · ${bcsLabel(Number(form.bcsScore))}` : 'Tidak diisi',
    ]);
    summaryRows.push([
      'Kesehatan',
      form.healthStatus ? labelStatusKesehatan(form.healthStatus) : 'Tidak diisi',
    ]);
  } else {
    summaryRows.push(['Kejadian', eventConfig?.label ?? '-']);
  }
  if (form.diseaseName) {
    summaryRows.push([isReproductionEvent ? 'Pejantan' : 'Keluhan', form.diseaseName]);
  }
  if (form.treatment) summaryRows.push(['Tindakan', form.treatment]);
  if (form.medicine) summaryRows.push(['Obat', form.medicine]);
  if (form.note) summaryRows.push(['Catatan', form.note]);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="mx-auto max-w-xl pb-28 md:mx-0 md:pb-0">
          {(step === 2 || step === 3) && (
            <button
              type="button"
              onClick={goBack}
              className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 rounded-lg pr-3 text-[17px] text-primary active:opacity-60"
            >
              <ChevronLeft size={24} aria-hidden="true" />
              {step === 2 ? 'Pilih ternak' : 'Ubah'}
            </button>
          )}

          {step !== 'done' && (
            <div
              className="mb-3 flex items-center gap-2"
              role="group"
              aria-label={`Langkah ${step} dari 3`}
            >
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  aria-current={n === step ? 'step' : undefined}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    n === step
                      ? 'w-7 bg-primary'
                      : n < (step as number)
                        ? 'w-3 bg-primary-icon'
                        : 'w-3 bg-line',
                  )}
                />
              ))}
              <span className="ml-1 text-[13px] text-ink-muted">Langkah {step} dari 3</span>
            </div>
          )}

          <PageHeader title={stepTitle} description={stepDescription} />

          {/* ===== Langkah 1: pilih ternak ===== */}
          {step === 1 &&
            (failed ? (
              <LoadError
                onRetry={() => {
                  setLoading(true);
                  void load();
                }}
              />
            ) : sheepOptions.length === 0 ? (
              <EmptyState
                icon={PawPrint}
                title="Belum ada ternak aktif"
                description="Tambahkan ternak lebih dulu di menu Ternak, lalu kembali untuk mencatat."
                action={
                  <Link href="/sheep" className={buttonClassName()}>
                    Ke daftar ternak
                  </Link>
                }
              />
            ) : (
              <>
                <div className="relative mb-3">
                  <Search
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
                  />
                  <Input
                    className="pl-11"
                    aria-label="Cari ternak"
                    placeholder="Cari kode, nama, ciri, atau pemilik"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <Segmented
                  label="Tampilan"
                  className="mb-4 max-w-xs"
                  value={pickView}
                  onChange={(value) => changePickView(value as 'LIST' | 'PHOTO')}
                  options={[
                    { value: 'LIST', label: 'Daftar' },
                    { value: 'PHOTO', label: 'Foto' },
                  ]}
                />

                {filteredSheep.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="Ternak tidak ditemukan"
                    description="Coba kata kunci lain, misalnya kode ternak."
                  />
                ) : pickView === 'PHOTO' ? (
                  <>
                    <p className="mb-2 px-1 text-[13px] text-ink-muted">
                      Ketuk foto untuk memilih. Ikon di pojok memperbesar foto.
                    </p>
                    <PhotoGrid
                      items={pickGallery}
                      onOpen={(index) => chooseSheep(pickGallery[index].id)}
                      onZoom={setZoomIndex}
                    />
                  </>
                ) : (
                  <ListGroup>
                    {filteredSheep.map((item) => (
                      <ListRow
                        key={item.id}
                        leading={
                          <Avatar
                            name={item.name || item.sheepCode}
                            photoUrl={item.photoUrl}
                            size="md"
                          />
                        }
                        title={sheepTitle(item)}
                        subtitle={[item.breed, item.ownerUser?.name].filter(Boolean).join(' · ')}
                        onClick={() => chooseSheep(item.id)}
                      />
                    ))}
                  </ListGroup>
                )}

                {zoomIndex !== null && (
                  <PhotoViewer
                    items={pickGallery}
                    index={Math.min(zoomIndex, pickGallery.length - 1)}
                    onIndexChange={setZoomIndex}
                    onClose={() => setZoomIndex(null)}
                    primaryAction={{
                      label: 'Pilih ternak ini',
                      onSelect: (target) => chooseSheep(target.id),
                    }}
                  />
                )}
              </>
            ))}

          {/* ===== Langkah 2: isi catatan ===== */}
          {step === 2 && (
            <div className="space-y-5">
              <Segmented
                label="Jenis catatan"
                value={mode}
                onChange={(value) => {
                  setMode(value as Mode);
                  setError('');
                }}
                options={[
                  { value: 'ROUTINE', label: 'Perkembangan' },
                  { value: 'EVENT', label: 'Kejadian' },
                ]}
              />

              {mode === 'ROUTINE' ? (
                <>
                  <Card>
                    <Field label="Bobot (dianjurkan)">
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="0"
                          className="h-16 pr-14 text-[32px] font-bold"
                          value={form.weightKg}
                          aria-invalid={weightInvalid}
                          onChange={(e) =>
                            setForm({ ...form, weightKg: sanitizeDecimal(e.target.value) })
                          }
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[17px] font-medium text-ink-muted">
                          kg
                        </span>
                      </div>
                    </Field>
                    {weightInvalid && (
                      <p role="alert" className="mt-2 text-[14px] font-medium text-danger">
                        Bobot tidak wajar. Isi angka antara 0 dan {MAX_WEIGHT_KG} kg.
                      </p>
                    )}
                  </Card>

                  <Card>
                    <Field label="Umur (opsional)">
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="0"
                          className="h-14 pr-20 text-[24px] font-bold"
                          disabled={knownAgeMonths !== null}
                          value={knownAgeMonths !== null ? String(knownAgeMonths) : form.ageMonths}
                          aria-invalid={ageInvalid}
                          onChange={(e) =>
                            setForm({ ...form, ageMonths: e.target.value.replace(/\D/g, '').slice(0, 3) })
                          }
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[17px] font-medium text-ink-muted">
                          bulan
                        </span>
                      </div>
                    </Field>
                    <p className="mt-2 text-[13px] text-ink-muted">
                      {knownAgeMonths !== null
                        ? 'Dihitung dari tanggal lahir yang sudah tercatat.'
                        : 'Boleh perkiraan. Tanggal lahir ternak ikut diperkirakan dari umur ini.'}
                    </p>
                    {ageInvalid && (
                      <p role="alert" className="mt-1 text-[14px] font-medium text-danger">
                        Umur tidak wajar. Isi bilangan bulat 0 sampai 240 bulan.
                      </p>
                    )}
                  </Card>

                  <Card className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[15px] font-semibold text-ink">Kondisi tubuh (opsional)</p>
                      <button
                        type="button"
                        onClick={() => setShowBcsHelp(true)}
                        className="min-h-11 text-[15px] font-medium text-primary active:opacity-60"
                      >
                        Apa artinya?
                      </button>
                    </div>
                    <Segmented
                      label="Kondisi tubuh 1 sampai 5"
                      allowClear
                      value={form.bcsScore}
                      onChange={(value) => setForm({ ...form, bcsScore: value })}
                      options={[
                        { value: '1', label: '1', hint: 'Kurus' },
                        { value: '2', label: '2' },
                        { value: '3', label: '3', hint: 'Ideal' },
                        { value: '4', label: '4' },
                        { value: '5', label: '5', hint: 'Gemuk' },
                      ]}
                    />
                    {form.bcsScore && (
                      <p className="text-[14px] text-ink-muted">
                        {bcsLabel(Number(form.bcsScore))}:{' '}
                        {BCS_GUIDE[Number(form.bcsScore) - 1]?.hint}
                      </p>
                    )}
                  </Card>

                  <Card className="space-y-3">
                    <p className="text-[15px] font-semibold text-ink">Kesehatan (opsional)</p>
                    <Segmented
                      label="Kesehatan"
                      allowClear
                      value={form.healthStatus}
                      onChange={(value) => setForm({ ...form, healthStatus: value })}
                      options={[
                        { value: 'HEALTHY', label: 'Sehat' },
                        { value: 'SICK', label: 'Sakit' },
                        { value: 'RECOVERING', label: 'Pulih' },
                      ]}
                    />
                    {form.healthStatus === 'SICK' && (
                      <div className="space-y-3 pt-1">
                        <Input
                          aria-label="Keluhan atau penyakit (opsional)"
                          placeholder="Keluhan atau penyakit (opsional)"
                          value={form.diseaseName}
                          onChange={(e) => setForm({ ...form, diseaseName: e.target.value })}
                        />
                        <Input
                          aria-label="Tindakan (opsional)"
                          placeholder="Tindakan (opsional)"
                          value={form.treatment}
                          onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                        />
                        <Input
                          aria-label="Obat (opsional)"
                          placeholder="Obat (opsional)"
                          value={form.medicine}
                          onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                        />
                      </div>
                    )}
                  </Card>

                  <Card>
                    <Field label="Catatan (opsional)">
                      <Input
                        placeholder="Misalnya: nafsu makan baik"
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                      />
                    </Field>
                  </Card>
                </>
              ) : (
                <>
                  <ListGroup header="Kejadian apa?">
                    {EVENTS.map((event) => {
                      const selected = eventType === event.key;
                      return (
                        <ListRow
                          key={event.key}
                          leading={
                            <RowIcon icon={event.icon} tone={event.danger ? 'danger' : 'default'} />
                          }
                          leadingSize="icon"
                          title={
                            <>
                              {event.label}
                              {selected && <span className="sr-only"> (dipilih)</span>}
                            </>
                          }
                          subtitle={event.hint}
                          tone={event.danger ? 'danger' : 'default'}
                          chevron={false}
                          trailing={
                            selected ? (
                              <Check size={20} className="text-primary" aria-hidden="true" />
                            ) : undefined
                          }
                          onClick={() => setEventType(event.key)}
                        />
                      );
                    })}
                  </ListGroup>

                  {(eventType === 'DEAD' || eventType === 'SOLD') && (
                    <p className="rounded-[var(--radius-control)] border border-[color:var(--warning-border)] bg-warning-soft px-4 py-3 text-[14px] text-warning">
                      {eventType === 'DEAD'
                        ? 'Ternak akan ditandai mati dan keluar dari daftar ternak aktif.'
                        : 'Ternak akan ditandai terjual dan keluar dari daftar ternak aktif.'}
                    </p>
                  )}

                  {eventType && (
                    <Card className="space-y-3">
                      {eventType === 'SICK' && (
                        <>
                          <Input
                            aria-label="Keluhan atau penyakit (opsional)"
                            placeholder="Keluhan atau penyakit (opsional)"
                            value={form.diseaseName}
                            onChange={(e) => setForm({ ...form, diseaseName: e.target.value })}
                          />
                          <Input
                            aria-label="Tindakan (opsional)"
                            placeholder="Tindakan (opsional)"
                            value={form.treatment}
                            onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                          />
                          <Input
                            aria-label="Obat (opsional)"
                            placeholder="Obat (opsional)"
                            value={form.medicine}
                            onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                          />
                        </>
                      )}
                      {isReproductionEvent && (
                        <Input
                          aria-label="Pejantan atau pasangan (opsional)"
                          placeholder="Pejantan atau pasangan (opsional)"
                          value={form.diseaseName}
                          onChange={(e) => setForm({ ...form, diseaseName: e.target.value })}
                        />
                      )}
                      <Input
                        aria-label="Catatan"
                        placeholder={
                          eventType === 'DEAD'
                            ? 'Sebab mati atau catatan singkat'
                            : eventType === 'SOLD'
                              ? 'Keterangan penjualan'
                              : 'Catatan singkat (opsional)'
                        }
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                      />
                    </Card>
                  )}
                </>
              )}

              <details className="glass rounded-[var(--radius-card)] px-4">
                <summary className="flex min-h-[52px] cursor-pointer items-center justify-between text-[15px] text-ink">
                  <span>Tanggal</span>
                  <span className="text-ink-muted">
                    {form.recordDate === todayLocal() ? 'Hari ini' : formatDayLong(form.recordDate)}
                  </span>
                </summary>
                <div className="pb-4">
                  <Input
                    type="date"
                    aria-label="Tanggal catatan"
                    max={todayLocal()}
                    value={form.recordDate}
                    onChange={(e) =>
                      setForm({ ...form, recordDate: e.target.value || todayLocal() })
                    }
                  />
                </div>
              </details>
            </div>
          )}

          {/* ===== Langkah 3: periksa ===== */}
          {step === 3 && (
            <div className="space-y-4">
              <ListGroup footer="Periksa sekali lagi. Ketuk Ubah di kiri atas bila ada yang salah.">
                {summaryRows.map(([label, value]) => (
                  <ListRow key={label} title={label} value={value} />
                ))}
              </ListGroup>

              {error && (
                <div
                  role="alert"
                  className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-[15px] font-medium text-danger"
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ===== Selesai ===== */}
          {step === 'done' && (
            <Card className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
                <CircleCheck size={30} aria-hidden="true" />
              </span>
              <h2 role="status" className="text-[20px] font-bold tracking-tight text-ink">
                {savedTitle}
              </h2>
              {selectedSheep && (
                <p className="text-[15px] text-ink-muted">{sheepTitle(selectedSheep)}</p>
              )}
              <div className="mt-2 grid w-full gap-2">
                <Button size="lg" onClick={resetForNext}>
                  Catat ternak lain
                </Button>
                {selectedSheep && (
                  <Link
                    href={`/sheep/${selectedSheep.id}`}
                    className={buttonClassName({ variant: 'tinted', size: 'lg' })}
                  >
                    Lihat perkembangan
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Tombol lanjut/simpan menempel di atas bilah tab pada mobile */}
        {(step === 2 || step === 3) && (
          <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] z-30 glass-bar-top px-4 py-3 md:static md:mt-5 md:max-w-xl md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none">
            <div className="mx-auto max-w-xl md:mx-0">
              {step === 2 ? (
                <>
                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!canContinue}
                    onClick={() => setStep(3)}
                  >
                    Lanjut
                  </Button>
                  {!canContinue && (
                    <p className="mt-1.5 text-center text-[13px] text-ink-muted md:text-left">
                      {mode === 'ROUTINE'
                        ? 'Isi salah satu: bobot, kondisi tubuh, atau kesehatan.'
                        : 'Pilih jenis kejadian dulu.'}
                    </p>
                  )}
                </>
              ) : (
                <Button size="lg" className="w-full" disabled={saving} onClick={handleSave}>
                  {saving
                    ? 'Menyimpan...'
                    : mode === 'EVENT'
                      ? (eventConfig?.submitLabel ?? 'Simpan kejadian')
                      : 'Simpan catatan'}
                </Button>
              )}
            </div>
          </div>
        )}

        <Sheet
          open={showBcsHelp}
          onClose={() => setShowBcsHelp(false)}
          title="Menilai kondisi tubuh"
        >
          <p className="mb-3 text-[15px] text-ink-muted">
            Raba punggung dan tulang rusuk ternak, lalu pilih skor yang paling mirip.
          </p>
          <ul className="space-y-2">
            {BCS_GUIDE.map((item) => (
              <li
                key={item.score}
                className="flex gap-3 rounded-[var(--radius-control)] bg-tint p-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-[17px] font-bold text-primary-strong">
                  {item.score}
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-semibold text-ink">{item.label}</span>
                  <span className="block text-[14px] leading-snug text-ink-muted">{item.hint}</span>
                </span>
              </li>
            ))}
          </ul>
          <Button size="lg" className="mt-4 w-full" onClick={() => setShowBcsHelp(false)}>
            Mengerti
          </Button>
        </Sheet>
      </DashboardShell>
    </RoleGuard>
  );
}
