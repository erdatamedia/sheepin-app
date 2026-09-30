'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, ClipboardPlus, Info, Check, X } from 'lucide-react';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import type { GalleryItem } from '@/components/sheep/photo-gallery';
import { Button, buttonClassName } from '@/components/ui/button';
import { ANGLES, getSheepPhotos, type SheepPhotoSlide } from '@/lib/sheep-photo';
import { cn } from '@/lib/utils';

type PhotoViewerProps = {
  items: GalleryItem[];
  /** Ternak yang sedang dilihat. */
  index: number;
  /** Sudut foto awal (mis. dari kotak sudut di detail ternak). */
  initialSlide?: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Bila ada, menggantikan tombol Catat/Detail (mis. "Pilih ternak ini" di halaman Catat). */
  primaryAction?: { label: string; onSelect: (item: GalleryItem) => void };
};

const SWIPE_X_PX = 50;
const SWIPE_Y_PX = 60;
const shortLabel = (angle: string) => ANGLES.find((item) => item.angle === angle)?.label ?? angle;

/**
 * Pelihat foto layar penuh.
 * - Geser kiri-kanan: sudut foto lain dari ternak yang sama (wajah dan hidung pertama).
 * - Geser atas-bawah, atau tombol panah di bilah atas: ternak berikutnya/sebelumnya.
 * Foto tetangga dan daftar sudut dimuat lebih dulu agar perpindahan terasa instan.
 */
export function PhotoViewer({
  items,
  index,
  initialSlide = 0,
  onIndexChange,
  onClose,
  primaryAction,
}: PhotoViewerProps) {
  const item = items[index];
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const requested = useRef(new Set<string>());
  const [slide, setSlide] = useState(initialSlide);
  const [cache, setCache] = useState<Record<string, SheepPhotoSlide[]>>({});

  const slidesFor = (target?: GalleryItem): SheepPhotoSlide[] => {
    if (!target) return [];
    return (
      cache[target.id] ??
      target.photos ??
      (target.photoUrl ? [{ angle: 'FACE', url: target.photoUrl }] : [])
    );
  };

  // Nilai terbaru dibaca lewat ref: efek pasang-papan-ketik hanya berjalan sekali dan tidak merebut fokus.
  const live = useRef({
    index,
    slide,
    count: items.length,
    slides: slidesFor(item),
    onIndexChange,
    onClose,
  });
  useEffect(() => {
    live.current = {
      index,
      slide,
      count: items.length,
      slides: slidesFor(item),
      onIndexChange,
      onClose,
    };
  });

  const goSheep = (delta: number) => {
    const { index: current, count, onIndexChange: change } = live.current;
    const next = current + delta;
    if (next < 0 || next >= count) return;
    setSlide(0);
    change(next);
  };

  // Geser antar sudut; di ujung, lanjut ke ternak tetangga.
  const goSlide = (delta: number) => {
    const { slide: current, slides } = live.current;
    const next = current + delta;
    if (next >= 0 && next < slides.length) setSlide(next);
    else goSheep(delta);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      const { onClose: close } = live.current;
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft') goSlide(-1);
      else if (event.key === 'ArrowRight') goSlide(1);
      else if (event.key === 'ArrowUp') goSheep(-1);
      else if (event.key === 'ArrowDown') goSheep(1);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ambil daftar sudut untuk ternak ini dan tetangganya.
  useEffect(() => {
    for (const target of [items[index - 1], items[index], items[index + 1]]) {
      if (!target?.photoUrl || target.photos || requested.current.has(target.id)) continue;
      requested.current.add(target.id);
      getSheepPhotos(target.id)
        .then((photos) => setCache((previous) => ({ ...previous, [target.id]: photos })))
        .catch(() => undefined); // tanpa daftar sudut, foto utama tetap tampil
    }
  }, [index, items]);

  if (!item) return null;

  const slides = slidesFor(item);
  const current = slides[Math.min(slide, slides.length - 1)];
  const preload = [
    slides[slide + 1],
    slidesFor(items[index + 1])[0],
    slidesFor(items[index - 1])[0],
  ].filter((value): value is SheepPhotoSlide => !!value);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${item.code}`}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col bg-black/95 outline-none"
    >
      <div className="flex items-center gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <button
          type="button"
          onClick={() => goSheep(-1)}
          disabled={index === 0}
          aria-label="Ternak sebelumnya"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 active:bg-white/25 disabled:opacity-30"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
        <p className="min-w-0 flex-1 text-center text-[15px] font-medium" aria-live="polite">
          Ternak {index + 1} / {items.length}
          {slides.length > 1 && (
            <span className="text-white/70">
              {' '}
              · foto {Math.min(slide, slides.length - 1) + 1}/{slides.length}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => goSheep(1)}
          disabled={index >= items.length - 1}
          aria-label="Ternak berikutnya"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 active:bg-white/25 disabled:opacity-30"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </button>
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
        style={{ touchAction: 'none' }}
        onPointerDown={(event) => {
          dragStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = dragStart.current;
          dragStart.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) >= SWIPE_X_PX && Math.abs(dx) > Math.abs(dy)) goSlide(dx < 0 ? 1 : -1);
          else if (Math.abs(dy) >= SWIPE_Y_PX) goSheep(dy < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      >
        {current ? (
          <SheepPhoto
            key={`${item.id}-${current.url}`}
            photoUrl={current.url}
            alt={`${shortLabel(current.angle)} ${item.code}`}
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

        {current && slides.length > 1 && (
          <span className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[13px] font-medium text-white backdrop-blur-sm">
            {shortLabel(current.angle)}
          </span>
        )}

        {/* Muat foto berikutnya lebih dulu, tanpa terlihat */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        >
          {preload.map((other) => (
            <div key={other.url} className="relative h-px w-px">
              <SheepPhoto photoUrl={other.url} alt="" sizes="100vw" quality={75} eager />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div
          role="tablist"
          aria-label="Sudut foto"
          className="flex gap-2 overflow-x-auto px-3 py-2"
        >
          {slides.map((photo, position) => {
            const active = position === Math.min(slide, slides.length - 1);
            return (
              <button
                key={photo.angle}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSlide(position)}
                className={cn(
                  'min-h-10 shrink-0 rounded-full px-3.5 text-[14px] font-medium transition',
                  active ? 'bg-white text-ink' : 'bg-white/15 text-white active:bg-white/25',
                )}
              >
                {shortLabel(photo.angle)}
              </button>
            );
          })}
        </div>
      )}

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
            {item.traits && item.traits.length > 0 && (
              <p className="mt-1 line-clamp-2 text-[14px] text-ink-soft">
                {item.traits.join(' · ')}
              </p>
            )}
          </div>
          {item.alert && (
            <span className="shrink-0 rounded-full bg-danger px-2.5 py-1 text-[12px] font-semibold text-white">
              {item.alert}
            </span>
          )}
        </div>

        {primaryAction ? (
          <Button size="lg" className="w-full" onClick={() => primaryAction.onSelect(item)}>
            <Check size={20} aria-hidden="true" />
            {primaryAction.label}
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/recording?sheepId=${item.id}`}
              className={buttonClassName({ size: 'lg' })}
            >
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
        )}
      </div>
    </div>
  );
}
