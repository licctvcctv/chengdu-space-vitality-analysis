import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  Clock,
  FileBarChart,
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { reportService } from '../api/reportService';
import { ReportAiNarrative, ReportItem } from '../types';
import { useUI } from '../components/ui/UIProvider';
import ReportPreviewModal from '../components/admin/ReportPreviewModal';
import { aiInsightService } from '../api/aiInsightService';

const StatusBadge = ({ status, type }: { status: string; type: string }) => {
  if (status === 'processing') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
        <Loader2 className="w-3 h-3 animate-spin" /> 生成中
      </span>
    );
  }

  const typeColors = {
    daily: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    weekly: 'bg-green-50 text-green-700 border-green-100',
    monthly: 'bg-amber-50 text-amber-700 border-amber-100',
    special: 'bg-purple-50 text-purple-700 border-purple-100',
    urgent: 'bg-red-50 text-red-700 border-red-100'
  };

  const typeLabel = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    special: '专项',
    urgent: '快报'
  };

  return (
    <div className="flex gap-2">
      <span className={`px-2 py-0.5 text-xs rounded border ${typeColors[type as keyof typeof typeColors] || 'bg-slate-100'}`}>
        {typeLabel[type as keyof typeof typeLabel] || '报告'}
      </span>
      <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">
        <CheckCircle2 className="w-3 h-3" /> 已完成
      </span>
    </div>
  );
};

const PersonalReports: React.FC = () => {
  const { message } = useUI();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingType, setGeneratingType] = useState<ReportItem['type'] | null>(null);
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('');
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);
  const [aiNarratives, setAiNarratives] = useState<Record<string, ReportAiNarrative>>({});
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [activeNarrativeReport, setActiveNarrativeReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await reportService.getReports();
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  const runProgress = async (type: ReportItem['type']) => {
    const stages = [
      { p: 10, text: '正在拉取招聘原始数据...' },
      { p: 32, text: '正在执行城市/行业聚合计算...' },
      { p: 58, text: '正在计算薪资区间与技能热度变化...' },
      { p: 82, text: '正在生成风险提示与摘要结论...' },
      { p: 100, text: '正在写入报表中心...' }
    ];

    setGeneratingType(type);
    setProgress(0);
    for (const stage of stages) {
      setStageText(stage.text);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProgress(stage.p);
    }
  };

  const handleGenerate = async (type: ReportItem['type']) => {
    if (generatingType) return;
    await runProgress(type);
    try {
      const report = await reportService.generateReport(type);
      setReports((prev) => [report, ...prev]);
      await handleGenerateAiNarrative(report, true);
      const typeLabel = type === 'weekly' ? '周报' : type === 'monthly' ? '月报' : '日报';
      message.success(`${typeLabel}生成成功（已包含 AI 解读）`);
    } catch (error) {
      message.error('报表生成失败，请稍后重试');
    } finally {
      setGeneratingType(null);
      setProgress(0);
      setStageText('');
    }
  };

  const handleGenerateAiNarrative = async (report: ReportItem, silent = false): Promise<ReportAiNarrative | null> => {
    if (!report.summary) {
      if (!silent) {
        message.warning('当前报告缺少摘要数据，暂无法生成 AI 解读');
      }
      return null;
    }

    setAiLoadingId(report.id);
    try {
      const narrative = await aiInsightService.generateReportNarrative(report);
      setAiNarratives((prev) => ({
        ...prev,
        [report.id]: narrative
      }));
      setActiveNarrativeReport(report);
      if (!silent) {
        message.success('AI 解读已生成');
      }
      return narrative;
    } catch (error) {
      if (!silent) {
        message.error('AI 解读生成失败，请稍后重试');
      }
      return null;
    } finally {
      setAiLoadingId(null);
    }
  };

  const activeNarrative = activeNarrativeReport ? aiNarratives[activeNarrativeReport.id] : null;

  const handleOpenAiNarrative = async (report: ReportItem) => {
    if (aiNarratives[report.id]) {
      setActiveNarrativeReport(report);
      return;
    }
    const narrative = await handleGenerateAiNarrative(report, true);
    if (narrative) {
      setActiveNarrativeReport(report);
    } else {
      message.error('AI 解读暂不可用，请稍后重试');
    }
  };

  const handleDownloadCsv = (report: ReportItem) => {
    reportService.exportReportCsv(report);
    message.success('CSV 导出成功');
  };

  const handleDownloadPdf = (report: ReportItem) => {
    reportService.exportReportPdf(report);
    message.success('PDF 导出成功');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <FileBarChart className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-slate-800">报表中心（周报 / 月报）</h2>
        <span className="text-sm text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded ml-2">Report Center</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-60 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" /> 智能报表生成引擎
            </h3>
            <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
              支持自动生成周报/月报，包含核心指标、城市排行、行业排行、薪资区间、技能热度变化与风险提示。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => handleGenerate('daily')}
              disabled={!!generatingType}
              className="px-4 py-2 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
            >
              生成日报
            </button>
            <button
              onClick={() => handleGenerate('weekly')}
              disabled={!!generatingType}
              className="px-4 py-2 rounded-lg font-bold text-white bg-green-600 hover:bg-green-500 disabled:opacity-60"
            >
              生成周报
            </button>
            <button
              onClick={() => handleGenerate('monthly')}
              disabled={!!generatingType}
              className="px-4 py-2 rounded-lg font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-60"
            >
              生成月报
            </button>
          </div>
        </div>

        {generatingType && (
          <div className="mt-6 animate-fade-in">
            <div className="flex justify-between text-xs font-mono font-medium text-blue-600 mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                {stageText}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {activeNarrativeReport && activeNarrative && (
        <div className="bg-white rounded-lg border border-blue-100 shadow-sm p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Brain className="w-4 h-4 text-blue-600" />
                AI 周报/月报解读
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                当前报告：{activeNarrativeReport.title}
              </p>
            </div>
            <div className="text-[11px] text-slate-400 text-right">
              <div>模型：{activeNarrative.model}</div>
              <div>生成时间：{new Date(activeNarrative.generatedAt).toLocaleString()}</div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 leading-relaxed">
            {activeNarrative.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="text-xs text-blue-700 mb-2">关键发现</div>
              <ul className="space-y-1 text-xs text-blue-800">
                {activeNarrative.highlights.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <div className="text-xs text-emerald-700 mb-2">建议动作</div>
              <ul className="space-y-1 text-xs text-emerald-800">
                {activeNarrative.actions.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 text-sm">历史报表归档</h3>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> 报告默认保留 90 天
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[1080px] text-left text-sm border-collapse">
            <thead className="bg-[#f5f7fa] text-[#909399] sticky top-0 z-10 font-medium">
              <tr>
                <th className="px-6 py-3 border-b border-[#ebeef5]">报告编号</th>
                <th className="px-6 py-3 border-b border-[#ebeef5]">报告名称</th>
                <th className="px-6 py-3 border-b border-[#ebeef5]">覆盖时间</th>
                <th className="px-6 py-3 border-b border-[#ebeef5]">生成时间</th>
                <th className="px-6 py-3 border-b border-[#ebeef5]">文件大小</th>
                <th className="px-6 py-3 border-b border-[#ebeef5]">状态</th>
                <th className="px-6 py-3 border-b border-[#ebeef5] text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebeef5]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    加载中...
                  </td>
                </tr>
              ) : (
                reports.map((rpt) => (
                  <tr key={rpt.id} className="hover:bg-[#f5f7fa] transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{rpt.id}</td>
                    <td className="px-6 py-4">
                      <div
                        className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors flex items-center gap-2 max-w-[260px] truncate"
                        title={rpt.title}
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        {rpt.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{rpt.timeRange}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {rpt.createTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{rpt.size}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={rpt.status} type={rpt.type} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-3 text-xs">
                        <button onClick={() => setPreviewReport(rpt)} className="text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> 预览
                        </button>
                        <button
                          onClick={() => handleOpenAiNarrative(rpt)}
                          className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                          {aiLoadingId === rpt.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                          查看AI
                        </button>
                        <button onClick={() => handleDownloadCsv(rpt)} className="text-slate-500 hover:text-green-600 transition-colors flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> CSV
                        </button>
                        <button onClick={() => handleDownloadPdf(rpt)} className="text-slate-500 hover:text-amber-600 transition-colors flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReportPreviewModal isOpen={!!previewReport} onClose={() => setPreviewReport(null)} data={previewReport} />
    </div>
  );
};

export default PersonalReports;
