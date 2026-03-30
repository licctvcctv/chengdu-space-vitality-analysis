import { ReportItem, ReportSummary } from '../types';

const buildSummary = (
  periodLabel: string,
  totalJobs: number,
  activeCities: number,
  avgSalaryK: number,
  newJobs: number,
  skillBoost = 0
): ReportSummary => ({
  periodLabel,
  coreMetrics: {
    totalJobs,
    activeCities,
    avgSalaryK,
    newJobs
  },
  cityRanking: [
    { name: '北京', value: 95 },
    { name: '上海', value: 92 },
    { name: '深圳', value: 90 },
    { name: '杭州', value: 88 },
    { name: '广州', value: 85 }
  ],
  industryRanking: [
    { name: '互联网/软件', value: 30 },
    { name: '智能制造', value: 15 },
    { name: '金融科技', value: 12 },
    { name: '电商零售', value: 11 },
    { name: '医疗健康', value: 9 }
  ],
  salaryBuckets: [
    { range: '8K以下', count: Math.round(totalJobs * 0.08), ratio: 8 },
    { range: '8-15K', count: Math.round(totalJobs * 0.19), ratio: 19 },
    { range: '15-25K', count: Math.round(totalJobs * 0.34), ratio: 34 },
    { range: '25-35K', count: Math.round(totalJobs * 0.22), ratio: 22 },
    { range: '35-50K', count: Math.round(totalJobs * 0.12), ratio: 12 },
    { range: '50K以上', count: Math.round(totalJobs * 0.05), ratio: 5 }
  ],
  skillHeatChanges: [
    { skill: 'TypeScript', delta: 12 + skillBoost },
    { skill: 'Python', delta: 10 + skillBoost },
    { skill: 'LLM', delta: 18 + skillBoost },
    { skill: 'Kubernetes', delta: 8 + skillBoost },
    { skill: 'Spark', delta: 7 + skillBoost }
  ],
  riskAlerts: [
    '异常薪资岗位占比上升，建议加严薪资离群值过滤规则。',
    '“经验不符”风险词出现聚集，建议提高岗位描述质量校验。',
    '部分城市供需比持续偏高，建议优先补充核心技术人才池。'
  ]
});

export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'RPT-W-202602-02',
    title: '招聘市场周报（第 06 周）',
    timeRange: '2026-02-02 00:00 - 2026-02-08 23:59',
    createTime: '2026-02-09 09:12:41',
    size: '2.9 MB',
    status: 'completed',
    type: 'weekly',
    summary: buildSummary('2026年第06周', 128560, 42, 24.8, 18420, 2)
  },
  {
    id: 'RPT-W-202601-05',
    title: '招聘市场周报（第 05 周）',
    timeRange: '2026-01-26 00:00 - 2026-02-01 23:59',
    createTime: '2026-02-02 09:05:12',
    size: '2.7 MB',
    status: 'completed',
    type: 'weekly',
    summary: buildSummary('2026年第05周', 121430, 41, 24.3, 17180, 1)
  },
  {
    id: 'RPT-W-202601-04',
    title: '招聘市场周报（第 04 周）',
    timeRange: '2026-01-19 00:00 - 2026-01-25 23:59',
    createTime: '2026-01-26 09:03:26',
    size: '2.6 MB',
    status: 'completed',
    type: 'weekly',
    summary: buildSummary('2026年第04周', 118970, 40, 24.1, 16510, 1)
  },
  {
    id: 'RPT-M-202601',
    title: '招聘市场月报（2026年01月）',
    timeRange: '2026-01-01 00:00 - 2026-01-31 23:59',
    createTime: '2026-02-01 08:03:15',
    size: '4.8 MB',
    status: 'completed',
    type: 'monthly',
    summary: buildSummary('2026年01月', 462210, 58, 23.9, 73640, 2)
  },
  {
    id: 'RPT-M-202512',
    title: '招聘市场月报（2025年12月）',
    timeRange: '2025-12-01 00:00 - 2025-12-31 23:59',
    createTime: '2026-01-01 08:02:09',
    size: '4.6 MB',
    status: 'completed',
    type: 'monthly',
    summary: buildSummary('2025年12月', 448300, 56, 23.6, 70210, 1)
  },
  {
    id: 'RPT-M-202511',
    title: '招聘市场月报（2025年11月）',
    timeRange: '2025-11-01 00:00 - 2025-11-30 23:59',
    createTime: '2025-12-01 08:02:42',
    size: '4.4 MB',
    status: 'completed',
    type: 'monthly',
    summary: buildSummary('2025年11月', 430850, 55, 23.2, 68400, 0)
  },
  {
    id: 'RPT-D-20260211-01',
    title: '招聘日快报（2026-02-11）',
    timeRange: '2026-02-11 00:00 - 2026-02-11 23:59',
    createTime: '2026-02-11 23:58:04',
    size: '1.1 MB',
    status: 'completed',
    type: 'daily',
    summary: buildSummary('2026-02-11', 19620, 38, 24.9, 19620, 2)
  },
  {
    id: 'RPT-D-20260210-01',
    title: '招聘日快报（2026-02-10）',
    timeRange: '2026-02-10 00:00 - 2026-02-10 23:59',
    createTime: '2026-02-10 23:56:22',
    size: '1.0 MB',
    status: 'completed',
    type: 'daily',
    summary: buildSummary('2026-02-10', 18940, 37, 24.7, 18940, 1)
  },
  {
    id: 'RPT-U-20260208-ALERT',
    title: '异常薪资风险快报（2026-02-08）',
    timeRange: '2026-02-08 10:00 - 2026-02-08 18:00',
    createTime: '2026-02-08 18:12:30',
    size: '0.8 MB',
    status: 'completed',
    type: 'urgent',
    summary: buildSummary('风险快报', 8650, 29, 25.3, 8650, 3)
  },
  {
    id: 'RPT-S-202602-AI',
    title: 'AIGC岗位专项分析（2026年2月）',
    timeRange: '2026-02-01 00:00 - 2026-02-12 12:00',
    createTime: '2026-02-12 12:30:08',
    size: '2.1 MB',
    status: 'completed',
    type: 'special',
    summary: buildSummary('AIGC专项', 70420, 34, 31.8, 14260, 5)
  }
];
