export interface CrawledJobRecord {
  id: number;
  rank: number;
  jobTitle: string;
  company: string;
  city: string;
  salaryMin: number;
  salaryMax: number;
  education: string;
  experience: string;
  demand: number;
  crawlTime: string;
  note?: string;
}

const BASE_JOBS: CrawledJobRecord[] = [
  { id: 1, rank: 1, jobTitle: '前端开发工程师', company: '字节跳动', city: '北京', salaryMin: 25, salaryMax: 40, education: '本科', experience: '3-5年', demand: 18620, crawlTime: '2026-02-12 09:31:04' },
  { id: 2, rank: 2, jobTitle: 'Java后端开发', company: '阿里巴巴', city: '杭州', salaryMin: 30, salaryMax: 48, education: '本科', experience: '3-5年', demand: 17940, crawlTime: '2026-02-12 09:28:41' },
  { id: 3, rank: 3, jobTitle: '算法工程师(AIGC)', company: '腾讯', city: '深圳', salaryMin: 45, salaryMax: 75, education: '硕士', experience: '3-5年', demand: 17110, crawlTime: '2026-02-12 09:25:20' },
  { id: 4, rank: 4, jobTitle: '数据平台架构师', company: '某新锐独角兽', city: '北京', salaryMin: 80, salaryMax: 120, education: '本科', experience: '3-5年', demand: 12810, crawlTime: '2026-02-12 09:18:52', note: '薪资区间波动异常' },
  { id: 5, rank: 5, jobTitle: '测试开发工程师', company: '网易', city: '杭州', salaryMin: 18, salaryMax: 30, education: '本科', experience: '1-3年', demand: 12480, crawlTime: '2026-02-12 09:15:36' },
  { id: 6, rank: 6, jobTitle: '机器学习平台工程师', company: '滴滴', city: '北京', salaryMin: 35, salaryMax: 60, education: '硕士', experience: '3-5年', demand: 12300, crawlTime: '2026-02-12 09:12:18' },
  { id: 7, rank: 7, jobTitle: 'Android开发', company: 'OPPO', city: '深圳', salaryMin: 22, salaryMax: 36, education: '本科', experience: '3-5年', demand: 11650, crawlTime: '2026-02-12 09:07:45' },
  { id: 8, rank: 8, jobTitle: '信息安全工程师', company: '奇安信', city: '北京', salaryMin: 28, salaryMax: 45, education: '本科', experience: '3-5年', demand: 11390, crawlTime: '2026-02-12 09:04:23' },
  { id: 9, rank: 9, jobTitle: 'Golang工程师', company: '蚂蚁集团', city: '杭州', salaryMin: 32, salaryMax: 55, education: '本科', experience: '3-5年', demand: 10810, crawlTime: '2026-02-12 08:58:11' },
  { id: 10, rank: 10, jobTitle: '云原生平台工程师', company: '腾讯云', city: '上海', salaryMin: 34, salaryMax: 58, education: '本科', experience: '3-5年', demand: 10620, crawlTime: '2026-02-12 08:55:30' },
  { id: 11, rank: 11, jobTitle: '推荐算法工程师', company: '快手', city: '北京', salaryMin: 40, salaryMax: 70, education: '硕士', experience: '3-5年', demand: 10480, crawlTime: '2026-02-12 08:53:16' },
  { id: 12, rank: 12, jobTitle: '数据治理工程师', company: '京东科技', city: '北京', salaryMin: 24, salaryMax: 38, education: '本科', experience: '3-5年', demand: 10290, crawlTime: '2026-02-12 08:50:04' },
  { id: 13, rank: 13, jobTitle: 'SRE工程师', company: '美团', city: '北京', salaryMin: 32, salaryMax: 52, education: '本科', experience: '3-5年', demand: 10150, crawlTime: '2026-02-12 08:47:21' },
  { id: 14, rank: 14, jobTitle: '机器学习工程师', company: '商汤科技', city: '上海', salaryMin: 36, salaryMax: 62, education: '硕士', experience: '3-5年', demand: 9980, crawlTime: '2026-02-12 08:44:15' },
  { id: 15, rank: 15, jobTitle: '风控建模工程师', company: '微众银行', city: '深圳', salaryMin: 33, salaryMax: 56, education: '本科', experience: '3-5年', demand: 9860, crawlTime: '2026-02-12 08:41:40' },
  { id: 16, rank: 16, jobTitle: '数据产品经理', company: '携程', city: '上海', salaryMin: 28, salaryMax: 45, education: '本科', experience: '5-10年', demand: 9680, crawlTime: '2026-02-12 08:35:09' },
  { id: 17, rank: 17, jobTitle: '图数据库工程师', company: '小米', city: '北京', salaryMin: 30, salaryMax: 48, education: '本科', experience: '3-5年', demand: 9540, crawlTime: '2026-02-12 08:32:40' },
  { id: 18, rank: 18, jobTitle: 'Prompt工程师', company: '智谱', city: '北京', salaryMin: 38, salaryMax: 65, education: '硕士', experience: '1-3年', demand: 9410, crawlTime: '2026-02-12 08:29:12' },
  { id: 19, rank: 19, jobTitle: '数据仓库开发', company: '拼多多', city: '上海', salaryMin: 27, salaryMax: 44, education: '本科', experience: '3-5年', demand: 9280, crawlTime: '2026-02-12 08:26:53' },
  { id: 20, rank: 20, jobTitle: '数据可视化工程师', company: '滴滴', city: '北京', salaryMin: 25, salaryMax: 41, education: '本科', experience: '3-5年', demand: 8710, crawlTime: '2026-02-12 08:11:39' }
];

const TARGET_CRAWL_COUNT = 4000;
const SEED = 20260213;

const TITLES = [
  '前端开发工程师', 'Java后端开发', 'Python开发工程师', 'Golang工程师', '算法工程师',
  '数据分析师', '机器学习工程师', '云原生平台工程师', 'SRE工程师', '测试开发工程师',
  '推荐算法工程师', '数据仓库开发', '产品经理', '数据产品经理', '信息安全工程师',
  'AIGC应用工程师', 'Prompt工程师', '图数据库工程师', '大数据工程师', 'BI工程师',
  '移动端开发工程师', '跨端开发工程师', '运维开发工程师', '数据治理工程师', '可视化工程师'
];

const COMPANIES = [
  '字节跳动', '阿里巴巴', '腾讯', '美团', '京东', '百度', '华为', '网易', '快手', '小米',
  '蚂蚁集团', '拼多多', '滴滴', '携程', 'OPPO', '理想汽车', 'BOSS直聘', '微众银行', '同程旅行', '蔚来汽车',
  '某成长型科技公司', '某AI创业公司', '某产业互联网平台', '某出海电商平台'
];

const CITIES = [
  '北京', '上海', '深圳', '杭州', '广州', '成都', '武汉', '南京', '苏州', '西安',
  '重庆', '天津', '青岛', '长沙', '郑州', '合肥', '厦门', '佛山', '宁波', '福州'
];

const EDUCATION = ['大专', '本科', '硕士'];
const EXPERIENCE = ['应届/实习', '1-3年', '3-5年', '5-10年'];

const formatDateTime = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
};

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const createSyntheticCrawledJobs = (startId: number, count: number): CrawledJobRecord[] => {
  const rand = createSeededRandom(SEED);
  const now = Date.now();
  const rows: CrawledJobRecord[] = [];

  for (let index = 0; index < count; index += 1) {
    const id = startId + index;
    const salaryMin = Math.max(8, Math.round(12 + rand() * 28));
    const salaryMax = salaryMin + Math.max(6, Math.round(8 + rand() * 20));
    const demand = Math.max(1600, Math.round(4200 + rand() * 4200));
    const crawlOffset = index * 45_000 + Math.floor(rand() * 6_000_000);

    rows.push({
      id,
      rank: id,
      jobTitle: TITLES[Math.floor(rand() * TITLES.length)],
      company: COMPANIES[Math.floor(rand() * COMPANIES.length)],
      city: CITIES[Math.floor(rand() * CITIES.length)],
      salaryMin,
      salaryMax,
      education: EDUCATION[Math.floor(rand() * EDUCATION.length)],
      experience: EXPERIENCE[Math.floor(rand() * EXPERIENCE.length)],
      demand,
      crawlTime: formatDateTime(new Date(now - crawlOffset))
    });
  }

  return rows;
};

const GENERATED_JOBS = createSyntheticCrawledJobs(
  BASE_JOBS.length + 1,
  Math.max(0, TARGET_CRAWL_COUNT - BASE_JOBS.length)
);

export const MOCK_CRAWLED_JOBS: CrawledJobRecord[] = [...BASE_JOBS, ...GENERATED_JOBS]
  .sort((a, b) => b.demand - a.demand)
  .map((item, index) => ({
    ...item,
    rank: index + 1
  }));

