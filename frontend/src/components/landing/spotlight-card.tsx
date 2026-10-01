'use client';

import { cn } from '@/lib/utils';

/** Kartu kaca dengan cahaya lembut yang mengikuti kursor di dalamnya. */
export function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-cursor
      className={cn('spotlight glass rounded-[var(--radius-card)]', className)}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--sx', `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty('--sy', `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </div>
  );
}
