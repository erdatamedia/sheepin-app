'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/ui/field';
import { TempPinDialog } from '@/components/farmers/temp-pin-dialog';
import { getApiErrorMessage } from '@/lib/api';
import { createFarmer, getFarmers, type FarmerOption } from '@/lib/farmers';

export default function FarmersPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', groupName: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [tempPin, setTempPin] = useState<{ name: string; pin: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const res = await getFarmers();
      setFarmers(res.data || []);
    } catch (error) {
      console.error('Gagal memuat data peternak:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredFarmers = useMemo(() => {
    const keyword = search.toLowerCase();
    const keywordDigits = keyword.replace(/\D/g, '');
    return farmers.filter(
      (item) =>
        !search ||
        item.name.toLowerCase().includes(keyword) ||
        (keywordDigits !== '' &&
          (item.phone || '').replace(/\D/g, '').includes(keywordDigits)) ||
        (item.groupName || '').toLowerCase().includes(keyword) ||
        (item.village || '').toLowerCase().includes(keyword) ||
        (item.district || '').toLowerCase().includes(keyword) ||
        (item.regency || '').toLowerCase().includes(keyword),
    );
  }, [farmers, search]);

  const handleCreate = async () => {
    try {
      setSaving(true);
      setFormError('');

      const result = await createFarmer({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim() || undefined,
        groupName: form.groupName.trim() || undefined,
      });

      setTempPin({ name: result.data.name, pin: result.data.pin });
      setForm({ name: '', phone: '', address: '', groupName: '' });
      setShowForm(false);
      void load();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Gagal mendaftarkan peternak.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <PageHeader
          title="Data Peternak"
          description="Peternak aktif yang terdaftar di sistem"
          actions={
            !showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus size={18} aria-hidden="true" />
                Daftarkan Peternak
              </Button>
            )
          }
        />

        {showForm && (
          <Card className="mb-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-ink">Daftarkan peternak baru</h2>
              <p className="text-sm text-ink-muted">
                PIN sementara dibuat otomatis dan ditampilkan sekali. Peternak akan diminta menggantinya saat pertama masuk.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nama peternak">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Nomor HP" hint="Contoh: 081234567890">
                <Input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="Alamat (opsional)">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <Field label="Kelompok (opsional)">
                <Input value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })} />
              </Field>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
              >
                {formError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" size="lg" disabled={saving} onClick={() => setShowForm(false)}>
                Batal
              </Button>
              <Button
                size="lg"
                className="sm:min-w-56"
                disabled={saving || !form.name.trim() || !form.phone.trim()}
                onClick={handleCreate}
              >
                {saving ? 'Menyimpan...' : 'Daftarkan'}
              </Button>
            </div>
          </Card>
        )}

        {tempPin && (
          <TempPinDialog
            title="Peternak terdaftar"
            name={tempPin.name}
            pin={tempPin.pin}
            onClose={() => setTempPin(null)}
          />
        )}

        <div className="relative mb-4">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <Input
            className="pl-11"
            aria-label="Cari peternak"
            placeholder="Cari nama, nomor HP, kelompok, atau wilayah"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            aria-busy="true"
            aria-label="Memuat data peternak"
          >
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-28 rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            title="Data peternak gagal dimuat"
            description="Periksa sambungan internet Anda lalu coba lagi."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setLoading(true);
                  void load();
                }}
              >
                <RefreshCw size={18} aria-hidden="true" />
                Coba lagi
              </Button>
            }
          />
        ) : filteredFarmers.length === 0 ? (
          <EmptyState
            icon={farmers.length === 0 ? Users : Search}
            title={farmers.length === 0 ? 'Belum ada peternak' : 'Peternak tidak ditemukan'}
            description={
              farmers.length === 0
                ? 'Peternak akan muncul setelah mendaftar.'
                : 'Coba kata kunci lain.'
            }
            action={
              search ? (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Hapus pencarian
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              Menampilkan {filteredFarmers.length} dari {farmers.length} peternak
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredFarmers.map((item) => (
                <Link
                  key={item.id}
                  href={`/farmers/${item.id}`}
                  className="block rounded-[var(--radius-card)] transition active:scale-[0.99]"
                >
                  <Card className="h-full">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-ink">{item.name}</h2>
                        <p className="text-sm text-ink-muted">{item.phone || '-'}</p>
                      </div>
                      {item.hasPin ? (
                        item.mustChangePin ? (
                          <Badge variant="warning">PIN sementara</Badge>
                        ) : (
                          <Badge variant="success">PIN aktif</Badge>
                        )
                      ) : (
                        <Badge variant="danger">Belum ada PIN</Badge>
                      )}
                    </div>

                    <dl className="space-y-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="w-16 shrink-0 text-ink-muted">Kelompok</dt>
                        <dd className="min-w-0 truncate">{item.groupName || '-'}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="w-16 shrink-0 text-ink-muted">Wilayah</dt>
                        <dd className="min-w-0">
                          {[item.village, item.district, item.regency].filter(Boolean).join(', ') ||
                            '-'}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
