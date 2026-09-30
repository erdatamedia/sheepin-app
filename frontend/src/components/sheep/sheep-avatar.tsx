/* eslint-disable @next/next/no-img-element */
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

type SheepAvatarProps = {
  sheepCode: string;
  name?: string | null;
  photoUrl?: string | null;
  className?: string;
};

export function SheepAvatar({ sheepCode, name, photoUrl, className }: SheepAvatarProps) {
  const box = 'h-14 w-14 shrink-0 rounded-2xl';

  return photoUrl ? (
    <img
      src={mediaUrl(photoUrl)}
      alt={name || sheepCode}
      className={cn(box, 'border border-line object-cover', className)}
    />
  ) : (
    <div
      aria-hidden="true"
      className={cn(
        box,
        'flex items-center justify-center bg-primary-soft text-sm font-semibold text-primary',
        className,
      )}
    >
      {sheepCode.slice(0, 2).toUpperCase()}
    </div>
  );
}
