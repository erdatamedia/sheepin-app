/* eslint-disable @next/next/no-img-element */
import { mediaUrl } from '@/lib/media';
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

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

/** Foto profil bulat; bila tidak ada, inisial di atas warna pastel. */
export function Avatar({ name, photoUrl, size = 'md', className }: AvatarProps) {
  return photoUrl ? (
    <img
      src={mediaUrl(photoUrl)}
      alt={name}
      className={cn('shrink-0 rounded-full border border-line object-cover', sizes[size], className)}
    />
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
