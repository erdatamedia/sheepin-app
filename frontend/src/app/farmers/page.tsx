'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, Users } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { getFarmers, type FarmerOption } from '@/lib/farmers';

export default function FarmersPage() {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [farmers, setFarmers] = useState<FarmerOption[]>([]);
  const [search, setSearch] = useState('');

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
    return farmers.filter(
      (item) =>
        !search ||
        item.name.toLowerCase().includes(keyword) ||
        (item.loginCode || '').toLowerCase().includes(keyword) ||
        (item.groupName || '').toLowerCase().includes(keyword) ||
        (item.village || '').toLowerCase().includes(keyword) ||
        (item.district || '').toLowerCase().includes(keyword) ||
        (item.regency || '').toLowerCase().includes(keyword),
    );
  }, [farmers, search]);

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <PageHeader
          title="Data Peternak"
          description="Peternak aktif yang terdaftar di sistem"
        />

        <div className="relative mb-4">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <Input
            className="pl-11"
            aria-label="Cari peternak"
            placeholder="Cari nama, ID, kelompok, atau wilayah"
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
                        <p className="text-sm text-ink-muted">{item.loginCode || '-'}</p>
                      </div>
                      <Badge variant="info">Peternak</Badge>
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
