import { cn } from '@/lib/utils';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

export function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  const variants = {
    default:
      'border border-[color:rgba(86,74,50,0.14)] bg-[rgba(120,108,82,0.1)] text-[color:#5f5340]',
    success:
      'border border-emerald-200 bg-emerald-50 text-emerald-800',
    warning:
      'border border-amber-200 bg-amber-50 text-amber-800',
    danger:
      'border border-red-200 bg-red-50 text-red-800',
    info:
      'border border-sky-200 bg-sky-50 text-sky-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.01em]',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
