'use client';

import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Sembunyikan judul secara visual (tetap dibaca pembaca layar). */
  hideTitle?: boolean;
  children: React.ReactNode;
  className?: string;
};

/**
 * Lembar dari bawah gaya iOS: pegangan di atas, latar digelapkan, Escape dan ketuk luar menutup.
 * Di layar lebar tampil sebagai dialog di tengah.
 */
export function Sheet({
  open,
  onClose,
  title,
  hideTitle = false,
  children,
  className,
}: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Tutup"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-[fadeIn_.2s_ease-out] bg-black/35 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'absolute inset-x-0 bottom-0 mx-auto max-h-[88%] w-full max-w-lg animate-[sheetIn_.28s_cubic-bezier(.2,.8,.2,1)] overflow-auto glass-strong rounded-t-[var(--radius-sheet)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2 shadow-[var(--shadow-sheet)] outline-none motion-reduce:animate-none',
          'md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-[var(--radius-sheet)]',
          className,
        )}
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line md:hidden"
        />

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id={titleId}
            className={cn('text-[20px] font-bold tracking-tight text-ink', hideTitle && 'sr-only')}
          >
            {title}
          </h2>
          {!hideTitle && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="-mr-1.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full active:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-ink-muted">
                <X size={18} aria-hidden="true" />
              </span>
            </button>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}
