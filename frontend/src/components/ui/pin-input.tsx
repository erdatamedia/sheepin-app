'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { onlyDigits, PIN_LENGTH } from '@/lib/pin';
import { cn } from '@/lib/utils';

type PinInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: 'current-password' | 'new-password' | 'one-time-code';
  placeholder?: string;
  className?: string;
};

/** Kolom PIN 6 angka: papan angka di HP, dengan tombol lihat/sembunyikan. */
export function PinInput({
  value,
  onChange,
  autoComplete = 'current-password',
  placeholder = '••••••',
  className,
}: PinInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? 'text' : 'password'}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={PIN_LENGTH}
        autoComplete={autoComplete}
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        className={cn('pr-14 text-xl font-semibold tracking-[0.4em]', className)}
        value={value}
        onChange={(event) => onChange(onlyDigits(event.target.value))}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-primary-soft/60"
      >
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}
