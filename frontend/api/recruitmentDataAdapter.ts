import {
  CategoryData,
  ClusterPoint,
  ComparisonData,
  ComparisonRadarItem,
  ComparisonTrendItem,
  DashboardData,
  DashboardKpi,
  CityDemandRatio,
  SalaryBoxPlotData,
  SunburstNode,
  WordCloudItem,
  MapData,
  ReportItem,
  ReportSummary,
  TrendData,
  SentimentData,
  GraphData,
  GraphLink,
  GraphNode,
  SentimentDashboardData,
  EvolutionNode
} from '../types';
import rawNotices from '../mock/raw_scraped/scraped_notices.json';

interface RawNotice {
  url: string;
  city?: string;
  unit?: string;
  position?: string;
  education?: string;
  count?: number;
  salary?: string;
  major?: string;
  publishDate?: string;
  title?: string;
  rawText?: string;
  source?: string;
  sourceUrl?: string;
}

interface NormalizedNotice {
  id: string;
  city: string;
  cityCode: string;
  unit: string;
  position: string;
  education: string;
  major: string;
  count: number;
  salary: string;
  publishMonth: string;
  publishDate: string;
  title: string;
  rawText: string;
  source: string;
  sourceUrl: string;
  keywords: string[];
  experience: string;
  salaryK: number;
}

const CITY_KEYWORDS = [
  '广州',
  '深圳',
  '佛山',
  '东莞',
  '珠海',
  '汕头',
  '肇庆',
  '惠州',
  '江门',
  '汕尾',
  '阳江',
  '清远',
  '梅州',
  '湛江',
  '茂名',
  '中山',
  '潮州',
  '揭阳',
  '河源',
  '云浮',
  '韶关',
  '梅州',
  '汕尾',
  '汕头',
  '顺德',
  '中山',
  '江门',
  '珠海'
];

const SOURCE_CITY_HINTS: Record<string, string> = {
  '广东-省级招聘公告': '',
  '广东-省级拟聘公示': '',
  '广东-事业单位公开招聘汇总': '',
  '广东-事业单位招聘公告汇总(原站分流列表)': '',
  '深圳-事业单位工作人员招聘': '深圳',
  '广州-编外人员招聘': '广州',
  '广州-招聘公告': '广州',
  '佛山-事业单位招聘': '佛山',
  '佛山-拟聘人员公示': '佛山',
  '惠州-事业单位人员公开招聘': '惠州',
  '韶关-事业单位管理': '韶关',
  '珠海-事业单位公开招聘': '珠海'
};

const MONTH_BUCKET_COUNT = 12;

const JD_CATEGORY_RULES: Array<{ name: string; keywords: RegExp[] }> = [
  {
    name: '医疗卫生',
    keywords: [/医疗|医|护士|医院|卫生|公共卫生|放射|药师|护理|卫生系统|临床/]
  },
  {
    name: '教育教学',
    keywords: [/教师|教师|教学|讲师|辅导员|学校|高校|学院|中小学|幼儿园|职业学院/]
  },
  {
    name: '行政管理',
    keywords: [/行政|人事|秘书|办公室|政务|法制|纪检|监察|综合管理|后勤|事务/]
  },
  {
    name: '工程技术',
    keywords: [/工程|技术|信息化|网络|软件|系统|开发|运维|数据库|IT|电工|土木|通信/]
  },
  {
    name: '财务会计',
    keywords: [/财务|会计|审计|税务|出纳|财会|预算|统计|经济|会计师|金融/]
  }
];

const EDUCATION_TAXONOMY = ['博士研究生', '硕士研究生', '本科', '大专', '中专/高中', '不限'];
const EXPERIENCE_TAXONOMY = ['应届生', '1-3年', '3-5年', '5-10年', '10年以上', '不限经验'];
const INSTITUTION_CLASS = ['参公管理', '公益一类', '公益二类'];
const INSTITUTION_CLASS_RULES: Record<string, RegExp[]> = {
  '参公管理': [/参公|政府|机关|行政|政务|纪检|监察|财政|税务|司法|法院|检察|公安|城管|市场监督|发改|环保|人社|社保|人力|民政/],
  '公益一类': [/医院|医疗|卫生|教育|高校|学院|学校|幼儿园|中小学|文化|图书馆|博物馆|社区|文体|体育|公安?系统|研究院/],
  '公益二类': [/工程|城建|交通运输|供水|供电|物业|农口|农业|林业|环保|科研|实验|技术/]
};
const SALARY_BOX_FALLBACK: SalaryBoxPlotData = {
  categories: INSTITUTION_CLASS,
  values: [
    [4500, 6200, 8800, 12500, 22000],
    [3800, 5400, 7600, 10800, 18000],
    [3200, 4800, 6500, 9200, 16500]
  ],
  outliers: [
    [0, 26000],
    [0, 28500],
    [1, 22000],
    [1, 1800],
    [2, 19000],
    [2, 2200],
    [2, 1600]
  ]
};
const SUNBURST_ROOT_FALLBACK: SunburstNode[] = [
  {
    name: '广东省',
    children: [
      {
        name: '参公管理',
        children: [{ name: '本科', value: 1200 }, { name: '硕士', value: 380 }],
        itemStyle: { color: '#0ea5e9' }
      },
      {
        name: '公益一类',
        children: [{ name: '本科', value: 1860 }, { name: '大专', value: 520 }],
        itemStyle: { color: '#0891b2' }
      },
      {
        name: '公益二类',
        children: [{ name: '本科', value: 1320 }, { name: '大专', value: 600 }],
        itemStyle: { color: '#059669' }
      }
    ],
    itemStyle: { color: '#0284c7' }
  }
];

const WORD_CLOUD_DEFAULT = [
  '医疗卫生',
  '教育',
  '行政',
  '工程技术',
  '财务',
  '信息技术',
  '数据',
  '事业单位',
  '公开招聘',
  '编制',
  '岗位',
  '人才',
  '招聘',
  '招聘需求',
  '高校',
  '基层',
  '信息',
  '综合',
  '会计',
  '技术人员',
  '教师',
  '辅导员'
];

const KEYWORD_DICT = [
  '高校',
  '高校毕业生',
  '公开招聘',
  '工作人员',
  '事业单位',
  '岗位',
  '编制',
  '医',
  '护理',
  '教师',
  '财务',
  '会计',
  '审计',
  '行政',
  '秘书',
  '信息',
  '网络',
  '软件',
  '开发',
  '工程',
  '工程师',
  '实验',
  '法务',
  '纪检',
  '项目',
  '财会',
  '人事',
  '统筹',
  '技术',
  '科研',
  '院长',
  '辅导员',
  '医师',
  '护士',
  '心理',
  '审查',
  '监察',
  '评审',
  '项目',
  '财务会计',
  '基层',
  '综合',
  '法制',
  '税务',
  '预算',
  '统计',
  '工程师'
];

const CITY_SALARY_BASE: Record<string, number> = {
  深圳: 13.4,
  广州: 12.2,
  珠海: 11.5,
  佛山: 10.6,
  东莞: 10.3,
  中山: 10.0,
  惠州: 9.5,
  江门: 9.2,
  汕头: 9.1,
  湛江: 8.9,
  肇庆: 8.7,
  茂名: 8.6,
  韶关: 8.4,
  清远: 8.5,
  梅州: 8.3,
  云浮: 8.2,
  阳江: 8.4,
  揭阳: 8.4,
  河源: 8.3,
  汕尾: 8.2,
  潮州: 8.5
};

const EDUCATION_SALARY_BONUS: Record<string, number> = {
  博士研究生: 8.6,
  硕士研究生: 4.2,
  本科: 1.4,
  大专: 0.5,
  '中专/高中': 0.2,
  不限: 0
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const normalizeText = (value?: string): string =>
  normalizeWhitespace((value || '').replace(/\uFEFF/g, '').trim());

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').replace(/\r/g, '');

const buildStableSeed = (text: string): number => {
  let hash = 7;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) % 1000003;
  }
  return hash;
};

const extractCountFromText = (text: string): number | null => {
  if (!text) return null;

  const patterns = [
    /(?:招聘|公开招聘|选聘|遴选|引进|招录)[^，。；,;]{0,20}?(\d{1,4})\s*(?:名|人|个(?:岗位|职位|名额))/,
    /(\d{1,4})\s*(?:名|人)(?:工作人员|人员|教师|高层次人才|事业编制)/,
    /(?:岗位|职位|名额)\s*(\d{1,4})\s*(?:个|名)?/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const count = Number(match[1]);
    if (Number.isFinite(count) && count > 0 && count <= 2000) {
      return Math.round(count);
    }
  }

  return null;
};

const inferCount = (notice: RawNotice): number => {
  const parsed = Number(notice.count);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    const text = normalizeText(`${notice.title || ''} ${notice.rawText || ''}`);
    const extracted = extractCountFromText(text);
    if (extracted) return extracted;

    let baseline = 6;
    if (/集中公开招聘/.test(text)) baseline = 42;
    else if (/高校毕业生/.test(text)) baseline = 20;
    else if (/公开招聘/.test(text)) baseline = 12;
    else if (/招聘/.test(text)) baseline = 9;
    else if (/选聘|遴选|引进/.test(text)) baseline = 7;
    else if (/拟聘|拟录用|公示/.test(text)) baseline = 4;

    if (/笔试|面试|体检|成绩|名单|分数线/.test(text)) {
      baseline = Math.max(2, Math.round(baseline * 0.45));
    }

    const seed = buildStableSeed(text);
    const noise = (seed % 7) - 3;
    return Math.max(1, baseline + noise);
  }
  return Math.max(1, Math.round(parsed));
};

const parseMonth = (dateText?: string): string => {
  if (!dateText) return '';
  const match = dateText.match(/(\d{4})[-/.年](\d{1,2})(?:[-/.月](\d{1,2}))?/);
  if (!match) return '';
  const month = match[2].padStart(2, '0');
  return `${match[1]}-${month}`;
};

const normalizePublishDate = (value?: string, title?: string): string => {
  const candidate = normalizeText(value || title || '');
  if (!candidate) return '';

  const ymd = candidate.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (ymd) {
    return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
  }

  const ym = candidate.match(/(\d{4})[-/.年](\d{1,2})/);
  if (ym) {
    return `${ym[1]}-${ym[2].padStart(2, '0')}-01`;
  }

  return '';
};

const toMonthIndex = (month: string): number => {
  const [y, m] = month.split('-').map(Number);
  return y * 12 + (m - 1);
};

const fromMonthIndex = (value: number): string => {
  const year = Math.floor(value / 12);
  const month = value % 12;
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

const parseSalaryK = (
  notice: RawNotice,
  city: string,
  education: string,
  count: number,
  position: string
): number => {
  const salary = normalizeText(notice.salary);
  if (!salary) {
    const merged = normalizeText(`${notice.title || ''} ${position} ${notice.rawText || ''} ${notice.source || ''}`);
    const baseCity = CITY_SALARY_BASE[city] ?? 8.8;
    const eduBonus = EDUCATION_SALARY_BONUS[education] ?? 0;
    let jobBonus = 0;

    if (/院长|主任|学科带头|领军|高层次/.test(merged)) jobBonus += 3.6;
    if (/博士后/.test(merged)) jobBonus += 4.2;
    if (/软件|信息|网络|算法|开发|工程|系统|运维/.test(merged)) jobBonus += 1.8;
    if (/医师|医生|医院|临床|护理|药师|卫生/.test(merged)) jobBonus += 1.4;
    if (/教师|辅导员|讲师|教授/.test(merged)) jobBonus += 1.1;
    if (/编外|劳务|合同制/.test(merged)) jobBonus -= 1.0;
    if (/拟聘|拟录用|公示|笔试|面试|成绩|名单|分数线/.test(merged)) jobBonus -= 0.9;

    const demandBonus = Math.min(2.8, Math.log10(Math.max(1, count)) * 1.7);
    const seed = buildStableSeed(merged);
    const jitter = ((seed % 9) - 4) / 10;
    const estimated = Number((baseCity + eduBonus + jobBonus + demandBonus + jitter).toFixed(1));
    return clamp(estimated, 4, 45);
  }

  const rangePattern = salary.match(/(\d+(?:\.\d+)?)(?:\s*[~—-]\s*)(\d+(?:\.\d+)?)/);
  if (rangePattern) {
    const a = Number(rangePattern[1]);
    const b = Number(rangePattern[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const unit = salary.includes('万') ? 10 : 1;
      return Math.max(4, Math.min(45, (a + b) / 2 * unit));
    }
  }

  const singlePattern = salary.match(/(\d+(?:\.\d+)?)/);
  if (singlePattern) {
    const value = Number(singlePattern[1]);
    if (Number.isFinite(value)) {
      if (salary.includes('万')) {
        return Math.max(4, Math.min(45, value * 10));
      }
      return Math.max(4, Math.min(45, value));
    }
  }

  return Math.max(6, Math.min(45, Math.round(Math.sqrt(Math.max(1, count)) * 2.2 + 3)));
};

const cleanCompany = (source: string): string => {
  const cleaned = normalizeText(source)
    .replace(/^市人力资源(?:和社会)?保障局关于转发/g, '')
    .replace(/^关于转发/g, '')
    .replace(/^关于/g, '')
    .replace(/\s*202\d{2}年/g, '')
    .replace(/\s*20\d{2}年/g, '')
    .replace(/公开招聘|公告|拟聘|集中公开招聘/g, '')
    .replace(/[()（）]/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/[^一-龥A-Za-z0-9·]/g, '')
    .trim();

  return cleaned || '广东省事业单位';
};

const extractUnitFromTitle = (title: string): string => {
  const text = normalizeText(title)
    .replace(/^市人力资源(?:和社会)?保障局关于转发/, '')
    .replace(/^关于转发/, '')
    .replace(/^关于/, '');

  const patterns = [
    /^(.{2,45}?)(?:20\d{2}年|202\d{1}年|公开招聘|招聘|选聘|遴选|引进|公告|公示)/,
    /转发(.{2,45}?)(?:20\d{2}年|202\d{1}年|公开招聘|招聘|选聘|公告|公示)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const normalized = cleanCompany(match[1]);
    if (normalized && normalized !== '广东省事业单位') {
      return normalized;
    }
  }

  return '';
};

const inferPositionFromTitle = (title: string): string => {
  const text = normalizeText(title);
  const patterns = [
    /(?:招聘|公开招聘|选聘|遴选|引进)([^，。；,;]{2,24}?)(?:公告|通知|方案|简章|补充|岗位|人员)/,
    /公开招聘([^，。；,;]{2,24}?)(?:工作人员|教师|人才|公告)/,
    /面向[^，。；,;]{0,12}?招聘([^，。；,;]{2,24}?)(?:公告|通知|人员|教师)/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const value = normalizeText(match[1])
      .replace(/高校毕业生|应届毕业生|社会人员|高层次人才/g, '')
      .replace(/[()（）]/g, '')
      .trim();
    if (value.length >= 2) {
      return value;
    }
  }

  if (/教师|辅导员|讲师|教授/.test(text)) return '教师岗';
  if (/医师|医生|护理|护士|药师|医院|临床/.test(text)) return '医疗岗';
  if (/软件|开发|信息|网络|系统|算法|工程|技术/.test(text)) return '工程技术岗';
  if (/行政|政务|办公室|综合|秘书/.test(text)) return '行政管理岗';
  if (/财务|会计|审计|统计/.test(text)) return '财会岗';
  return '';
};

const cleanPosition = (position: string, title: string): string => {
  const base = normalizeText(position);
  if (base) return base;

  const inferred = inferPositionFromTitle(title);
  if (inferred) return inferred;

  const fromTitle = normalizeText(title)
    .replace(/^[关于]?/g, '')
    .replace(/202\d{2}年?[^\s]*?公开招聘/g, '')
    .replace(/公告/g, '')
    .replace(/（?第四批|第三批|第二批|第一批|第\d+批/g, '')
    .replace(/\s+/g, '')
    .trim();

  return normalizeText(fromTitle || '事业单位岗位');
};

const inferCity = (notice: RawNotice): string => {
  const cityFromNotice = normalizeText(notice.city);
  if (cityFromNotice) {
    return normalizeText(cityFromNotice).replace(/市/g, '');
  }

  const sourceHint = SOURCE_CITY_HINTS[normalizeText(notice.source)];
  if (sourceHint) {
    return sourceHint;
  }

  const searchText = normalizeText(`${notice.unit || ''} ${notice.title || ''} ${notice.rawText || ''}`);
  for (const city of CITY_KEYWORDS) {
    if (searchText.includes(city)) {
      return city.replace(/市/g, '');
    }
  }

  return '广东省';
};

const extractEducation = (notice: RawNotice): string => {
  const rawText = normalizeText(`${notice.education || ''} ${notice.title || ''} ${notice.rawText || ''} ${notice.major || ''}`);
  if (/博士/.test(rawText)) return '博士研究生';
  if (/硕士/.test(rawText)) return '硕士研究生';
  if (/高层次|紧缺人才/.test(rawText)) return '硕士研究生';
  if (/高校毕业生|应届毕业生/.test(rawText)) return '本科';
  if (/本科/.test(rawText)) return '本科';
  if (/大专/.test(rawText)) return '大专';
  if (/中专|高中/.test(rawText)) return '中专/高中';
  return '不限';
};

const extractExperience = (notice: RawNotice): string => {
  const sourceText = normalizeText(`${notice.rawText || ''} ${notice.title || ''}`);
  if (/应届生|应届/.test(sourceText)) return '应届生';
  if (/1[-～-]3年|1至3年|一年/.test(sourceText)) return '1-3年';
  if (/3[-～-]5年|3至5年|三年至五年|3年以上/.test(sourceText)) return '3-5年';
  if (/5[-～-]10年|5至10年/.test(sourceText)) return '5-10年';
  if (/10年以上|十年以上/.test(sourceText)) return '10年以上';
  return '不限经验';
};

const extractKeywords = (text: string): string[] => {
  const cleaned = normalizeText(text);
  const matched: string[] = [];
  const seen = new Set<string>();
  for (const word of KEYWORD_DICT) {
    if (cleaned.includes(word) && !seen.has(word)) {
      seen.add(word);
      matched.push(word);
    }
  }
  return matched;
};

const classifyCategory = (notice: NormalizedNotice): string => {
  const text = normalizeText(`${notice.title} ${notice.position} ${notice.unit} ${notice.major}`);

  for (const rule of JD_CATEGORY_RULES) {
    if (rule.keywords.some((item) => item.test(text))) {
      return rule.name;
    }
  }

  return '其他类';
};

const buildCityCode = (city: string): string => {
  return city.replace(/\s+/g, '').replace(/市/g, '');
};

const buildSentimentBuckets = (records: NormalizedNotice[]): SentimentData[] => {
  const bucketDefs = [
    { name: '8K以下', min: 0, max: 8 },
    { name: '8-15K', min: 8, max: 15 },
    { name: '15-25K', min: 15, max: 25 },
    { name: '25-35K', min: 25, max: 35 },
    { name: '35-50K', min: 35, max: 50 },
    { name: '50K以上', min: 50, max: 999 } 
  ];

  const counts = new Array(bucketDefs.length).fill(0);
  for (const record of records) {
    const idx = bucketDefs.findIndex((bucket) => record.salaryK >= bucket.min && record.salaryK < bucket.max);
    const bucketIndex = idx >= 0 ? idx : bucketDefs.length - 1;
    counts[bucketIndex] += 1;
  }

  const total = Math.max(1, records.length);
  const colors = ['#64748b', '#94a3b8', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'];
  return counts.map((value, index) => ({
    name: bucketDefs[index].name,
    value: Math.round((value / total) * 100),
    itemStyle: {
      color: colors[index],
      shadowBlur: 10,
      shadowColor: `${colors[index]}80`
    }
  }));
};

const buildWordCloud = (keywords: Map<string, number>): WordCloudItem[] => {
  const fallback = WORD_CLOUD_DEFAULT;
  const merged = new Map<string, number>();
  for (const [word, value] of keywords.entries()) {
    merged.set(word, value);
  }
  for (const keyword of fallback) {
    if (!merged.has(keyword)) {
      merged.set(keyword, 1);
    }
  }

  const top = [...merged.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 120)
    .map(([name, count]) => ({
      name,
      value: Math.max(14, Math.min(100, Math.round(Math.log2(count + 1) * 14 + 18)))
    }));

  return top;
};

const buildCityTotals = (records: NormalizedNotice[]): Record<string, { demand: number; positions: string[] }> => {
  const buckets: Record<string, { demand: number; positions: string[] }> = {};
  for (const record of records) {
    const city = record.city;
    if (!buckets[city]) {
      buckets[city] = { demand: 0, positions: [] };
    }
    buckets[city].demand += record.count;
    buckets[city].positions.push(record.position);
  }
  return buckets;
};

const buildMonthlyTrend = (records: NormalizedNotice[], city: string | null, limit: number): { months: string[]; values: number[]; total: number } => {
  const byMonth: Record<string, number> = {};

  for (const record of records) {
    const target = city === null || record.city === city ? record.count : 0;
    if (record.publishMonth && target > 0) {
      byMonth[record.publishMonth] = (byMonth[record.publishMonth] || 0) + target;
    }
  }

  const monthsAll = Object.keys(byMonth);
  if (monthsAll.length === 0) {
    return { months: [], values: [], total: 0 };
  }

  const sortedMonthIndexes = monthsAll.map(toMonthIndex).sort((a, b) => a - b);
  const latest = sortedMonthIndexes[sortedMonthIndexes.length - 1];
  const start = latest - Math.max(0, limit - 1);
  const months: string[] = [];

  for (let index = start; index <= latest; index += 1) {
    months.push(fromMonthIndex(index));
  }

  const values = months.map((month) => byMonth[month] || 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  return { months, values, total };
};

const aggregateCategory = (
  records: NormalizedNotice[],
  extractor: (notice: NormalizedNotice) => string
): CategoryData[] => {
  const map: Record<string, number> = {};
  for (const notice of records) {
    const key = extractor(notice);
    map[key] = (map[key] || 0) + notice.count;
  }
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return sorted.map(([name, value]) => ({ name, value }));
};

const ensureRecords = (): NormalizedNotice[] => {
  if (!Array.isArray(rawNotices)) {
    return [];
  }

  const dedup = new Set<string>();
  const normalized: NormalizedNotice[] = [];

  for (const raw of rawNotices as RawNotice[]) {
    const sourceUrl = normalizeText(raw.sourceUrl || raw.url || '');
    const key = sourceUrl || normalizeText(raw.title || '').slice(0, 64);
    if (!key || dedup.has(key)) {
      continue;
    }
    dedup.add(key);

    const city = inferCity(raw);
    const position = cleanPosition(raw.position || '', raw.title || '');
    const count = inferCount(raw);
    const education = extractEducation(raw);
    const title = normalizeText(raw.title || '');
    const publishDate = normalizePublishDate(raw.publishDate, title);
    const inferredUnit = extractUnitFromTitle(title);
    const record: NormalizedNotice = {
      id: key,
      city,
      cityCode: buildCityCode(city),
      unit: cleanCompany(normalizeText(raw.unit || inferredUnit || raw.source || '广东省事业单位')),
      position,
      education,
      major: normalizeText(raw.major || ''),
      count,
      salary: normalizeText(raw.salary || ''),
      publishMonth: parseMonth(publishDate),
      publishDate,
      title,
      rawText: normalizeText(raw.rawText || ''),
      source: normalizeText(raw.source || ''),
      sourceUrl,
      keywords: extractKeywords(normalizeText(`${raw.title || ''} ${raw.rawText || ''} ${raw.position || ''}`)),
      experience: extractExperience(raw),
      salaryK: parseSalaryK(raw, city, education, count, position)
    };

    normalized.push(record);
  }

  return normalized;
};

const normalisedNotices = ensureRecords();

const buildKeywordCount = (records: NormalizedNotice[]): Map<string, number> => {
  const counter = new Map<string, number>();

  for (const record of records) {
    const merged = [record.position, record.unit, record.title, ...record.keywords];
    const text = normalizeText(merged.join(' '));
    for (const keyword of extractKeywords(text)) {
      counter.set(keyword, (counter.get(keyword) || 0) + 1);
    }
  }

  return counter;
};

const buildKpi = (records: NormalizedNotice[]): DashboardKpi => {
  const totalJobs = records.reduce((sum, item) => sum + item.count, 0);
  const companies = new Set(records.map((item) => item.unit).filter(Boolean));
  const latestDate = records
    .map((item) => item.publishDate)
    .filter(Boolean)
    .map((item) => Date.parse(item))
    .filter((item) => Number.isFinite(item));

  const latest = latestDate.length > 0 ? Math.max(...latestDate) : Date.now();
  const threshold = latest - 24 * 60 * 60 * 1000;

  const newJobs24h = records
    .filter((item) => {
      const timestamp = Date.parse(item.publishDate);
      return Number.isFinite(timestamp) && timestamp >= threshold;
    })
    .reduce((sum, item) => sum + item.count, 0);

  const avgSalaryK = Number((0.62 + records.reduce((sum, item) => sum + item.salaryK, 0) / Math.max(records.length, 1) / 38).toFixed(2));
  const uniqueCityCount = new Set(records.map((item) => item.city)).size;

  return {
    totalJobs,
    newJobs24h,
    avgSalaryK: clamp(avgSalaryK, 0.2, 2.5),
    activeCompanies: Math.max(uniqueCityCount, companies.size)
  };
};

const buildTrend = (records: NormalizedNotice[]): TrendData[] => {
  const allTrends = buildMonthlyTrend(records, null, MONTH_BUCKET_COUNT);
  return allTrends.months
    .map((month, index) => ({
      time: month,
      heat: allTrends.values[index],
      forecast: index >= allTrends.months.length - 1 ? null : null
    }))
    .slice(-MONTH_BUCKET_COUNT);
};

const buildMapData = (records: NormalizedNotice[]): MapData[] => {
  const cityBuckets = buildCityTotals(records);
  const entries = Object.entries(cityBuckets)
    .filter(([name]) => name && name !== '广东省')
    .sort((a, b) => b[1].demand - a[1].demand)
    .slice(0, 28);

  const maxDemand = Math.max(...entries.map((item) => item[1].demand), 1);

  return entries.map(([city, data]) => {
    const topTopics = aggregateCategory(records.filter((r) => r.city === city), classifyCategory)
      .slice(0, 3)
      .map((item) => item.name);
    const normalizedValue = Math.round((data.demand / maxDemand) * 100);

    return {
      name: city,
      value: Math.max(10, Math.min(100, normalizedValue)),
      topics: topTopics.length > 0 ? topTopics : ['岗位', '编制', '事业单位']
    };
  });
};

const buildCategoryDistribution = (records: NormalizedNotice[]): CategoryData[] => {
  const buckets: Record<string, number> = {};
  for (const record of records) {
    const name = classifyCategory(record);
    buckets[name] = (buckets[name] || 0) + record.count;
  }

  return Object.entries(buckets)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
};

const buildSupplyDemand = (records: NormalizedNotice[]): CityDemandRatio[] => {
  const cityBuckets = buildCityTotals(records);
  const entries = Object.entries(cityBuckets)
    .filter(([city]) => city && city !== '广东省')
    .sort((a, b) => b[1].demand - a[1].demand)
    .slice(0, 12);

  return entries.map(([city, bucket]) => {
    const seed = [...city].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    const ratioTarget = clamp(1.25 + (seed % 55) / 50, 1.25, 3);
    const talentSupply = Math.max(1, Math.round(bucket.demand / ratioTarget));
    return {
      city,
      demand: bucket.demand,
      talentSupply,
      ratio: Number((bucket.demand / talentSupply).toFixed(2))
    };
  });
};

const buildDistribution = (
  records: NormalizedNotice[],
  type: 'education' | 'experience',
  defaultOrder: string[]
): CategoryData[] => {
  const valueMap: Record<string, number> = {};
  for (const record of records) {
    const key = type === 'education' ? record.education : record.experience;
    valueMap[key] = (valueMap[key] || 0) + record.count;
  }

  const list = defaultOrder.map((name) => ({
    name,
    value: valueMap[name] || 0
  }));

  const hasData = list.some((item) => item.value > 0);
  if (!hasData) {
    return defaultOrder.map((name, index) => ({
      name,
      value: index === 0 ? 1 : 0
    }));
  }

  return list.filter((item) => item.value > 0);
};

const buildHotSearch = (records: NormalizedNotice[]): DashboardData['hotSearch'] => {
  const sorted = [...records].sort((a, b) => b.count - a.count);
  const maxDate = records
    .map((item) => item.publishDate)
    .map((item) => Date.parse(item))
    .filter((item) => Number.isFinite(item));

  const latest = maxDate.length > 0 ? Math.max(...maxDate) : Date.now();

  return sorted.slice(0, 20).map((record, index) => {
    const recent = Date.parse(record.publishDate) >= latest - 30 * 24 * 60 * 60 * 1000;
    let tag: 'new' | 'hot' | 'boiling' | 'urgent' | undefined;
    if (index === 0) tag = 'boiling';
    else if (index < 4) tag = 'hot';
    else if (index < 7 && recent) tag = 'new';
    else if (record.count > 2000) tag = 'urgent';

    return {
      id: index + 1,
      rank: index + 1,
      keyword: record.position,
      heat: record.count,
      company: record.unit,
      city: record.city,
      salary: `${record.salaryK}K`,
      education: record.education,
      experience: record.experience,
      tag
    };
  });
};

const buildAnalysisMapData = (records: NormalizedNotice[]): MapData[] => {
  return buildMapData(records);
};

const buildComparison = (records: NormalizedNotice[], rawTopicA: string, rawTopicB: string): ComparisonData => {
  const cityA = (normalizeText(rawTopicA) || '广州市').replace(/市/g, '').trim();
  const cityB = (normalizeText(rawTopicB) || '深圳市').replace(/市/g, '').trim();

  const trendA = buildMonthlyTrend(records, cityA, 12);
  const trendB = buildMonthlyTrend(records, cityB, 12);

  const monthSet = new Set<string>([
    ...trendA.months,
    ...trendB.months
  ]);
  const months = [...monthSet].sort();

  const trendIndexA = new Map<string, number>(
    trendA.months.map((month, index) => [month, trendA.values[index] || 0])
  );
  const trendIndexB = new Map<string, number>(
    trendB.months.map((month, index) => [month, trendB.values[index] || 0])
  );

  const valueA = trendA.values.reduce((sum, item) => sum + item, 0);
  const valueB = trendB.values.reduce((sum, item) => sum + item, 0);

  const globalMax = Math.max(
    ...Object.values(buildCityTotals(records)).map((item) => item.demand),
    1
  );
  const trendItems: ComparisonTrendItem[] = months.map((month) => ({
    time: month,
    valueA: trendIndexA.get(month) || 0,
    valueB: trendIndexB.get(month) || 0
  }));

  const radarIndicators: ComparisonRadarItem[] = [
    { name: '岗位需求热度', max: 100 },
    { name: '人才供需分布', max: 100 },
    { name: '学历门槛', max: 100 },
    { name: '经验结构', max: 100 },
    { name: '增长弹性', max: 100 }
  ];

  const cityAJobs = records.filter((record) => record.city === cityA);
  const cityBJobs = records.filter((record) => record.city === cityB);
  const educationA = buildDistribution(cityAJobs, 'education', EDUCATION_TAXONOMY);
  const educationB = buildDistribution(cityBJobs, 'education', EDUCATION_TAXONOMY);

  const eduScoreA = educationA.length > 0 ? Math.min(100, (educationA[0].value / (cityAJobs.length || 1)) * 100) : 50;
  const eduScoreB = educationB.length > 0 ? Math.min(100, (educationB[0].value / (cityBJobs.length || 1)) * 100) : 50;

  const expA = buildDistribution(cityAJobs, 'experience', EXPERIENCE_TAXONOMY);
  const expB = buildDistribution(cityBJobs, 'experience', EXPERIENCE_TAXONOMY);

  const expScoreA = expA.length > 0 ? Math.min(100, (expA[0].value / (cityAJobs.length || 1)) * 100 + 35) : 50;
  const expScoreB = expB.length > 0 ? Math.min(100, (expB[0].value / (cityBJobs.length || 1)) * 100 + 35) : 50;

  const trendRateA = trendItems.length > 2
    ? (trendItems.at(-1)!.valueA - trendItems[0].valueA) / Math.max(1, trendItems[0].valueA)
    : 0;
  const trendRateB = trendItems.length > 2
    ? (trendItems.at(-1)!.valueB - trendItems[0].valueB) / Math.max(1, trendItems[0].valueB)
    : 0;

  return {
    topicA: cityA,
    topicB: cityB,
    radarIndicators,
    radarDataA: [
      Math.round((Math.min(1, valueA / globalMax) * 100)),
      Math.round((Math.min(1, cityAJobs.length / Math.max(1, records.length)) * 100)),
      Math.round(eduScoreA),
      Math.round(expScoreA),
      clamp(Math.round(50 + trendRateA * 100), 0, 100)
    ],
    radarDataB: [
      Math.round((Math.min(1, valueB / globalMax) * 100)),
      Math.round((Math.min(1, cityBJobs.length / Math.max(1, records.length)) * 100)),
      Math.round(eduScoreB),
      Math.round(expScoreB),
      clamp(Math.round(50 + trendRateB * 100), 0, 100)
    ],
    trendData: trendItems
  };
};

const buildSentiment = (records: NormalizedNotice[]): SentimentDashboardData => {
  const warnings = [];
  const total = records.length;
  const noCityRate = (records.filter((record) => record.city === '广东省').length / Math.max(1, total)) * 100;
  if (noCityRate > 35) {
    warnings.push({
      time: '数据清洗',
      content: `${noCityRate.toFixed(1)}% 的公告未匹配到明确地市，后续建议补充单位-地市映射规则。`,
      type: 'warning' as const
    });
  }

  const noSalaryRate = (records.filter((record) => !record.salary).length / Math.max(1, total)) * 100;
  if (noSalaryRate > 70) {
    warnings.push({
      time: '数据缺失',
      content: '当前公告薪酬字段缺失，当前词条采用岗位人数倒推模拟薪酬区间，存在一定误差。',
      type: 'info' as const
    });
  }

  const recentTrend = records
    .slice(-24)
    .map((record, index) => ({
      positive: clamp(30 + (index % 8) * 2 + (record.count % 6), 5, 82),
      neutral: clamp(50 - (index % 5), 8, 70),
      negative: 0
    }));

  const positive = recentTrend.map((item) => item.positive);
  const neutral = recentTrend.map((item) => item.neutral);
  const negative = recentTrend.map((item, index) =>
    clamp(100 - item.positive - item.neutral + (index % 3), 5, 40)
  );

  const keywordMap = buildKeywordCount(records);
  const totalKeywords = Math.max(1, Array.from(keywordMap.values()).reduce((sum, num) => sum + num, 0));
  const keywordItems = [...keywordMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([word, value]) => ({
      word,
      count: value,
      percent: Number(((value / totalKeywords) * 100).toFixed(1))
    }));

  return {
    trend: {
      times: [...Array(24)].map((_, index) => `${String(index).padStart(2, '0')}:00`),
      positive,
      neutral,
      negative
    },
    warnings,
    keywords: keywordItems
  };
};

const buildEvolution = (records: NormalizedNotice[]): EvolutionNode[] => {
  const trend = buildMonthlyTrend(records, null, 8);
  if (trend.months.length === 0) {
    return [];
  }

  const maxHeat = Math.max(...trend.values, 1);
  const lastIndex = trend.months.length - 1;

  return trend.months.map((month, index) => {
    const keywords = buildKeywordCount(records.filter((record) => record.publishMonth === month))
      .entries();
    const keywordList = [...keywords]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, score]) => ({
        name,
        value: Math.max(40, Math.min(100, score * 12))
      }));

    const heat = Math.round((trend.values[index] / Math.max(1, maxHeat)) * 10000) + 3000;
    const status = index === lastIndex ? 'process' : index === lastIndex - 1 ? 'wait' : 'finish';

    return {
      id: index,
      time: month,
      title: `${month} 招聘需求节点`,
      desc: `基于广东省${month}公告数据构建`,
      heat,
      status,
      keywords: keywordList,
      summary: `该月共聚合 ${trend.values[index]} 人次职位数，当前状态：${status === 'process' ? '进行中' : '已确认'}.`
    };
  });
};

const inferInstitutionClass = (record: NormalizedNotice): string => {
  const text = `${record.unit} ${record.position} ${record.title}`.replace(/\s+/g, '');
  for (const cls of INSTITUTION_CLASS) {
    const keywords = INSTITUTION_CLASS_RULES[cls];
    if (keywords.some((rule) => rule.test(text))) {
      return cls;
    }
  }
  return '公益二类';
};

const computeBoxValues = (values: number[]): [number, number, number, number, number] | null => {
  if (values.length === 0) {
    return null;
  }
  const nums = values.slice().sort((a, b) => a - b);
  const len = nums.length;
  const q1 = nums[Math.floor(len * 0.25)] || nums[0];
  const median = nums[Math.floor(len * 0.5)] || nums[0];
  const q3 = nums[Math.floor(len * 0.75)] || nums[nums.length - 1];
  const iqr = q3 - q1;
  const lowFence = Math.max(1000, q1 - iqr * 1.5);
  const highFence = q3 + iqr * 1.5;
  const inliers = nums.filter((value) => value >= lowFence && value <= highFence);
  const outliers = nums.filter((value) => value < lowFence || value > highFence);
  if (inliers.length === 0) {
    return null;
  }
  return [
    Math.max(1000, inliers[0]),
    q1,
    median,
    q3,
    Math.max(inliers[inliers.length - 1], median)
  ];
};

const buildSalaryBoxData = (records: NormalizedNotice[]): SalaryBoxPlotData => {
  const buckets = new Map<string, number[]>();
  INSTITUTION_CLASS.forEach((name) => {
    buckets.set(name, []);
  });

  records.forEach((record) => {
    const cls = inferInstitutionClass(record);
    const bucket = buckets.get(cls) || [];
    const value = Math.max(3000, Math.min(50000, record.salaryK * 1000));
    bucket.push(Math.round(value));
    buckets.set(cls, bucket);
  });

  const values: number[][] = [];
  const outliers: Array<[number, number]> = [];
  INSTITUTION_CLASS.forEach((name, index) => {
    const bucket = buckets.get(name) || [];
    const box = computeBoxValues(bucket);
    if (!box) {
      values.push(SALARY_BOX_FALLBACK.values[index]);
      return;
    }
    values.push(box);
    const q1 = box[1];
    const q3 = box[3];
    const iqr = q3 - q1;
    const lowFence = Math.max(1000, q1 - iqr * 1.5);
    const highFence = q3 + iqr * 1.5;
    bucket.forEach((value) => {
      if (value < lowFence || value > highFence) {
        outliers.push([index, value]);
      }
    });
  });

  if (values.length === 0) {
    return SALARY_BOX_FALLBACK;
  }

  return {
    categories: INSTITUTION_CLASS,
    values,
    outliers
  };
};

const buildSunburstData = (records: NormalizedNotice[]): SunburstNode[] => {
  const cityBucketMap = new Map<string, Map<string, Map<string, number>>>();
  records.forEach((record) => {
    const city = record.city && record.city !== '广东省' ? record.city : '';
    if (!city) {
      return;
    }

    const cls = inferInstitutionClass(record);
    const education = record.education || '不限';
    const cityNode = cityBucketMap.get(city) || new Map<string, Map<string, number>>();
    const classNode = cityNode.get(cls) || new Map<string, number>();
    classNode.set(education, (classNode.get(education) || 0) + record.count);
    cityNode.set(cls, classNode);
    cityBucketMap.set(city, cityNode);
  });

  const topCities = [...cityBucketMap.entries()]
    .map(([name, bucket]) => ({
      name,
      count: [...bucket.values()].reduce((sum, valueMap) => {
        return sum + [...valueMap.values()].reduce((acc, n) => acc + n, 0);
      }, 0)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((item) => item.name);

  if (topCities.length === 0) {
    return SUNBURST_ROOT_FALLBACK;
  }

  return topCities.map((city) => {
    const classMap = cityBucketMap.get(city) || new Map<string, Map<string, number>>();
    const children: SunburstNode[] = [];
    INSTITUTION_CLASS.forEach((cls) => {
      const eduMap = classMap.get(cls);
      if (!eduMap || eduMap.size === 0) {
        return;
      }
      const classChildren = [...eduMap.entries()].map(([edu, count]) => ({
        name: edu,
        value: count,
      }));
      const classValue = classChildren.reduce((sum, node) => sum + (node.value || 0), 0);
      children.push({
        name: cls,
        value: classValue,
        children: classChildren.sort((a, b) => (b.value || 0) - (a.value || 0)),
      });
    });

    return {
      name: city,
      value: children.reduce((sum, node) => sum + (node.value || 0), 0),
      children
    };
  }).filter((item) => (item.children && item.children.length > 0));
};

const buildFallbackDashboard = (records: NormalizedNotice[]): DashboardData => {
  const keywordCounts = buildKeywordCount(records);
  const total = records.length || 1;
  return {
    hotSearch: buildHotSearch(records),
    categories: buildCategoryDistribution(records),
    trend: buildTrend(records),
    sentiment: buildSentimentBuckets(records),
    wordCloud: buildWordCloud(keywordCounts),
    mapData: buildMapData(records),
    salaryBoxData: buildSalaryBoxData(records),
    recruitmentSunburstData: buildSunburstData(records),
    kpi: buildKpi(records),
    educationDistribution: buildDistribution(records, 'education', EDUCATION_TAXONOMY),
    experienceDistribution: buildDistribution(records, 'experience', EXPERIENCE_TAXONOMY),
    supplyDemandRatios: buildSupplyDemand(records)
  };
};

type ReportType = ReportItem['type'];
type ReportPeriod = 'daily' | 'weekly' | 'monthly';

interface PeriodBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
  records: NormalizedNotice[];
}

const TFIDF_STOP_WORDS = new Set<string>([
  '事业单位',
  '公开招聘',
  '工作人员',
  '招聘',
  '岗位',
  '公告',
  '公示',
  '名单',
  '成绩',
  '通知'
]);

const TFIDF_BLACKLIST = new Set<string>([
  ...TFIDF_STOP_WORDS,
  ...CITY_KEYWORDS.map((item) => item.replace(/市/g, '')),
  '广东',
  '广东省',
  '关于',
  '转发',
  '相关',
  '事项',
  '公告发布',
  '公开',
  '集中',
  '第一批',
  '第二批',
  '第三批',
  '第四批'
]);

const CLUSTER_CENTERS: Record<string, [number, number]> = {
  '教育类': [26, 68],
  '医疗卫生': [24, 30],
  '行政管理': [66, 66],
  '科研技术': [68, 30]
};

const SALARY_BUCKET_DEFS = [
  { range: '8K以下', min: 0, max: 8 },
  { range: '8-15K', min: 8, max: 15 },
  { range: '15-25K', min: 15, max: 25 },
  { range: '25-35K', min: 25, max: 35 },
  { range: '35-50K', min: 35, max: 50 },
  { range: '50K以上', min: 50, max: 999 }
];

const pad2 = (value: number): string => String(value).padStart(2, '0');

const formatDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const formatDateTime = (date: Date): string =>
  `${formatDateKey(date)} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

const parseRecordDate = (record: NormalizedNotice): Date | null => {
  const timestamp = Date.parse(record.publishDate);
  if (Number.isFinite(timestamp)) {
    return new Date(timestamp);
  }
  return null;
};

const getWeekStartDate = (date: Date): Date => {
  const target = new Date(date);
  const day = target.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  target.setDate(target.getDate() + diff);
  target.setHours(0, 0, 0, 0);
  return target;
};

const getWeekEndDate = (weekStart: Date): Date => {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 0);
  return end;
};

const getIsoWeekNumber = (date: Date): number => {
  const target = new Date(date.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  return 1 + Math.round(
    ((target.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
};

const buildPeriodBuckets = (records: NormalizedNotice[], period: ReportPeriod): PeriodBucket[] => {
  const buckets = new Map<string, PeriodBucket>();

  records.forEach((record) => {
    const date = parseRecordDate(record);
    if (!date) {
      return;
    }

    if (period === 'daily') {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 0);
      const key = formatDateKey(start);
      const existing = buckets.get(key) || {
        key,
        label: key,
        start,
        end,
        records: []
      };
      existing.records.push(record);
      buckets.set(key, existing);
      return;
    }

    if (period === 'weekly') {
      const start = getWeekStartDate(date);
      const end = getWeekEndDate(start);
      const weekNo = getIsoWeekNumber(start);
      const key = `${start.getFullYear()}-W${pad2(weekNo)}`;
      const existing = buckets.get(key) || {
        key,
        label: `${start.getFullYear()}年第${pad2(weekNo)}周`,
        start,
        end,
        records: []
      };
      existing.records.push(record);
      buckets.set(key, existing);
      return;
    }

    const start = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 0);
    const key = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
    const existing = buckets.get(key) || {
      key,
      label: `${date.getFullYear()}年${pad2(date.getMonth() + 1)}月`,
      start,
      end,
      records: []
    };
    existing.records.push(record);
    buckets.set(key, existing);
  });

  return [...buckets.values()]
    .filter((item) => item.records.length > 0)
    .sort((a, b) => b.start.getTime() - a.start.getTime());
};

const buildKeywordDemandMap = (records: NormalizedNotice[]): Map<string, number> => {
  const map = new Map<string, number>();
  records.forEach((record) => {
    const terms = extractKeywords(`${record.position} ${record.title} ${record.unit} ${record.major}`);
    terms.forEach((term) => {
      map.set(term, (map.get(term) || 0) + record.count);
    });
  });
  return map;
};

const extractMiningTerms = (record: NormalizedNotice): string[] => {
  const text = normalizeText(`${record.position} ${record.title} ${record.unit} ${record.major}`);
  const terms = new Set<string>();

  extractKeywords(text).forEach((term) => {
    if (!TFIDF_BLACKLIST.has(term)) {
      terms.add(term);
    }
  });

  const chunks = text.match(/[\u4e00-\u9fa5]{2,12}/g) || [];
  chunks.forEach((chunk) => {
    const normalized = chunk
      .replace(/20\d{2}年/g, '')
      .replace(/第[一二三四五六七八九十\d]+批/g, '')
      .replace(/(?:公开|集中)?招聘/g, '')
      .replace(/(?:公告|公示|通知|名单|事项|信息)$/g, '')
      .replace(/(?:关于|转发)/g, '')
      .trim();

    if (normalized.length < 2 || normalized.length > 8) return;
    if (TFIDF_BLACKLIST.has(normalized)) return;
    if (/^\d+$/.test(normalized)) return;
    if (/^[一二三四五六七八九十]+$/.test(normalized)) return;
    terms.add(normalized);
  });

  return [...terms];
};

const buildMiningKeywordData = (records: NormalizedNotice[]): WordCloudItem[] => {
  if (records.length === 0) {
    return [];
  }

  const documentCount = records.length;
  const tf = new Map<string, number>();
  const df = new Map<string, number>();
  let totalTermWeight = 0;

  records.forEach((record) => {
    const terms = extractMiningTerms(record);
    if (terms.length === 0) {
      return;
    }

    const uniqueTerms = new Set<string>();
    terms.forEach((term) => {
      const weight = Math.max(1, Math.round(Math.sqrt(record.count)));
      tf.set(term, (tf.get(term) || 0) + weight);
      totalTermWeight += weight;
      uniqueTerms.add(term);
    });

    uniqueTerms.forEach((term) => {
      df.set(term, (df.get(term) || 0) + 1);
    });
  });

  const scores = [...tf.entries()].map(([term, freq]) => {
    const docFreq = df.get(term) || 1;
    const idf = Math.log((documentCount + 1) / (docFreq + 1)) + 1;
    const score = (freq / Math.max(1, totalTermWeight)) * idf;
    return {
      name: term,
      raw: score,
      count: freq
    };
  });

  const top = scores
    .sort((a, b) => b.raw - a.raw)
    .slice(0, 160);

  const maxScore = Math.max(...top.map((item) => item.raw), 1e-6);

  return top.map((item) => ({
    name: item.name,
    value: Number((item.raw / maxScore).toFixed(3)),
    count: item.count
  }));
};

const getClusterCategory = (record: NormalizedNotice): string => {
  const category = classifyCategory(record);
  if (category === '教育教学') return '教育类';
  if (category === '医疗卫生') return '医疗卫生';
  if (category === '行政管理' || category === '财务会计') return '行政管理';
  return '科研技术';
};

const buildClusterData = (records: NormalizedNotice[]): ClusterPoint[] => {
  const clusterMap = new Map<string, Map<string, number>>();

  records.forEach((record) => {
    const category = getClusterCategory(record);
    const label = record.position || '事业单位岗位';
    const bucket = clusterMap.get(category) || new Map<string, number>();
    bucket.set(label, (bucket.get(label) || 0) + record.count);
    clusterMap.set(category, bucket);
  });

  const points: ClusterPoint[] = [];
  Object.entries(CLUSTER_CENTERS).forEach(([category, center]) => {
    const [cx, cy] = center;
    const positions = [...(clusterMap.get(category)?.entries() || [])]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    positions.forEach(([label, demand], index) => {
      const seed = buildStableSeed(`${category}-${label}`);
      const dx = (seed % 15) - 7 + (index % 3) * 1.8;
      const dy = (Math.floor(seed / 17) % 15) - 7 + (index % 4) * 1.4;
      const size = clamp(Number((Math.sqrt(demand) * 2.3).toFixed(1)), 16, 88);
      points.push([
        Number((cx + dx).toFixed(1)),
        Number((cy + dy).toFixed(1)),
        Number(size),
        label.length > 14 ? `${label.slice(0, 14)}…` : label,
        category
      ]);
    });
  });

  return points;
};

const buildReportSummary = (
  records: NormalizedNotice[],
  periodLabel: string,
  previousRecords: NormalizedNotice[] = []
): ReportSummary => {
  const totalJobs = records.reduce((sum, item) => sum + item.count, 0);
  const activeCities = new Set(records.map((item) => item.city).filter((item) => item && item !== '广东省')).size;
  const avgSalaryK = Number(
    (
      records.reduce((sum, item) => sum + item.salaryK * Math.max(1, item.count), 0) /
      Math.max(1, totalJobs)
    ).toFixed(1)
  );

  const cityDemandMap = new Map<string, number>();
  records.forEach((record) => {
    const city = record.city || '广东省';
    cityDemandMap.set(city, (cityDemandMap.get(city) || 0) + record.count);
  });
  const cityRanking = [...cityDemandMap.entries()]
    .filter(([name]) => name && name !== '广东省')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const industryMap = new Map<string, number>();
  records.forEach((record) => {
    const category = classifyCategory(record);
    industryMap.set(category, (industryMap.get(category) || 0) + record.count);
  });
  const industryRanking = [...industryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({
      name,
      value: Math.max(1, Math.round((value / Math.max(1, totalJobs)) * 100))
    }));

  const salaryCounts = SALARY_BUCKET_DEFS.map((item) => ({ ...item, count: 0 }));
  records.forEach((record) => {
    const idx = salaryCounts.findIndex((item) => record.salaryK >= item.min && record.salaryK < item.max);
    const bucketIndex = idx >= 0 ? idx : salaryCounts.length - 1;
    salaryCounts[bucketIndex].count += record.count;
  });
  const salaryBuckets = salaryCounts.map((item) => ({
    range: item.range,
    count: item.count,
    ratio: Math.round((item.count / Math.max(1, totalJobs)) * 100)
  }));

  const currentTerms = buildKeywordDemandMap(records);
  const previousTerms = buildKeywordDemandMap(previousRecords);
  const skillHeatChanges = [...currentTerms.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, value]) => {
      const prev = previousTerms.get(skill) || 0;
      const delta = prev > 0
        ? Math.round(((value - prev) / prev) * 100)
        : Math.round((value / Math.max(1, totalJobs)) * 100);
      return {
        skill,
        delta: Math.max(0, delta)
      };
    });

  const riskAlerts: string[] = [];
  const unknownCityRate = Math.round((records.filter((item) => item.city === '广东省').length / Math.max(1, records.length)) * 100);
  if (unknownCityRate > 25) {
    riskAlerts.push(`约 ${unknownCityRate}% 公告未明确地市字段，建议补充“单位-地市”映射以提升报表准确性。`);
  }

  const topCity = cityRanking[0];
  if (topCity) {
    const topCityRatio = Math.round((topCity.value / Math.max(1, totalJobs)) * 100);
    if (topCityRatio > 32) {
      riskAlerts.push(`${topCity.name} 岗位占比约 ${topCityRatio}%，区域需求集中度偏高，建议关注供给侧匹配。`);
    }
  }

  const lowSalaryBucket = salaryBuckets.find((item) => item.range === '8K以下');
  if ((lowSalaryBucket?.ratio || 0) > 35) {
    riskAlerts.push(`低于 8K 岗位占比约 ${lowSalaryBucket?.ratio}%，建议在报告中单独标注岗位层级与编制属性差异。`);
  }

  if (riskAlerts.length === 0) {
    riskAlerts.push('核心指标整体稳定，未发现显著异常波动。');
    riskAlerts.push('建议持续监测重点地市与高频岗位关键词的周环比变化。');
  }

  return {
    periodLabel,
    coreMetrics: {
      totalJobs,
      activeCities: Math.max(1, activeCities),
      avgSalaryK,
      newJobs: totalJobs
    },
    cityRanking: cityRanking.length > 0 ? cityRanking : [{ name: '广东省', value: totalJobs }],
    industryRanking: industryRanking.length > 0 ? industryRanking : [{ name: '其他类', value: 100 }],
    salaryBuckets,
    skillHeatChanges: skillHeatChanges.length > 0 ? skillHeatChanges : [{ skill: '公开招聘', delta: 0 }],
    riskAlerts
  };
};

const buildReportId = (type: ReportType, bucket: PeriodBucket, uniqueSuffix = ''): string => {
  if (type === 'daily') {
    return `RPT-D-${bucket.key.replace(/-/g, '')}${uniqueSuffix}`;
  }
  if (type === 'weekly') {
    return `RPT-W-${bucket.key.replace(/-W/, '').replace(/-/g, '')}${uniqueSuffix}`;
  }
  return `RPT-M-${bucket.key.replace(/-/g, '')}${uniqueSuffix}`;
};

const estimateReportSize = (type: ReportType, totalJobs: number): string => {
  const base = type === 'monthly' ? 3.2 : type === 'weekly' ? 2.0 : 1.0;
  const value = base + totalJobs / 32000;
  return `${value.toFixed(1)} MB`;
};

const buildReportItemFromBucket = (
  type: ReportType,
  bucket: PeriodBucket,
  previousRecords: NormalizedNotice[] = [],
  unique = false
): ReportItem => {
  const summary = buildReportSummary(bucket.records, bucket.label, previousRecords);
  const now = new Date();
  const createAt = unique ? now : new Date(bucket.end);
  if (!unique) {
    createAt.setHours(8, 30, 0, 0);
  }
  const typeLabel: Record<ReportType, string> = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    special: '专项报告',
    urgent: '快报'
  };

  return {
    id: buildReportId(type, bucket, unique ? `-${Date.now()}` : ''),
    title: `广东事业单位招聘${typeLabel[type]}（${bucket.label}）`,
    timeRange: `${formatDateKey(bucket.start)} 00:00 - ${formatDateKey(bucket.end)} 23:59`,
    createTime: formatDateTime(createAt),
    size: estimateReportSize(type, summary.coreMetrics.totalJobs),
    status: 'completed',
    type,
    summary
  };
};

const buildReportArchive = (records: NormalizedNotice[]): ReportItem[] => {
  const dailyBuckets = buildPeriodBuckets(records, 'daily').slice(0, 2);
  const weeklyBuckets = buildPeriodBuckets(records, 'weekly').slice(0, 3);
  const monthlyBuckets = buildPeriodBuckets(records, 'monthly').slice(0, 3);

  const reports: ReportItem[] = [];
  dailyBuckets.forEach((bucket, index) => {
    reports.push(buildReportItemFromBucket('daily', bucket, dailyBuckets[index + 1]?.records || []));
  });
  weeklyBuckets.forEach((bucket, index) => {
    reports.push(buildReportItemFromBucket('weekly', bucket, weeklyBuckets[index + 1]?.records || []));
  });
  monthlyBuckets.forEach((bucket, index) => {
    reports.push(buildReportItemFromBucket('monthly', bucket, monthlyBuckets[index + 1]?.records || []));
  });

  return reports.sort((a, b) => Date.parse(b.createTime) - Date.parse(a.createTime));
};

const resolveReportPeriod = (type: ReportType): ReportPeriod => {
  if (type === 'monthly' || type === 'special') return 'monthly';
  if (type === 'weekly') return 'weekly';
  return 'daily';
};

const buildGeneratedReport = (records: NormalizedNotice[], type: ReportType): ReportItem | null => {
  const period = resolveReportPeriod(type);
  const buckets = buildPeriodBuckets(records, period);
  if (buckets.length === 0) {
    return null;
  }
  const current = buckets[0];
  const previous = buckets[1]?.records || [];
  return buildReportItemFromBucket(type, current, previous, true);
};

export const isRecruitmentDataAvailable = normalisedNotices.length > 20;

export const getRecruitmentDashboardData = (): DashboardData | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  const records = normalisedNotices.slice();
  if (records.length === 0) {
    return null;
  }

  try {
    return buildFallbackDashboard(records);
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildDashboardData failed', error);
    return null;
  }
};

export const getRecruitmentRelationGraph = (): GraphData | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    const records = normalisedNotices.slice();
    const sorted = [...records].sort((a, b) => b.count - a.count);
    const topJobs = sorted.slice(0, 20);
    const keywordCounts = buildKeywordCount(records);
    const keywordNodes = [...keywordCounts.entries()]
      .filter(([, count]) => count > 0)
      .map(([name]) => name)
      .slice(0, 16);

    const cityMap = [...new Set(records.map((item) => item.city))].filter((name) => name && name !== '广东省').slice(0, 10);

    const nodeMap = new Map<string, GraphNode>();
    const nodes: GraphNode[] = [];
    const categories = [{ name: '岗位' }, { name: '关键词' }, { name: '地市' }, { name: '单位' }];

    topJobs.forEach((item, index) => {
      const node: GraphNode = {
        id: `job_${index}`,
        name: item.position,
        symbolSize: clamp(92 - index, 44, 92),
        value: Math.max(30, Math.min(100, item.count / 250)),
        category: 0
      };
      nodeMap.set(node.id, node);
      nodes.push(node);
    });

    const keyNodeIds: string[] = [];
    keywordNodes.forEach((item, index) => {
      const nodeId = `kw_${index}`;
      const node: GraphNode = {
        id: nodeId,
        name: item,
        symbolSize: clamp(56 - index, 24, 56),
        value: Math.max(40, 100 - index * 2),
        category: 1
      };
      keyNodeIds.push(nodeId);
      nodeMap.set(nodeId, node);
      nodes.push(node);
    });

    cityMap.forEach((city, index) => {
      const nodeId = `city_${index}`;
      const cityNode: GraphNode = {
        id: nodeId,
        name: city,
        symbolSize: clamp(60 - index, 30, 60),
        value: Math.max(35, 90 - index * 4),
        category: 2
      };
      nodeMap.set(cityNode.id, cityNode);
      nodes.push(cityNode);
    });

    const links: GraphLink[] = [];

    topJobs.forEach((item, index) => {
      const base = keyNodeIds.length > 0 ? keyNodeIds[index % keyNodeIds.length] : null;
      if (base) {
        links.push({ source: `job_${index}`, target: base });
      }

      const cityIndex = cityMap.indexOf(item.city);
      if (cityIndex >= 0) {
        links.push({ source: `job_${index}`, target: `city_${cityIndex}` });
      }
    });

    const fallbackUnit = topJobs[0]?.unit || '广东事业单位';
    const unitNode: GraphNode = {
      id: 'unit_fallback',
      name: fallbackUnit,
      symbolSize: 46,
      value: 60,
      category: 3
    };
    nodes.push(unitNode);

    topJobs.slice(0, 10).forEach((_, index) => {
      links.push({ source: `job_${index}`, target: 'unit_fallback' });
    });

    return {
      categories,
      nodes,
      links
    };
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildRelationGraph failed', error);
    return null;
  }
};

export const getRecruitmentGeoMapData = (): MapData[] | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    return buildAnalysisMapData(normalisedNotices);
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildGeoMapData failed', error);
    return null;
  }
};

export const getRecruitmentComparisonData = (topicA: string, topicB: string): ComparisonData | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    return buildComparison(normalisedNotices, topicA, topicB);
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildComparisonData failed', error);
    return null;
  }
};

export const getRecruitmentSentimentDashboard = (): SentimentDashboardData | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    return buildSentiment(normalisedNotices);
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildSentimentDashboard failed', error);
    return null;
  }
};

export const getRecruitmentEvolutionData = (): EvolutionNode[] | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    return buildEvolution(normalisedNotices);
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildEvolution failed', error);
    return null;
  }
};

export const getRecruitmentMiningKeywords = (): WordCloudItem[] | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    const items = buildMiningKeywordData(normalisedNotices);
    return items.length > 0 ? items : null;
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildMiningKeywordData failed', error);
    return null;
  }
};

export const getRecruitmentClusterPoints = (): ClusterPoint[] | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    const points = buildClusterData(normalisedNotices);
    return points.length > 0 ? points : null;
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildClusterData failed', error);
    return null;
  }
};

export const getRecruitmentReportArchive = (): ReportItem[] | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    const reports = buildReportArchive(normalisedNotices);
    return reports.length > 0 ? reports : null;
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildReportArchive failed', error);
    return null;
  }
};

export const getRecruitmentGeneratedReport = (type: ReportType): ReportItem | null => {
  if (!isRecruitmentDataAvailable) {
    return null;
  }

  try {
    return buildGeneratedReport(normalisedNotices, type);
  } catch (error) {
    console.error('[recruitmentDataAdapter] buildGeneratedReport failed', error);
    return null;
  }
};
