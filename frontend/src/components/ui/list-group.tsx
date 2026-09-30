import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ListGroupProps = {
  /** Judul kecil di atas kelompok. */
  header?: string;
  /** Keterangan kecil di bawah kelompok. */
  footer?: string;
  children: React.ReactNode;
  className?: string;
};

/** Kelompok baris membulat gaya iOS ("inset grouped"). Isi dengan <ListRow>. */
export function ListGroup({ header, footer, children, className }: ListGroupProps) {
  return (
    <section className={className}>
      {header && (
        <h2 className="mb-1.5 px-4 text-[13px] font-medium text-ink-muted">{header}</h2>
      )}
      <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-soft)]">
        {children}
      </ul>
      {footer && <p className="mt-1.5 px-4 text-[13px] leading-snug text-ink-muted">{footer}</p>}
    </section>
  );
}

type ListRowProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Ikon atau avatar di kiri. */
  leading?: React.ReactNode;
  /** Teks nilai di kanan (abu-abu). */
  value?: React.ReactNode;
  /** Elemen di kanan, mis. <Badge>. */
  trailing?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  /** Tampilkan panah; default aktif bila ada href/onClick. */
  chevron?: boolean;
  tone?: 'default' | 'danger';
  className?: string;
};

const rowBase =
  'flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors';

/** Satu baris daftar: min. 56px, pemisah tipis masuk ke dalam, panah bila bisa diketuk. */
export function ListRow({
  title,
  subtitle,
  leading,
  value,
  trailing,
  href,
  onClick,
  chevron,
  tone = 'default',
  className,
}: ListRowProps) {
  const interactive = !!href || !!onClick;
  const showChevron = chevron ?? interactive;

  const content = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[17px] leading-snug',
            tone === 'danger' ? 'text-danger' : 'text-ink',
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="block truncate text-[14px] leading-snug text-ink-muted">{subtitle}</span>
        )}
      </span>
      {value && <span className="shrink-0 text-[15px] text-ink-muted">{value}</span>}
      {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
      {showChevron && (
        <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-primary-icon" />
      )}
    </>
  );

  const classes = cn(rowBase, interactive && 'active:bg-tint', className);

  return (
    <li className="group relative">
      {href ? (
        <Link href={href} className={classes}>
          {content}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={classes}>
          {content}
        </button>
      ) : (
        <div className={classes}>{content}</div>
      )}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-0 right-0 h-px bg-line group-last:hidden',
          leading ? 'left-[68px]' : 'left-4',
        )}
      />
    </li>
  );
}
