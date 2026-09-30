'use client';

import { EllipsisVertical, Plus, Share } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-strong">
        {n}
      </span>
      <p className="pt-0.5 text-[15px] leading-snug text-ink">{children}</p>
    </li>
  );
}

export function InstallSheet({
  open,
  platform,
  onClose,
}: {
  open: boolean;
  platform: 'ios' | 'android' | 'other';
  onClose: () => void;
}) {
  const ios = platform === 'ios';

  return (
    <Sheet open={open} onClose={onClose} title="Pasang Sheep-In di layar utama">
      <p className="text-sm text-ink-muted">
        Buka Sheep-In langsung dari layar utama seperti aplikasi biasa: lebih cepat dan layar penuh.
      </p>

      {ios ? (
        <ol className="mt-4 space-y-3">
          <Step n={1}>
            Buka halaman ini di <b>Safari</b> (bukan di dalam aplikasi lain).
          </Step>
          <Step n={2}>
            Ketuk tombol <b>Bagikan</b> <Share size={16} className="inline -translate-y-0.5" aria-hidden="true" /> di
            bagian bawah layar.
          </Step>
          <Step n={3}>
            Gulir, pilih <b>Tambah ke Layar Utama</b> <Plus size={16} className="inline -translate-y-0.5" aria-hidden="true" />.
          </Step>
          <Step n={4}>
            Ketuk <b>Tambah</b>. Ikon Sheep-In muncul di layar utama.
          </Step>
        </ol>
      ) : (
        <ol className="mt-4 space-y-3">
          <Step n={1}>
            Buka halaman ini di <b>Chrome</b>.
          </Step>
          <Step n={2}>
            Ketuk menu <EllipsisVertical size={16} className="inline -translate-y-0.5" aria-hidden="true" /> di pojok kanan atas.
          </Step>
          <Step n={3}>
            Pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.
          </Step>
          <Step n={4}>
            Ketuk <b>Instal</b> / <b>Tambahkan</b>. Ikon Sheep-In muncul di layar utama.
          </Step>
        </ol>
      )}

      <Button className="mt-5 w-full" size="lg" onClick={onClose}>
        Mengerti
      </Button>
    </Sheet>
  );
}
