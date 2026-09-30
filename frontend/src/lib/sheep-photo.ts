import { api } from '@/lib/api';

export type PhotoAngle = 'FACE' | 'SIDE' | 'REAR' | 'EARS_HORNS' | 'TAIL';

export type SheepPhotoSlide = { angle: PhotoAngle; url: string };

/** Urutan dan arti sudut foto. Wajah dan hidung selalu pratinjau utama. */
export const ANGLES: Array<{ angle: PhotoAngle; label: string; hint: string }> = [
  {
    angle: 'FACE',
    label: 'Wajah & hidung',
    hint: 'Dari depan: dahi, mata, dan hidung terlihat jelas',
  },
  { angle: 'SIDE', label: 'Samping', hint: 'Seluruh badan dari samping' },
  { angle: 'REAR', label: 'Belakang', hint: 'Pantat dan pangkal ekor' },
  { angle: 'EARS_HORNS', label: 'Telinga & tanduk', hint: 'Dari dekat: bentuk telinga dan tanduk' },
  { angle: 'TAIL', label: 'Ekor', hint: 'Bentuk dan panjang ekor' },
];

export function angleLabel(angle: PhotoAngle) {
  return ANGLES.find((item) => item.angle === angle)?.label ?? '';
}

type PhotosResponse = { message: string; data: { photos: SheepPhotoSlide[] } };

export async function getSheepPhotos(sheepId: string) {
  const response = await api.get<PhotosResponse>(`/sheep/${sheepId}/photos`);
  return response.data.data.photos;
}

/** Pasang atau ganti foto satu sudut; mengembalikan daftar foto terbaru. */
export async function setSheepPhoto(sheepId: string, angle: PhotoAngle, photoUrl: string) {
  const response = await api.put<PhotosResponse>(`/sheep/${sheepId}/photos/${angle}`, { photoUrl });
  return response.data.data.photos;
}

export async function removeSheepPhoto(sheepId: string, angle: PhotoAngle) {
  const response = await api.delete<PhotosResponse>(`/sheep/${sheepId}/photos/${angle}`);
  return response.data.data.photos;
}

/** Foto utama (wajah dan hidung); dipertahankan untuk kompatibilitas. */
export async function updateSheepPhoto(sheepId: string, photoUrl: string) {
  const response = await api.patch<{
    message: string;
    data: { id: string; photoUrl: string | null };
  }>(`/sheep/${sheepId}/photo`, { photoUrl });
  return response.data;
}

export type SheepTraits = {
  faceNose?: string | null;
  earsHorns?: string | null;
  tailBody?: string | null;
  physicalMark?: string | null;
};

/** Ciri pembeda (opsional). String kosong menghapus isian; yang tidak dikirim tidak berubah. */
export async function updateSheepTraits(
  sheepId: string,
  traits: { faceNose?: string; earsHorns?: string; tailBody?: string; physicalMark?: string },
) {
  const response = await api.patch<{ message: string; data: SheepTraits & { id: string } }>(
    `/sheep/${sheepId}/traits`,
    traits,
  );
  return response.data.data;
}

/** Ciri yang terisi, sebagai daftar teks singkat (untuk tampilan dan pencarian). */
export function traitList(traits: SheepTraits): string[] {
  return [traits.faceNose, traits.earsHorns, traits.tailBody, traits.physicalMark].filter(
    (value): value is string => !!value && value.trim() !== '',
  );
}

/** Saran isian cepat; peternak tetap boleh menulis bebas. */
export const TRAIT_SUGGESTIONS: Record<keyof SheepTraits, string[]> = {
  faceNose: ['Hidung lurus', 'Hidung cembung', 'Wajah pendek', 'Wajah panjang', 'Dahi lebar'],
  earsHorns: [
    'Telinga kecil',
    'Telinga besar',
    'Telinga menggantung',
    'Telinga tegak',
    'Tanpa tanduk',
    'Tanduk melengkung',
  ],
  tailBody: [
    'Ekor gemuk',
    'Ekor tipis',
    'Ekor panjang',
    'Ekor pendek',
    'Badan besar',
    'Badan ramping',
  ],
  physicalMark: ['Bercak di telinga', 'Tahi lalat di wajah', 'Bekas luka', 'Bulu beda di dahi'],
};
