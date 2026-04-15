import { api } from '@/lib/api';

export type MeResponse = {
  id: string;
  name: string;
  email?: string | null;
  loginCode?: string | null;
  phone?: string | null;
  address?: string | null;
  groupName?: string | null;
  photoUrl?: string | null;
  province?: string | null;
  regency?: string | null;
  district?: string | null;
  village?: string | null;
  addressDetail?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationSource?: string | null;
  locationUpdatedAt?: string | null;
  role: 'ADMIN' | 'OFFICER' | 'FARMER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MySheepResponse = {
  message: string;
  data: Array<{
    id: string;
    sheepCode: string;
    name?: string | null;
    breed: string;
    gender: string;
    status: 'ACTIVE' | 'SOLD' | 'DEAD' | 'CULLED';
    photoUrl?: string | null;
    location?: string | null;
    latestWeight?: {
      recordDate: string;
      weightKg: number;
    } | null;
    latestBcs?: {
      recordDate: string;
      bcsScore: number;
    } | null;
    latestHealth?: {
      checkDate: string;
      healthStatus: 'HEALTHY' | 'SICK' | 'RECOVERING';
      diseaseName?: string | null;
    } | null;
    latestReproduction?: {
      status: 'OPEN' | 'MATED' | 'PREGNANT' | 'LAMBED';
      matingDate?: string | null;
      lambingDate?: string | null;
    } | null;
  }>;
};

export async function getMe() {
  const response = await api.get<MeResponse>('/auth/me');
  return response.data;
}

export async function getMySheep() {
  const response = await api.get<MySheepResponse>('/users/me/sheep');
  return response.data;
}

export async function updateMyProfile(payload: {
  name?: string;
  phone?: string;
  address?: string;
  groupName?: string;
  photoUrl?: string;
}) {
  const response = await api.patch('/users/me/profile', payload);
  return response.data;
}
