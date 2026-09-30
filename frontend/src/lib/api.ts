import axios from 'axios';

export const api = axios.create({
  // Tanpa env (mis. di belakang reverse proxy satu domain) API dipanggil lewat /api.
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Akun dengan PIN sementara hanya boleh membuka halaman ganti PIN.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      typeof window !== 'undefined' &&
      axios.isAxiosError<{ code?: string }>(error) &&
      error.response?.status === 403 &&
      error.response.data?.code === 'PIN_CHANGE_REQUIRED' &&
      window.location.pathname !== '/change-pin'
    ) {
      window.location.assign('/change-pin?wajib=1');
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
