'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { Sheet } from '@/components/ui/sheet';
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
        (keywordDigits !== '' && (item.phone || '').replace(/\D/g, '').includes(keywordDigits)) ||
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

  const pinBadge = (item: FarmerOption) =>
    item.hasPin ? (
      item.mustChangePin ? (
        <Badge variant="warning">PIN sementara</Badge>
      ) : (
        <Badge variant="success">PIN aktif</Badge>
      )
    ) : (
      <Badge variant="danger">Belum ada PIN</Badge>
    );

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <PageHeader
          title="Peternak"
          description={loading || failed ? undefined : `${farmers.length} peternak terdaftar`}
          actions={
            <Button variant="tinted" onClick={() => setShowForm(true)}>
              <Plus size={18} aria-hidden="true" />
              Daftarkan
            </Button>
          }
        />

        <Sheet open={showForm} onClose={() => setShowForm(false)} title="Daftarkan peternak">
          <div className="space-y-4">
            <p className="-mt-1 text-[15px] text-ink-muted">
              PIN sementara dibuat otomatis dan ditampilkan sekali. Peternak akan diminta
              menggantinya saat pertama masuk.
            </p>

            <Field label="Nama peternak">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
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
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>
            <Field label="Kelompok (opsional)">
              <Input
                value={form.groupName}
                onChange={(e) => setForm({ ...form, groupName: e.target.value })}
              />
            </Field>

            {formError && (
              <div
                role="alert"
                className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
              >
                {formError}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                variant="tinted"
                size="lg"
                disabled={saving}
                onClick={() => setShowForm(false)}
              >
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
          </div>
        </Sheet>

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
          <div className="space-y-3" aria-busy="true" aria-label="Memuat data peternak">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-16 rounded-[var(--radius-card)]" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            title="Data peternak gagal dimuat"
            description="Periksa sambungan internet Anda lalu coba lagi."
            action={
              <Button
                variant="tinted"
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
                ? 'Daftarkan peternak pertama, atau minta peternak mendaftar sendiri.'
                : 'Coba kata kunci lain.'
            }
            action={
              search ? (
                <Button variant="tinted" onClick={() => setSearch('')}>
                  Hapus pencarian
                </Button>
              ) : (
                <Button onClick={() => setShowForm(true)}>Daftarkan peternak</Button>
              )
            }
          />
        ) : (
          <>
            <p className="mb-2 px-1 text-[13px] text-ink-muted">
              Menampilkan {filteredFarmers.length} dari {farmers.length} peternak
            </p>
            <ListGroup>
              {filteredFarmers.map((item) => (
                <ListRow
                  key={item.id}
                  href={`/farmers/${item.id}`}
                  leading={<Avatar name={item.name} size="md" />}
                  title={item.name}
                  subtitle={
                    [
                      item.phone,
                      item.groupName,
                      [item.village, item.district, item.regency].filter(Boolean).join(', '),
                    ]
                      .filter(Boolean)
                      .join(' · ') || '-'
                  }
                  trailing={pinBadge(item)}
                />
              ))}
            </ListGroup>
          </>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
