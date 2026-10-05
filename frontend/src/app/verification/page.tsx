'use client';

import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, ShieldOff } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ListGroup, ListRow } from '@/components/ui/list-group';
import { LoadError } from '@/components/ui/load-error';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Toast, useToast } from '@/components/ui/toast';
import { getApiErrorMessage } from '@/lib/api';
import {
  getCatalogList,
  getPendingVerification,
  setSheepVerified,
  VERIFIER_LABEL,
  type CatalogListItem,
  type PendingItem,
} from '@/lib/catalog';

export default function VerificationPage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [verified, setVerified] = useState<CatalogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { notify, toast } = useToast();

  const load = useCallback(async () => {
    try {
      setFailed(false);
      const [p, v] = await Promise.all([getPendingVerification(), getCatalogList({})]);
      setPending(p);
      setVerified(v);
    } catch (error) {
      console.error('Gagal memuat verifikasi:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (id: string, value: boolean, code: string) => {
    if (!value && !window.confirm(`Cabut verifikasi ${code}? Ternak ini tidak akan tampil lagi di katalog.`)) return;
    try {
      setBusyId(id);
      await setSheepVerified(id, value);
      notify('success', value ? `${code} terverifikasi` : `Verifikasi ${code} dicabut`);
      await load();
    } catch (error) {
      notify('error', getApiErrorMessage(error, 'Gagal memperbarui verifikasi'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <PageHeader
          title="Verifikasi katalog"
          description={`Ternak layak bibit yang Anda verifikasi akan tampil di katalog publik dengan tanda terverifikasi ${VERIFIER_LABEL}.`}
        />
        <p className="mb-5 rounded-[var(--radius-control)] border border-[color:var(--warning-border)] bg-warning-soft px-4 py-3 text-[14px] leading-relaxed text-warning">
          Verifikasi hanya setelah peneliti dan dinas benar-benar memeriksa ternaknya. Tanda ini tampil kepada publik
          atas nama kedua pihak tersebut.
        </p>

        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : failed ? (
          <LoadError onRetry={load} title="Gagal memuat daftar verifikasi" />
        ) : (
          <div className="space-y-6">
            <section>
              {pending.length === 0 ? (
                <EmptyState icon={BadgeCheck} title="Tidak ada yang menunggu" description="Belum ada ternak baru yang memenuhi syarat layak bibit dan belum diverifikasi." />
              ) : (
                <ListGroup header={`Menunggu verifikasi (${pending.length})`}>
                  {pending.map((s) => (
                    <ListRow
                      key={s.id}
                      href={`/sheep/${s.id}`}
                      leading={<Avatar name={s.name || s.sheepCode} photoUrl={s.photoUrl} size="md" />}
                      title={s.name ? `${s.sheepCode} · ${s.name}` : s.sheepCode}
                      subtitle={[s.breed, s.farmerName, s.score != null ? `skor ${s.score}` : null].filter(Boolean).join(' · ')}
                      chevron={false}
                      actions={
                        <Button disabled={busyId === s.id} onClick={() => toggle(s.id, true, s.sheepCode)}>
                          Verifikasi
                        </Button>
                      }
                    />
                  ))}
                </ListGroup>
              )}
            </section>

            {verified.length > 0 && (
              <ListGroup header={`Sudah terverifikasi (${verified.length})`}>
                {verified.map((s) => (
                  <ListRow
                    key={s.id}
                    href={`/katalog/ternak/${s.id}`}
                    leading={<Avatar name={s.name || s.sheepCode} photoUrl={s.photoUrl} size="md" />}
                    title={s.name ? `${s.sheepCode} · ${s.name}` : s.sheepCode}
                    subtitle={[s.breed, s.farmer?.name, s.score != null ? `skor ${s.score}` : null].filter(Boolean).join(' · ')}
                    chevron={false}
                    actions={
                      <Button variant="dangerOutline" disabled={busyId === s.id} onClick={() => toggle(s.id, false, s.sheepCode)}>
                        <ShieldOff size={16} aria-hidden="true" /> Cabut
                      </Button>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </div>
        )}
        <Toast toast={toast} />
      </DashboardShell>
    </RoleGuard>
  );
}
