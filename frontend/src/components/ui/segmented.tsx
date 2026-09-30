import { cn } from '@/lib/utils';

type SegmentedOption = {
  value: string;
  label: string;
  hint?: string;
};

type SegmentedProps = {
  label: string;
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** Ketuk pilihan yang sedang aktif untuk mengosongkan (untuk isian opsional). */
  allowClear?: boolean;
  className?: string;
};

export function Segmented({
  label,
  options,
  value,
  onChange,
  allowClear = false,
  className,
}: SegmentedProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('grid gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(allowClear && active ? '' : option.value)}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center rounded-[var(--radius-control)] border px-2 text-base font-semibold transition active:scale-[0.97]',
              active
                ? 'border-primary bg-primary text-white shadow-[var(--shadow-accent)]'
                : 'border-line bg-white text-ink hover:border-primary/40',
            )}
          >
            {option.label}
            {option.hint && (
              <span className={cn('text-xs font-normal', active ? 'text-white/80' : 'text-ink-muted')}>
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
