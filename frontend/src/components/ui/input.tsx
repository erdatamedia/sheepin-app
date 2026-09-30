import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const fieldClassName =
  'flex h-12 w-full rounded-[var(--radius-control)] border border-line bg-white px-4 text-base text-ink outline-none transition placeholder:text-ink-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(fieldClassName, className)} {...props} />;
  },
);

Input.displayName = 'Input';

export { Input };
