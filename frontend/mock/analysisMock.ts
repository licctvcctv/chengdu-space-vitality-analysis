import { EvolutionNode, SentimentDashboardData, ClusterPoint } from '../types';

export const MOCK_EVOLUTION_DATA: EvolutionNode[] = [
  {
    id: 0,
    time: '07:00',
    title: '前端开发热度回升',
    desc: '前端岗位在早间招聘窗口回暖',
    heat: 7800,
    status: 'finish',
    keywords: [
      { name: 'React', value: 100 },
      { name: 'TypeScript', value: 90 },
      { name: 'Vue3', value: 82 },
      { name: '可视化', value: 80 },
      { name: '跨端开发', value: 72 }
    ],
    summary: '历史数据表明前端岗位在早间回升明显，预计 07:00-09:00 发布活跃度持续上行。'
  },
  {
    id: 1,
    time: '10:00',
    title: 'Java后端需求冲高',
    desc: '中台与交易系统类岗位集中释放',
    heat: 11200,
    status: 'finish',
    keywords: [
      { name: 'Java', value: 94 },
      { name: 'Spring Boot', value: 90 },
      { name: '微服务', value: 85 },
      { name: '高并发', value: 81 },
      { name: 'MySQL', value: 78 }
    ],
    summary: '10:00 时段后端岗位热度稳定上扬，交易、支付与中台方向预计继续成为热门。'
  },
  {
    id: 2,
    time: '12:30',
    title: 'AIGC岗位持续上扬',
    desc: '模型应用与推理优化岗位继续增长',
    heat: 13400,
    status: 'finish',
    keywords: [
      { name: 'LLM', value: 98 },
      { name: 'RAG', value: 92 },
      { name: 'Prompt', value: 88 },
      { name: '多模态', value: 82 },
      { name: '知识库', value: 76 }
    ],
    summary: 'AIGC 岗位午间热度持续抬升，预计下午会延续“算法+工程”双高需求结构。'
  },
  {
    id: 3,
    time: '15:00',
    title: '算法工程师峰值',
    desc: '模型训练与推理优化岗位达到预测峰值',
    heat: 14800,
    status: 'process',
    keywords: [
      { name: '算法工程师', value: 95 },
      { name: '模型训练', value: 88 },
      { name: 'PyTorch', value: 84 },
      { name: '特征工程', value: 78 },
      { name: '分布式训练', value: 72 }
    ],
    summary: '当前预测窗口显示算法岗热度达到日内高点，预计 15:00-17:00 仍维持高位。'
  },
  {
    id: 4,
    time: '17:30',
    title: '数据分析师补涨',
    desc: '业务分析与增长分析岗位进入补涨期',
    heat: 15200,
    status: 'wait',
    keywords: [
      { name: '数据分析师', value: 90 },
      { name: 'SQL', value: 84 },
      { name: 'BI', value: 80 },
      { name: 'A/B测试', value: 76 },
      { name: '增长分析', value: 70 }
    ],
    summary: '预测 17:30 后分析类岗位热度补涨，业务增长与经营分析场景需求最为明显。'
  },
  {
    id: 5,
    time: '19:00',
    title: '测试开发回温',
    desc: '自动化测试与质量工程岗位热度上扬',
    heat: 13900,
    status: 'wait',
    keywords: [
      { name: '测试开发', value: 88 },
      { name: '自动化测试', value: 82 },
      { name: 'CI/CD', value: 79 },
      { name: '质量平台', value: 74 },
      { name: '稳定性测试', value: 68 }
    ],
    summary: '晚间预测窗口中测试开发岗位热度回温，质量平台与自动化方向需求增长明显。'
  },
  {
    id: 6,
    time: '21:00',
    title: 'SRE岗位潜力释放',
    desc: '运维开发与稳定性工程岗位热度提升',
    heat: 11600,
    status: 'wait',
    keywords: [
      { name: 'SRE', value: 86 },
      { name: 'K8s', value: 82 },
      { name: '可观测性', value: 78 },
      { name: '容器云', value: 74 },
      { name: '故障演练', value: 69 }
    ],
    summary: '21:00 后 SRE 与运维开发岗位热度预计释放，云原生稳定性方向有增量空间。'
  },
  {
    id: 7,
    time: '23:00',
    title: '产品经理夜间窗口',
    desc: '策略与增长产品岗位在夜间有小幅抬升',
    heat: 9800,
    status: 'wait',
    keywords: [
      { name: '产品经理', value: 90 },
      { name: '增长策略', value: 78 },
      { name: '商业分析', value: 75 },
      { name: '用户研究', value: 71 },
      { name: '数据产品', value: 67 }
    ],
    summary: '夜间窗口预测显示产品岗位热度小幅提升，次日早间可能继续向增长方向集中。'
  }
];

export const MOCK_SENTIMENT_DASHBOARD: SentimentDashboardData = {
  trend: {
    times: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
    positive: [30, 29, 28, 27, 28, 30, 32, 34, 36, 38, 41, 43, 45, 47, 49, 50, 51, 51, 49, 47, 45, 43, 40, 38],
    neutral: [46, 45, 44, 43, 42, 41, 40, 38, 37, 36, 35, 34, 33, 31, 30, 29, 28, 28, 29, 30, 31, 33, 34, 35],
    negative: [24, 26, 28, 30, 30, 29, 28, 28, 27, 26, 24, 23, 22, 22, 21, 21, 21, 21, 22, 23, 24, 24, 26, 27]
  },
  warnings: [
    { time: '08:40', content: '检测到 5 条“零经验要求资深技能”的岗位，建议复核。', type: 'warning' },
    { time: '10:15', content: '华东区域 35K+ 岗位环比增加 18%，请关注供需压力。', type: 'info' },
    { time: '11:20', content: '检测到 8 条“经验1年要求8年技能”岗位，建议人工复核。', type: 'warning' },
    { time: '13:55', content: '某行业低薪岗位占比快速上升，可能存在岗位质量下滑。', type: 'warning' },
    { time: '15:40', content: '某城市“50K+”岗位激增 42%，存在异常薪资风险。', type: 'critical' },
    { time: '17:05', content: '3 个采集源出现薪资字段缺失，数据完整性下降。', type: 'warning' },
    { time: '19:10', content: '敏感词过滤命中率提升至 9.2%，请关注采集源质量。', type: 'info' },
    { time: '21:35', content: '异常岗位重复出现，建议开启更严格去重策略。', type: 'critical' }
  ],
  keywords: [
    { word: '经验不符', count: 960, percent: 82 },
    { word: '薪资倒挂', count: 880, percent: 76 },
    { word: '外包', count: 760, percent: 64 },
    { word: '虚假招聘', count: 720, percent: 58 },
    { word: '学历限制', count: 620, percent: 52 },
    { word: '岗位冻结', count: 560, percent: 46 },
    { word: '试用降薪', count: 510, percent: 41 },
    { word: '培训费', count: 470, percent: 38 },
    { word: '长期值班', count: 430, percent: 35 },
    { word: '强制加班', count: 390, percent: 31 }
  ]
};

const buildClusterPoints = (): ClusterPoint[] => {
  const clusterGroups = [
    {
      category: '互联网/软件',
      centerX: 22,
      centerY: 30,
      baseDemand: 86,
      labels: ['前端生态岗位', 'React工程师', 'Vue工程师', 'Node.js开发', '全栈开发', 'Web性能优化', '前端架构师', '可视化工程师']
    },
    {
      category: '后端/云原生',
      centerX: 62,
      centerY: 28,
      baseDemand: 90,
      labels: ['后端中台岗位', 'Java后端', 'Go开发', '微服务架构', '云原生工程师', 'DevOps工程师', 'SRE工程师', '数据库工程师']
    },
    {
      category: 'AI/数据',
      centerX: 40,
      centerY: 70,
      baseDemand: 94,
      labels: ['AI与算法岗位', '算法工程师', '机器学习工程师', '数据科学家', 'NLP工程师', 'LLM应用工程师', '推荐算法工程师', '数据平台工程师']
    },
    {
      category: '产品/运营',
      centerX: 74,
      centerY: 70,
      baseDemand: 78,
      labels: ['运营与产品岗位', '产品经理', '增长运营', '数据产品经理', '商业分析师', '用户运营', '内容运营', '项目经理']
    }
  ];

  const offsets: Array<[number, number, number]> = [
    [0, 0, 0],
    [4, 4, 10],
    [-4, -3, 14],
    [3, -5, 18],
    [-3, 5, 20],
    [6, 2, 24],
    [-6, 2, 26],
    [2, 7, 28]
  ];

  return clusterGroups.flatMap((group) =>
    group.labels.map((label, index) => {
      const [dx, dy, demandLoss] = offsets[index];
      return [
        group.centerX + dx,
        group.centerY + dy,
        Math.max(30, group.baseDemand - demandLoss),
        label,
        group.category
      ] as ClusterPoint;
    })
  );
};

export const MOCK_CLUSTERS: ClusterPoint[] = buildClusterPoints();
