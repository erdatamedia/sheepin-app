'use client';

import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Maximize2, Plus, Trash2 } from 'lucide-react';
import { SheepPhoto } from '@/components/sheep/sheep-photo';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { getApiErrorMessage } from '@/lib/api';
import { uploadImage } from '@/lib/media';
import {
  ANGLES,
  removeSheepPhoto,
  setSheepPhoto,
  type PhotoAngle,
  type SheepPhotoSlide,
} from '@/lib/sheep-photo';
import { cn } from '@/lib/utils';

type AnglePhotosProps = {
  sheepId: string;
  photos: SheepPhotoSlide[];
  /** Dipanggil setelah foto berubah, agar halaman memuat ulang datanya. */
  onChanged: () => Promise<void> | void;
  /** Perbesar foto pada urutan tertentu di pelihat. */
  onView: (slideIndex: number) => void;
  notify: (tone: 'success' | 'error', text: string) => void;
};

/**
 * Foto ternak per sudut. Wajah dan hidung adalah pratinjau utama; sudut lain opsional
 * dan bisa digeser di pelihat. Kotak kosong langsung membuka kamera agar cepat di kandang.
 */
export function AnglePhotos({ sheepId, photos, onChanged, onView, notify }: AnglePhotosProps) {
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const pendingAngle = useRef<PhotoAngle | null>(null);
  const [busy, setBusy] = useState<PhotoAngle | null>(null);
  const [managing, setManaging] = useState<PhotoAngle | null>(null);

  const photoOf = (angle: PhotoAngle) => photos.find((photo) => photo.angle === angle);

  const pick = (angle: PhotoAngle, source: 'camera' | 'gallery') => {
    pendingAngle.current = angle;
    (source === 'camera' ? cameraRef : galleryRef).current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const angle = pendingAngle.current;
    event.target.value = '';
    if (!file || !angle) return;

    try {
      setBusy(angle);
      setManaging(null);
      const uploaded = await uploadImage(file);
      await setSheepPhoto(sheepId, angle, uploaded.data.path || uploaded.data.url);
      notify('success', 'Foto tersimpan');
      await onChanged();
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal menyimpan foto'));
    } finally {
      setBusy(null);
      pendingAngle.current = null;
    }
  };

  const handleRemove = async (angle: PhotoAngle) => {
    try {
      setBusy(angle);
      setManaging(null);
      await removeSheepPhoto(sheepId, angle);
      notify('success', 'Foto dihapus');
      await onChanged();
    } catch (error) {
      console.error(error);
      notify('error', getApiErrorMessage(error, 'Gagal menghapus foto'));
    } finally {
      setBusy(null);
    }
  };

  const managedInfo = ANGLES.find((item) => item.angle === managing);
  const managedPhoto = managing ? photoOf(managing) : undefined;

  return (
    <>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <ul className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {ANGLES.map((item) => {
          const photo = photoOf(item.angle);
          const loading = busy === item.angle;

          return (
            <li key={item.angle} className="w-28 shrink-0">
              <button
                type="button"
                disabled={loading}
                onClick={() => (photo ? setManaging(item.angle) : pick(item.angle, 'camera'))}
                aria-label={
                  photo ? `Kelola foto ${item.label}` : `Tambah foto ${item.label} dengan kamera`
                }
                className={cn(
                  'relative block aspect-square w-full overflow-hidden rounded-[var(--radius-control)] text-left active:scale-[0.97]',
                  photo ? 'glass' : 'border border-dashed border-primary-icon/60 bg-white/40',
                )}
              >
                {photo ? (
                  <SheepPhoto photoUrl={photo.url} alt="" sizes="112px" />
                ) : (
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-primary-strong">
                    {loading ? (
                      <span className="text-[13px] font-medium">Mengunggah...</span>
                    ) : (
                      <>
                        <Camera size={22} aria-hidden="true" />
                        <Plus size={14} aria-hidden="true" className="opacity-70" />
                      </>
                    )}
                  </span>
                )}
                {photo && loading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-[13px] font-medium text-white">
                    Mengunggah...
                  </span>
                )}
                <span
                  className={cn(
                    'absolute inset-x-0 bottom-0 px-2 pb-1.5 pt-6 text-[12px] font-semibold leading-tight',
                    photo
                      ? 'bg-gradient-to-t from-black/70 via-black/35 to-transparent text-white'
                      : 'text-ink',
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Sheet
        open={managing !== null}
        onClose={() => setManaging(null)}
        title={managedInfo?.label ?? 'Foto'}
      >
        {managing && managedInfo && (
          <div className="space-y-4">
            <p className="-mt-1 text-[15px] text-ink-muted">{managedInfo.hint}</p>

            {managedPhoto && (
              <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-[var(--radius-card)]">
                <SheepPhoto
                  photoUrl={managedPhoto.url}
                  alt={managedInfo.label}
                  sizes="320px"
                  quality={75}
                />
              </div>
            )}

            <div className="grid gap-2">
              {managedPhoto && (
                <Button
                  variant="tinted"
                  size="lg"
                  onClick={() => {
                    const position = photos.findIndex((photo) => photo.angle === managing);
                    setManaging(null);
                    onView(Math.max(0, position));
                  }}
                >
                  <Maximize2 size={20} aria-hidden="true" />
                  Perbesar
                </Button>
              )}
              <Button size="lg" onClick={() => pick(managing, 'camera')}>
                <Camera size={20} aria-hidden="true" />
                {managedPhoto ? 'Ambil foto baru' : 'Ambil foto'}
              </Button>
              <Button variant="tinted" size="lg" onClick={() => pick(managing, 'gallery')}>
                <ImageIcon size={20} aria-hidden="true" />
                Pilih dari galeri
              </Button>
              {managedPhoto && (
                <Button
                  variant="dangerOutline"
                  size="lg"
                  onClick={() => void handleRemove(managing)}
                >
                  <Trash2 size={20} aria-hidden="true" />
                  Hapus foto
                </Button>
              )}
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
