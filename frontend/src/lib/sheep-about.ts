import { api } from '@/lib/api';

export type SheepAbout = {
  sheepCode?: string;
  gender?: string;
  name?: string | null;
  breed: string;
  birthDate?: string | null;
  color?: string | null;
  location?: string | null;
  sireId?: string | null;
  damId?: string | null;
};

/** Keterangan ternak (opsional). String kosong menghapus isian; yang tidak dikirim tidak berubah. */
export async function updateSheepAbout(
  sheepId: string,
  values: {
    sheepCode?: string;
    gender?: string;
    name?: string;
    breed?: string;
    birthDate?: string;
    color?: string;
    location?: string;
    sireId?: string;
    damId?: string;
  },
) {
  const response = await api.patch(`/sheep/${sheepId}/about`, values);
  return response.data;
}
