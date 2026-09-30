import { api } from '@/lib/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  loginCode: string | null;
  role: 'ADMIN' | 'OFFICER' | 'FARMER';
  mustChangePin: boolean;
};

export type AuthResponse = {
  message: string;
  access_token: string;
  user: AuthUser;
};

export async function loginWithPhone(payload: { phone: string; pin: string }) {
  const response = await api.post<AuthResponse>('/auth/login-phone', payload);
  return response.data;
}

export async function registerWithPhone(payload: {
  name: string;
  phone: string;
  pin: string;
  address?: string;
  groupName?: string;
}) {
  const response = await api.post<AuthResponse>('/auth/register-farmer', payload);
  return response.data;
}

export async function changePin(payload: { currentPin: string; newPin: string }) {
  const response = await api.post<AuthResponse>('/auth/change-pin', payload);
  return response.data;
}

/** Login kode lama; hanya untuk akun yang belum punya PIN (masa transisi). */
export async function loginWithLegacyCode(loginCode: string) {
  const response = await api.post<AuthResponse>('/auth/login-farmer', { loginCode });
  return response.data;
}
