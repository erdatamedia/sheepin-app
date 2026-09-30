'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';

type TempPinDialogProps = {
  name: string;
  pin: string;
  title: string;
  onClose: () => void;
};

/** PIN sementara hanya ditampilkan sekali; petugas menyampaikannya langsung ke peternak. */
export function TempPinDialog({ name, pin, title, onClose }: TempPinDialogProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={title} className="max-w-sm">
      <p className="text-[15px] text-ink-muted">PIN sementara untuk</p>
      <p className="text-[17px] font-semibold text-ink">{name}</p>

      <p
        aria-label={`PIN sementara ${pin.split('').join(' ')}`}
        className="my-4 rounded-[var(--radius-card)] bg-tint py-4 text-center text-[40px] font-bold tracking-[0.35em] text-ink"
      >
        {pin}
      </p>

      <ul className="mb-4 space-y-1 text-[14px] text-ink-muted">
        <li>• PIN ini hanya ditampilkan sekali. Catat sekarang.</li>
        <li>• Sampaikan langsung kepada peternak, jangan lewat grup.</li>
        <li>• Peternak wajib menggantinya saat pertama masuk.</li>
      </ul>

      <div className="grid gap-2">
        <Button variant="tinted" size="lg" onClick={copy}>
          {copied ? 'PIN tersalin' : 'Salin PIN'}
        </Button>
        <Button size="lg" onClick={onClose}>
          Sudah saya catat
        </Button>
      </div>
    </Sheet>
  );
}
