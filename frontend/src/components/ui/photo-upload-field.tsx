'use client';
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/lib/media';
import { getApiErrorMessage } from '@/lib/api';

type PhotoUploadFieldProps = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  helperText?: string;
  emptyLabel: string;
};

export function PhotoUploadField({
  label,
  value,
  onChange,
  helperText,
  emptyLabel,
}: PhotoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePickFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage('');
      const response = await uploadImage(file);
      onChange(response.data.url);
      setMessage('Foto berhasil diunggah.');
    } catch (error) {
      console.error(error);
      setMessage(getApiErrorMessage(error, 'Gagal mengunggah foto.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {helperText && (
          <p className="mt-1 text-sm text-ink-muted">{helperText}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-20 w-20 rounded-[22px] border border-line object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-primary-soft px-3 text-center text-xs font-semibold text-primary">
            {emptyLabel}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePickFile}
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePickFile}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => cameraRef.current?.click()}
          >
            <Camera size={18} aria-hidden="true" />
            {uploading ? 'Mengunggah...' : 'Ambil Foto'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon size={18} aria-hidden="true" />
            Pilih dari Galeri
          </Button>
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange('')}>
              Hapus Foto
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div role="status" className="rounded-[var(--radius-control)] border border-line bg-surface/80 px-4 py-3 text-sm text-ink">
          {message}
        </div>
      )}
    </div>
  );
}
