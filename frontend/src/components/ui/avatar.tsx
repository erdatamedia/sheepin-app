import { SheepPhoto } from '@/components/sheep/sheep-photo';
import { cn } from '@/lib/utils';

type AvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizes = {
  sm: 'h-9 w-9 text-[13px]',
  md: 'h-11 w-11 text-[15px]',
  lg: 'h-16 w-16 text-[22px]',
  xl: 'h-20 w-20 text-[28px]',
};

const photoSizes = { sm: '36px', md: '44px', lg: '64px', xl: '80px' };

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Foto profil bulat (miniatur teroptimasi); bila tidak ada, inisial di atas warna pastel. */
export function Avatar({ name, photoUrl, size = 'md', className }: AvatarProps) {
  return photoUrl ? (
    <span
      className={cn(
        'relative block shrink-0 overflow-hidden rounded-full border border-line',
        sizes[size],
        className,
      )}
    >
      <SheepPhoto photoUrl={photoUrl} alt={name} sizes={photoSizes[size]} />
    </span>
  ) : (
    <div
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-strong',
        sizes[size],
        className,
      )}
    >
      {initials(name) || 'SI'}
    </div>
  );
}
