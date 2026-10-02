'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { getApiErrorMessage } from '@/lib/api';
import { updateSheepAbout, type SheepAbout } from '@/lib/sheep-about';

type AboutSheetProps = {
  sheepId: string;
  initial: SheepAbout;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  notify: (tone: 'success' | 'error', text: string) => void;
};

/** Keterangan ternak yang bisa diisi peternak sendiri. Semua opsional kecuali jenis / rumpun yang tidak boleh kosong. */
export function AboutSheet({ sheepId, initial, onClose, onSaved, notify }: AboutSheetProps) {
  const [values, setValues] = useState({
    sheepCode: initial.sheepCode ?? '',
    gender: initial.gender ?? 'MALE',
    name: initial.name ?? '',
    breed: initial.breed ?? '',
    birthDate: (initial.birthDate ?? '').slice(0, 10),
    color: initial.color ?? '',
    location: initial.location ?? '',
    sireId: initial.sireId ?? '',
    damId: initial.damId ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof values, value: string) => setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    if (!values.sheepCode.trim()) {
      notify('error', 'Kode ternak tidak boleh kosong');
      return;
    }
    if (!values.breed.trim()) {
      notify('error', 'Jenis / rumpun tidak boleh kosong');
      return;
    }
    try {
      setSaving(true);
      await updateSheepAbout(sheepId, values);
      notify('success', 'Keterangan ternak tersimpan');
      await onSaved();
      onClose();
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal menyimpan keterangan'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Ubah data ternak">
      <div className="space-y-4">
        <p className="-mt-1 text-[15px] text-ink-muted">
          Salah input? Perbaiki di sini. Selain kode, jenis, dan jenis kelamin, semua isian boleh dikosongkan.
        </p>
        <Field label="Kode ternak">
          <Input value={values.sheepCode} maxLength={50} autoComplete="off" onChange={(e) => set('sheepCode', e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Jenis kelamin</p>
          <Segmented
            label="Jenis kelamin"
            className="md:max-w-sm"
            value={values.gender}
            onChange={(value) => set('gender', value)}
            options={[
              { value: 'MALE', label: 'Jantan' },
              { value: 'FEMALE', label: 'Betina' },
            ]}
          />
        </div>
        <Field label="Nama (opsional)">
          <Input value={values.name} maxLength={100} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Jenis / rumpun">
          <Input value={values.breed} maxLength={100} onChange={(e) => set('breed', e.target.value)} />
        </Field>
        <Field label="Tanggal lahir (opsional)">
          <Input type="date" value={values.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
        </Field>
        <Field label="Warna (opsional)">
          <Input
            placeholder="Contoh: putih, cokelat bercak"
            value={values.color}
            maxLength={50}
            onChange={(e) => set('color', e.target.value)}
          />
        </Field>
        <Field label="Lokasi / kandang (opsional)">
          <Input
            placeholder="Contoh: Kandang B"
            value={values.location}
            maxLength={150}
            onChange={(e) => set('location', e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pejantan / ayah (opsional)" hint="Kode atau nama ternak">
            <Input value={values.sireId} maxLength={100} onChange={(e) => set('sireId', e.target.value)} />
          </Field>
          <Field label="Induk / ibu (opsional)" hint="Kode atau nama ternak">
            <Input value={values.damId} maxLength={100} onChange={(e) => set('damId', e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
          <Button variant="tinted" size="lg" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button size="lg" className="sm:min-w-56" onClick={save} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
