import { HotSearchItem, CategoryData, TrendData, SentimentData, WordCloudItem, MapData } from '../types';

export const MOCK_HOT_SEARCH: HotSearchItem[] = [
  { id: 1, rank: 1, keyword: '前端开发工程师', company: '字节跳动', city: '北京', salary: '25-40K', education: '本科', experience: '3-5年', heat: 18620, tag: 'boiling' },
  { id: 2, rank: 2, keyword: 'Java后端开发', company: '阿里巴巴', city: '杭州', salary: '30-48K', education: '本科', experience: '3-5年', heat: 17940, tag: 'hot' },
  { id: 3, rank: 3, keyword: '算法工程师(AIGC)', company: '腾讯', city: '深圳', salary: '45-75K', education: '硕士', experience: '3-5年', heat: 17110, tag: 'new' },
  { id: 4, rank: 4, keyword: '数据分析师', company: '美团', city: '北京', salary: '18-32K', education: '本科', experience: '1-3年', heat: 16320, tag: 'hot' },
  { id: 5, rank: 5, keyword: '产品经理', company: '京东', city: '北京', salary: '24-42K', education: '本科', experience: '3-5年', heat: 15970 },
  { id: 6, rank: 6, keyword: 'Python开发工程师', company: '百度', city: '上海', salary: '20-36K', education: '本科', experience: '3-5年', heat: 15280, tag: 'new' },
  { id: 7, rank: 7, keyword: '大数据工程师', company: '华为', city: '深圳', salary: '28-50K', education: '本科', experience: '3-5年', heat: 14910, tag: 'urgent' },
  { id: 8, rank: 8, keyword: '测试开发工程师', company: '网易', city: '杭州', salary: '18-30K', education: '本科', experience: '1-3年', heat: 14360 },
  { id: 9, rank: 9, keyword: '运维工程师(DevOps)', company: '快手', city: '北京', salary: '24-38K', education: '本科', experience: '3-5年', heat: 13940 },
  { id: 10, rank: 10, keyword: 'UI/UX设计师', company: '小米', city: '北京', salary: '16-28K', education: '本科', experience: '1-3年', heat: 13680 },
  { id: 11, rank: 11, keyword: 'Golang工程师', company: '蚂蚁集团', city: '杭州', salary: '32-55K', education: '本科', experience: '3-5年', heat: 13350, tag: 'hot' },
  { id: 12, rank: 12, keyword: '推荐算法工程师', company: '哔哩哔哩', city: '上海', salary: '38-68K', education: '硕士', experience: '3-5年', heat: 12970 },
  { id: 13, rank: 13, keyword: '销售运营分析师', company: '拼多多', city: '上海', salary: '20-34K', education: '本科', experience: '1-3年', heat: 12640 },
  { id: 14, rank: 14, keyword: '机器学习平台工程师', company: '滴滴', city: '北京', salary: '35-60K', education: '硕士', experience: '3-5年', heat: 12380, tag: 'new' },
  { id: 15, rank: 15, keyword: '移动端开发(iOS)', company: '携程', city: '上海', salary: '24-38K', education: '本科', experience: '3-5年', heat: 12090 },
  { id: 16, rank: 16, keyword: 'Android开发', company: 'OPPO', city: '深圳', salary: '22-36K', education: '本科', experience: '3-5年', heat: 11870 },
  { id: 17, rank: 17, keyword: '信息安全工程师', company: '奇安信', city: '北京', salary: '28-45K', education: '本科', experience: '3-5年', heat: 11620, tag: 'urgent' },
  { id: 18, rank: 18, keyword: 'BI工程师', company: '理想汽车', city: '北京', salary: '22-35K', education: '本科', experience: '3-5年', heat: 11390 },
  { id: 19, rank: 19, keyword: '嵌入式开发', company: '大疆', city: '深圳', salary: '26-40K', education: '本科', experience: '3-5年', heat: 11130 },
  { id: 20, rank: 20, keyword: 'HR数据产品经理', company: 'BOSS直聘', city: '上海', salary: '24-39K', education: '本科', experience: '5-10年', heat: 10860 }
];

export const MOCK_CATEGORY_DATA: CategoryData[] = [
  { name: '互联网/软件', value: 30 },
  { name: '智能制造', value: 15 },
  { name: '金融科技', value: 12 },
  { name: '电商零售', value: 11 },
  { name: '医疗健康', value: 9 },
  { name: '游戏文娱', value: 7 },
  { name: '汽车出行', value: 6 },
  { name: '教育服务', value: 5 },
  { name: '能源环保', value: 3 },
  { name: '其他行业', value: 2 }
];

export const MOCK_TREND_DATA: TrendData[] = [
  { time: '2025-01', heat: 8800, forecast: null },
  { time: '2025-02', heat: 7600, forecast: null },
  { time: '2025-03', heat: 12600, forecast: null },
  { time: '2025-04', heat: 11900, forecast: null },
  { time: '2025-05', heat: 11200, forecast: null },
  { time: '2025-06', heat: 11650, forecast: null },
  { time: '2025-07', heat: 10280, forecast: null },
  { time: '2025-08', heat: 10860, forecast: null },
  { time: '2025-09', heat: 12140, forecast: null },
  { time: '2025-10', heat: 12980, forecast: null },
  { time: '2025-11', heat: 13720, forecast: 13720 },
  { time: '2025-12', heat: null, forecast: 14500 },
  { time: '2026-01', heat: null, forecast: 15160 },
  { time: '2026-02', heat: null, forecast: 15840 }
];

export const MOCK_SENTIMENT_DATA: SentimentData[] = [
  { name: '8K以下', value: 6, itemStyle: { color: '#64748b', shadowBlur: 10, shadowColor: 'rgba(100, 116, 139, 0.45)' } },
  { name: '8-15K', value: 18, itemStyle: { color: '#94a3b8', shadowBlur: 10, shadowColor: 'rgba(148, 163, 184, 0.45)' } },
  { name: '15-25K', value: 31, itemStyle: { color: '#10b981', shadowBlur: 10, shadowColor: 'rgba(16, 185, 129, 0.45)' } },
  { name: '25-35K', value: 23, itemStyle: { color: '#3b82f6', shadowBlur: 10, shadowColor: 'rgba(59, 130, 246, 0.45)' } },
  { name: '35-50K', value: 15, itemStyle: { color: '#8b5cf6', shadowBlur: 10, shadowColor: 'rgba(139, 92, 246, 0.45)' } },
  { name: '50K以上', value: 7, itemStyle: { color: '#f43f5e', shadowBlur: 10, shadowColor: 'rgba(244, 63, 94, 0.45)' } }
];

const WORD_CLOUD_SKILLS = [
  'React', 'TypeScript', 'Python', 'Java', 'Spring Boot', 'Vue', 'Node.js', 'MySQL', 'Redis', 'Docker',
  'Kubernetes', 'ClickHouse', 'Flink', 'Spark', 'TensorFlow', 'LLM', 'Prompt Engineering', 'GraphQL', 'PostgreSQL', 'Go',
  'Rust', 'Kafka', 'Elasticsearch', 'Hadoop', 'Hive', 'Airflow', 'NLP', 'RAG', '向量数据库', '机器学习平台',
  'A/B Testing', '数据中台', '数据治理', '微服务', '云原生', 'CI/CD', 'GitOps', 'DevOps', '性能调优', '自动化测试',
  'Android', 'iOS', 'Flutter', '跨端开发', '低代码', '大模型应用', 'Agent', '推荐算法', '搜索排序', '图数据库',
  '数仓建模', '实时计算', '风控建模', '隐私计算', '多模态', '多云架构', '网络安全', '渗透测试', '零信任', 'SRE'
];

export const MOCK_WORD_CLOUD: WordCloudItem[] = WORD_CLOUD_SKILLS.map((name, index) => ({
  name,
  value: Math.max(18, Math.round(100 - index * 1.3))
}));

export const MOCK_MAP_DATA: MapData[] = [
  { name: '北京', value: 95, topics: ['算法工程师', '前端开发工程师', '大模型应用工程师'] },
  { name: '上海', value: 92, topics: ['Java后端开发', '数据分析师', 'BI工程师'] },
  { name: '广东', value: 90, topics: ['大数据工程师', '测试开发', '嵌入式开发'] },
  { name: '浙江', value: 87, topics: ['Golang工程师', '运维工程师', '产品经理'] },
  { name: '江苏', value: 84, topics: ['Java开发', '算法工程师', 'UI设计师'] },
  { name: '四川', value: 79, topics: ['Python开发', '测试工程师', '数据分析师'] },
  { name: '湖北', value: 76, topics: ['前端开发工程师', '运维工程师', '安卓开发'] },
  { name: '陕西', value: 72, topics: ['嵌入式开发', '算法工程师', 'Go开发'] },
  { name: '湖南', value: 70, topics: ['UI设计师', '测试开发', 'HR数据产品经理'] },
  { name: '山东', value: 69, topics: ['Java开发', '销售运营', '数据产品经理'] },
  { name: '天津', value: 66, topics: ['云原生工程师', '测试开发', '数据治理工程师'] },
  { name: '重庆', value: 68, topics: ['后端开发', '大数据平台工程师', '产品运营'] },
  { name: '福建', value: 64, topics: ['前端开发', '跨端开发', '运维开发'] },
  { name: '安徽', value: 61, topics: ['自动化测试', 'Java开发', '数据分析师'] },
  { name: '江西', value: 58, topics: ['Python开发', '云运维', '移动端开发'] },
  { name: '河北', value: 57, topics: ['测试工程师', '信息安全工程师', '数据清洗工程师'] },
  { name: '山西', value: 52, topics: ['工业互联网工程师', '后端开发', '实施顾问'] },
  { name: '辽宁', value: 55, topics: ['C++开发', '嵌入式工程师', '算法工程师'] },
  { name: '吉林', value: 49, topics: ['Java开发', '测试开发', '运维工程师'] },
  { name: '黑龙江', value: 47, topics: ['数据开发', '信息安全', '系统运维'] },
  { name: '河南', value: 62, topics: ['前端开发', '后端开发', '电商数据分析'] },
  { name: '广西', value: 53, topics: ['软件实施', '测试工程师', '数据标注工程师'] },
  { name: '海南', value: 41, topics: ['旅游平台开发', '产品经理', '小程序开发'] },
  { name: '贵州', value: 50, topics: ['大数据工程师', '算力运维', '平台开发'] },
  { name: '云南', value: 46, topics: ['全栈开发', '运维工程师', '项目实施'] },
  { name: '甘肃', value: 43, topics: ['后端开发', '数据治理', '系统集成'] },
  { name: '青海', value: 36, topics: ['云平台运维', '网络工程师', '数据处理'] },
  { name: '宁夏', value: 39, topics: ['运维开发', '大数据运维', '测试开发'] },
  { name: '新疆', value: 44, topics: ['信息安全工程师', '后端开发', '数字化运维'] },
  { name: '内蒙古', value: 45, topics: ['工业数据开发', '运维工程师', '算法支持工程师'] },
  { name: '台湾', value: 59, topics: ['芯片验证工程师', 'iOS开发', '跨境电商技术'] }
];
