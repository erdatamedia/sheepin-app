'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonClassName } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { api, getApiErrorMessage } from '@/lib/api';

/** Harus sama dengan FARMER_DELETE_GRACE_DAYS di backend (server tetap menjadi penentu). */
export const FARMER_DELETE_GRACE_DAYS = 7;

type Props = {
  sheepId: string;
  code: string;
  createdAt: string;
  recordCount: number;
  /** Petugas/admin boleh menghapus kapan saja. */
  isStaff: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

/** Konfirmasi hapus ternak, dengan penjelasan akibatnya. Peternak hanya boleh menghapus ternak salah input. */
export function DeleteSheepSheet({ sheepId, code, createdAt, recordCount, isStaff, onClose, onDeleted }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [now] = useState(() => Date.now());
  const ageDays = (now - new Date(createdAt).getTime()) / 86_400_000;
  const blocked = !isStaff && recordCount > 0 && ageDays > FARMER_DELETE_GRACE_DAYS;

  const remove = async () => {
    try {
      setBusy(true);
      setError('');
      await api.delete(`/sheep/${sheepId}`);
      onDeleted();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Gagal menghapus ternak'));
      setBusy(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title={`Hapus ${code}?`}>
      <div className="space-y-4">
        {blocked ? (
          <>
            <p className="text-[15px] leading-relaxed text-ink">
              {code} sudah punya {recordCount} catatan dan dibuat lebih dari {FARMER_DELETE_GRACE_DAYS} hari
              lalu, jadi tidak bisa dihapus dari sini agar riwayatnya tidak hilang.
            </p>
            <p className="text-[15px] leading-relaxed text-ink-muted">
              Kalau ternak ini sudah dijual, mati, atau diafkir, tandai saja statusnya. Kalau memang salah
              input, minta petugas untuk menghapusnya.
            </p>
            <div className="grid gap-2">
              <Link
                href={`/recording?sheepId=${sheepId}`}
                className={buttonClassName({ size: 'lg', className: 'w-full' })}
                onClick={onClose}
              >
                Tandai terjual, mati, atau afkir
              </Link>
              <Button variant="tinted" size="lg" onClick={onClose}>
                Batal
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-ink">
              {recordCount > 0
                ? `Ternak ${code} dan ${recordCount} catatannya akan dihapus permanen.`
                : `Ternak ${code} akan dihapus permanen.`}{' '}
              Tindakan ini tidak bisa dibatalkan.
            </p>
            <p className="text-[14px] leading-relaxed text-ink-muted">
              Gunakan hanya bila ternak ini salah input. Bila ternak sudah dijual atau mati, tandai statusnya
              saja agar riwayatnya tetap tersimpan.
            </p>
            {error && (
              <p role="alert" className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="tinted" size="lg" onClick={onClose} disabled={busy}>
                Batal
              </Button>
              <Button variant="dangerOutline" size="lg" className="sm:min-w-56" onClick={remove} disabled={busy}>
                {busy ? 'Menghapus...' : 'Ya, hapus ternak'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
