import { api } from '@/lib/api';

/** Ganti foto ternak; string kosong menghapusnya. Peternak hanya untuk ternaknya sendiri. */
export async function updateSheepPhoto(sheepId: string, photoUrl: string) {
  const response = await api.patch<{
    message: string;
    data: { id: string; photoUrl: string | null };
  }>(`/sheep/${sheepId}/photo`, { photoUrl });
  return response.data;
}
