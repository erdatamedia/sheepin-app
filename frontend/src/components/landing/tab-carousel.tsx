'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CarouselTab = { id: string; label: string; content: React.ReactNode };

/**
 * Tab dengan panel yang bergeser seperti carousel: panel digeser horizontal dengan easing halus,
 * tinggi wadah ikut menyesuaikan panel aktif. Bisa digeser (swipe), panah keyboard, tombol
 * sebelumnya/berikutnya, dan tautan #id dari bagian lain halaman.
 */
export function TabCarousel({ tabs, className }: { tabs: CarouselTab[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [heights, setHeights] = useState<number[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const touch = useRef<{ x: number; y: number; ok: boolean } | null>(null);

  const go = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(tabs.length - 1, next))),
    [tabs.length],
  );

  // Tinggi tiap panel, dipantau agar tetap pas saat isi berubah (peta dimuat, layar diputar).
  useEffect(() => {
    const ros = panelRefs.current.map((el, i) => {
      if (!el) return null;
      const ro = new ResizeObserver(() =>
        setHeights((prev) => {
          const next = [...prev];
          next[i] = el.offsetHeight;
          return next;
        }),
      );
      ro.observe(el);
      return ro;
    });
    return () => ros.forEach((ro) => ro?.disconnect());
  }, [tabs.length]);

  // Penanda geser di bawah tab aktif.
  useLayoutEffect(() => {
    const place = () => {
      const el = tabRefs.current[index];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
      // Hanya menggeser deretan tab (bukan halaman) agar tab aktif tetap terlihat di layar sempit.
      const scroller = scrollerRef.current;
      if (el && scroller) {
        scroller.scrollTo({
          left: el.offsetLeft - (scroller.clientWidth - el.offsetWidth) / 2,
          behavior: 'smooth',
        });
      }
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [index]);

  // Tautan #id (mis. dari menu atas) membuka tab yang sesuai lalu menggulir ke carousel.
  useEffect(() => {
    let timer = 0;
    const fromHash = (delay: number) => {
      const i = tabs.findIndex((t) => `#${t.id}` === window.location.hash);
      if (i < 0) return;
      setIndex(i);
      // Tunggu tata letak (tinggi panel, animasi masuk) stabil sebelum menggulir.
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
        delay,
      );
    };
    const onHash = () => fromHash(80);
    fromHash(700);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hashchange', onHash);
    };
  }, [tabs]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(index + 1);
    else if (e.key === 'ArrowLeft') go(index - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(tabs.length - 1);
    else return;
    e.preventDefault();
    requestAnimationFrame(() => tabRefs.current[Math.max(0, Math.min(tabs.length - 1, index + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0)))]?.focus());
  };

  return (
    <div ref={wrapRef} className={cn('scroll-mt-24', className)}>
      <div ref={scrollerRef} className="relative -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        <div
          role="tablist"
          aria-label="Bagian halaman"
          onKeyDown={onKey}
          className="glass relative mx-auto flex w-max min-w-0 gap-1 rounded-full p-1.5 md:mx-0"
        >
          {pill && (
            <span
              aria-hidden="true"
              className="absolute bottom-1.5 top-1.5 rounded-full bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] shadow-[var(--shadow-accent)] transition-[left,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ left: pill.left, width: pill.width }}
            />
          )}
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={index === i}
              aria-controls={`panel-${t.id}`}
              tabIndex={index === i ? 0 : -1}
              onClick={() => go(i)}
              className={cn(
                'relative z-10 min-h-11 whitespace-nowrap rounded-full px-5 text-[15px] font-medium transition-colors duration-300 lg:min-h-12 lg:px-7 lg:text-base',
                index === i ? 'text-white' : 'text-ink-soft hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mt-6 overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:mt-10"
        style={heights[index] ? { height: heights[index] } : undefined}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = {
            x: t.clientX,
            y: t.clientY,
            // Geser di atas peta dipakai peta, bukan carousel.
            ok: !(e.target as Element).closest('.leaflet-container'),
          };
        }}
        onTouchEnd={(e) => {
          const s = touch.current;
          touch.current = null;
          if (!s?.ok) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        <div
          className="flex items-start transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
          style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}
        >
          {tabs.map((t, i) => (
            <div
              key={t.id}
              id={`panel-${t.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${t.id}`}
              inert={index !== i}
              className={cn(
                'w-full shrink-0 transition-opacity duration-500',
                index === i ? 'opacity-100' : 'opacity-0',
              )}
            >
              <div
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
              >
                {t.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Bagian sebelumnya"
          className="glass flex h-12 w-12 items-center justify-center rounded-full text-ink transition disabled:opacity-35"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </button>
        <div aria-hidden="true" className="flex gap-2">
          {tabs.map((t, i) => (
            <span
              key={t.id}
              className={cn(
                'h-2 rounded-full bg-primary transition-all duration-500',
                index === i ? 'w-7 opacity-100' : 'w-2 opacity-30',
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === tabs.length - 1}
          aria-label="Bagian berikutnya"
          className="glass flex h-12 w-12 items-center justify-center rounded-full text-ink transition disabled:opacity-35"
        >
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
