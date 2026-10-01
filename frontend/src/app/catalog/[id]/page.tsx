'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { RoleGuard } from '@/components/auth/role-guard';
import { CatalogView } from '@/components/catalog/catalog-view';
import { BackLink } from '@/components/ui/back-link';
import { LoadError } from '@/components/ui/load-error';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { getCatalog, type CatalogResponse } from '@/lib/location';

export default function CatalogPage() {
  const id = useParams().id as string;
  const [data, setData] = useState<CatalogResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData((await getCatalog(id)).data);
    } catch (error) {
      console.error('Gagal memuat katalog:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const region = data
    ? [data.farmer.village, data.farmer.district, data.farmer.regency].filter(Boolean).join(', ')
    : '';

  return (
    <RoleGuard allowedRoles={['ADMIN', 'OFFICER']}>
      <DashboardShell>
        <BackLink href="/map" label="Peta" />
        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-64" />
          </div>
        ) : failed || !data ? (
          <LoadError onRetry={load} title="Gagal memuat katalog" />
        ) : (
          <>
            <PageHeader
              title={`Katalog ${data.farmer.name}`}
              description={[data.farmer.groupName, region, `${data.sheep.length} ternak`].filter(Boolean).join(' · ')}
            />
            <CatalogView sheep={data.sheep} hrefFor={(s) => `/sheep/${s.id}`} showStatusFilter />
          </>
        )}
      </DashboardShell>
    </RoleGuard>
  );
}
