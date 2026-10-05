import { BadgeCheck } from 'lucide-react';
import { VERIFIER_LABEL } from '@/lib/catalog';
import { cn } from '@/lib/utils';

/** Tanda verifikasi. `compact` hanya ikon + "Terverifikasi"; versi penuh menyebut pihak yang memverifikasi. */
export function VerifiedBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span
      title={`Terverifikasi ${VERIFIER_LABEL}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[color:var(--success-border)] bg-success-soft font-semibold text-success',
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
        className,
      )}
    >
      <BadgeCheck size={compact ? 14 : 16} aria-hidden="true" />
      {compact ? 'Terverifikasi' : `Terverifikasi ${VERIFIER_LABEL}`}
    </span>
  );
}
