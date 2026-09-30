import Image from 'next/image';
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
      <Card className="w-full max-w-md animate-[fadeInUp_.4s_ease-out] p-5 sm:p-6">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/sheepin-logo.png"
              alt="Sheep-In"
              width={320}
              height={96}
              priority
              className="h-16 w-auto max-w-full object-contain sm:h-20"
            />
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-[15px] text-ink-muted">{description}</p>
        </div>
        {children}
      </Card>
    </div>
  );
}
