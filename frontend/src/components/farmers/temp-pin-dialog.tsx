'use client';

import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TempPinDialogProps = {
  name: string;
  pin: string;
  title: string;
  onClose: () => void;
};

/** PIN sementara hanya ditampilkan sekali; petugas menyampaikannya langsung ke peternak. */
export function TempPinDialog({ name, pin, title, onClose }: TempPinDialogProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="temp-pin-title"
        className="w-full max-w-sm rounded-[var(--radius-card)] bg-surface p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <KeyRound size={20} aria-hidden="true" />
          </span>
          <h2 id="temp-pin-title" className="text-lg font-semibold text-ink">
            {title}
          </h2>
        </div>

        <p className="text-sm text-ink-muted">PIN sementara untuk</p>
        <p className="font-semibold text-ink">{name}</p>

        <p
          aria-label={`PIN sementara ${pin.split('').join(' ')}`}
          className="my-4 rounded-[var(--radius-control)] border border-line bg-white py-4 text-center text-4xl font-bold tracking-[0.35em] text-ink"
        >
          {pin}
        </p>

        <ul className="mb-4 space-y-1 text-sm text-ink-muted">
          <li>• PIN ini hanya ditampilkan sekali. Catat sekarang.</li>
          <li>• Sampaikan langsung kepada peternak, jangan lewat grup.</li>
          <li>• Peternak wajib menggantinya saat pertama masuk.</li>
        </ul>

        <div className="grid gap-2">
          <Button variant="outline" size="lg" onClick={copy}>
            {copied ? 'PIN tersalin' : 'Salin PIN'}
          </Button>
          <Button size="lg" onClick={onClose}>
            Sudah saya catat
          </Button>
        </div>
      </div>
    </div>
  );
}
