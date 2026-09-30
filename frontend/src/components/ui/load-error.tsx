'use client';

import { RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

type LoadErrorProps = {
  onRetry: () => void;
  title?: string;
  description?: string;
};

/** Tampilan bila data gagal dimuat: jelas, tidak menyesatkan seperti "belum ada data", dan bisa dicoba ulang. */
export function LoadError({
  onRetry,
  title = 'Gagal memuat',
  description = 'Periksa sambungan internet Anda lalu coba lagi.',
}: LoadErrorProps) {
  return (
    <EmptyState
      icon={WifiOff}
      title={title}
      description={description}
      action={
        <Button variant="tinted" onClick={onRetry}>
          <RefreshCw size={18} aria-hidden="true" />
          Coba lagi
        </Button>
      }
    />
  );
}
