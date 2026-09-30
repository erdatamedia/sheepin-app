import axios from 'axios';
import { api } from '@/lib/api';

type UploadImageResponse = {
  message: string;
  data: {
    path: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  };
};

export async function uploadImage(originalFile: File) {
  const file = await compressImage(originalFile);
  const formData = new FormData();
  formData.append('file', file);

  const headers = {
    'Content-Type': 'multipart/form-data',
  };

  try {
    const response = await api.post<UploadImageResponse>('/media/unggah-gambar', formData, {
      headers,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const rootUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;

      try {
        const response = await axios.post<UploadImageResponse>(
          `${rootUrl}/api/media/unggah-gambar`,
          formData,
          { headers },
        );

        return response.data;
      } catch {
        throw new Error(
          'Layanan unggah foto belum tersedia. Restart backend Sheep-In lalu coba lagi.',
        );
      }
    }

    throw error;
  }
}

/**
 * Alamat foto yang aman dipakai di halaman HTTPS.
 *
 * Foto lama tersimpan dengan alamat penuh (mis. "http://sheep-in.com/uploads/x.jpg" atau alamat internal
 * backend) sehingga diblokir sebagai "mixed content" atau tidak terjangkau. Bagian "/uploads/..." selalu
 * diambil dari domain yang sama, lalu diteruskan Next.js ke backend (lihat next.config.ts).
 */
export function mediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const index = url.indexOf('/uploads/');
  return index >= 0 ? url.slice(index) : url;
}

const MAX_EDGE_PX = 1600;
const SKIP_BELOW_BYTES = 400 * 1024;

/**
 * Perkecil foto HP (sering 3-5 MB) sebelum diunggah: sisi terpanjang 1600 px, JPEG kualitas 0,85.
 * Unggahan jadi jauh lebih cepat di sinyal lemah. Bila gagal atau hasilnya tidak lebih kecil,
 * berkas asli dipakai apa adanya.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < SKIP_BELOW_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
