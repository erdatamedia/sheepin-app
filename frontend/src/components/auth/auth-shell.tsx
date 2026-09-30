import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

/** Kerangka halaman masuk/daftar: kartu di tengah dengan logo. */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md lg:max-w-lg animate-[fadeInUp_.4s_ease-out] p-5 sm:p-6 lg:p-8">
        <div className="mb-6 text-center">
          <Link href="/" className="mb-4 inline-flex items-center gap-3" aria-label="Sheep-In, beranda">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={56}
              height={56}
              priority
              className="h-14 w-14 rounded-[16px] shadow-[var(--shadow-accent)]"
            />
            <span className="text-2xl font-semibold tracking-tight text-ink">Sheep-In</span>
          </Link>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">{description}</p>
        </div>
        {children}
      </Card>
    </div>
  );
}
