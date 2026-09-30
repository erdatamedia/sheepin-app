import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5',
        className,
      )}
      {...props}
    />
  );
}
