
export interface User {
  id: number;
  username: string;
  password?: string;
  avatar: string;
  role: 'admin' | 'user';
  phone: string;
  regDate: string;
  status: boolean;
  nickname?: string;
}

export interface HotSearchItem {
  id: number;
  rank: number;
  keyword: string;
  heat: number;
  company?: string;
  city?: string;
  salary?: string;
  education?: string;
  experience?: string;
  tag?: 'new' | 'hot' | 'boiling' | 'urgent';
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface TrendData {
  time: string;
  heat: number | null;
  forecast: number | null;
}

export interface SalaryBoxPlotData {
  categories: string[];
  values: number[][];
  outliers: Array<[number, number]>;
}

export interface SunburstNode {
  name: string;
  value?: number;
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  children?: SunburstNode[];
}

export interface SentimentData {
  name: string;
  value: number;
  itemStyle?: {
    color: string;
    shadowBlur?: number;
    shadowColor?: string;
  };
}

export interface WordCloudItem {
  name: string;
  value: number;
  count?: number;
}

export interface GeoPoint {
  id: number;
  name: string;
  x: number;
  y: number;
  value: number;
}

export interface MapData {
  name: string;
  value: number;
  topics: string[];
}

export interface GraphNode {
  id: string;
  name: string;
  symbolSize: number;
  value: number;
  category: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  categories: { name: string }[];
}

export interface ComparisonTrendItem {
  time: string;
  valueA: number;
  valueB: number;
}

export interface ComparisonRadarItem {
  name: string;
  max: number;
}

export interface ComparisonData {
  topicA: string;
  topicB: string;
  radarIndicators: ComparisonRadarItem[];
  radarDataA: number[];
  radarDataB: number[];
  trendData: ComparisonTrendItem[];
}

export interface EvolutionNode {
  id: number;
  time: string;
  title: string;
  desc: string;
  heat: number;
  status: 'process' | 'wait' | 'finish' | 'error';
  keywords: { name: string; value: number }[];
  summary: string;
}

export interface SentimentTrendData {
  times: string[];
  positive: number[];
  neutral: number[];
  negative: number[];
}

export interface SentimentWarning {
  time: string;
  content: string;
  type: 'critical' | 'warning' | 'info';
}

export interface SentimentKeyword {
  word: string;
  count: number;
  percent: number;
}

export interface SentimentDashboardData {
  trend: SentimentTrendData;
  warnings: SentimentWarning[];
  keywords: SentimentKeyword[];
}

export interface DashboardData {
  hotSearch: HotSearchItem[];
  categories: CategoryData[];
  trend: TrendData[];
  sentiment: SentimentData[];
  wordCloud: WordCloudItem[];
  mapData: MapData[];
  salaryBoxData?: SalaryBoxPlotData;
  recruitmentSunburstData?: SunburstNode[];
  kpi: DashboardKpi;
  educationDistribution: CategoryData[];
  experienceDistribution: CategoryData[];
  supplyDemandRatios: CityDemandRatio[];
}

export interface PredictionResult {
  times: string[];
  realData: (number | null)[];
  predData: (number | null)[];
  stats: {
    peakTime: string;
    peakValue: number;
    confidence: number;
  };
}

export type ClusterPoint = [number, number, number, string, string];

export interface JobPosting {
  id: number;
  jobName: string;
  companyName: string;
  city: string;
  salaryMin: number;
  salaryMax: number;
  education: string;
  experience: string;
  industry: string;
  skills: string[];
  heatIndex: number;
  publishTime: string;
}

export interface CompanyProfile {
  id: number;
  name: string;
  industry: string;
  city: string;
  activeJobs: number;
  avgSalary: number;
  hiringGrowth: number;
}

export interface CityDemandRatio {
  city: string;
  demand: number;
  talentSupply: number;
  ratio: number;
}

export interface SalaryDistribution {
  range: string;
  count: number;
  ratio: number;
}

export interface SkillCloudMetric {
  skill: string;
  demand: number;
  growth: number;
}

export interface DemandForecast {
  time: string;
  actual: number | null;
  predicted: number | null;
  confidence: number;
}

export interface DashboardKpi {
  totalJobs: number;
  newJobs24h: number;
  avgSalaryK: number;
  activeCompanies: number;
}

export interface ReportSummary {
  periodLabel: string;
  coreMetrics: {
    totalJobs: number;
    activeCities: number;
    avgSalaryK: number;
    newJobs: number;
  };
  cityRanking: CategoryData[];
  industryRanking: CategoryData[];
  salaryBuckets: SalaryDistribution[];
  skillHeatChanges: { skill: string; delta: number }[];
  riskAlerts: string[];
}

export interface ReportItem {
  id: string;
  title: string;
  timeRange: string;
  createTime: string;
  size: string;
  status: 'completed' | 'processing' | 'failed';
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'urgent';
  summary?: ReportSummary;
}

export interface ResumeProfile {
  id: string;
  rawText: string;
  extractedSkills: string[];
  experienceYears: number;
  education: string;
  targetJobs: string[];
  updatedAt: string;
}

export interface ResumeJobMatchResult {
  jobTitle: string;
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
}

export interface DeepSeekGapSkill {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  action: string;
}

export interface DeepSeekLearningPath {
  phase: string;
  focus: string;
  target: string;
}

export interface DeepSeekAdvice {
  model: string;
  generatedAt: string;
  summary: string;
  strengths: string[];
  gapSkills: DeepSeekGapSkill[];
  resumeOptimizations: string[];
  learningPath: DeepSeekLearningPath[];
  marketTips: string[];
}

export interface DeepSeekAdviceRequest {
  jobTitle: string;
  resumeSkills: string[];
  missingSkills: string[];
  marketSignals: string[];
}

export interface ResumeReviewIssue {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  excerpt: string;
  problem: string;
  suggestion: string;
}

export interface ResumeRewriteReview {
  model: string;
  generatedAt: string;
  score: number;
  summary: string;
  quickWins: string[];
  issues: ResumeReviewIssue[];
  revisedResume: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  mock: boolean;
  retryCount: number;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
  success: boolean;
  meta: ApiMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  retryable: boolean;
}

export interface DataCleaningAiInsight {
  score: number;
  summary: string;
  risks: string[];
  suggestions: string[];
  generatedAt: string;
  model: string;
}

export interface ReportAiNarrative {
  summary: string;
  highlights: string[];
  actions: string[];
  generatedAt: string;
  model: string;
}

export interface ComparisonAiInsight {
  summary: string;
  advantagesA: string[];
  advantagesB: string[];
  suggestions: string[];
  generatedAt: string;
  model: string;
}

export interface ForecastAiInsight {
  summary: string;
  trendSignals: string[];
  riskPoints: string[];
  actions: string[];
  generatedAt: string;
  model: string;
}
