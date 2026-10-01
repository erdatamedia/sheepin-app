'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

/** Elemen sedikit tertarik ke arah kursor saat didekati. Tidak berefek di layar sentuh. */
export function Magnetic({
  children,
  className,
  strength = 0.28,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      className={cn('inline-block transition-transform duration-200 ease-out will-change-transform', className)}
    >
      {children}
    </div>
  );
}
