import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
};

const toneClasses = {
  default: '',
  success: 'border-[color:var(--success-border)] bg-success-soft/80',
  warning: 'border-[color:var(--warning-border)] bg-warning-soft/80',
  danger: 'border-[color:var(--danger-border)] bg-danger-soft/80',
  info: 'border-[color:var(--info-border)] bg-info-soft/80',
};

export function StatTile({ label, value, hint, tone = 'default', className }: StatTileProps) {
  return (
    <Card className={cn('p-3 sm:p-4', toneClasses[tone], className)}>
      <p className="text-xs text-ink-muted sm:text-sm">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}
