'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ClipboardPlus, Info, Camera, X } from 'lucide-react';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import type { GalleryItem } from '@/components/sheep/photo-gallery';
import { buttonClassName } from '@/components/ui/button';

type PhotoViewerProps = {
  items: GalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const SWIPE_PX = 50;

/**
 * Pelihat foto layar penuh: geser kiri-kanan (atau tombol panah) untuk pindah antar ternak.
 * Foto ternak sebelum dan sesudahnya dimuat lebih dulu agar perpindahan terasa instan.
 */
export function PhotoViewer({ items, index, onIndexChange, onClose }: PhotoViewerProps) {
  const item = items[index];
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef<number | null>(null);

  // Nilai terbaru dibaca lewat ref: efek di bawah hanya bergantung pada "terbuka", sehingga
  // tidak berjalan ulang (dan tidak merebut fokus) setiap kali pemanggil dirender ulang.
  const live = useRef({ index, count: items.length, onIndexChange, onClose });
  useEffect(() => {
    live.current = { index, count: items.length, onIndexChange, onClose };
  });

  const go = (delta: number) => {
    const { index: current, count, onIndexChange: change } = live.current;
    const next = current + delta;
    if (next >= 0 && next < count) change(next);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      const { index: current, count, onIndexChange: change, onClose: close } = live.current;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft' && current > 0) change(current - 1);
      else if (event.key === 'ArrowRight' && current < count - 1) change(current + 1);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (!item) return null;

  const neighbors = [items[index - 1], items[index + 1]].filter(
    (other): other is GalleryItem => !!other?.photoUrl,
  );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${item.code}`}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 outline-none"
    >
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <p className="text-[15px] font-medium" aria-live="polite">
          {index + 1} / {items.length}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 active:bg-white/25"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative min-h-0 flex-1 select-none"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(event) => {
          dragStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (dragStartX.current === null) return;
          const dx = event.clientX - dragStartX.current;
          dragStartX.current = null;
          if (dx <= -SWIPE_PX) go(1);
          else if (dx >= SWIPE_PX) go(-1);
        }}
        onPointerCancel={() => {
          dragStartX.current = null;
        }}
      >
        {item.photoUrl ? (
          <SheepPhoto
            key={item.id}
            photoUrl={item.photoUrl}
            alt={`Foto ${item.code}`}
            sizes="100vw"
            quality={75}
            eager
            className="object-contain!"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/80">
            <Camera size={48} aria-hidden="true" />
            <p className="text-[17px]">Belum ada foto untuk {item.code}</p>
          </div>
        )}

        {index > 0 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Ternak sebelumnya"
            className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
          >
            <ChevronLeft size={26} aria-hidden="true" />
          </button>
        )}
        {index < items.length - 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Ternak berikutnya"
            className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white active:bg-white/25"
          >
            <ChevronRight size={26} aria-hidden="true" />
          </button>
        )}

        {/* Muat foto tetangga lebih dulu, tanpa terlihat */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        >
          {neighbors.map((other) => (
            <div key={other.id} className="relative h-px w-px">
              <SheepPhoto photoUrl={other.photoUrl} alt="" sizes="100vw" quality={75} eager />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-strong mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] rounded-[var(--radius-card)] p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[24px] font-bold leading-tight tracking-tight text-ink">
              {item.code}
            </p>
            {item.name && <p className="truncate text-[16px] text-ink-soft">{item.name}</p>}
            {item.subtitle && (
              <p className="truncate text-[14px] text-ink-muted">{item.subtitle}</p>
            )}
          </div>
          {item.alert && (
            <span className="shrink-0 rounded-full bg-danger px-2.5 py-1 text-[12px] font-semibold text-white">
              {item.alert}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/recording?sheepId=${item.id}`} className={buttonClassName({ size: 'lg' })}>
            <ClipboardPlus size={20} aria-hidden="true" />
            Catat
          </Link>
          <Link
            href={`/sheep/${item.id}`}
            className={buttonClassName({ variant: 'tinted', size: 'lg' })}
          >
            <Info size={20} aria-hidden="true" />
            Detail
          </Link>
        </div>
      </div>
    </div>
  );
}
