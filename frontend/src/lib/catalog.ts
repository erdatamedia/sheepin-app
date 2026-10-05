import { api } from '@/lib/api';

/** Pihak yang menjadi dasar tanda "terverifikasi" di katalog. Ditampilkan apa adanya di publik. */
export const VERIFIER_LABEL = 'Peneliti dan Dinas Pertanian dan Pangan Kabupaten Banyuwangi';

export type CatalogFarmer = {
  name: string;
  groupName?: string | null;
  village?: string | null;
  district?: string | null;
  regency?: string | null;
};

export type CatalogListItem = {
  id: string;
  sheepCode: string;
  name?: string | null;
  breed: string;
  gender: string;
  ageMonths?: number | null;
  photoUrl?: string | null;
  latestWeightKg?: number | null;
  score?: number | null;
  verifiedAt: string;
  farmer?: CatalogFarmer | null;
};

export type CatalogDetail = Omit<CatalogListItem, 'verifiedAt'> & {
  verifiedAt: string;
  photos: Array<{ angle: string; url: string }>;
  latestWeightDate?: string | null;
  bcs?: number | null;
  reasons: string[];
};

export type PendingItem = {
  id: string;
  sheepCode: string;
  name?: string | null;
  breed: string;
  gender: string;
  photoUrl?: string | null;
  latestWeightKg?: number | null;
  score?: number | null;
  farmerName?: string | null;
};

export async function getCatalogList(params: { search?: string; breed?: string; gender?: string }) {
  const response = await api.get<{ data: CatalogListItem[] }>('/catalog', {
    params: {
      search: params.search || undefined,
      breed: params.breed || undefined,
      gender: params.gender || undefined,
    },
  });
  return response.data.data;
}

export async function getCatalogDetail(id: string) {
  const response = await api.get<{ data: CatalogDetail }>(`/catalog/${id}`);
  return response.data.data;
}

export async function getPendingVerification() {
  const response = await api.get<{ data: PendingItem[] }>('/catalog/pending');
  return response.data.data;
}

export async function setSheepVerified(id: string, verified: boolean, note?: string) {
  const response = await api.patch<{ message: string }>(`/catalog/verify/${id}`, { verified, note });
  return response.data;
}

export function ageText(months?: number | null) {
  if (months === null || months === undefined) return null;
  return months >= 12 ? `${Math.floor(months / 12)} th ${months % 12} bln` : `${months} bln`;
}

export function farmerRegion(farmer?: CatalogFarmer | null) {
  if (!farmer) return '';
  return [farmer.village, farmer.district, farmer.regency].filter(Boolean).join(', ');
}
