import { api } from '@/lib/api';

export type Badge = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
  value: number;
  target: number;
};

export type Achievements = {
  period: { from: string; to: string };
  farmer: { name: string; groupName: string | null; regency: string | null; village: string | null } | null;
  sheep: { total: number; active: number; recordedInPeriod: number };
  records: { weights: number; bcs: number; health: number; total: number };
  activeDays: number;
  streakDays: number;
  lastRecordDate: string | null;
  growth: {
    sheepWeighed: number;
    averageAdgGrams: number | null;
    averageLatestWeightKg: number | null;
  };
  topGrowers: { sheepCode: string; name: string | null; adgGrams: number | null; lastWeightKg: number }[];
  sickNow: number;
  badges: Badge[];
  earnedBadges: number;
};

export async function getAchievements(params: { from?: string; to?: string; farmerId?: string }) {
  const response = await api.get<Achievements>('/reports/achievements', { params });
  return response.data;
}
