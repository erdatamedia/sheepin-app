'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { CatalogView } from '@/components/catalog/catalog-view';
import { buttonClassName } from '@/components/ui/button';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { getPublicCatalog, type CatalogResponse } from '@/lib/location';

/** Katalog publik satu titik di peta sebaran: hanya ternak aktif, tanpa kontak maupun data catatan. */
export default function PublicCatalogPage() {
  const id = useParams().id as string;
  const [data, setData] = useState<CatalogResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData((await getPublicCatalog(id)).data);
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
    <div className="min-h-svh">
      <header className="glass-bar-top sticky top-0 z-30 border-b border-b-white/70 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 md:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Sheep-In, beranda">
            <Image src="/icons/icon-192.png" alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-[12px]" />
            <span className="text-xl font-semibold tracking-tight text-ink">Sheep-In</span>
          </Link>
          <Link href="/login" className={buttonClassName({ variant: 'outline' })}>
            Masuk
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[90rem] px-4 pb-16 pt-4 md:px-8 lg:px-12">
        <Link
          href="/#sebaran"
          className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 rounded-lg pr-3 text-[17px] text-primary active:opacity-60"
        >
          <ChevronLeft size={24} aria-hidden="true" />
          Peta sebaran
        </Link>

        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-64" />
          </div>
        ) : failed || !data ? (
          <LoadError onRetry={load} title="Katalog tidak ditemukan" description="Titik ini mungkin sudah tidak tampil di peta." />
        ) : (
          <>
            <div className="mb-5">
              <h1 className="text-[32px] font-bold leading-[1.1] tracking-tight text-ink lg:text-5xl">
                Katalog {data.farmer.name}
              </h1>
              <p className="mt-1.5 text-[15px] text-ink-muted lg:text-lg">
                {[data.farmer.groupName, region, `${data.sheep.length} ternak aktif`].filter(Boolean).join(' · ')}
              </p>
            </div>
            <CatalogView sheep={data.sheep} />
          </>
        )}
      </main>
    </div>
  );
}
