import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn('flex flex-col items-center gap-3 py-10 text-center', className)}>
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </Card>
  );
}
