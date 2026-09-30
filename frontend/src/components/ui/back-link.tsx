import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

/** Tombol kembali gaya iOS di bilah atas: "‹ Ternak". */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-0.5 rounded-lg pr-3 text-[17px] text-primary active:opacity-60"
    >
      <ChevronLeft size={24} aria-hidden="true" />
      {label}
    </Link>
  );
}
