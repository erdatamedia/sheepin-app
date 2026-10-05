'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PawPrint, Search } from 'lucide-react';
import { PublicHeader } from '@/components/landing/public-header';
import { VerifiedBadge } from '@/components/catalog/verified-badge';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { LoadError } from '@/components/ui/load-error';
import { Skeleton } from '@/components/ui/skeleton';
import { ageText, farmerRegion, getCatalogList, VERIFIER_LABEL, type CatalogListItem } from '@/lib/catalog';
import { labelJenisKelamin } from '@/lib/labels';
import { cn } from '@/lib/utils';

/** Katalog publik: ternak layak bibit yang sudah diverifikasi. Bisa dibuka tanpa masuk. */
export default function PublicCatalogIndexPage() {
  const [items, setItems] = useState<CatalogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [breed, setBreed] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      setItems(await getCatalogList({}));
    } catch (error) {
      console.error('Gagal memuat katalog:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const breeds = useMemo(() => [...new Set(items.map((i) => i.breed))].sort(), [items]);

  const shown = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (gender === 'ALL' || i.gender === gender) &&
        (breed === 'ALL' || i.breed === breed) &&
        (!keyword ||
          i.sheepCode.toLowerCase().includes(keyword) ||
          (i.name ?? '').toLowerCase().includes(keyword) ||
          i.breed.toLowerCase().includes(keyword)),
    );
  }, [items, search, gender, breed]);

  const chip = (active: boolean) =>
    cn('min-h-11 shrink-0 rounded-full px-4 text-[15px] font-medium transition', active ? 'bg-primary text-white' : 'glass text-ink-soft');

  return (
    <div className="min-h-svh">
      <PublicHeader />
      <main className="mx-auto w-full max-w-[90rem] px-4 pb-16 pt-8 md:px-8 lg:px-12 lg:pt-12">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-ink lg:text-6xl">Katalog ternak layak bibit</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-ink-muted lg:text-lg lg:leading-8">
          Hanya ternak yang memenuhi syarat layak bibit menurut penilaian sistem (data bobot, kondisi tubuh, kesehatan,
          dan reproduksi) dan sudah diverifikasi oleh {VERIFIER_LABEL} yang tampil di sini.
        </p>
        <VerifiedBadge className="mt-4" />

        <div className="mb-5 mt-8 grid gap-3">
          <div className="relative max-w-xl">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <Input type="search" placeholder="Cari kode, nama, atau jenis" aria-label="Cari ternak" className="pl-11" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="radiogroup" aria-label="Filter katalog">
            {([['ALL', 'Semua'], ['MALE', 'Jantan'], ['FEMALE', 'Betina']] as const).map(([value, label]) => (
              <button key={value} type="button" role="radio" aria-checked={gender === value} onClick={() => setGender(value)} className={chip(gender === value)}>
                {label}
              </button>
            ))}
            {breeds.length > 1 && (
              <>
                <button type="button" role="radio" aria-checked={breed === 'ALL'} onClick={() => setBreed('ALL')} className={chip(breed === 'ALL')}>
                  Semua jenis
                </button>
                {breeds.map((b) => (
                  <button key={b} type="button" role="radio" aria-checked={breed === b} onClick={() => setBreed(b)} className={chip(breed === b)}>
                    {b}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        ) : failed ? (
          <LoadError onRetry={load} title="Katalog gagal dimuat" />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            title={items.length === 0 ? 'Belum ada ternak terverifikasi' : 'Tidak ada yang cocok'}
            description={
              items.length === 0
                ? 'Ternak akan tampil di sini setelah memenuhi syarat dan diverifikasi.'
                : 'Ubah kata kunci atau filter.'
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
            {shown.map((s) => (
              <li key={s.id}>
                <Link href={`/katalog/ternak/${s.id}`} className="glass block overflow-hidden rounded-[var(--radius-card)] transition active:brightness-95">
                  <div className="relative aspect-[4/5] overflow-hidden bg-primary-soft">
                    {s.photoUrl ? (
                      <SheepPhoto photoUrl={s.photoUrl} alt={`Foto ${s.sheepCode}`} sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-primary/40">
                        <PawPrint size={48} aria-hidden="true" />
                      </span>
                    )}
                    <span className="absolute left-2 top-2">
                      <VerifiedBadge compact />
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-[17px] font-semibold text-ink">{s.sheepCode}</p>
                    {s.name && <p className="truncate text-[14px] text-ink-soft">{s.name}</p>}
                    <p className="mt-1 truncate text-[13px] text-ink-muted">
                      {[s.breed, labelJenisKelamin(s.gender), ageText(s.ageMonths)].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-1 truncate text-[13px] text-ink-muted">{farmerRegion(s.farmer)}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[14px] font-semibold tabular-nums text-ink">
                      <span>{s.latestWeightKg != null ? `${s.latestWeightKg} kg` : ''}</span>
                      {s.score != null && <span className="text-success">Skor {s.score}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
