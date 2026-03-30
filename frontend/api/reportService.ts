import { jsPDF } from 'jspdf';
import { delay } from '../utils/delay';
import { ReportItem, ReportSummary } from '../types';
import { MOCK_REPORTS } from '../mock/reportsMock';
import { getRecruitmentGeneratedReport, getRecruitmentReportArchive } from './recruitmentDataAdapter';
import { requestWithMock, unwrapResponse } from './apiClient';

type ReportType = ReportItem['type'];

const getDefaultSummary = (periodLabel: string): ReportSummary => ({
  periodLabel,
  coreMetrics: {
    totalJobs: 28640,
    activeCities: 16,
    avgSalaryK: 9.8,
    newJobs: 28640
  },
  cityRanking: [
    { name: '佛山', value: 7780 },
    { name: '广州', value: 5120 },
    { name: '惠州', value: 2980 },
    { name: '韶关', value: 2160 },
    { name: '深圳', value: 1850 }
  ],
  industryRanking: [
    { name: '教育教学', value: 34 },
    { name: '医疗卫生', value: 28 },
    { name: '行政管理', value: 18 },
    { name: '工程技术', value: 12 },
    { name: '财务会计', value: 8 }
  ],
  salaryBuckets: [
    { range: '8K以下', count: 4880, ratio: 17 },
    { range: '8-15K', count: 12310, ratio: 43 },
    { range: '15-25K', count: 7890, ratio: 28 },
    { range: '25-35K', count: 2430, ratio: 8 },
    { range: '35-50K', count: 980, ratio: 3 },
    { range: '50K以上', count: 150, ratio: 1 }
  ],
  skillHeatChanges: [
    { skill: '教师', delta: 11 },
    { skill: '医疗', delta: 9 },
    { skill: '辅导员', delta: 8 },
    { skill: '工程', delta: 7 },
    { skill: '财务', delta: 6 }
  ],
  riskAlerts: [
    '部分公告缺少明确地市字段，建议完善单位-地市映射规则。',
    '地市供需比在部分区域持续偏高，建议关注人才供给侧匹配。'
  ]
});

const createReport = (type: ReportType): ReportItem => {
  const now = new Date();
  const dateText = now.toLocaleDateString().replace(/\//g, '-');
  const id = `RPT-${type.toUpperCase()}-${Date.now()}`;
  const timeRange = `${dateText} 00:00 - ${dateText} 23:59`;
  const typeLabel: Record<ReportType, string> = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    special: '专项报告',
    urgent: '快报'
  };

  return {
    id,
    title: `招聘市场${typeLabel[type]}（${dateText}）`,
    timeRange,
    createTime: now.toLocaleString(),
    size: type === 'monthly' ? '4.6 MB' : type === 'weekly' ? '2.8 MB' : '1.3 MB',
    status: 'completed',
    type,
    summary: getDefaultSummary(type === 'daily' ? '当日' : type === 'weekly' ? '本周' : '本月')
  };
};

const generateReportCsv = (report: ReportItem): string => {
  const summary = report.summary ?? getDefaultSummary(report.timeRange);
  const bom = '\uFEFF';
  const header = `报告标题,${report.title}\n生成时间,${report.createTime}\n统计周期,${report.timeRange}\n\n`;
  const core = [
    '核心指标,值',
    `总岗位数,${summary.coreMetrics.totalJobs}`,
    `新增岗位数,${summary.coreMetrics.newJobs}`,
    `活跃城市数,${summary.coreMetrics.activeCities}`,
    `平均薪资(K),${summary.coreMetrics.avgSalaryK}`,
    ''
  ].join('\n');
  const city = ['城市排行,需求指数', ...summary.cityRanking.map((item) => `${item.name},${item.value}`), ''].join('\n');
  const industry = ['行业排行,需求占比', ...summary.industryRanking.map((item) => `${item.name},${item.value}`), ''].join('\n');
  const salary = ['薪资区间,岗位数,占比', ...summary.salaryBuckets.map((item) => `${item.range},${item.count},${item.ratio}%`), ''].join('\n');
  const skills = ['技能热度变化,增幅', ...summary.skillHeatChanges.map((item) => `${item.skill},${item.delta}%`), ''].join('\n');
  const risks = ['风险提示', ...summary.riskAlerts.map((item) => item)].join('\n');

  return `${bom}${header}${core}${city}${industry}${salary}${skills}${risks}`;
};

const generateReportPdf = (report: ReportItem): jsPDF => {
  const summary = report.summary ?? getDefaultSummary(report.timeRange);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 18;
  const lineHeight = 7;
  const ensureSpace = (required = 12) => {
    if (y + required > 285) {
      doc.addPage();
      y = 18;
    }
  };

  doc.setFontSize(16);
  doc.text(report.title, 14, y);
  y += lineHeight;

  doc.setFontSize(10);
  doc.text(`Generated At: ${report.createTime}`, 14, y);
  y += lineHeight;
  doc.text(`Period: ${report.timeRange}`, 14, y);
  y += lineHeight + 2;

  doc.setFontSize(12);
  doc.text('Core KPI', 14, y);
  y += lineHeight;
  doc.setFontSize(10);
  doc.text(`Total Jobs: ${summary.coreMetrics.totalJobs}`, 18, y); y += lineHeight;
  doc.text(`New Jobs: ${summary.coreMetrics.newJobs}`, 18, y); y += lineHeight;
  doc.text(`Active Cities: ${summary.coreMetrics.activeCities}`, 18, y); y += lineHeight;
  doc.text(`Avg Salary: ${summary.coreMetrics.avgSalaryK}K`, 18, y); y += lineHeight + 2;

  ensureSpace(48);
  doc.setFontSize(12);
  doc.text('City Ranking (Top5)', 14, y);
  y += lineHeight;
  doc.setFontSize(10);
  summary.cityRanking.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.name} - ${item.value}`, 18, y);
    y += lineHeight;
  });
  y += 2;

  ensureSpace(48);
  doc.setFontSize(12);
  doc.text('Industry Ranking (Top5)', 14, y);
  y += lineHeight;
  doc.setFontSize(10);
  summary.industryRanking.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.name} - ${item.value}%`, 18, y);
    y += lineHeight;
  });
  y += 2;

  ensureSpace(56);
  doc.setFontSize(12);
  doc.text('Salary Buckets', 14, y);
  y += lineHeight;
  doc.setFontSize(10);
  summary.salaryBuckets.forEach((item) => {
    doc.text(`${item.range}: ${item.count} jobs (${item.ratio}%)`, 18, y);
    y += lineHeight;
  });
  y += 2;

  ensureSpace(48);
  doc.setFontSize(12);
  doc.text('Skill Heat Changes', 14, y);
  y += lineHeight;
  doc.setFontSize(10);
  summary.skillHeatChanges.forEach((item) => {
    doc.text(`${item.skill}: ${item.delta}%`, 18, y);
    y += lineHeight;
  });
  y += 2;

  ensureSpace(36);
  doc.setFontSize(12);
  doc.text('Risk Alerts', 14, y);
  y += lineHeight;
  doc.setFontSize(10);
  summary.riskAlerts.forEach((item) => {
    doc.text(`- ${item}`, 18, y);
    y += lineHeight;
  });

  return doc;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const reportService = {
  getReports: async (): Promise<ReportItem[]> => {
    const response = await requestWithMock<ReportItem[]>({
      endpoint: '/api/recruitment/reports',
      method: 'GET',
      retries: 2,
      mockHandler: async () => {
        await delay(420);
        return getRecruitmentReportArchive() || [...MOCK_REPORTS];
      }
    });
    return unwrapResponse(response);
  },

  generateReport: async (type: ReportType): Promise<ReportItem> => {
    const response = await requestWithMock<ReportItem>({
      endpoint: '/api/recruitment/reports/generate',
      method: 'POST',
      retries: 2,
      mockHandler: async () => {
        await delay(type === 'monthly' ? 2200 : type === 'weekly' ? 1800 : 1200);
        return getRecruitmentGeneratedReport(type) || createReport(type);
      }
    });
    return unwrapResponse(response);
  },

  generateDailyReport: async (): Promise<ReportItem> => reportService.generateReport('daily'),
  generateWeeklyReport: async (): Promise<ReportItem> => reportService.generateReport('weekly'),
  generateMonthlyReport: async (): Promise<ReportItem> => reportService.generateReport('monthly'),

  exportReportCsv: (report: ReportItem) => {
    const csv = generateReportCsv(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${report.id}.csv`);
  },

  exportReportPdf: (report: ReportItem) => {
    const pdf = generateReportPdf(report);
    pdf.save(`${report.id}.pdf`);
  }
};
