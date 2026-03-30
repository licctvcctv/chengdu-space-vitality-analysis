import React, { useEffect, useMemo, useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  Plus,
  X,
  AlertCircle,
  FileSpreadsheet,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';
import { collectionStorage } from '../utils/collectionStorage';

interface JobRecord {
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

const MOCK_JOBS: JobRecord[] = [
  { id: 1, rank: 1, jobTitle: '中学语文教师', company: '广州市教育局', city: '广州', salaryMin: 9, salaryMax: 15, education: '本科', experience: '应届/1-3年', demand: 18620, crawlTime: '2026-02-12 09:31:04' },
  { id: 2, rank: 2, jobTitle: '全科医生', company: '深圳市卫生健康委', city: '深圳', salaryMin: 12, salaryMax: 20, education: '本科', experience: '1-3年', demand: 17940, crawlTime: '2026-02-12 09:28:41' },
  { id: 3, rank: 3, jobTitle: '科研助理（生物医学）', company: '广东省科学院', city: '广州', salaryMin: 10, salaryMax: 18, education: '硕士', experience: '应届/1-3年', demand: 17110, crawlTime: '2026-02-12 09:25:20' },
  { id: 4, rank: 4, jobTitle: '行政管理岗（编外）', company: '某区政务服务中心', city: '佛山', salaryMin: 5, salaryMax: 7, education: '大专', experience: '1-3年', demand: 13520, crawlTime: '2026-02-12 09:21:03', note: '岗位描述存在”编外人员”字样' },
  { id: 5, rank: 5, jobTitle: '信息技术工程师', company: '广东省数据局', city: '广州', salaryMin: 15, salaryMax: 25, education: '本科', experience: '3-5年', demand: 12810, crawlTime: '2026-02-12 09:18:52', note: '薪资区间波动异常' },
  { id: 6, rank: 6, jobTitle: '小学数学教师', company: '东莞市教育局', city: '东莞', salaryMin: 8, salaryMax: 14, education: '本科', experience: '应届/1-3年', demand: 12480, crawlTime: '2026-02-12 09:15:36' },
  { id: 7, rank: 7, jobTitle: '图书馆馆员', company: '广东省立中山图书馆', city: '广州', salaryMin: 7, salaryMax: 12, education: '硕士', experience: '应届/1-3年', demand: 12300, crawlTime: '2026-02-12 09:12:18' },
  { id: 8, rank: 8, jobTitle: '统计分析岗（劳务派遣）', company: '某统计局下属机构', city: '珠海', salaryMin: 4, salaryMax: 6, education: '本科', experience: '1-3年', demand: 11790, crawlTime: '2026-02-12 09:10:02', note: '劳务派遣岗混入编制采集池' },
  { id: 9, rank: 9, jobTitle: '护士（临床）', company: '南方医科大学附属医院', city: '广州', salaryMin: 8, salaryMax: 13, education: '本科', experience: '应届/1-3年', demand: 11650, crawlTime: '2026-02-12 09:07:45' },
  { id: 10, rank: 10, jobTitle: '档案管理员', company: '广州市档案局', city: '广州', salaryMin: 7, salaryMax: 11, education: '本科', experience: '1-3年', demand: 11390, crawlTime: '2026-02-12 09:04:23' },
  { id: 11, rank: 11, jobTitle: '高中物理教师（需缴体检费）', company: '某民办培训机构', city: '深圳', salaryMin: 8, salaryMax: 12, education: '本科', experience: '应届/1-3年', demand: 10920, crawlTime: '2026-02-12 09:01:57', note: '描述包含疑似敏感词”体检费”' },
  { id: 12, rank: 12, jobTitle: '农业技术推广员', company: '广东省农业农村厅', city: '广州', salaryMin: 9, salaryMax: 14, education: '本科', experience: '1-3年', demand: 10810, crawlTime: '2026-02-12 08:58:11' }
];

const EXTRA_MOCK_JOBS: JobRecord[] = [
  { id: 13, rank: 13, jobTitle: '幼儿园教师', company: '广州市教育局', city: '广州', salaryMin: 7, salaryMax: 11, education: '本科', experience: '应届/1-3年', demand: 10620, crawlTime: '2026-02-12 08:55:30' },
  { id: 14, rank: 14, jobTitle: '高校辅导员', company: '华南理工大学', city: '广州', salaryMin: 10, salaryMax: 16, education: '硕士', experience: '应届/1-3年', demand: 10480, crawlTime: '2026-02-12 08:53:16' },
  { id: 15, rank: 15, jobTitle: '财务管理岗', company: '广东省财政厅', city: '广州', salaryMin: 9, salaryMax: 14, education: '本科', experience: '1-3年', demand: 10290, crawlTime: '2026-02-12 08:50:04' },
  { id: 16, rank: 16, jobTitle: '政务数据分析员', company: '广东省政数局', city: '广州', salaryMin: 12, salaryMax: 18, education: '本科', experience: '1-3年', demand: 10150, crawlTime: '2026-02-12 08:47:21' },
  { id: 17, rank: 17, jobTitle: '实验室技术员', company: '广东省质量监督检验研究院', city: '广州', salaryMin: 9, salaryMax: 15, education: '硕士', experience: '应届/1-3年', demand: 9980, crawlTime: '2026-02-12 08:44:15' },
  { id: 18, rank: 18, jobTitle: '社区卫生服务员', company: '广州市卫生健康委', city: '广州', salaryMin: 8, salaryMax: 12, education: '本科', experience: '1-3年', demand: 9860, crawlTime: '2026-02-12 08:41:40' },
  { id: 19, rank: 19, jobTitle: '城管执法助理（编外）', company: '某区城市管理局', city: '深圳', salaryMin: 4, salaryMax: 6, education: '大专', experience: '1-3年', demand: 9720, crawlTime: '2026-02-12 08:38:27', note: '描述包含”编外驻场”，需人工复核' },
  { id: 20, rank: 20, jobTitle: '博物馆讲解员', company: '广东省博物馆', city: '广州', salaryMin: 7, salaryMax: 11, education: '本科', experience: '1-3年', demand: 9680, crawlTime: '2026-02-12 08:35:09' },
  { id: 21, rank: 21, jobTitle: '气象观测员', company: '广东省气象局', city: '广州', salaryMin: 9, salaryMax: 14, education: '本科', experience: '1-3年', demand: 9540, crawlTime: '2026-02-12 08:32:40' },
  { id: 22, rank: 22, jobTitle: '环境监测技术员', company: '广东省生态环境厅', city: '广州', salaryMin: 10, salaryMax: 16, education: '硕士', experience: '应届/1-3年', demand: 9410, crawlTime: '2026-02-12 08:29:12' },
  { id: 23, rank: 23, jobTitle: '职业规划指导师', company: '广东省人才服务中心', city: '广州', salaryMin: 8, salaryMax: 13, education: '本科', experience: '1-3年', demand: 9280, crawlTime: '2026-02-12 08:26:53' },
  { id: 24, rank: 24, jobTitle: '法律援助工作者', company: '广州市司法局', city: '广州', salaryMin: 9, salaryMax: 14, education: '本科', experience: '1-3年', demand: 9150, crawlTime: '2026-02-12 08:23:21' },
  { id: 25, rank: 25, jobTitle: '高校教师（需缴报名费）', company: '某民办高校', city: '珠海', salaryMin: 8, salaryMax: 12, education: '硕士', experience: '应届', demand: 9030, crawlTime: '2026-02-12 08:20:02', note: '描述出现”收费报名”，需强拦截' },
  { id: 26, rank: 26, jobTitle: '社会保险业务员', company: '广东省社会保险局', city: '广州', salaryMin: 8, salaryMax: 12, education: '本科', experience: '1-3年', demand: 8920, crawlTime: '2026-02-12 08:17:58' },
  { id: 27, rank: 27, jobTitle: '城市规划助理', company: '广州市自然资源局', city: '广州', salaryMin: 10, salaryMax: 15, education: '本科', experience: '1-3年', demand: 8800, crawlTime: '2026-02-12 08:14:11' },
  { id: 28, rank: 28, jobTitle: '文化遗产保护员', company: '广东省文化和旅游厅', city: '广州', salaryMin: 8, salaryMax: 12, education: '本科', experience: '1-3年', demand: 8710, crawlTime: '2026-02-12 08:11:39' },
  { id: 29, rank: 29, jobTitle: '应急救援管理员', company: '广东省应急管理厅', city: '广州', salaryMin: 9, salaryMax: 14, education: '本科', experience: '1-3年', demand: 8620, crawlTime: '2026-02-12 08:08:25' },
  { id: 30, rank: 30, jobTitle: '科技创新管理岗', company: '广东省科技厅', city: '广州', salaryMin: 12, salaryMax: 18, education: '硕士', experience: '1-3年', demand: 8550, crawlTime: '2026-02-12 08:05:07' }
];

const TARGET_CRAWL_COUNT = 4000;
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const JOB_DATA_RULES = {
  seed: 20260213,
  salaryAnomaly: {
    minFloor: 8,
    maxCeiling: 90,
    spanLimit: 45
  },
  injectionInterval: {
    salaryAnomaly: 137,
    sensitiveNote: 173,
    mixedEmployment: 211
  }
} as const;

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

const SYNTHETIC_TITLES = [
  '中学语文教师', '小学数学教师', '全科医生', '护士（临床）', '科研助理',
  '行政管理岗', '档案管理员', '图书馆馆员', '文化遗产保护员', '气象观测员',
  '财务管理岗', '法律援助工作者', '社会保险业务员', '农业技术推广员', '环境监测技术员',
  '政务数据分析员', '城市规划助理', '实验室技术员', '应急救援管理员', '高校辅导员',
  '社区卫生服务员', '博物馆讲解员', '职业规划指导师', '科技创新管理岗', '幼儿园教师'
];

const SYNTHETIC_COMPANIES = [
  '广州市教育局', '深圳市卫生健康委', '广东省科学院', '广东省财政厅', '广州市档案局',
  '广东省数据局', '广东省农业农村厅', '广东省质量监督检验研究院', '广东省生态环境厅', '广东省文化和旅游厅',
  '广东省人才服务中心', '广州市司法局', '广东省社会保险局', '广州市自然资源局', '广东省应急管理厅',
  '广东省科技厅', '华南理工大学', '中山大学', '暨南大学', '广东省立中山图书馆',
  '广东省气象局', '广东省博物馆', '南方医科大学附属医院', '广州市卫生健康委'
];

const SYNTHETIC_CITIES = [
  '广州', '深圳', '佛山', '东莞', '珠海', '惠州', '中山', '江门', '湛江', '茂名',
  '汕头', '潮州', '揭阳', '汕尾', '梅州', '河源', '清远', '韶关', '肇庆', '云浮'
];

const SYNTHETIC_EDUCATION = ['大专', '本科', '硕士'];
const SYNTHETIC_EXPERIENCE = ['应届', '1-3年', '3-5年', '5年以上'];
const SENSITIVE_NOTES = [
  '描述包含疑似敏感词”体检费”',
  '描述包含”编外驻场”，需人工复核',
  '描述包含”收费报名”，建议拦截',
  '岗位文案存在”劳务派遣”字样'
];

const createSyntheticCrawledJobs = (startId: number, count: number): JobRecord[] => {
  const rand = createSeededRandom(JOB_DATA_RULES.seed);
  const now = Date.now();
  const rows: JobRecord[] = [];

  for (let index = 0; index < count; index += 1) {
    const id = startId + index;
    const title = SYNTHETIC_TITLES[Math.floor(rand() * SYNTHETIC_TITLES.length)];
    const company = SYNTHETIC_COMPANIES[Math.floor(rand() * SYNTHETIC_COMPANIES.length)];
    const city = SYNTHETIC_CITIES[Math.floor(rand() * SYNTHETIC_CITIES.length)];
    const education = SYNTHETIC_EDUCATION[Math.floor(rand() * SYNTHETIC_EDUCATION.length)];
    const experience = SYNTHETIC_EXPERIENCE[Math.floor(rand() * SYNTHETIC_EXPERIENCE.length)];

    const salaryMin = Math.max(JOB_DATA_RULES.salaryAnomaly.minFloor, Math.round(12 + rand() * 28));
    let salaryMax = salaryMin + Math.max(6, Math.round(8 + rand() * 20));
    let note: string | undefined;

    if (index % JOB_DATA_RULES.injectionInterval.salaryAnomaly === 0) {
      salaryMax = Math.max(salaryMax, JOB_DATA_RULES.salaryAnomaly.maxCeiling + 6);
      note = '薪资区间波动异常';
    } else if (index % JOB_DATA_RULES.injectionInterval.sensitiveNote === 0) {
      note = SENSITIVE_NOTES[index % SENSITIVE_NOTES.length];
    } else if (index % JOB_DATA_RULES.injectionInterval.mixedEmployment === 0) {
      note = '劳务派遣岗混入编制采集池';
    }

    const demandBase = 8400 - index;
    const demand = Math.max(1800, Math.round(demandBase + rand() * 2600));
    const crawlOffset = index * 45_000 + Math.floor(rand() * 6_000_000);
    const crawlTime = formatDateTime(new Date(now - crawlOffset));

    rows.push({
      id,
      rank: id,
      jobTitle: note && rand() > 0.55 ? `${title}（待复核）` : title,
      company,
      city,
      salaryMin,
      salaryMax,
      education,
      experience,
      demand,
      crawlTime,
      note
    });
  }

  return rows;
};

const BASE_JOBS = [...MOCK_JOBS, ...EXTRA_MOCK_JOBS];
const GENERATED_JOBS = createSyntheticCrawledJobs(
  BASE_JOBS.length + 1,
  Math.max(0, TARGET_CRAWL_COUNT - BASE_JOBS.length)
);

const ALL_MOCK_JOBS: JobRecord[] = [...BASE_JOBS, ...GENERATED_JOBS]
  .sort((a, b) => b.demand - a.demand)
  .map((item, index) => ({
    ...item,
    rank: index + 1
  }));

const ElButton = ({ type = 'default', icon: Icon, onClick, children, disabled }: any) => {
  const styles = {
    primary: 'bg-[#409EFF] hover:bg-[#66b1ff] text-white border-transparent',
    danger: 'bg-[#F56C6C] hover:bg-[#f78989] text-white border-transparent',
    success: 'bg-[#67C23A] hover:bg-[#85ce61] text-white border-transparent',
    warning: 'bg-[#E6A23C] hover:bg-[#ebb563] text-white border-transparent',
    default: 'bg-white hover:border-[#409EFF] hover:text-[#409EFF] text-[#606266] border-[#dcdfe6]'
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-all border ${styles[type as keyof typeof styles]} ${disabled ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const ElTag = ({ type, children, onClose }: any) => {
  const colors = {
    normal: 'bg-[#f0f9eb] border-[#e1f3d8] text-[#67C23A]',
    warning: 'bg-[#fdf6ec] border-[#faecd8] text-[#E6A23C]',
    danger: 'bg-[#fef0f0] border-[#fde2e2] text-[#F56C6C]',
    sensitive: 'bg-[#f4f4f5] border-[#e9e9eb] text-[#909399]'
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${colors[type as keyof typeof colors]}`}>
      {children}
      {onClose && <X className="w-3 h-3 cursor-pointer hover:bg-black/10 rounded-full p-0.5" onClick={onClose} />}
    </span>
  );
};

const DataManagement: React.FC = () => {
  const { message, confirm } = useUI();
  const [data, setData] = useState<JobRecord[]>(ALL_MOCK_JOBS);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [sensitiveWords, setSensitiveWords] = useState<string[]>(['编外', '体检费', '劳务派遣', '收费报名']);
  const [newWord, setNewWord] = useState('');
  const [collectedIds, setCollectedIds] = useState<number[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      if (!user?.id) return;
      setCurrentUserId(user.id);
      const collections = collectionStorage.getUserCollections(user.id);
      setCollectedIds(collections.map((item) => item.topicId));
    } catch (error) {
      console.error('load user error', error);
    }
  }, []);

  const isSensitive = (row: JobRecord) =>
    sensitiveWords.some((word) => `${row.jobTitle} ${row.company} ${row.note || ''}`.includes(word));

  const isSalaryAnomaly = (row: JobRecord) =>
    row.salaryMin <= JOB_DATA_RULES.salaryAnomaly.minFloor ||
    row.salaryMax >= JOB_DATA_RULES.salaryAnomaly.maxCeiling ||
    row.salaryMax - row.salaryMin >= JOB_DATA_RULES.salaryAnomaly.spanLimit;

  const riskType = (row: JobRecord): 'danger' | 'warning' | 'normal' => {
    if (isSensitive(row)) return 'danger';
    if (isSalaryAnomaly(row)) return 'warning';
    return 'normal';
  };

  const stats = useMemo(() => {
    const sensitiveCount = data.filter(isSensitive).length;
    const anomalyCount = data.filter(isSalaryAnomaly).length;
    return { sensitiveCount, anomalyCount };
  }, [data, sensitiveWords]);

  const latestCrawlTime = useMemo(() => {
    if (data.length === 0) return '--';
    return [...data]
      .sort((a, b) => (a.crawlTime > b.crawlTime ? -1 : 1))[0]
      .crawlTime;
  }, [data]);

  const reviewCount = useMemo(() => data.filter((item) => riskType(item) !== 'normal').length, [data, sensitiveWords]);
  const validCount = Math.max(0, data.length - reviewCount);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = pageStart + pageSize;
  const pagedData = useMemo(() => data.slice(pageStart, pageEnd), [data, pageStart, pageEnd]);
  const currentPageIds = useMemo(() => pagedData.map((item) => item.id), [pagedData]);
  const currentPageSelectedCount = useMemo(
    () => currentPageIds.filter((id) => selectedIds.includes(id)).length,
    [currentPageIds, selectedIds]
  );
  const pageInfoStart = data.length === 0 ? 0 : pageStart + 1;
  const pageInfoEnd = Math.min(pageEnd, data.length);
  const isAllCurrentPageSelected = pagedData.length > 0 && currentPageSelectedCount === pagedData.length;
  const pageButtons = useMemo(() => {
    const maxButtons = 7;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (currentPage <= totalPages) return;
    setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
  };

  const handleSelectRow = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirm(`确定删除选中的 ${selectedIds.length} 条岗位记录吗？`, {
      type: 'warning',
      confirmText: '确认删除',
      title: '批量删除'
    });
    if (!confirmed) return;
    setData((prev) =>
      prev
        .filter((item) => !selectedIds.includes(item.id))
        .map((item, index) => ({
          ...item,
          rank: index + 1
        }))
    );
    setSelectedIds([]);
    message.success('已删除选中记录');
  };

  const handleExport = () => {
    const rows = data.filter((item) => selectedIds.length === 0 || selectedIds.includes(item.id));
    const csv = [
      '排名,岗位,单位,地市,薪资(K),学历,经验,热度,风险,采集时间',
      ...rows.map((item) =>
        [
          item.rank,
          item.jobTitle,
          item.company,
          item.city,
          `${item.salaryMin}-${item.salaryMax}`,
          item.education,
          item.experience,
          item.demand,
          riskType(item) === 'danger' ? '敏感词风险' : riskType(item) === 'warning' ? '异常薪资' : '正常',
          item.crawlTime
        ].join(',')
      )
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '事业单位招聘数据导出.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    message.success('CSV 已开始下载');
  };

  const handleAddWord = () => {
    if (!newWord.trim()) {
      message.warning('请输入敏感词');
      return;
    }
    if (sensitiveWords.includes(newWord.trim())) {
      message.warning('该敏感词已存在');
      return;
    }
    setSensitiveWords((prev) => [...prev, newWord.trim()]);
    setNewWord('');
    message.success('敏感词已添加');
  };

  const handleCollect = (row: JobRecord) => {
    if (!currentUserId) {
      message.error('请先登录');
      return;
    }
    try {
      collectionStorage.addCollection({
        userId: currentUserId,
        topicId: row.id,
        title: `${row.jobTitle} - ${row.company}`,
        heat: row.demand,
        note: row.note || `${row.city} | ${row.salaryMin}-${row.salaryMax}K`,
        tags: [row.city, row.education, riskType(row) === 'normal' ? '正常编制岗' : '待复核']
      });
      setCollectedIds((prev) => [...prev, row.id]);
      message.success('已加入岗位收藏');
    } catch (error) {
      message.warning('该岗位已收藏');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#E6A23C]" />
            <h3 className="text-sm font-bold text-slate-700">事业单位招聘数据管理</h3>
          </div>
          <div className="text-xs text-slate-500">最近采集：{latestCrawlTime}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[11px] text-slate-500">采集总量</div>
            <div className="text-lg font-bold text-slate-700">{data.length}</div>
          </div>
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2">
            <div className="text-[11px] text-green-700">正常岗位</div>
            <div className="text-lg font-bold text-green-700">{validCount}</div>
          </div>
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2">
            <div className="text-[11px] text-amber-700">异常数据</div>
            <div className="text-lg font-bold text-amber-700">{stats.anomalyCount}</div>
          </div>
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2">
            <div className="text-[11px] text-red-700">敏感词命中</div>
            <div className="text-lg font-bold text-red-700">{stats.sensitiveCount}</div>
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-3">
          待复核岗位 <span className="text-amber-600 font-bold">{reviewCount}</span> 条 · 异常数据 <span className="text-orange-600 font-bold">{stats.anomalyCount}</span> 条 ·
          敏感词命中 <span className="text-red-600 font-bold">{stats.sensitiveCount}</span> 条 ·
          当前筛选词 <span className="text-slate-700 font-bold">{sensitiveWords.length}</span> 个
        </div>

        <div className="mb-4 rounded-md border border-[#e4e7ed] bg-[#fafbfd] px-3 py-2 text-xs text-slate-600 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <span className="font-semibold text-slate-700">数据构成：</span>
            基础样本 30 条 + 采集数据补齐至 {TARGET_CRAWL_COUNT} 条，固定种子 {JOB_DATA_RULES.seed}。
          </div>
          <div>
            <span className="font-semibold text-slate-700">异常数据规则：</span>
            最低薪资 ≤ {JOB_DATA_RULES.salaryAnomaly.minFloor}K 或最高薪资 ≥ {JOB_DATA_RULES.salaryAnomaly.maxCeiling}K 或跨度 ≥ {JOB_DATA_RULES.salaryAnomaly.spanLimit}K。
          </div>
          <div>
            <span className="font-semibold text-slate-700">敏感词规则：</span>
            命中岗位名/单位名/备注任一字段，支持手动新增过滤词并实时生效。
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="px-3 py-1.5 border border-[#dcdfe6] rounded text-sm focus:outline-none focus:border-[#409EFF] w-56"
              placeholder="输入过滤词 (例如: 编外)"
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
            />
            <ElButton type="primary" icon={Plus} onClick={handleAddWord}>
              添加过滤词
            </ElButton>
          </div>
          <div className="h-6 w-[1px] bg-gray-200" />
          <div className="flex flex-wrap gap-2">
            {sensitiveWords.map((word) => (
              <ElTag key={word} type="sensitive" onClose={() => setSensitiveWords((prev) => prev.filter((item) => item !== word))}>
                {word}
              </ElTag>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fcfcfc]">
          <div className="flex items-center gap-2">
            <ElButton type="danger" icon={Trash2} disabled={selectedIds.length === 0} onClick={handleBatchDelete}>
              批量删除
            </ElButton>
            <ElButton type="success" icon={FileSpreadsheet} onClick={handleExport}>
              导出 CSV
            </ElButton>
          </div>
          <div className="text-xs text-gray-500">
            共 <span className="text-[#409EFF] font-bold">{data.length}</span> 条采集岗位数据 ·
            已勾选 <span className="text-rose-500 font-bold">{selectedIds.length}</span> 条
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#f5f7fa] text-[#909399] sticky top-0 z-10 font-medium shadow-sm">
              <tr>
                <th className="px-4 py-3 border-b border-[#ebeef5] w-12 text-center">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={isAllCurrentPageSelected}
                    title="当前页全选"
                    className="rounded text-[#409EFF] focus:ring-[#409EFF]"
                  />
                </th>
                <th className="px-4 py-3 border-b border-[#ebeef5]">排名</th>
                <th className="px-4 py-3 border-b border-[#ebeef5]">岗位 / 单位</th>
                <th className="px-4 py-3 border-b border-[#ebeef5]">地市</th>
                <th className="px-4 py-3 border-b border-[#ebeef5]">薪资(K)</th>
                <th className="px-4 py-3 border-b border-[#ebeef5]">学历 / 经验</th>
                <th className="px-4 py-3 border-b border-[#ebeef5]">风险标签</th>
                <th className="px-4 py-3 border-b border-[#ebeef5]">采集时间</th>
                <th className="px-4 py-3 border-b border-[#ebeef5] text-center w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebeef5]">
              {pagedData.map((row) => {
                const rowRisk = riskType(row);
                const isCollected = collectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-[#f5f7fa] transition-colors ${
                      rowRisk === 'danger' ? 'bg-red-50/70' : rowRisk === 'warning' ? 'bg-orange-50/60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="rounded text-[#409EFF] focus:ring-[#409EFF]"
                      />
                    </td>
                    <td className="px-4 py-3 text-[#606266] font-mono font-bold">#{row.rank}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#303133]">{row.jobTitle}</div>
                      <div className="text-xs text-slate-500">{row.company}</div>
                    </td>
                    <td className="px-4 py-3 text-[#606266]">{row.city}</td>
                    <td className="px-4 py-3 font-mono text-[#606266]">{row.salaryMin}-{row.salaryMax}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {row.education} · {row.experience}
                    </td>
                    <td className="px-4 py-3">
                      {rowRisk === 'danger' ? (
                        <ElTag type="danger">
                          <AlertTriangle className="w-3 h-3" /> 敏感词风险
                        </ElTag>
                      ) : rowRisk === 'warning' ? (
                        <ElTag type="warning">异常薪资</ElTag>
                      ) : (
                        <ElTag type="normal">正常</ElTag>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#909399] text-xs font-mono">{row.crawlTime}</td>
                    <td className="px-4 py-3 text-center">
                      {isCollected ? (
                        <ElButton type="default" disabled icon={Check}>
                          已收藏
                        </ElButton>
                      ) : (
                        <ElButton type="warning" icon={Bookmark} onClick={() => handleCollect(row)}>
                          收藏
                        </ElButton>
                      )}
                    </td>
                  </tr>
                );
              })}
              {pagedData.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#909399]">
                    暂无记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-[#fcfcfc] flex flex-wrap gap-3 items-center justify-between text-sm text-[#606266]">
          <div className="flex items-center gap-3">
            <span>
              当前显示 <span className="font-semibold text-[#303133]">{pageInfoStart}</span> -{' '}
              <span className="font-semibold text-[#303133]">{pageInfoEnd}</span> / {data.length}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-[#909399]">每页</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 border border-[#dcdfe6] rounded bg-white text-sm focus:outline-none focus:border-[#409EFF]"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-xs text-[#909399]">条</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#dcdfe6] bg-white hover:text-[#409EFF] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageButtons.map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`min-w-8 h-8 px-2 rounded border text-xs ${
                  currentPage === page
                    ? 'bg-[#409EFF] border-[#409EFF] text-white'
                    : 'border-[#dcdfe6] bg-white text-[#606266] hover:border-[#c6e2ff] hover:text-[#409EFF]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-[#dcdfe6] bg-white hover:text-[#409EFF] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="ml-2 text-xs text-[#909399]">
              第 {currentPage} / {totalPages} 页
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
