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
    default: 'border border-line bg-[rgba(120,108,82,0.1)] text-[#5f5340]',
    success:
      'border border-[color:var(--success-border)] bg-success-soft text-success',
    warning:
      'border border-[color:var(--warning-border)] bg-warning-soft text-warning',
    danger:
      'border border-[color:var(--danger-border)] bg-danger-soft text-danger',
    info: 'border border-[color:var(--info-border)] bg-info-soft text-info',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
