import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginQr } from '@/components/landing/login-qr';
import { LOGIN_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'QR masuk Sheep-In',
  description: 'Pindai untuk membuka halaman masuk Sheep-In.',
};

/** Layar penuh untuk dipamerkan di proyektor saat pemaparan. */
export default function QrPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-10 text-center">
      <div>
        <p className="text-lg font-medium text-primary-strong">Sheep-In</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink md:text-6xl">
          Pindai untuk masuk
        </h1>
        <p className="mt-3 text-lg text-ink-muted md:text-2xl">
          Arahkan kamera HP ke kode di bawah.
        </p>
      </div>

      <LoginQr url={LOGIN_URL} className="w-[min(80vw,70svh)] max-w-[34rem] p-5 md:p-7" />

      <p className="text-xl font-semibold tracking-tight text-ink md:text-3xl">
        {LOGIN_URL.replace(/^https?:\/\//, '')}
      </p>

      <Link href="/" className="flex items-center gap-2 text-[15px] font-medium text-primary-strong print:hidden">
        <ArrowLeft size={18} aria-hidden="true" /> Kembali ke beranda
      </Link>
    </main>
  );
}
