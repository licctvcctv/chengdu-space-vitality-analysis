import { GeoPoint, GraphData, ComparisonData } from './types';
export {
  MOCK_HOT_SEARCH,
  MOCK_CATEGORY_DATA,
  MOCK_TREND_DATA,
  MOCK_SENTIMENT_DATA,
  MOCK_WORD_CLOUD,
  MOCK_MAP_DATA
} from './mock/visMock';

export const MOCK_GEO_POINTS: GeoPoint[] = [
  { id: 1, name: '北京', x: 72, y: 28, value: 95 },
  { id: 2, name: '上海', x: 80, y: 55, value: 92 },
  { id: 3, name: '广州', x: 70, y: 75, value: 82 },
  { id: 4, name: '深圳', x: 72, y: 76, value: 90 },
  { id: 5, name: '成都', x: 45, y: 58, value: 78 },
  { id: 6, name: '武汉', x: 65, y: 56, value: 72 },
  { id: 7, name: '西安', x: 52, y: 45, value: 63 },
  { id: 8, name: '杭州', x: 78, y: 58, value: 87 },
  { id: 9, name: '南京', x: 75, y: 52, value: 80 },
  { id: 10, name: '重庆', x: 48, y: 60, value: 68 }
];

export const MOCK_GRAPH_DATA: GraphData = {
  categories: [{ name: '核心技能' }, { name: '编程语言' }, { name: '工程框架' }, { name: '数据/云工具' }],
  nodes: [
    { id: '1', name: '全栈工程师', symbolSize: 85, value: 100, category: 0 },
    { id: '2', name: 'JavaScript', symbolSize: 65, value: 88, category: 1 },
    { id: '3', name: 'TypeScript', symbolSize: 60, value: 82, category: 1 },
    { id: '4', name: 'Java', symbolSize: 62, value: 84, category: 1 },
    { id: '5', name: 'React', symbolSize: 58, value: 80, category: 2 },
    { id: '6', name: 'Spring Boot', symbolSize: 56, value: 78, category: 2 },
    { id: '7', name: 'Node.js', symbolSize: 55, value: 76, category: 2 },
    { id: '8', name: 'MySQL', symbolSize: 52, value: 74, category: 3 },
    { id: '9', name: 'Redis', symbolSize: 50, value: 70, category: 3 },
    { id: '10', name: 'Docker', symbolSize: 49, value: 68, category: 3 },
    { id: '11', name: 'Kubernetes', symbolSize: 47, value: 64, category: 3 },
    { id: '12', name: 'LLM应用', symbolSize: 48, value: 66, category: 0 },
    { id: '13', name: 'Python', symbolSize: 58, value: 79, category: 1 },
    { id: '14', name: 'Go', symbolSize: 55, value: 75, category: 1 },
    { id: '15', name: 'Vue', symbolSize: 54, value: 74, category: 2 },
    { id: '16', name: 'GraphQL', symbolSize: 46, value: 63, category: 2 },
    { id: '17', name: 'Spark', symbolSize: 52, value: 72, category: 3 },
    { id: '18', name: 'Flink', symbolSize: 49, value: 68, category: 3 },
    { id: '19', name: 'Kafka', symbolSize: 48, value: 67, category: 3 },
    { id: '20', name: 'ClickHouse', symbolSize: 47, value: 65, category: 3 },
    { id: '21', name: '云原生架构师', symbolSize: 60, value: 81, category: 0 },
    { id: '22', name: '数据平台工程师', symbolSize: 58, value: 79, category: 0 },
    { id: '23', name: 'AI工程师', symbolSize: 61, value: 83, category: 0 },
    { id: '24', name: 'Prompt工程师', symbolSize: 50, value: 69, category: 0 }
  ],
  links: [
    { source: '1', target: '2' },
    { source: '1', target: '3' },
    { source: '1', target: '4' },
    { source: '1', target: '5' },
    { source: '1', target: '6' },
    { source: '1', target: '7' },
    { source: '5', target: '2' },
    { source: '7', target: '2' },
    { source: '6', target: '4' },
    { source: '6', target: '8' },
    { source: '7', target: '9' },
    { source: '10', target: '11' },
    { source: '12', target: '3' },
    { source: '12', target: '10' },
    { source: '21', target: '11' },
    { source: '21', target: '10' },
    { source: '21', target: '19' },
    { source: '22', target: '17' },
    { source: '22', target: '18' },
    { source: '22', target: '20' },
    { source: '22', target: '8' },
    { source: '23', target: '13' },
    { source: '23', target: '17' },
    { source: '23', target: '19' },
    { source: '24', target: '12' },
    { source: '24', target: '13' },
    { source: '14', target: '7' },
    { source: '15', target: '2' },
    { source: '16', target: '5' },
    { source: '17', target: '19' },
    { source: '18', target: '20' }
  ]
};

export const MOCK_COMPARISON_DATA: ComparisonData = {
  topicA: '前端开发工程师',
  topicB: 'Java后端开发',
  radarIndicators: [
    { name: '岗位需求热度', max: 100 },
    { name: '平均薪资水平', max: 100 },
    { name: '岗位供需比', max: 100 },
    { name: '技能门槛', max: 100 },
    { name: '成长空间', max: 100 }
  ],
  radarDataA: [96, 80, 74, 85, 90],
  radarDataB: [92, 88, 70, 80, 87],
  trendData: [
    { time: '1月', valueA: 9100, valueB: 9800 },
    { time: '2月', valueA: 8000, valueB: 9100 },
    { time: '3月', valueA: 12600, valueB: 13800 },
    { time: '4月', valueA: 12000, valueB: 13300 },
    { time: '5月', valueA: 11200, valueB: 12500 },
    { time: '6月', valueA: 11600, valueB: 12900 },
    { time: '7月', valueA: 10300, valueB: 11400 },
    { time: '8月', valueA: 10900, valueB: 11900 },
    { time: '9月', valueA: 12400, valueB: 13400 },
    { time: '10月', valueA: 13000, valueB: 14100 },
    { time: '11月', valueA: 13800, valueB: 14900 },
    { time: '12月', valueA: 14600, valueB: 15700 }
  ]
};
