import { cn } from '@/lib/utils';

/** Domba garis (sama dengan lambang), diwarnai lewat mask supaya mengikuti token warna. */
export function LineSheep({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden="true" className={cn('sheep-line', className)} style={style} />;
}

/** Domba berbulu wol, siluet sederhana untuk dekorasi latar. Warna mengikuti currentColor. */
export function WoolSheep({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 84"
      className={className}
      style={style}
      fill="currentColor"
    >
      <rect x="44" y="60" width="6" height="22" rx="3" />
      <rect x="54" y="62" width="6" height="20" rx="3" />
      <rect x="76" y="62" width="6" height="20" rx="3" />
      <rect x="86" y="60" width="6" height="22" rx="3" />
      <circle cx="24" cy="46" r="6" />
      <circle cx="30" cy="52" r="14" />
      <circle cx="38" cy="38" r="17" />
      <circle cx="56" cy="31" r="20" />
      <circle cx="77" cy="35" r="19" />
      <circle cx="92" cy="47" r="15" />
      <circle cx="50" cy="52" r="18" />
      <circle cx="72" cy="54" r="17" />
      <ellipse cx="108" cy="42" rx="11" ry="14" transform="rotate(-12 108 42)" />
      <ellipse cx="97" cy="34" rx="9" ry="4.5" transform="rotate(28 97 34)" />
    </svg>
  );
}
