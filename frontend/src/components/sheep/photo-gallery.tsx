'use client';

import { Camera, Ellipsis, Maximize2 } from 'lucide-react';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import type { SheepPhotoSlide } from '@/lib/sheep-photo';
import { cn } from '@/lib/utils';

export type GalleryItem = {
  id: string;
  code: string;
  name?: string | null;
  /** Pratinjau utama (wajah dan hidung). */
  photoUrl?: string | null;
  /** Foto semua sudut bila sudah diketahui; bila tidak, pelihat mengambilnya sendiri. */
  photos?: SheepPhotoSlide[];
  /** Baris singkat di pelihat, mis. "32,5 kg · kemarin" atau "Garut · Budi". */
  subtitle?: string;
  /** Ciri pembeda yang sudah diisi (teks singkat). */
  traits?: string[];
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

/**
 * Kisi foto ternak: kode besar di atas foto supaya cepat dikenali di antara banyak ternak.
 * `onOpen` = aksi utama saat foto diketuk; `onZoom` (opsional) menambah tombol kecil untuk memperbesar.
 */
export function PhotoGrid({
  items,
  onOpen,
  onZoom,
  onMenu,
}: {
  items: GalleryItem[];
  onOpen: (index: number) => void;
  onZoom?: (index: number) => void;
  /** Bila diisi, tiap foto punya tombol ⋯ untuk aksi cepat. */
  onMenu?: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
      {items.map((item, index) => (
        <li key={item.id} className="relative">
          <button
            type="button"
            onClick={() => onOpen(index)}
            aria-label={`${onZoom ? 'Pilih' : 'Lihat foto'} ${item.code}${item.name ? `, ${item.name}` : ''}`}
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

          {onMenu && (
            <button
              type="button"
              onClick={() => onMenu(index)}
              aria-label={`Aksi untuk ${item.code}`}
              className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center active:opacity-70"
            >
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm',
                  item.photoUrl ? 'bg-black/50 text-white' : 'bg-white/70 text-ink',
                )}
              >
                <Ellipsis size={16} aria-hidden="true" />
              </span>
            </button>
          )}

          {onZoom && item.photoUrl && (
            <button
              type="button"
              onClick={() => onZoom(index)}
              aria-label={`Perbesar foto ${item.code}`}
              className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center active:opacity-70"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
                <Maximize2 size={14} aria-hidden="true" />
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
