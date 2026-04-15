import { api } from '@/lib/api';

export type MyLocationResponse = {
  message: string;
  data: {
    id: string;
    name: string;
    loginCode?: string | null;
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
  };
};

export type UpdateMyLocationPayload = {
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  addressDetail?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: 'GPS' | 'MAP_PICKER' | 'MANUAL';
};

export type MapDistributionResponse = {
  message: string;
  data: Array<{
    userId: string;
    name: string;
    loginCode?: string | null;
    groupName?: string | null;
    province?: string | null;
    regency?: string | null;
    district?: string | null;
    village?: string | null;
    addressDetail?: string | null;
    latitude: number;
    longitude: number;
    locationSource?: string | null;
    locationUpdatedAt?: string | null;
    totalSheep: number;
    activeSheep: number;
    eligibleBreeding: number;
    monitoring: number;
    notRecommended: number;
  }>;
};

export async function getMyLocation() {
  const response = await api.get<MyLocationResponse>('/users/me/location');
  return response.data;
}

export async function updateMyLocation(payload: UpdateMyLocationPayload) {
  const response = await api.patch<MyLocationResponse>(
    '/users/me/location',
    payload,
  );
  return response.data;
}

export async function getMapDistribution() {
  const response = await api.get<MapDistributionResponse>('/map/distribution');
  return response.data;
}
