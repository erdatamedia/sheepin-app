import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] p-5 shadow-[var(--shadow-soft)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(39,33,21,0.10)]',
        className,
      )}
      {...props}
    />
  );
}
