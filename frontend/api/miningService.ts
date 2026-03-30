import { delay } from '../utils/delay';
import { WordCloudItem, ClusterPoint, PredictionResult } from '../types';
import { MOCK_MINING_KEYWORDS } from '../mock/miningMock';
import { MOCK_CLUSTERS } from '../mock/analysisMock';
import { getRecruitmentMiningKeywords, getRecruitmentClusterPoints } from './recruitmentDataAdapter';
import { requestWithMock, unwrapResponse } from './apiClient';

const buildPrediction = (): PredictionResult => {
  const times = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const actual = [8200, 7600, 12400, 11800, 10900, 11300, 10200, 10800, 12100, null, null, null];
  const predicted = [null, null, null, null, null, null, null, null, 12100, 13200, 14500, 15400];

  return {
    times,
    realData: actual,
    predData: predicted,
    stats: {
      peakTime: '12月',
      peakValue: 15400,
      confidence: 91.6
    }
  };
};

export const miningService = {
  getKeywords: async (): Promise<WordCloudItem[]> => {
    const response = await requestWithMock<WordCloudItem[]>({
      endpoint: '/api/recruitment/mining/skill-keywords',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        await delay(550);
        return getRecruitmentMiningKeywords() || MOCK_MINING_KEYWORDS;
      }
    });
    return unwrapResponse(response);
  },

  getClusters: async (): Promise<ClusterPoint[]> => {
    const response = await requestWithMock<ClusterPoint[]>({
      endpoint: '/api/recruitment/mining/job-clusters',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        await delay(720);
        return getRecruitmentClusterPoints() || MOCK_CLUSTERS;
      }
    });
    return unwrapResponse(response);
  },

  getPrediction: async (topic: string): Promise<PredictionResult> => {
    const response = await requestWithMock<PredictionResult>({
      endpoint: '/api/recruitment/mining/demand-forecast',
      method: 'POST',
      retries: 2,
      mockHandler: async () => {
        await delay(820);
        const base = buildPrediction();
        const jitter = Math.floor(Math.random() * 500);
        return {
          ...base,
          stats: {
            peakTime: base.stats.peakTime,
            peakValue: base.stats.peakValue + jitter,
            confidence: Number((88 + Math.random() * 10).toFixed(1))
          },
          predData: base.predData.map((item) => (item === null ? null : item + Math.floor(Math.random() * 260)))
        };
      }
    });

    const result = unwrapResponse(response);
    if (!topic.trim()) {
      return result;
    }

    return {
      ...result,
      stats: {
        ...result.stats,
        peakTime: result.stats.peakTime
      }
    };
  }
};
