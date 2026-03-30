import { delay } from '../utils/delay';
import {
  HotSearchItem,
  CategoryData,
  TrendData,
  SentimentData,
  WordCloudItem,
  MapData,
  DashboardData,
  DashboardKpi,
  CityDemandRatio
} from '../types';
import { requestWithMock, unwrapResponse } from './apiClient';

const API = '/api';
const F = async <T>(path: string): Promise<T> => (await fetch(`${API}${path}`)).json();

async function buildChengduDashboard(): Promise<DashboardData> {
  const [overview, ranking, district, weather, feature, trend, timePat, findings, season, poiMap] = await Promise.all([
    F<any>('/overview'),
    F<any>('/vitality_ranking'),
    F<any>('/district_flow'),
    F<any>('/weather_impact'),
    F<any>('/feature_importance'),
    F<any>('/monthly_trend'),
    F<any>('/time_pattern'),
    F<any>('/findings'),
    F<any>('/season_impact'),
    F<any>('/poi_map'),
  ]);

  const kpi: DashboardKpi = {
    totalJobs: overview.poi_count,
    newJobs24h: overview.social_posts,
    avgSalaryK: overview.avg_vitality,
    activeCompanies: overview.weather_days
  };

  const hotSearch: HotSearchItem[] = ranking.details.map((item: any, i: number) => ({
    id: i + 1, rank: i + 1,
    keyword: item.poi_name,
    heat: Math.round(item.space_vitality_index * 100),
    company: item.district,
    city: item.type,
    salary: `活力 ${item.space_vitality_index.toFixed(1)}`,
    education: item.vitality_level,
    tag: i < 3 ? 'hot' : i < 6 ? 'boiling' : undefined
  }));

  const categories: CategoryData[] = district.districts.map((d: string, i: number) => ({
    name: d, value: Math.round(district.avg_flow[i])
  }));

  const trendData: TrendData[] = trend.months.map((m: string, i: number) => ({
    time: m,
    heat: Math.round(trend.avg_flow[i]),
    forecast: i >= trend.months.length - 3 ? Math.round(trend.avg_flow[i] * (0.95 + Math.random() * 0.1)) : null
  }));

  const weatherTop = weather.weather_types.slice(0, 6);
  const weatherVals = weather.avg_flow.slice(0, 6);
  const sentiment: SentimentData[] = weatherTop.map((w: string, i: number) => ({
    name: w,
    value: Math.round(weatherVals[i]),
    itemStyle: {
      color: w.includes('晴') ? '#fbbf24' : w.includes('云') ? '#94a3b8' : w.includes('阴') ? '#64748b' : '#3b82f6'
    }
  }));

  const wordCloud: WordCloudItem[] = feature.features.map((f: string, i: number) => ({
    name: f, value: Math.round(feature.importance[i] * 1000)
  }));
  // 补充更多词云词
  const extraWords = ['人民公园','浣花溪','天府广场','大慈寺','青羊宫','桂溪公园','望江楼','黄龙溪','锦江区','武侯区','节假日','周末','春季','舒适度','降水量'];
  extraWords.forEach((w,i) => wordCloud.push({ name: w, value: 80 + Math.round(Math.random() * 120) }));

  const mapData: MapData[] = district.districts.map((d: string, i: number) => ({
    name: d,
    value: Math.round(district.avg_flow[i]),
    topics: [`POI ${district.poi_count[i]}个`, `日均人流 ${Math.round(district.avg_flow[i])}`]
  }));

  const salaryBoxData = {
    categories: ['景区', '广场', '公园'],
    values: [
      [1200, 3000, 4985, 9000, 18000],
      [600, 1400, 2183, 4500, 9000],
      [400, 800, 1405, 2800, 6000],
    ],
    outliers: [[0, 25000], [0, 35000], [1, 12000], [2, 8500]] as Array<[number, number]>
  };

  const recruitmentSunburstData = [{
    name: '成都市', value: 1,
    children: [
      { name: '锦江区', value: 6, children: [
        { name: '景区', value: 3, itemStyle: { color: '#38d9fb' } },
        { name: '广场', value: 3, itemStyle: { color: '#7dd3fc' } },
      ]},
      { name: '青羊区', value: 9, children: [
        { name: '景区', value: 4, itemStyle: { color: '#22d3ee' } },
        { name: '广场', value: 3, itemStyle: { color: '#67e8f9' } },
        { name: '公园', value: 2, itemStyle: { color: '#a5f3fc' } },
      ]},
      { name: '武侯区', value: 7, children: [
        { name: '广场', value: 5, itemStyle: { color: '#06b6d4' } },
        { name: '公园', value: 2, itemStyle: { color: '#67e8f9' } },
      ]},
      { name: '成华区', value: 10, children: [
        { name: '广场', value: 7, itemStyle: { color: '#0891b2' } },
        { name: '公园', value: 3, itemStyle: { color: '#a5f3fc' } },
      ]},
      { name: '金牛区', value: 8, children: [
        { name: '景区', value: 2, itemStyle: { color: '#155e75' } },
        { name: '广场', value: 5, itemStyle: { color: '#0e7490' } },
        { name: '公园', value: 1, itemStyle: { color: '#a5f3fc' } },
      ]},
      { name: '双流区', value: 9, children: [
        { name: '景区', value: 1, itemStyle: { color: '#164e63' } },
        { name: '广场', value: 6, itemStyle: { color: '#155e75' } },
        { name: '公园', value: 2, itemStyle: { color: '#67e8f9' } },
      ]},
    ]
  }];

  const educationDistribution: CategoryData[] = [
    { name: '景区', value: 11 },
    { name: '广场', value: 43 },
    { name: '公园', value: 4 },
  ];

  const experienceDistribution: CategoryData[] = season.seasons.map((s: string, i: number) => ({
    name: s, value: Math.round(season.avg_flow[i])
  }));

  const supplyDemandRatios: CityDemandRatio[] = district.districts.map((d: string, i: number) => ({
    city: d,
    demand: Math.round(district.avg_flow[i]),
    talentSupply: Math.round(district.avg_flow[i] * (1.2 + Math.random() * 0.8)),
    ratio: parseFloat((district.avg_flow[i] / 1000).toFixed(2))
  }));

  return {
    hotSearch, categories, trend: trendData, sentiment, wordCloud, mapData,
    salaryBoxData, recruitmentSunburstData, kpi,
    educationDistribution, experienceDistribution, supplyDemandRatios
  };
}

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardData> => {
    const response = await requestWithMock<DashboardData>({
      endpoint: '/api/chengdu/dashboard',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        return await buildChengduDashboard();
      }
    });
    return unwrapResponse(response);
  },

  getHotSearch: async (): Promise<HotSearchItem[]> => {
    const response = await requestWithMock<HotSearchItem[]>({
      endpoint: '/api/chengdu/ranking',
      method: 'GET',
      retries: 1,
      mockHandler: async () => {
        const data = await buildChengduDashboard();
        return data.hotSearch;
      }
    });
    return unwrapResponse(response);
  }
};
