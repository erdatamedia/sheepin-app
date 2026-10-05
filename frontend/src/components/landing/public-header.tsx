import Image from 'next/image';
import Link from 'next/link';
import { buttonClassName } from '@/components/ui/button';

/** Bilah atas halaman publik (katalog): merek, tautan beranda, dan tombol masuk. */
export function PublicHeader() {
  return (
    <header className="glass-bar-top sticky top-0 z-30 border-b border-b-white/70 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 md:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Sheep-In, beranda">
          <Image src="/icons/icon-192.png" alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-[12px]" />
          <span className="text-xl font-semibold tracking-tight text-ink">Sheep-In</span>
        </Link>
        <Link href="/login" className={buttonClassName({ variant: 'outline' })}>
          Masuk
        </Link>
      </div>
    </header>
  );
}
