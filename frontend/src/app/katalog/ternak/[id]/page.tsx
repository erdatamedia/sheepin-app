'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, PawPrint } from 'lucide-react';
import { PublicHeader } from '@/components/landing/public-header';
import { VerifiedBadge } from '@/components/catalog/verified-badge';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { ageText, farmerRegion, getCatalogDetail, VERIFIER_LABEL, type CatalogDetail } from '@/lib/catalog';
import { labelJenisKelamin } from '@/lib/labels';
import { angleLabel } from '@/lib/sheep-photo';
import { formatDayLong } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function PublicCatalogDetailPage() {
  const id = useParams().id as string;
  const [data, setData] = useState<CatalogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [slide, setSlide] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await getCatalogDetail(id));
    } catch (error) {
      console.error('Gagal memuat ternak katalog:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const slides = data
    ? data.photos.length > 0
      ? data.photos
      : data.photoUrl
        ? [{ angle: 'FACE', url: data.photoUrl }]
        : []
    : [];
  const current = slides[Math.min(slide, Math.max(0, slides.length - 1))];

  return (
    <div className="min-h-svh">
      <PublicHeader />
      <main className="mx-auto w-full max-w-[90rem] px-4 pb-16 pt-4 md:px-8 lg:px-12">
        <Link href="/katalog" className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-0.5 rounded-lg pr-3 text-[17px] text-primary active:opacity-60">
          <ChevronLeft size={24} aria-hidden="true" />
          Katalog
        </Link>

        {loading ? (
          <Skeleton className="h-96" />
        ) : failed || !data ? (
          <LoadError onRetry={load} title="Ternak tidak ditemukan di katalog" description="Ternak ini mungkin belum atau tidak lagi memenuhi syarat katalog." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
            <div>
              <div className="glass relative aspect-[4/3] overflow-hidden rounded-[var(--radius-sheet)] bg-primary-soft lg:aspect-[4/3]">
                {current ? (
                  <SheepPhoto photoUrl={current.url} alt={`Foto ${data.sheepCode} (${angleLabel(current.angle as never)})`} sizes="(min-width: 1024px) 55vw, 100vw" quality={75} eager />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-primary/40">
                    <PawPrint size={72} aria-hidden="true" />
                  </span>
                )}
              </div>
              {slides.length > 1 && (
                <div role="tablist" aria-label="Sudut foto" className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {slides.map((p, i) => (
                    <button
                      key={p.angle}
                      type="button"
                      role="tab"
                      aria-selected={i === slide}
                      onClick={() => setSlide(i)}
                      className={cn('min-h-11 shrink-0 rounded-full px-4 text-[15px] font-medium', i === slide ? 'bg-primary text-white' : 'glass text-ink-soft')}
                    >
                      {angleLabel(p.angle as never)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <VerifiedBadge />
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink lg:text-5xl">{data.sheepCode}</h1>
              {data.name && <p className="mt-1 text-xl text-ink-soft">{data.name}</p>}
              <p className="mt-2 text-[15px] text-ink-muted">
                {[data.breed, labelJenisKelamin(data.gender), ageText(data.ageMonths)].filter(Boolean).join(' · ')}
              </p>
              <p className="mt-1 text-[15px] text-ink-muted">
                {[data.farmer?.name, data.farmer?.groupName].filter(Boolean).join(' · ')}
                {farmerRegion(data.farmer) ? ` · ${farmerRegion(data.farmer)}` : ''}
              </p>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <StatTile label="Bobot terakhir" value={data.latestWeightKg != null ? `${data.latestWeightKg} kg` : '-'} hint={data.latestWeightDate ? formatDayLong(data.latestWeightDate) : undefined} />
                <StatTile label="Kondisi tubuh" value={data.bcs ?? '-'} hint="skala 1-5" />
                <StatTile label="Skor kelayakan" value={data.score ?? '-'} hint="dari 100" tone="success" />
              </div>

              {data.reasons.length > 0 && (
                <section className="mt-6" aria-labelledby="alasan">
                  <h2 id="alasan" className="mb-2 text-[20px] font-bold tracking-tight text-ink">Mengapa layak bibit</h2>
                  <ul className="glass divide-y divide-line overflow-hidden rounded-[var(--radius-card)]">
                    {data.reasons.map((r) => (
                      <li key={r} className="px-4 py-3 text-[15px] text-ink">{r}</li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="mt-6 text-[13px] leading-relaxed text-ink-muted">
                Diverifikasi {formatDayLong(data.verifiedAt)} oleh {VERIFIER_LABEL}. Status layak dihitung ulang dari data
                terbaru; ternak yang kondisinya berubah otomatis keluar dari katalog.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
