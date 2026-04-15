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

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = {
    'Content-Type': 'multipart/form-data',
  };

  try {
    const response = await api.post<UploadImageResponse>(
      '/media/unggah-gambar',
      formData,
      { headers },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const rootUrl = baseUrl.endsWith('/api')
        ? baseUrl.slice(0, -4)
        : baseUrl;

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
