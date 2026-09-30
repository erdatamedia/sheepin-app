'use client';

import { Camera } from 'lucide-react';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import { cn } from '@/lib/utils';

export type GalleryItem = {
  id: string;
  code: string;
  name?: string | null;
  photoUrl?: string | null;
  /** Baris singkat di pelihat, mis. "32,5 kg · kemarin" atau "Garut · Budi". */
  subtitle?: string;
  /** Penanda mencolok di foto, mis. "Sakit". */
  alert?: string;
};

function initialsOf(item: GalleryItem) {
  return (item.name || item.code)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Kisi foto ternak: kode besar di atas foto supaya cepat dikenali di antara banyak ternak. */
export function PhotoGrid({
  items,
  onOpen,
}: {
  items: GalleryItem[];
  onOpen: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((item, index) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onOpen(index)}
            aria-label={`Lihat foto ${item.code}${item.name ? `, ${item.name}` : ''}`}
            className="glass relative block aspect-square w-full overflow-hidden rounded-[var(--radius-control)] text-left active:scale-[0.97] active:brightness-95"
          >
            {item.photoUrl ? (
              <SheepPhoto
                photoUrl={item.photoUrl}
                alt=""
                sizes="(max-width: 640px) 34vw, (max-width: 1024px) 25vw, 16vw"
              />
            ) : (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-primary-soft/70 text-primary-strong">
                <span className="text-[26px] font-bold leading-none">{initialsOf(item)}</span>
                <Camera size={16} aria-hidden="true" className="opacity-70" />
              </span>
            )}

            <span
              className={cn(
                'absolute inset-x-0 bottom-0 px-2 pb-1.5 pt-7',
                item.photoUrl
                  ? 'bg-gradient-to-t from-black/70 via-black/35 to-transparent text-white'
                  : 'text-ink',
              )}
            >
              <span className="block truncate text-[16px] font-bold leading-tight">
                {item.code}
              </span>
              {item.name && (
                <span
                  className={cn(
                    'block truncate text-[12px] leading-tight',
                    item.photoUrl ? 'text-white/90' : 'text-ink-soft',
                  )}
                >
                  {item.name}
                </span>
              )}
            </span>

            {item.alert && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">
                {item.alert}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
