'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PawPrint, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import { labelJenisKelamin, labelStatusTernak } from '@/lib/labels';
import type { CatalogResponse } from '@/lib/location';
import { cn } from '@/lib/utils';

type CatalogSheep = CatalogResponse['data']['sheep'][number];

function ageLabel(birthDate?: string | null) {
  if (!birthDate) return null;
  const months = Math.max(0, Math.floor((Date.now() - new Date(birthDate).getTime()) / (30.44 * 86400000)));
  return months >= 12 ? `${Math.floor(months / 12)} th ${months % 12} bln` : `${months} bln`;
}

function statusVariant(status: string) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'DEAD') return 'danger' as const;
  return 'default' as const;
}

/**
 * Kisi katalog ternak. `hrefFor` diisi untuk petugas (menuju detail ternak);
 * di katalog publik tidak ada tautan ke data detail.
 */
export function CatalogView({
  sheep,
  hrefFor,
  showStatusFilter = false,
}: {
  sheep: CatalogSheep[];
  hrefFor?: (item: CatalogSheep) => string;
  showStatusFilter?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [status, setStatus] = useState('ALL');

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return sheep.filter(
      (s) =>
        (gender === 'ALL' || s.gender === gender) &&
        (status === 'ALL' || s.status === status) &&
        (!keyword ||
          s.sheepCode.toLowerCase().includes(keyword) ||
          (s.name ?? '').toLowerCase().includes(keyword) ||
          s.breed.toLowerCase().includes(keyword)),
    );
  }, [sheep, search, gender, status]);

  const chip = (active: boolean) =>
    cn(
      'min-h-11 shrink-0 rounded-full px-4 text-[15px] font-medium transition',
      active ? 'bg-primary text-white' : 'glass text-ink-soft',
    );

  return (
    <div>
      <div className="mb-4 grid gap-3">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Cari kode, nama, atau jenis"
            aria-label="Cari ternak"
            className="pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="radiogroup" aria-label="Filter katalog">
          {(
            [
              ['ALL', 'Semua'],
              ['MALE', 'Jantan'],
              ['FEMALE', 'Betina'],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={gender === value} onClick={() => setGender(value)} className={chip(gender === value)}>
              {label}
            </button>
          ))}
          {showStatusFilter &&
            (
              [
                ['ALL', 'Semua status'],
                ['ACTIVE', 'Aktif'],
                ['SOLD', 'Terjual'],
                ['DEAD', 'Mati'],
                ['CULLED', 'Afkir'],
              ] as const
            ).map(([value, label]) => (
              <button key={value} type="button" role="radio" aria-checked={status === value} onClick={() => setStatus(value)} className={chip(status === value)}>
                {label}
              </button>
            ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={sheep.length === 0 ? 'Belum ada ternak' : 'Tidak ada yang cocok'}
          description={sheep.length === 0 ? 'Peternak ini belum mendaftarkan ternak.' : 'Ubah kata kunci atau filter.'}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
          {filtered.map((s) => {
            const href = hrefFor?.(s);
            const age = ageLabel(s.birthDate);
            const body = (
              <>
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[var(--radius-card)] bg-primary-soft">
                  {s.photoUrl ? (
                    <SheepPhoto
                      photoUrl={s.photoUrl}
                      alt={`Foto ${s.sheepCode}`}
                      sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-primary/40">
                      <PawPrint size={48} aria-hidden="true" />
                    </span>
                  )}
                  {s.status !== 'ACTIVE' && (
                    <span className="absolute left-2 top-2">
                      <Badge variant={statusVariant(s.status)}>{labelStatusTernak(s.status)}</Badge>
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-[17px] font-semibold text-ink">{s.sheepCode}</p>
                  {s.name && <p className="truncate text-[14px] text-ink-soft">{s.name}</p>}
                  <p className="mt-1 truncate text-[13px] text-ink-muted">
                    {[s.breed, labelJenisKelamin(s.gender), age].filter(Boolean).join(' · ')}
                  </p>
                  {s.latestWeightKg != null && (
                    <p className="mt-1.5 text-[14px] font-semibold tabular-nums text-ink">{s.latestWeightKg} kg</p>
                  )}
                </div>
              </>
            );
            const cls = 'glass block overflow-hidden rounded-[var(--radius-card)] transition active:brightness-95';
            return (
              <li key={s.id}>
                {href ? (
                  <Link href={href} className={cls}>
                    {body}
                  </Link>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
