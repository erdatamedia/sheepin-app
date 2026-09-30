import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Segmented } from '@/components/ui/segmented';
import { PhotoUploadField } from '@/components/ui/photo-upload-field';
import { farmerLabel, type FarmerOption } from '@/lib/farmers';

export type SheepFormState = {
  sheepCode: string;
  name: string;
  breed: string;
  gender: string;
  photoUrl: string;
  ownerUserId: string;
};

export const emptySheepForm: SheepFormState = {
  sheepCode: '',
  name: '',
  breed: '',
  gender: 'MALE',
  photoUrl: '',
  ownerUserId: '',
};

type AddSheepFormProps = {
  form: SheepFormState;
  onChange: (form: SheepFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  description: string;
  /** Isi untuk menampilkan pilihan pemilik (admin/petugas). */
  farmers?: FarmerOption[];
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function AddSheepForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  error,
  description,
  farmers,
}: AddSheepFormProps) {
  return (
    <Sheet open onClose={onCancel} title="Tambah ternak baru">
      <div className="space-y-5">
        <p className="-mt-1 text-[15px] text-ink-muted">{description}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Kode ternak">
            <Input
              placeholder="Contoh: DMB-001"
              autoComplete="off"
              value={form.sheepCode}
              onChange={(e) => onChange({ ...form, sheepCode: e.target.value })}
            />
          </Field>
          <Field label="Nama ternak (opsional)">
            <Input
              placeholder="Contoh: Si Putih"
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Jenis / rumpun">
            <Input
              placeholder="Contoh: Garut, Texel"
              value={form.breed}
              onChange={(e) => onChange({ ...form, breed: e.target.value })}
            />
          </Field>
          {farmers && (
            <Field label="Pemilik">
              <Select
                value={form.ownerUserId}
                onChange={(e) => onChange({ ...form, ownerUserId: e.target.value })}
              >
                <option value="">Pilih pemilik peternak</option>
                {farmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmerLabel(farmer)}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Jenis kelamin</p>
          <Segmented
            label="Jenis kelamin"
            className="md:max-w-sm"
            value={form.gender}
            onChange={(value) => onChange({ ...form, gender: value })}
            options={[
              { value: 'MALE', label: 'Jantan' },
              { value: 'FEMALE', label: 'Betina' },
            ]}
          />
        </div>

        <PhotoUploadField
          label="Foto ternak"
          value={form.photoUrl}
          onChange={(value) => onChange({ ...form, photoUrl: value })}
          helperText="Foto membantu mengenali ternak dengan cepat di kandang."
          emptyLabel="FOTO"
        />

        {error && (
          <div
            role="alert"
            className="rounded-[var(--radius-control)] border border-[color:var(--danger-border)] bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="tinted" size="lg" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
          <Button size="lg" className="sm:min-w-56" onClick={onSubmit} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan ternak'}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
