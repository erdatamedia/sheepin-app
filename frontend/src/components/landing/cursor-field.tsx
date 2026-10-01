'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Pembungkus halaman yang bereaksi pada kursor (hanya perangkat dengan mouse/trackpad):
 * - --mx/--my (-1..1) dan --gx/--gy (px) diperhalus dengan lerp, dipakai dekorasi untuk paralaks dan cahaya
 * - cincin kecil mengikuti kursor dan membesar di atas tautan/tombol
 * Di layar sentuh atau saat "kurangi gerakan" aktif, tidak ada yang dipasang.
 */
export function CursorField({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const ring = ringRef.current;
    if (!root || !ring) return;
    if (!matchMedia('(pointer: fine)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let tx = 0, ty = 0; // target, piksel relatif ke root
    let cx = 0, cy = 0; // posisi halus
    let rx = 0, ry = 0; // posisi cincin (viewport)
    let rtx = 0, rty = 0;
    let raf = 0;
    let started = false;

    const tick = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      rx += (rtx - rx) * 0.22;
      ry += (rty - ry) * 0.22;
      const w = root.clientWidth || 1;
      const h = window.innerHeight || 1;
      const rect = root.getBoundingClientRect();
      root.style.setProperty('--gx', `${cx.toFixed(1)}px`);
      root.style.setProperty('--gy', `${cy.toFixed(1)}px`);
      root.style.setProperty('--mx', ((cx / w) * 2 - 1).toFixed(3));
      // vertikal dihitung terhadap layar, bukan seluruh halaman, agar paralaks terasa di tiap bagian
      root.style.setProperty('--my', (((cy + rect.top) / h) * 2 - 1).toFixed(3));
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      const moving =
        Math.abs(tx - cx) > 0.3 || Math.abs(ty - cy) > 0.3 ||
        Math.abs(rtx - rx) > 0.3 || Math.abs(rty - ry) > 0.3;
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const rect = root.getBoundingClientRect();
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
      rtx = e.clientX;
      rty = e.clientY;
      if (!started) {
        started = true;
        cx = tx; cy = ty; rx = rtx; ry = rty;
      }
      root.dataset.cursor = 'on';
      const hot = (e.target as Element | null)?.closest('a, button, [data-cursor]');
      root.dataset.hot = hot ? 'on' : 'off';
      kick();
    };
    const onLeave = () => {
      root.dataset.cursor = 'off';
    };
    // Saat menggulir, posisi kursor di halaman berubah walau mouse diam.
    const onScroll = () => {
      if (!started) return;
      const rect = root.getBoundingClientRect();
      ty = rty - rect.top;
      kick();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn('cursor-field relative', className)}>
      {/* cahaya hangat yang mengikuti kursor */}
      <div aria-hidden="true" className="cursor-glow pointer-events-none absolute inset-0 z-0" />
      {children}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[70] hidden"
      >
        <span />
      </div>
    </div>
  );
}
