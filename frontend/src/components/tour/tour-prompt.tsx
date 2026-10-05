'use client';

import { useSyncExternalStore } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tourPrompt, tourStore } from '@/lib/tour';

/** Ajakan untuk peternak baru: tampil sampai panduan diselesaikan atau ditutup; panduan tetap bisa diulang lewat tombol Panduan. */
export function TourPrompt() {
  const show = useSyncExternalStore(tourPrompt.subscribe, tourPrompt.snapshot, tourPrompt.serverSnapshot);
  if (!show) return null;

  return (
    <div className="glass mb-4 flex items-center gap-3 rounded-[var(--radius-card)] p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary-strong">
        <CircleHelp size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">Baru pertama kali?</p>
        <p className="text-[13px] leading-snug text-ink-muted">Ikuti panduan singkat cara mengisi data.</p>
      </div>
      <Button onClick={() => tourStore.start()}>Mulai</Button>
      <button
        type="button"
        onClick={() => tourPrompt.dismiss()}
        aria-label="Tutup ajakan panduan"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted active:bg-tint"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
