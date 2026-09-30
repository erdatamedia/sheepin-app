'use client';
/* eslint-disable @next/next/no-img-element */

import Image from 'next/image';
import { useState } from 'react';
import { mediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

type SheepPhotoProps = {
  photoUrl?: string | null;
  alt: string;
  /** Atribut `sizes` HTML: ukuran tampil foto, agar browser meminta ukuran yang pas. */
  sizes: string;
  quality?: 60 | 75;
  /** Muat segera (mis. foto besar di pelihat), bukan menunggu terlihat. */
  eager?: boolean;
  className?: string;
};

/**
 * Foto ternak yang sudah dioptimalkan (ukuran dan WebP lewat Next.js). Induknya harus `relative`
 * dan punya ukuran. Bila optimasi gagal, otomatis memakai berkas asli agar foto tetap tampil.
 */
export function SheepPhoto({
  photoUrl,
  alt,
  sizes,
  quality = 60,
  eager = false,
  className,
}: SheepPhotoProps) {
  const src = mediaUrl(photoUrl);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src) return null;

  if (!src.startsWith('/uploads/') || failedSrc === src) {
    return (
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailedSrc(src)}
      className={cn('object-cover', className)}
    />
  );
}
