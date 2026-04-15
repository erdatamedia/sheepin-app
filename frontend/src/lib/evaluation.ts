import { api } from '@/lib/api';

export type EvaluationDetailResponse = {
  message: string;
  data: {
    sheep: {
      id: string;
      sheepCode: string;
      name?: string;
      breed: string;
      gender: string;
      status: string;
      location?: string | null;
    };
    latestRecords: {
      weight: {
        value: number;
        recordDate: string;
        note?: string | null;
      } | null;
      bcs: {
        value: number;
        category: 'LOW' | 'IDEAL' | 'HIGH';
        recordDate: string;
        note?: string | null;
      } | null;
      health: {
        status: string;
        checkDate: string;
        diseaseName?: string | null;
        note?: string | null;
      } | null;
      reproduction: {
        status: string;
        matingDate?: string | null;
        estimatedBirthDate?: string | null;
        lambingDate?: string | null;
        maleParent?: string | null;
      } | null;
    };
    trend: {
      weight: {
        status: 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
        previous: number | null;
        latest: number | null;
        difference: number | null;
      };
      bcs: {
        status: 'UP' | 'DOWN' | 'STABLE' | 'INSUFFICIENT_DATA';
        previous: number | null;
        latest: number | null;
        difference: number | null;
      };
      health: {
        status: 'GOOD' | 'CAUTION' | 'BAD';
      };
    };
    completeness: {
      identity: boolean;
      weights: boolean;
      bcs: boolean;
      health: boolean;
      reproduction: boolean;
      score: number;
      status: 'COMPLETE' | 'PARTIAL' | 'MINIMAL';
    };
    evaluation: {
      overallCondition: 'GOOD' | 'FAIR' | 'POOR';
      breedingScore: number;
      breedingStatus:
        | 'LAYAK_BIBIT'
        | 'PERLU_PEMANTAUAN'
        | 'BELUM_DIREKOMENDASIKAN';
      reasons: string[];
      warnings: string[];
    };
  };
};

export type EvaluationSummaryResponse = {
  message: string;
  data: {
    totalEvaluated: number;
    eligible: number;
    monitoring: number;
    notRecommended: number;
    completeRecords: number;
    partialRecords: number;
    minimalRecords: number;
  };
};

export async function getSheepEvaluation(sheepId: string) {
  const response = await api.get<EvaluationDetailResponse>(
    `/evaluation/sheep/${sheepId}`,
  );
  return response.data;
}

export async function getEvaluationSummary() {
  const response = await api.get<EvaluationSummaryResponse>(
    '/evaluation/summary',
  );
  return response.data;
}
