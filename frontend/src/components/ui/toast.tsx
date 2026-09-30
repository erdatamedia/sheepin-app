'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type ToastState = { tone: 'success' | 'error'; text: string } | null;

/** Pesan singkat di atas bottom nav (mobile) atau pojok bawah (desktop). */
export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'fixed inset-x-4 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+0.75rem)] z-[60] rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium shadow-[var(--shadow-sheet)] md:inset-x-auto md:bottom-6 md:right-6 md:max-w-sm',
        toast.tone === 'success'
          ? 'border-[color:var(--success-border)] bg-success-soft text-success'
          : 'border-[color:var(--danger-border)] bg-danger-soft text-danger',
      )}
    >
      {toast.text}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const notify = useCallback((tone: 'success' | 'error', text: string) => {
    setToast({ tone, text });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  return { toast, notify };
}
