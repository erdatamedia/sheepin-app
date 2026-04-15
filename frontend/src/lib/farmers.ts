import { api } from '@/lib/api';

export type FarmerOption = {
  id: string;
  name: string;
  loginCode?: string | null;
  groupName?: string | null;
  village?: string | null;
  district?: string | null;
  regency?: string | null;
};

export type FarmerListResponse = {
  message: string;
  data: FarmerOption[];
};

export type FarmerDetailResponse = {
  message: string;
  data: {
    id: string;
    name: string;
    loginCode?: string | null;
    phone?: string | null;
    address?: string | null;
    groupName?: string | null;
    province?: string | null;
    regency?: string | null;
    district?: string | null;
    village?: string | null;
    addressDetail?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    locationSource?: 'GPS' | 'MAP_PICKER' | 'MANUAL' | null;
    locationUpdatedAt?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

export type UpdateFarmerPayload = {
  name?: string;
  phone?: string;
  address?: string;
  groupName?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  addressDetail?: string;
  isActive?: boolean;
};

export type FarmerSheepResponse = {
  message: string;
  data: {
    farmer: {
      id: string;
      name: string;
      loginCode?: string | null;
    };
    sheep: Array<{
      id: string;
      sheepCode: string;
      name?: string | null;
      breed: string;
      gender: string;
      color?: string | null;
      location?: string | null;
      status: string;
      createdAt: string;
      ownerUser?: {
        id: string;
        name: string;
        loginCode?: string | null;
        groupName?: string | null;
      } | null;
      _count: {
        weights: number;
        bcsRecords: number;
        healthRecords: number;
        reproductions: number;
      };
    }>;
  };
};

export type FarmerSummaryResponse = {
  message: string;
  data: {
    farmer: {
      id: string;
      name: string;
      loginCode?: string | null;
      phone?: string | null;
      groupName?: string | null;
      province?: string | null;
      regency?: string | null;
      district?: string | null;
      village?: string | null;
      addressDetail?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      locationSource?: 'GPS' | 'MAP_PICKER' | 'MANUAL' | null;
      locationUpdatedAt?: string | null;
      isActive: boolean;
    };
    summary: {
      totalSheep: number;
      activeSheep: number;
      eligibleBreeding: number;
      monitoring: number;
      notRecommended: number;
    };
  };
};

export async function getFarmers() {
  const response = await api.get<FarmerListResponse>('/farmers');
  return response.data;
}

export async function getFarmerDetail(id: string) {
  const response = await api.get<FarmerDetailResponse>(`/farmers/${id}`);
  return response.data;
}

export async function updateFarmer(id: string, payload: UpdateFarmerPayload) {
  const response = await api.patch<FarmerDetailResponse>(`/farmers/${id}`, payload);
  return response.data;
}

export async function deleteFarmer(id: string) {
  const response = await api.delete(`/farmers/${id}`);
  return response.data;
}

export async function getFarmerSheep(id: string) {
  const response = await api.get<FarmerSheepResponse>(`/farmers/${id}/sheep`);
  return response.data;
}

export async function getFarmerSummary(id: string) {
  const response = await api.get<FarmerSummaryResponse>(`/farmers/${id}/summary`);
  return response.data;
}
