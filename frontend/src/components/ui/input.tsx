import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const fieldClassName =
  'flex h-12 w-full rounded-[var(--radius-control)] border border-line bg-surface px-4 text-[17px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-primary focus:ring-[3px] focus:ring-primary/20 disabled:bg-tint disabled:text-ink-muted';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(fieldClassName, className)} {...props} />;
  },
);

Input.displayName = 'Input';

export { Input };
