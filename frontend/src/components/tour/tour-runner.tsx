'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { findTourTarget, TOUR_STEPS, tourStore } from '@/lib/tour';

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const CARD_W = 340;

/**
 * Pelaksana panduan: menyorot elemen berpenanda data-tour, pindah halaman bila langkah berikutnya
 * ada di halaman lain, dan melewati langkah yang elemennya tidak ada. Hanya menunjukkan; tidak
 * mengirim atau menyimpan data apa pun.
 */
export function TourRunner() {
  const index = useSyncExternalStore(tourStore.subscribe, tourStore.snapshot, tourStore.serverSnapshot);
  const router = useRouter();
  const pathname = usePathname();
  const step = index === null ? null : TOUR_STEPS[index];

  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const nextRef = useRef<HTMLButtonElement>(null);
  const direction = useRef<'next' | 'back'>('next');

  const last = index === TOUR_STEPS.length - 1;

  const next = useCallback(() => {
    if (index === null) return;
    direction.current = 'next';
    if (index >= TOUR_STEPS.length - 1) tourStore.finish();
    else tourStore.go(index + 1);
  }, [index]);

  const back = useCallback(() => {
    if (index === null || index === 0) return;
    direction.current = 'back';
    tourStore.go(index - 1);
  }, [index]);

  // Pindah ke halaman langkah ini bila belum di sana.
  useEffect(() => {
    if (step && pathname !== step.route) router.push(step.route);
  }, [step, pathname, router]);

  // Cari elemen sasaran (menunggu halaman memuat), gulirkan ke tengah, lalu ikuti posisinya.
  useEffect(() => {
    if (!step || pathname !== step.route) return;
    let cancelled = false;
    let raf = 0;
    let poll = 0;
    let element: HTMLElement | null = null;
    const started = Date.now();

    const measure = () => {
      if (cancelled) return;
      setViewport({ w: window.innerWidth, h: window.innerHeight });
      if (element) {
        const r = element.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const attach = () => {
      if (!step.target) {
        setRect(null);
        measure();
        return;
      }
      element = findTourTarget(step.target);
      if (element) {
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        measure();
        window.addEventListener('scroll', onChange, true);
        window.addEventListener('resize', onChange);
        return;
      }
      if (Date.now() - started > 3000) {
        window.clearInterval(poll);
        if (step.skipIfMissing) {
          if (direction.current === 'back') {
            const prev = TOUR_STEPS.findIndex((item) => item === step) - 1;
            if (prev >= 0) tourStore.go(prev);
          } else next();
        } else {
          setRect(null);
          measure();
        }
      }
    };

    // Elemen mungkin baru muncul setelah data dimuat: coba berulang sampai 3 detik.
    poll = window.setInterval(() => {
      if (element) return window.clearInterval(poll);
      attach();
      if (element) window.clearInterval(poll);
    }, 150);
    const first = window.setTimeout(attach, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(poll);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
      setRect(null);
    };
  }, [step, pathname, next]);

  // Escape menutup panduan; fokus ke tombol Lanjut agar bisa dioperasikan keyboard.
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tourStore.finish();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    nextRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [index, next, back]);

  if (!step || index === null || pathname !== step.route) return null;

  const spot = step.target && rect ? rect : null;

  // Kartu: di bawah sasaran bila sasaran di bagian atas layar, selain itu di atasnya.
  const cardW = Math.min(CARD_W, viewport.w - 24);
  let cardStyle: React.CSSProperties;
  if (spot) {
    const below = spot.top + spot.height / 2 < viewport.h / 2;
    const left = Math.max(12, Math.min(viewport.w - cardW - 12, spot.left + spot.width / 2 - cardW / 2));
    cardStyle = below
      ? { top: Math.min(viewport.h - 200, spot.top + spot.height + PAD + 12), left, width: cardW }
      : { bottom: Math.min(viewport.h - 120, viewport.h - spot.top + PAD + 12), left, width: cardW };
  } else {
    cardStyle = { top: '50%', left: '50%', width: cardW, transform: 'translate(-50%, -50%)' };
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label={`Panduan: ${step.title}`}>
      {/* Lapisan penahan ketukan agar panduan tidak memicu aksi di bawahnya */}
      <div className="absolute inset-0" />
      {spot ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[16px] shadow-[0_0_0_9999px_rgba(40,28,20,0.62)] ring-2 ring-white/90 transition-all duration-300 ease-out"
          style={{
            top: spot.top - PAD,
            left: spot.left - PAD,
            width: spot.width + PAD * 2,
            height: spot.height + PAD * 2,
          }}
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[rgba(40,28,20,0.62)]" />
      )}

      <div className="glass-strong absolute rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-sheet)]" style={cardStyle}>
        <p className="text-[12px] font-medium text-ink-muted">
          Langkah {index + 1} dari {TOUR_STEPS.length}
        </p>
        <h2 className="mt-0.5 text-[18px] font-bold leading-snug text-ink">{step.title}</h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => tourStore.finish()}
            className="min-h-11 px-2 text-[14px] font-medium text-ink-muted active:opacity-60"
          >
            {last ? 'Tutup' : 'Lewati'}
          </button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="tinted" onClick={back}>
                Kembali
              </Button>
            )}
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              className="inline-flex h-11 items-center justify-center rounded-[var(--radius-control)] border border-white/30 bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] px-5 text-[15px] font-semibold text-white shadow-[var(--shadow-accent)] active:brightness-90"
            >
              {last ? 'Selesai' : 'Lanjut'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
