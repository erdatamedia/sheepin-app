'use client';

import { useState, useSyncExternalStore } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInstall } from './install-provider';

const KEY = 'sheepin-install-dismissed';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

const noopSubscribe = () => () => {};

function snoozed() {
  try {
    const at = Number(localStorage.getItem(KEY));
    return !!at && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

/** Ajakan memasang ke layar utama. Hanya di seluler, tidak pernah di mode aplikasi, bisa ditutup 14 hari. */
export function InstallBanner() {
  const { canGuide, install } = useInstall();
  const [closed, setClosed] = useState(false);
  const hidden = useSyncExternalStore(noopSubscribe, snoozed, () => true) || closed;

  if (!canGuide || hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* abaikan */
    }
    setClosed(true);
  };

  return (
    <div className="glass mb-4 flex items-center gap-3 rounded-[var(--radius-card)] p-3 md:hidden">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-primary-soft text-primary-strong">
        <Download size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">Pasang di layar utama</p>
        <p className="text-[13px] leading-snug text-ink-muted">Buka Sheep-In seperti aplikasi, tanpa ketik alamat.</p>
      </div>
      <Button onClick={install}>
        Pasang
      </Button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Tutup ajakan"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted active:bg-tint"
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
