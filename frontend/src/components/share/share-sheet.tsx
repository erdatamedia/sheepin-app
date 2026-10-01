'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { shareOrDownload } from '@/lib/share-card';

type ShareSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  filename: string;
  message: string;
  /** Membuat gambar. Dipanggil ulang saat `renderKey` berubah. */
  render: () => Promise<Blob>;
  renderKey: string;
  /** Pilihan di atas pratinjau (periode, tampilkan nama, dll.). */
  options?: React.ReactNode;
};

/** Pratinjau kartu + tombol Bagikan (lembar bagikan HP) atau Unduh bila perangkat tidak mendukung. */
export function ShareSheet({ open, onClose, title, filename, message, render, renderKey, options }: ShareSheetProps) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const renderRef = useRef(render);
  useEffect(() => {
    renderRef.current = render;
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    renderRef
      .current()
      .then((b) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
        setError('');
        setNote('');
      })
      .catch(() => {
        if (!cancelled) setError('Kartu gagal dibuat. Coba lagi.');
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, renderKey]);

  const share = async () => {
    if (!blob) return;
    try {
      const result = await shareOrDownload(blob, filename, title, message);
      setNote(result === 'downloaded' ? 'Gambar tersimpan di perangkat Anda.' : '');
    } catch (e) {
      // Menutup lembar bagikan bukan kesalahan.
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError('Gagal membagikan. Coba unduh saja.');
    }
  };

  const save = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {options && <div className="mb-4">{options}</div>}

      <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-soft)]">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`Pratinjau ${title}`} className="block h-auto w-full" />
        ) : error ? (
          <p className="p-6 text-center text-sm text-danger">{error}</p>
        ) : (
          <Skeleton className="aspect-[1080/1350] w-full" />
        )}
      </div>

      {error && url && <p className="mt-3 text-center text-sm text-danger">{error}</p>}
      {note && <p className="mt-3 text-center text-sm text-ink-muted">{note}</p>}

      <div className="mt-5 grid gap-3">
        <Button size="lg" onClick={share} disabled={!blob} className="w-full">
          {canShare ? <Share2 size={20} aria-hidden="true" /> : <Download size={20} aria-hidden="true" />}
          {canShare ? 'Bagikan' : 'Unduh gambar'}
        </Button>
        {canShare && (
          <Button variant="tinted" size="lg" disabled={!blob} className="w-full" onClick={save}>
            <Download size={20} aria-hidden="true" /> Simpan ke perangkat
          </Button>
        )}
      </div>
    </Sheet>
  );
}
