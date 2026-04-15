import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'solid'
  | 'outline'
  | 'dangerOutline'
  | 'successOutline';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = 'solid',
  ...props
}: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    solid:
      'bg-[color:var(--accent)] text-white shadow-[0_12px_24px_rgba(33,73,61,0.22)] hover:brightness-105',
    outline:
      'border border-gray-200 bg-white text-gray-900 shadow-none hover:bg-gray-50',
    dangerOutline:
      'border border-red-200 bg-white text-red-700 shadow-none hover:bg-red-50',
    successOutline:
      'border border-emerald-200 bg-white text-emerald-700 shadow-none hover:bg-emerald-50',
  };

  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold tracking-[0.01em] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
