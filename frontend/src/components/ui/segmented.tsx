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
      className={cn('grid gap-0.5 rounded-[12px] bg-tint p-[3px]', className)}
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
              'flex min-h-12 flex-col items-center justify-center rounded-[10px] px-2 text-[15px] transition duration-150',
              active
                ? 'bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(62,46,36,0.22)]'
                : 'font-medium text-ink-muted active:bg-surface/50',
            )}
          >
            {option.label}
            {option.hint && (
              <span className="text-xs font-normal text-ink-muted">
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
