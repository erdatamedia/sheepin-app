'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, PawPrint, Search } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { cn, sanitizeDecimal, todayLocal } from '@/lib/utils';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  labelJenisKelamin,
  labelStatusKesehatan,
} from '@/lib/labels';
import {
  getRecordingSheepOptions,
  submitSheepStatusEvent,
  submitQuickRecording,
  type RecordingSheepOptionResponse,
} from '@/lib/recording';

type SheepOption = RecordingSheepOptionResponse['data'][number];

export default function RecordingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const [changingSheep, setChangingSheep] = useState(false);
  const [search, setSearch] = useState('');
  const [sheepOptions, setSheepOptions] = useState<SheepOption[]>([]);
  const [eventType, setEventType] = useState<
    '' | 'SICK' | 'MATED' | 'PREGNANT' | 'LAMBED' | 'DEAD' | 'SOLD'
  >('');

  const today = todayLocal();

  const [form, setForm] = useState({
    sheepId: '',
    recordDate: today,
    weightKg: '',
    bcsScore: '',
    healthStatus: '',
    diseaseName: '',
    treatment: '',
    medicine: '',
    note: '',
  });

  const filteredSheep = useMemo(() => {
    return sheepOptions.filter((item) => {
      const q = search.toLowerCase();
      return (
        !search ||
        item.sheepCode.toLowerCase().includes(q) ||
        (item.name || '').toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        (item.ownerUser?.name || '').toLowerCase().includes(q) ||
        (item.ownerUser?.groupName || '').toLowerCase().includes(q)
      );
    });
  }, [sheepOptions, search]);

  const selectedSheep = useMemo(
    () => sheepOptions.find((item) => item.id === form.sheepId),
    [sheepOptions, form.sheepId],
  );
  const isEventMode = !!eventType;
  const isStatusEvent = eventType === 'DEAD' || eventType === 'SOLD';
  const isSickEvent = eventType === 'SICK';
  const isReproductionEvent =
    eventType === 'MATED' || eventType === 'PREGNANT' || eventType === 'LAMBED';

  const eventConfig = useMemo(() => {
    switch (eventType) {
      case 'SICK':
        return {
          title: 'Catat ternak sakit',
          description: 'Isi kondisi sakit, tindakan, dan obat jika ada.',
          submitLabel: 'Simpan Kejadian Sakit',
        };
      case 'MATED':
        return {
          title: 'Catat kawin',
          description: 'Simpan kejadian kawin dan identitas pejantan bila diketahui.',
          submitLabel: 'Simpan Kejadian Kawin',
        };
      case 'PREGNANT':
        return {
          title: 'Catat bunting',
          description: 'Gunakan saat ternak dipastikan bunting.',
          submitLabel: 'Simpan Status Bunting',
        };
      case 'LAMBED':
        return {
          title: 'Catat beranak',
          description: 'Gunakan saat ternak selesai beranak.',
          submitLabel: 'Simpan Kejadian Beranak',
        };
      case 'DEAD':
        return {
          title: 'Catat mati',
          description: 'Status ternak akan ditutup dan keluar dari daftar aktif.',
          submitLabel: 'Simpan Status Mati',
        };
      case 'SOLD':
        return {
          title: 'Catat terjual',
          description: 'Status ternak akan diubah menjadi terjual.',
          submitLabel: 'Simpan Status Terjual',
        };
      default:
        return null;
    }
  }, [eventType]);

  useEffect(() => {
    const load = async () => {
      try {
        const sheepRes = await getRecordingSheepOptions();
        setSheepOptions(sheepRes.data || []);
        const params = new URLSearchParams(window.location.search);
        const sheepId = params.get('sheepId');
        const event = params.get('event');

        setForm((prev) => ({
          ...prev,
          sheepId: sheepId || prev.sheepId,
        }));
        setEventType(
          (event as
            | ''
            | 'SICK'
            | 'MATED'
            | 'PREGNANT'
            | 'LAMBED'
            | 'DEAD'
            | 'SOLD') || '',
        );
      } catch (error) {
        console.error('Gagal memuat rekording cepat:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setMessage('');

      await submitQuickRecording({
        sheepId: form.sheepId,
        recordDate: form.recordDate,
        weightKg: form.weightKg ? Number(form.weightKg) : undefined,
        bcsScore: form.bcsScore ? Number(form.bcsScore) : undefined,
        healthStatus: form.healthStatus
          ? (form.healthStatus as 'HEALTHY' | 'SICK' | 'RECOVERING')
          : undefined,
        diseaseName: form.diseaseName || undefined,
        treatment: form.treatment || undefined,
        medicine: form.medicine || undefined,
        note: form.note || undefined,
      });

      setMessageTone('success');
      setMessage('Rekording cepat berhasil disimpan.');
      setForm({
        sheepId: '',
        recordDate: today,
        weightKg: '',
        bcsScore: '',
        healthStatus: '',
        diseaseName: '',
        treatment: '',
        medicine: '',
        note: '',
      });
    } catch (error) {
      console.error(error);
      setMessageTone('error');
      setMessage(getApiErrorMessage(error, 'Gagal menyimpan rekording cepat.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEventSubmit = async () => {
    try {
      setSaving(true);
      setMessage('');

      if (!form.sheepId || !eventType) {
        setMessageTone('error');
        setMessage('Pilih ternak dan jenis kejadian terlebih dahulu.');
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
          matingDate:
            eventType === 'MATED' ? form.recordDate : undefined,
          lambingDate:
            eventType === 'LAMBED' ? form.recordDate : undefined,
          note: form.note || undefined,
          maleParent: form.diseaseName || undefined,
        });
      }

      setMessageTone('success');
      setMessage('Kejadian lapangan berhasil dicatat.');
      setEventType('');
      setForm({
        sheepId: form.sheepId,
        recordDate: today,
        weightKg: '',
        bcsScore: '',
        healthStatus: '',
        diseaseName: '',
        treatment: '',
        medicine: '',
        note: '',
      });
    } catch (error) {
      console.error(error);
      setMessageTone('error');
      setMessage(getApiErrorMessage(error, 'Gagal mencatat kejadian lapangan.'));
    } finally {
      setSaving(false);
    }
  };

  const eventOptions = [
    { key: '', label: 'Rutin' },
    { key: 'SICK', label: 'Sakit' },
    { key: 'MATED', label: 'Kawin' },
    { key: 'PREGNANT', label: 'Bunting' },
    { key: 'LAMBED', label: 'Beranak' },
    { key: 'DEAD', label: 'Mati' },
    { key: 'SOLD', label: 'Terjual' },
  ];

  const pickingSheep = !form.sheepId || changingSheep;

  const handleWeightChange = (raw: string) => {
    setForm({ ...form, weightKg: sanitizeDecimal(raw) });
  };

  const submitLabel = saving
    ? 'Menyimpan...'
    : isEventMode
      ? eventConfig?.submitLabel || 'Simpan Kejadian'
      : 'Simpan Rekording';

  if (loading) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <PageHeader title="Rekording Cepat" />
          <div className="space-y-4" aria-busy="true" aria-label="Memuat rekording cepat">
            <Skeleton className="h-14" />
            <Skeleton className="h-12" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </DashboardShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="pb-24 md:pb-0">
          <PageHeader
            title="Rekording Cepat"
            description="Catat bobot, kondisi, dan kesehatan dalam sekali simpan"
          />

          {/* 1. Jenis catatan */}
          <section className="mb-5" aria-labelledby="rec-event">
            <h2 id="rec-event" className="mb-2 text-sm font-semibold text-ink">
              Jenis catatan
            </h2>
            <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
              {eventOptions.map((item) => {
                const active = eventType === item.key;
                return (
                  <button
                    key={item.key || 'routine'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setEventType(item.key as typeof eventType)}
                    className={cn(
                      'min-h-11 rounded-[var(--radius-control)] border px-2 text-sm font-semibold transition active:scale-[0.97]',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-line bg-white text-ink hover:border-primary/40',
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 2. Pilih ternak */}
          <Card className="mb-5">
            <h2 className="mb-3 text-base font-semibold text-ink">Ternak</h2>

            {!pickingSheep && selectedSheep ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <PawPrint size={22} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-ink">
                      {selectedSheep.sheepCode}
                    </p>
                    <p className="truncate text-sm text-ink-muted">
                      {selectedSheep.name || selectedSheep.breed}
                      {selectedSheep.ownerUser?.name ? ` · ${selectedSheep.ownerUser.name}` : ''}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setChangingSheep(true)}>
                  Ganti
                </Button>
              </div>
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
                    placeholder="Cari kode, nama, atau pemilik"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {filteredSheep.length === 0 ? (
                  <EmptyState
                    className="border-0 py-6 shadow-none"
                    icon={PawPrint}
                    title={search ? 'Ternak tidak ditemukan' : 'Belum ada ternak aktif'}
                    description={
                      search
                        ? 'Coba kata kunci lain, misalnya kode ternak.'
                        : 'Tambahkan ternak lebih dulu di menu Ternak.'
                    }
                  />
                ) : (
                  <ul className="grid max-h-[340px] gap-2 overflow-auto md:grid-cols-2 xl:grid-cols-3">
                    {filteredSheep.map((item) => {
                      const active = form.sheepId === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                              setForm({ ...form, sheepId: item.id });
                              setChangingSheep(false);
                            }}
                            className={cn(
                              'flex min-h-16 w-full items-center justify-between gap-3 rounded-[var(--radius-control)] border px-4 py-3 text-left transition',
                              active
                                ? 'border-primary bg-primary-soft'
                                : 'border-line bg-white hover:border-primary/40',
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-base font-semibold text-ink">
                                {item.sheepCode}
                                <span className="ml-2 text-sm font-normal text-ink-muted">
                                  {labelJenisKelamin(item.gender)}
                                </span>
                              </span>
                              <span className="block truncate text-sm text-ink-muted">
                                {item.name || item.breed} · {item.ownerUser?.name || '-'}
                              </span>
                            </span>
                            {active && <Check size={20} className="shrink-0 text-primary" aria-hidden="true" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </Card>

          {/* 3. Form */}
          <Card>
            <h2 className="text-base font-semibold text-ink">
              {isEventMode ? eventConfig?.title : 'Catatan rutin'}
            </h2>
            <p className="mb-4 mt-1 text-sm text-ink-muted">
              {isEventMode
                ? eventConfig?.description
                : 'Isi yang perlu saja, kolom kosong tidak akan disimpan.'}
            </p>

            {message && (
              <div
                role="status"
                className={cn(
                  'mb-4 rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium',
                  messageTone === 'success'
                    ? 'border-[color:var(--success-border)] bg-success-soft text-success'
                    : 'border-[color:var(--danger-border)] bg-danger-soft text-danger',
                )}
              >
                {message}
              </div>
            )}

            {isStatusEvent && (
              <div className="mb-4 rounded-[var(--radius-control)] border border-[color:var(--warning-border)] bg-warning-soft px-4 py-3 text-sm text-warning">
                {eventType === 'DEAD'
                  ? 'Ternak akan ditandai mati dan keluar dari daftar ternak aktif.'
                  : 'Ternak akan ditandai terjual dan keluar dari daftar ternak aktif.'}
              </div>
            )}

            <div className="space-y-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Tanggal</span>
                <Input
                  type="date"
                  value={form.recordDate}
                  onChange={(e) => setForm({ ...form, recordDate: e.target.value })}
                />
              </label>

              {!isEventMode && (
                <>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-ink">Bobot (kg)</span>
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        className="h-16 pr-14 text-3xl font-bold"
                        value={form.weightKg}
                        onChange={(e) => handleWeightChange(e.target.value)}
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-ink-muted">
                        kg
                      </span>
                    </div>
                  </label>

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink">
                      Kondisi tubuh (BCS)
                    </p>
                    <Segmented
                      label="Kondisi tubuh (BCS)"
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
                  </div>

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-ink">Kesehatan</p>
                    <Segmented
                      label="Kesehatan"
                      allowClear
                      value={form.healthStatus}
                      onChange={(value) => setForm({ ...form, healthStatus: value })}
                      options={[
                        { value: 'HEALTHY', label: labelStatusKesehatan('HEALTHY') },
                        { value: 'SICK', label: labelStatusKesehatan('SICK') },
                        { value: 'RECOVERING', label: labelStatusKesehatan('RECOVERING') },
                      ]}
                    />
                  </div>
                </>
              )}

              {(isSickEvent || isReproductionEvent || isStatusEvent) && (
                <Input
                  placeholder={
                    eventType === 'MATED'
                      ? 'Pejantan / pasangan (opsional)'
                      : eventType === 'DEAD' || eventType === 'SOLD'
                        ? 'Label tambahan (opsional)'
                        : 'Penyakit / keluhan (opsional)'
                  }
                  value={form.diseaseName}
                  onChange={(e) => setForm({ ...form, diseaseName: e.target.value })}
                />
              )}

              {isSickEvent && (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Tindakan (opsional)"
                    value={form.treatment}
                    onChange={(e) => setForm({ ...form, treatment: e.target.value })}
                  />
                  <Input
                    placeholder="Obat (opsional)"
                    value={form.medicine}
                    onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                  />
                </div>
              )}

              <Input
                placeholder={
                  !isEventMode
                    ? 'Catatan singkat (opsional)'
                    : eventType === 'DEAD'
                      ? 'Sebab mati / catatan singkat'
                      : eventType === 'SOLD'
                        ? 'Keterangan penjualan'
                        : 'Catatan singkat'
                }
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </div>
          </Card>

          {/* Tombol simpan: menempel di atas bottom nav pada mobile */}
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-[rgba(255,252,245,0.97)] px-4 py-3 backdrop-blur md:static md:mt-5 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            <div className="mx-auto flex max-w-7xl gap-2">
              <Button
                size="lg"
                className="flex-1 md:flex-none md:min-w-64"
                onClick={isEventMode ? handleEventSubmit : handleSubmit}
                disabled={saving || !form.sheepId}
              >
                {submitLabel}
              </Button>
            </div>
            {!form.sheepId && (
              <p className="mt-1.5 text-center text-xs text-ink-muted md:text-left">
                Pilih ternak dulu untuk menyimpan.
              </p>
            )}
          </div>
        </div>
      </DashboardShell>
    </RoleGuard>
  );
}
