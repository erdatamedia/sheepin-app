import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'glass rounded-[var(--radius-card)] p-4 sm:p-5',
        className,
      )}
      {...props}
    />
  );
}
