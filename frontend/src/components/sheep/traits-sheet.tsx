'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { getApiErrorMessage } from '@/lib/api';
import { TRAIT_SUGGESTIONS, updateSheepTraits, type SheepTraits } from '@/lib/sheep-photo';

type TraitKey = keyof SheepTraits;

const FIELDS: Array<{ key: TraitKey; label: string; placeholder: string }> = [
  { key: 'faceNose', label: 'Wajah dan hidung', placeholder: 'Contoh: hidung cembung, dahi lebar' },
  {
    key: 'earsHorns',
    label: 'Telinga dan tanduk',
    placeholder: 'Contoh: telinga kecil, tanpa tanduk',
  },
  {
    key: 'tailBody',
    label: 'Ekor dan postur badan',
    placeholder: 'Contoh: ekor gemuk, badan besar',
  },
  { key: 'physicalMark', label: 'Tanda khusus', placeholder: 'Contoh: tahi lalat di pipi kiri' },
];

type TraitsSheetProps = {
  sheepId: string;
  initial: SheepTraits;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  notify: (tone: 'success' | 'error', text: string) => void;
};

/** Ciri pembeda (opsional) untuk membedakan ternak yang sama-sama putih. Tap saran untuk mengisi cepat. */
export function TraitsSheet({ sheepId, initial, onClose, onSaved, notify }: TraitsSheetProps) {
  const [values, setValues] = useState<Record<TraitKey, string>>({
    faceNose: initial.faceNose ?? '',
    earsHorns: initial.earsHorns ?? '',
    tailBody: initial.tailBody ?? '',
    physicalMark: initial.physicalMark ?? '',
  });
  const [saving, setSaving] = useState(false);

  const addSuggestion = (key: TraitKey, text: string) => {
    setValues((previous) => {
      const current = previous[key].trim();
      if (current.toLowerCase().includes(text.toLowerCase())) return previous;
      return { ...previous, [key]: current ? `${current}, ${text.toLowerCase()}` : text };
    });
  };

  const save = async () => {
    try {
      setSaving(true);
      await updateSheepTraits(sheepId, values);
      notify('success', 'Ciri ternak tersimpan');
      await onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal menyimpan ciri'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Ciri pembeda">
      <div className="space-y-5">
        <p className="-mt-1 text-[15px] text-ink-muted">
          Opsional. Isi yang membantu Anda mengenali ternak ini di antara ternak lain yang mirip.
        </p>

        {FIELDS.map((field) => (
          <div key={field.key}>
            <Field label={field.label}>
              <Input
                placeholder={field.placeholder}
                value={values[field.key]}
                maxLength={field.key === 'physicalMark' ? 200 : 120}
                onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TRAIT_SUGGESTIONS[field.key].map((text) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => addSuggestion(field.key, text)}
                  className="min-h-9 rounded-full bg-primary-soft/70 px-3 text-[13px] font-medium text-primary-strong active:brightness-95"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
          <Button variant="tinted" size="lg" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button size="lg" className="sm:min-w-56" onClick={save} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan ciri'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
