'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, History, KeyRound, LogOut, MapPin, PencilLine, Users } from 'lucide-react';
import { LoadError } from '@/components/ui/load-error';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ListGroup, ListRow, RowIcon } from '@/components/ui/list-group';
import { PageHeader } from '@/components/ui/page-header';
import { useInstall } from '@/components/pwa/install-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { removeToken } from '@/lib/auth';
import { getMe, type MeResponse } from '@/lib/me';
import { labelPeran } from '@/lib/labels';

/** Halaman Akun: ringkasan diri dan pintu ke pengaturan, gaya "Pengaturan" iOS. */
export default function AccountPage() {
  const router = useRouter();
  const { canGuide, install } = useInstall();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setMe(await getMe());
    } catch (error) {
      console.error('Gagal memuat akun:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isFarmer = me?.role === 'FARMER';
  const isStaff = !!me && !isFarmer;

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER', 'FARMER']}>
      <DashboardShell>
        <PageHeader title="Akun" />

        {loading ? (
          <div className="space-y-4" aria-busy="true" aria-label="Memuat akun">
            <Skeleton className="h-24 rounded-[var(--radius-card)]" />
            <Skeleton className="h-40 rounded-[var(--radius-card)]" />
          </div>
        ) : failed || !me ? (
          <LoadError
            onRetry={() => {
              setLoading(true);
              void load();
            }}
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-6 md:mx-0">
            <Card className="flex items-center gap-4">
              <Avatar name={me.name} photoUrl={me.photoUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-[20px] font-bold tracking-tight text-ink">{me.name}</p>
                <p className="truncate text-[15px] text-ink-muted">
                  {[me.groupName, isFarmer ? me.phone : me.email].filter(Boolean).join(' · ') ||
                    '-'}
                </p>
                <div className="mt-1.5">
                  <Badge variant="info">{labelPeran(me.role)}</Badge>
                </div>
              </div>
            </Card>

            <ListGroup header="Akun saya">
              <ListRow
                leading={<RowIcon icon={PencilLine} />}
                leadingSize="icon"
                title="Data profil"
                subtitle="Nama, kelompok, alamat, foto"
                href="/profile/edit"
              />
              <ListRow
                leading={<RowIcon icon={MapPin} />}
                leadingSize="icon"
                title="Lokasi kandang"
                subtitle="Titik untuk peta sebaran"
                href="/location"
              />
              {isFarmer && (
                <ListRow
                  leading={<RowIcon icon={KeyRound} />}
                  leadingSize="icon"
                  title="Ganti PIN"
                  subtitle="PIN 6 angka untuk masuk"
                  href="/change-pin"
                />
              )}
            </ListGroup>

            {isStaff && (
              <ListGroup header="Kelola">
                <ListRow
                  leading={<RowIcon icon={Users} />}
                  leadingSize="icon"
                  title="Peternak"
                  subtitle="Daftar, buat PIN, atur data"
                  href="/farmers"
                />
                <ListRow
                  leading={<RowIcon icon={History} />}
                  leadingSize="icon"
                  title="Riwayat rekording"
                  href="/history"
                />
              </ListGroup>
            )}

            {canGuide && (
              <ListGroup footer="Buka Sheep-In dari layar utama seperti aplikasi biasa.">
                <ListRow
                  leading={<RowIcon icon={Download} />}
                  leadingSize="icon"
                  title="Pasang di layar utama"
                  subtitle="Android dan iPhone"
                  onClick={install}
                />
              </ListGroup>
            )}

            <ListGroup>
              <ListRow
                leading={<RowIcon icon={LogOut} tone="danger" />}
                leadingSize="icon"
                title="Keluar"
                tone="danger"
                chevron={false}
                onClick={handleLogout}
              />
            </ListGroup>
          </div>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
