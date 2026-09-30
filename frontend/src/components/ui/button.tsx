import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'solid'
  | 'tinted'
  | 'outline'
  | 'ghost'
  | 'dangerOutline'
  | 'successOutline';

type ButtonSize = 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

// Gaya iOS: isi penuh (solid), isi pastel (tinted), bingkai tipis, dan teks saja (ghost).
const variantClasses: Record<ButtonVariant, string> = {
  solid: 'bg-primary text-white active:bg-primary-strong',
  tinted: 'bg-primary-soft text-primary-strong active:brightness-95',
  outline: 'border border-line bg-surface text-ink active:bg-tint',
  ghost: 'text-primary active:bg-primary-soft/60',
  dangerOutline: 'bg-danger-soft text-danger active:brightness-95',
  successOutline: 'bg-success-soft text-success active:brightness-95',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-[52px] px-6 text-[17px] rounded-[14px]',
};

/** Kelas tombol yang bisa dipakai juga pada <Link> agar tidak ada <a><button> bersarang. */
export function buttonClassName({
  variant = 'solid',
  size = 'md',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:active:scale-100',
    sizeClasses[size],
    variantClasses[variant],
    className,
  );
}

export function Button({
  className,
  variant = 'solid',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  );
}
