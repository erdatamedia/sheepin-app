'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getMe, type MeResponse } from '@/lib/me';
import { api, getApiErrorMessage } from '@/lib/api';
import {
  labelJenisKelamin,
  labelPeran,
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
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sheepOptions, setSheepOptions] = useState<SheepOption[]>([]);
  const [eventType, setEventType] = useState<
    '' | 'SICK' | 'MATED' | 'PREGNANT' | 'LAMBED' | 'DEAD' | 'SOLD'
  >('');

  const today = new Date().toISOString().slice(0, 10);

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
        (item.ownerUser?.loginCode || '').toLowerCase().includes(q)
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
        const [meRes, sheepRes] = await Promise.all([
          getMe(),
          getRecordingSheepOptions(),
        ]);
        setMe(meRes);
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
      setMessage(getApiErrorMessage(error, 'Gagal mencatat kejadian lapangan.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
        <DashboardShell>
          <p className="text-sm text-gray-500">Memuat rekording cepat...</p>
        </DashboardShell>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Rekording Cepat</h1>
          <p className="mt-1 text-sm text-gray-500">
            Input bobot, BCS, dan kesehatan dalam satu kali simpan
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-sm text-gray-500">Pengguna</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {me?.name || '-'}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Peran</p>
            <div className="mt-2">
              <Badge variant="info">{labelPeran(me?.role)}</Badge>
            </div>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Tanggal Rekord</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {form.recordDate}
            </h2>
          </Card>
          <Card>
            <p className="text-sm text-gray-500">Ternak Aktif</p>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              {sheepOptions.length}
            </h2>
          </Card>
        </div>

        <Card className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kejadian Lapangan</h2>
            <p className="text-sm text-gray-500">
              Pilih kejadian nyata yang baru terjadi di kandang, atau tetap di mode rekording rutin
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Button
              type="button"
              variant={eventType === '' ? 'solid' : 'outline'}
              onClick={() => setEventType('')}
              className="h-11"
            >
              Rekord Rutin
            </Button>
            {[
              { key: 'SICK', label: 'Sakit' },
              { key: 'MATED', label: 'Kawin' },
              { key: 'PREGNANT', label: 'Bunting' },
              { key: 'LAMBED', label: 'Beranak' },
              { key: 'DEAD', label: 'Mati' },
              { key: 'SOLD', label: 'Terjual' },
            ].map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={eventType === item.key ? 'solid' : 'outline'}
                onClick={() => setEventType(item.key as typeof eventType)}
                className="h-11"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pilih Ternak</h2>
            <p className="text-sm text-gray-500">
              Cari lalu pilih ternak yang ingin direkord
            </p>
          </div>

          <div className="mb-4">
            <Input
              placeholder="Cari kode, nama ternak, breed, pemilik..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid max-h-[320px] gap-3 overflow-auto md:grid-cols-2 xl:grid-cols-3">
            {filteredSheep.map((item) => {
              const active = form.sheepId === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setForm({ ...form, sheepId: item.id })}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-white shadow-[0_14px_28px_rgba(33,73,61,0.16)]'
                      : 'border-[color:rgba(86,74,50,0.12)] bg-white hover:border-[color:rgba(33,73,61,0.26)] hover:shadow-sm'
                  }`}
                >
                  <div className="mb-2">
                    <p className="text-base font-semibold">{item.sheepCode}</p>
                    <p className={`text-sm ${active ? 'text-white/80' : 'text-gray-500'}`}>
                      {item.name || 'Tanpa nama'}
                    </p>
                  </div>
                  <div className={`space-y-1 text-sm ${active ? 'text-white/90' : 'text-gray-700'}`}>
                    <p>Breed: {item.breed}</p>
                    <p>Jenis kelamin: {labelJenisKelamin(item.gender)}</p>
                    <p>Pemilik: {item.ownerUser?.name || '-'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Form Rekording</h2>
            <p className="text-sm text-gray-500">
              {isEventMode
                ? eventConfig?.description
                : 'Isi bobot, BCS, atau kesehatan dalam satu kali simpan'}
            </p>
          </div>

          {message && (
            <div className="mb-4 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
              {message}
            </div>
          )}

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Ternak terpilih</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                {selectedSheep?.sheepCode || '-'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedSheep?.name || 'Belum memilih ternak'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Pemilik</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
                {selectedSheep?.ownerUser?.name || '-'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedSheep?.ownerUser?.loginCode || '-'}
              </p>
            </div>
          </div>

          {isEventMode && (
            <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900">
                {eventConfig?.title}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {eventConfig?.description}
              </p>
            </div>
          )}

          {isStatusEvent && (
            <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              {eventType === 'DEAD'
                ? 'Kejadian mati akan menutup status ternak dan mengeluarkannya dari daftar ternak aktif.'
                : 'Kejadian terjual akan mengubah status ternak menjadi terjual dan mengeluarkannya dari daftar ternak aktif.'}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input
              type="date"
              value={form.recordDate}
              onChange={(e) =>
                setForm({ ...form, recordDate: e.target.value })
              }
            />

            {!isEventMode && (
              <Input
                type="number"
                step="0.1"
                placeholder="Bobot (kg)"
                value={form.weightKg}
                onChange={(e) =>
                  setForm({ ...form, weightKg: e.target.value })
                }
              />
            )}

            {!isEventMode && (
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={form.bcsScore}
                onChange={(e) =>
                  setForm({ ...form, bcsScore: e.target.value })
                }
              >
                <option value="">Pilih BCS</option>
                <option value="1">BCS 1</option>
                <option value="2">BCS 2</option>
                <option value="3">BCS 3</option>
                <option value="4">BCS 4</option>
                <option value="5">BCS 5</option>
              </select>
            )}

            {!isEventMode && (
              <select
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none"
                value={form.healthStatus}
                onChange={(e) =>
                  setForm({ ...form, healthStatus: e.target.value })
                }
              >
                <option value="">Pilih Kesehatan</option>
                <option value="HEALTHY">{labelStatusKesehatan('HEALTHY')}</option>
                <option value="SICK">{labelStatusKesehatan('SICK')}</option>
                <option value="RECOVERING">{labelStatusKesehatan('RECOVERING')}</option>
              </select>
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
                onChange={(e) =>
                  setForm({ ...form, diseaseName: e.target.value })
                }
              />
            )}

            {isSickEvent && (
              <Input
                placeholder="Tindakan (opsional)"
                value={form.treatment}
                onChange={(e) =>
                  setForm({ ...form, treatment: e.target.value })
                }
              />
            )}

            {isSickEvent && (
              <Input
                placeholder="Obat (opsional)"
                value={form.medicine}
                onChange={(e) =>
                  setForm({ ...form, medicine: e.target.value })
                }
              />
            )}

            <div className="md:col-span-2 xl:col-span-3">
              <Input
                placeholder={
                  !isEventMode
                    ? 'Catatan singkat'
                    : eventType === 'DEAD'
                    ? 'Sebab mati / catatan singkat'
                    : eventType === 'SOLD'
                      ? 'Keterangan penjualan'
                      : 'Catatan singkat'
                }
                value={form.note}
                onChange={(e) =>
                  setForm({ ...form, note: e.target.value })
                }
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {!isEventMode && (
                <Button
                  onClick={handleSubmit}
                  disabled={saving || !form.sheepId}
                >
                  {saving ? 'Menyimpan...' : 'Simpan Rekording Cepat'}
                </Button>
              )}
              {isEventMode && (
                <Button
                  onClick={handleEventSubmit}
                  disabled={saving || !form.sheepId}
                >
                  {saving ? 'Menyimpan...' : eventConfig?.submitLabel || 'Simpan Kejadian'}
                </Button>
              )}
              {isEventMode && (
                <Button
                  type="button"
                  onClick={() => setEventType('')}
                  disabled={saving}
                  variant="outline"
                >
                  Kembali ke Rekord Rutin
                </Button>
              )}
            </div>
          </div>
        </Card>
      </DashboardShell>
    </RoleGuard>
  );
}
