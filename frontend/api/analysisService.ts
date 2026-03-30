import { delay } from '../utils/delay';
import {
  GraphData,
  MapData,
  ComparisonData,
  EvolutionNode,
  SentimentDashboardData
} from '../types';
import { MOCK_GRAPH_DATA, MOCK_MAP_DATA, MOCK_COMPARISON_DATA } from '../constants';
import { MOCK_EVOLUTION_DATA, MOCK_SENTIMENT_DASHBOARD } from '../mock/analysisMock';
import {
  getRecruitmentRelationGraph,
  getRecruitmentGeoMapData,
  getRecruitmentComparisonData,
  getRecruitmentSentimentDashboard,
  getRecruitmentEvolutionData
} from './recruitmentDataAdapter';
import { requestWithMock, unwrapResponse } from './apiClient';

export const analysisService = {
  getRelationGraph: async (): Promise<GraphData> => {
    const response = await requestWithMock<GraphData>({
      endpoint: '/api/recruitment/insight/skill-graph',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        await delay(420);
        return getRecruitmentRelationGraph() || MOCK_GRAPH_DATA;
      }
    });
    return unwrapResponse(response);
  },

  getGeoMapData: async (): Promise<MapData[]> => {
    const response = await requestWithMock<MapData[]>({
      endpoint: '/api/recruitment/insight/city-demand-map',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        await delay(480);
        return getRecruitmentGeoMapData() || MOCK_MAP_DATA;
      }
    });
    return unwrapResponse(response);
  },

  getComparisonData: async (topicA: string, topicB: string): Promise<ComparisonData> => {
    const response = await requestWithMock<ComparisonData>({
      endpoint: '/api/recruitment/insight/job-compare',
      method: 'POST',
      retries: 2,
      mockHandler: async () => {
        await delay(650);
        const adapted = getRecruitmentComparisonData(topicA, topicB);
        if (adapted) {
          return adapted;
        }
        return {
          ...MOCK_COMPARISON_DATA,
          topicA,
          topicB,
          radarDataA: Array.from({ length: 5 }, () => Math.floor(Math.random() * 26 + 70)),
          radarDataB: Array.from({ length: 5 }, () => Math.floor(Math.random() * 26 + 68))
        };
      }
    });
    return unwrapResponse(response);
  },

  getSentimentDashboard: async (): Promise<SentimentDashboardData> => {
    const response = await requestWithMock<SentimentDashboardData>({
      endpoint: '/api/recruitment/insight/salary-dashboard',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        await delay(500);
        return getRecruitmentSentimentDashboard() || MOCK_SENTIMENT_DASHBOARD;
      }
    });
    return unwrapResponse(response);
  },

  getEvolutionData: async (): Promise<EvolutionNode[]> => {
    const response = await requestWithMock<EvolutionNode[]>({
      endpoint: '/api/recruitment/insight/demand-evolution',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        await delay(550);
        return getRecruitmentEvolutionData() || MOCK_EVOLUTION_DATA;
      }
    });
    return unwrapResponse(response);
  }
};
