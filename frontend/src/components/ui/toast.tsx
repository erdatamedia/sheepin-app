import { cn } from '@/lib/utils';

export type ToastState = { tone: 'success' | 'error'; text: string } | null;

/** Pesan singkat di atas bottom nav (mobile) atau pojok bawah (desktop). */
export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium shadow-lg md:inset-x-auto md:bottom-6 md:right-6 md:max-w-sm',
        toast.tone === 'success'
          ? 'border-[color:var(--success-border)] bg-success-soft text-success'
          : 'border-[color:var(--danger-border)] bg-danger-soft text-danger',
      )}
    >
      {toast.text}
    </div>
  );
}
