import Link from 'next/link';
import { ChevronRight, type LucideIcon } from 'lucide-react';
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
      {header && <h2 className="mb-1.5 px-4 text-[13px] font-medium text-ink-muted">{header}</h2>}
      <ul className="glass overflow-hidden rounded-[var(--radius-card)]">
        {children}
      </ul>
      {footer && <p className="mt-1.5 px-4 text-[13px] leading-snug text-ink-muted">{footer}</p>}
    </section>
  );
}

/** Ikon kotak membulat untuk leading ListRow (seperti daftar Pengaturan iOS). */
export function RowIcon({
  icon: Icon,
  tone = 'default',
}: {
  icon: LucideIcon;
  tone?: 'default' | 'danger';
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-[30px] w-[30px] items-center justify-center rounded-[8px]',
        tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary-strong',
      )}
    >
      <Icon size={18} />
    </span>
  );
}

type ListRowProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Ikon atau avatar di kiri. */
  leading?: React.ReactNode;
  /** Lebar leading untuk pemisah: 'icon' (30px), 'circle' (36px), atau 'avatar' (44px, bawaan). */
  leadingSize?: 'icon' | 'circle' | 'avatar';
  /** Teks nilai di kanan (abu-abu). */
  value?: React.ReactNode;
  /** Elemen di kanan, mis. <Badge>. */
  trailing?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  /** Tampilkan panah; default aktif bila ada href/onClick. */
  chevron?: boolean;
  tone?: 'default' | 'danger' | 'accent';
  className?: string;
};

const rowBase =
  'flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors';

/** Satu baris daftar: min. 56px, pemisah tipis masuk ke dalam, panah bila bisa diketuk. */
export function ListRow({
  title,
  subtitle,
  leading,
  leadingSize = 'avatar',
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
            tone === 'danger'
              ? 'text-danger'
              : tone === 'accent'
                ? 'font-medium text-primary'
                : 'text-ink',
          )}
        >
          {title}
        </span>
        {subtitle && (
          <span className="block truncate text-[14px] leading-snug text-ink-muted">{subtitle}</span>
        )}
      </span>
      {value && (
        <span className="max-w-[60%] shrink-0 break-words text-right text-[15px] text-ink-muted">
          {value}
        </span>
      )}
      {trailing && <span className="flex shrink-0 items-center">{trailing}</span>}
      {showChevron && (
        <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-primary-icon" />
      )}
    </>
  );

  const classes = cn(rowBase, interactive && 'active:bg-primary-soft/50', className);

  return (
    <li className="group relative">
      {href && /^(https?:|tel:|mailto:)/.test(href) ? (
        <a
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel="noreferrer"
          className={classes}
        >
          {content}
        </a>
      ) : href ? (
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
          leading
            ? leadingSize === 'icon'
              ? 'left-[58px]'
              : leadingSize === 'circle'
                ? 'left-[64px]'
                : 'left-[72px]'
            : 'left-4',
        )}
      />
    </li>
  );
}
