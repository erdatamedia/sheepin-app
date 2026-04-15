import { api } from '@/lib/api';

export type RecordingSheepOptionResponse = {
  message: string;
  data: Array<{
    id: string;
    sheepCode: string;
    name?: string | null;
    breed: string;
    gender: string;
    location?: string | null;
    ownerUser?: {
      id: string;
      name: string;
      loginCode?: string | null;
      groupName?: string | null;
    } | null;
  }>;
};

export type QuickRecordingPayload = {
  sheepId: string;
  recordDate: string;
  weightKg?: number;
  bcsScore?: number;
  healthStatus?: 'HEALTHY' | 'SICK' | 'RECOVERING';
  diseaseName?: string;
  treatment?: string;
  medicine?: string;
  note?: string;
};

export type RecordingHistoryResponse = {
  message: string;
  data: Array<{
    id: string;
    type: 'WEIGHT' | 'BCS' | 'HEALTH' | 'REPRODUCTION' | 'STATUS';
    recordDate: string;
    title: string;
    description: string;
    sheep: {
      id: string;
      sheepCode: string;
      name?: string | null;
      ownerUser?: {
        id: string;
        name: string;
        loginCode?: string | null;
      } | null;
    };
    createdBy: {
      id: string;
      name: string;
      role: string;
    };
  }>;
};

export async function getRecordingSheepOptions() {
  const response = await api.get<RecordingSheepOptionResponse>(
    '/recording/quick/sheep-options',
  );
  return response.data;
}

export async function submitQuickRecording(payload: QuickRecordingPayload) {
  const response = await api.post('/recording/quick', payload);
  return response.data;
}

export async function submitSheepStatusEvent(
  sheepId: string,
  payload: {
    status: 'DEAD' | 'SOLD' | 'CULLED';
    eventDate: string;
    note?: string;
  },
) {
  const response = await api.post(`/sheep/${sheepId}/status-event`, payload);
  return response.data;
}

export async function getRecordingHistory() {
  const response = await api.get<RecordingHistoryResponse>('/recording/history');
  return response.data;
}
