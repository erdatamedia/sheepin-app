import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'solid'
  | 'outline'
  | 'ghost'
  | 'dangerOutline'
  | 'successOutline';

type ButtonSize = 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = 'solid',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    solid:
      'bg-primary text-white shadow-[var(--shadow-accent)] hover:brightness-110',
    outline:
      'border border-line bg-surface text-ink hover:bg-primary-soft/50',
    ghost: 'text-primary hover:bg-primary-soft/60',
    dangerOutline:
      'border border-[color:var(--danger-border)] bg-surface text-danger hover:bg-danger-soft',
    successOutline:
      'border border-[color:var(--success-border)] bg-surface text-success hover:bg-success-soft',
  };

  const sizes: Record<ButtonSize, string> = {
    md: 'h-11 px-5 text-sm',
    lg: 'h-14 px-6 text-base',
  };

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        sizes[size],
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
