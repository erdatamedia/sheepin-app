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
  // Kaca bergradien: gradasi coklat, garis terang di tepi atas, dan cahaya lembut di bawah
  solid:
    'border border-white/30 bg-[linear-gradient(180deg,var(--btn-top),var(--btn-bottom))] text-white shadow-[var(--shadow-accent)] active:brightness-90',
  tinted:
    'border border-white/60 bg-primary-soft/80 text-primary-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md active:brightness-95',
  outline: 'glass text-ink active:brightness-95',
  ghost: 'text-primary active:bg-primary-soft/60',
  dangerOutline:
    'border border-white/60 bg-danger-soft/85 text-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md active:brightness-95',
  successOutline:
    'border border-white/60 bg-success-soft/85 text-success shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-md active:brightness-95',
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
