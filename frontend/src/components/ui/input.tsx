import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const fieldClassName =
  'flex h-12 w-full rounded-[var(--radius-control)] border border-white/70 bg-white/70 px-4 shadow-[inset_0_1px_2px_rgba(94,70,50,0.08)] backdrop-blur-md text-[17px] text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-primary focus:ring-[3px] focus:ring-primary/20 disabled:bg-tint disabled:text-ink-muted';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(fieldClassName, className)} {...props} />;
  },
);

Input.displayName = 'Input';

export { Input };
