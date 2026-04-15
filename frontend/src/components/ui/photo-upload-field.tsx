'use client';
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react';
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
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {helperText && (
          <p className="mt-1 text-sm text-[color:var(--ink-muted)]">{helperText}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-20 w-20 rounded-[22px] border border-[color:rgba(86,74,50,0.12)] object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-[rgba(33,73,61,0.1)] px-3 text-center text-xs font-semibold text-[color:var(--accent)]">
            {emptyLabel}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
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
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Mengunggah...' : 'Pilih Foto'}
          </Button>
          {value && (
            <Button type="button" variant="outline" onClick={() => onChange('')}>
              Hapus Foto
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-[color:rgba(86,74,50,0.12)] bg-white/80 px-4 py-3 text-sm text-gray-800">
          {message}
        </div>
      )}
    </div>
  );
}
