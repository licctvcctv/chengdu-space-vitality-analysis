import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Activity,
  Cloud,
  Settings,
  AlertTriangle,
  X,
  Save,
  BellRing,
  Download,
  MapPin,
  RefreshCw,
  GraduationCap,
  TrendingUp,
  Gauge,
  Sparkles,
  BriefcaseBusiness,
  ShieldAlert,
  BarChart2,
  SunMedium,
  BoxSelect
} from 'lucide-react';
import DashboardCard from './DashboardCard';
import TrendChart from './TrendChart';
import ChinaHeatMap from './ChinaHeatMap';
import CategoryChart from './CategoryChart';
import WordCloud3D from './WordCloud3D';
import ParticleBackground from './ParticleBackground';
import ModelComparisonChart from './ModelComparisonChart';
import FeatureImportanceChart from './FeatureImportanceChart';
import WeatherImpactChart from './WeatherImpactChart';
import FindingsList from './FindingsList';
import { useDashboard } from '../hooks/useDashboard';
import { useUI } from './ui/UIProvider';
import { LoadingState } from './ui/LoadingState';

interface Props {
  onSwitchMode: () => void;
}

const BigScreen: React.FC<Props> = ({ onSwitchMode }) => {
  const { message } = useUI();
  const {
    time,
    data,
    loading,
    isAlerting,
    heatThreshold,
    setHeatThreshold,
    refreshStatus,
    lastRefreshAt,
    refreshData
  } = useDashboard();

  const [showSettings, setShowSettings] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(heatThreshold);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  // 成都公共休闲空间核心摘要数据
  const topCity = data?.supplyDemandRatios?.[0]?.city || '青羊区';
  const topCityDemand = data?.supplyDemandRatios?.[0]?.demand;
  const topMajor = data?.categories?.[0]?.name || '青羊区';
  const categoryTotal = (data?.categories || []).reduce((sum, item) => sum + (item.value || 0), 0);
  const topMajorShare = categoryTotal > 0 ? Math.round(((data?.categories?.[0]?.value || 0) / categoryTotal) * 100) : 28;
  const avgSalaryWan = data?.kpi?.avgSalaryK ? `${data.kpi.avgSalaryK.toFixed(1)}` : '30.2';
  const totalGdJobs = data?.kpi?.totalJobs || 58;
  const trendList = data?.trend || [];
  const trendStart = trendList[0]?.time;
  const trendEnd = trendList[trendList.length - 1]?.time;
  const trendTitle = trendStart && trendEnd ? `${trendStart} — ${trendEnd} 月度人流趋势` : '月度人流趋势';

  const handleSaveSettings = () => {
    setHeatThreshold(tempThreshold);
    setShowSettings(false);
    message.success('告警阈值已更新');
  };

  const handleExportCsv = () => {
    if (!data) return;
    setExporting('csv');
    const bom = '\uFEFF';
    const lines = [
      `导出时间,${new Date().toLocaleString()}`,
      `监测空间总数,${totalGdJobs}`,
      `最活跃区域,${topCity}`,
      `最活跃区域,${topMajor}`,
      `平均活力指数,${avgSalaryWan}`,
      '',
      '区域,日均人流,人流峰值,活力比',
      ...(data.supplyDemandRatios || []).map(
        item => `${item.city},${item.demand},${item.talentSupply},${item.ratio.toFixed(2)}`
      )
    ];
    const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `成都空间活力数据_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExporting(null);
    message.success('CSV 导出成功');
  };

  const handleExportPdf = () => {
    if (!data) return;
    setExporting('pdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const dateText = new Date().toLocaleString();
    let y = 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Chengdu Urban Public Space Vitality Dashboard', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated At: ${dateText}`, 14, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Core KPI', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Spaces: ${totalGdJobs}`, 16, y); y += 5;
    doc.text(`Top District: ${topCity}`, 16, y); y += 5;
    doc.text(`Most Active: ${topMajor}`, 16, y); y += 5;
    doc.text(`Avg Vitality: ${avgSalaryWan}`, 16, y);
    doc.save(`成都空间活力报告_${Date.now()}.pdf`);
    setExporting(null);
    message.success('PDF 导出成功');
  };

  const refreshStatusText = {
    idle: '待同步',
    syncing: '同步中',
    success: '已同步',
    error: '同步失败'
  } as const;

  return (
    <div className="w-screen h-screen bg-slate-950 text-white flex flex-col overflow-hidden relative font-sans selection:bg-cyan-500/30">
      <ParticleBackground />
      <div className="absolute inset-0 pointer-events-none grid-bg z-0 opacity-50" />

      {isAlerting && (
        <div className="absolute top-0 left-0 right-0 h-10 bg-red-900/90 border-b border-red-500 z-50 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]">
          <div className="flex items-center gap-3 text-red-100 font-bold tracking-wide">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
            <span>告警：人流量异常波动，请关注节假日高峰与安全管理</span>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-lg p-6 w-96 shadow-[0_0_50px_rgba(6,182,212,0.2)] relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-cyan-400" /> 告警阈值配置
            </h3>
            <div className="space-y-4">
              <label className="block text-xs text-cyan-400 uppercase tracking-wider mb-2">告警人流量阈值</label>
              <input
                type="number"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-white focus:outline-none focus:border-cyan-500"
              />
              <button onClick={handleSaveSettings} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded mt-4">
                <Save className="w-4 h-4 inline mr-2" /> 保存配置
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={`h-16 flex items-center justify-between px-6 border-b border-cyan-900/30 bg-slate-900/50 backdrop-blur-md relative z-10 shrink-0 transition-all ${isAlerting ? 'mt-10' : 'mt-0'}`}>
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              成都城市公共休闲空间活力分析
            </h1>
            <p className="text-[10px] text-cyan-700 tracking-[0.2em] uppercase">
              Chengdu Urban Public Space Vitality Analysis Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => refreshData(true)}
            disabled={refreshStatus === 'syncing'}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-500/30 rounded text-xs text-cyan-300 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshStatus === 'syncing' ? 'animate-spin' : ''}`} />
            手动刷新
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting !== null || loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-900/20 hover:bg-green-900/40 border border-green-500/30 rounded text-xs text-green-300 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting === 'csv' ? '导出中...' : '导出 CSV'}
          </button>

          <button
            onClick={handleExportPdf}
            disabled={exporting !== null || loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-900/20 hover:bg-indigo-900/40 border border-indigo-500/30 rounded text-xs text-indigo-300 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {exporting === 'pdf' ? '导出中...' : '导出 PDF'}
          </button>

          <button
            onClick={() => {
              setTempThreshold(heatThreshold);
              setShowSettings(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-500/30 rounded text-xs text-yellow-300 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            阈值配置
          </button>

          <div className="text-right border-l border-cyan-900/50 pl-4">
            <div className="text-[11px] text-cyan-300 flex items-center justify-end gap-1">
              <span className={`w-2 h-2 rounded-full ${refreshStatus === 'success' ? 'bg-green-500' : refreshStatus === 'error' ? 'bg-red-500' : refreshStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-500'}`} />
              {refreshStatusText[refreshStatus]}
            </div>
            <div className="text-[10px] text-cyan-600">
              上次刷新: {lastRefreshAt ? lastRefreshAt.toLocaleTimeString('zh-CN', { hour12: false }) : '--:--:--'}
            </div>
          </div>

          <div className="text-right border-l border-cyan-900/50 pl-4">
            <div className="text-xl font-mono font-bold text-cyan-100">
              {time.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
            <div className="text-xs text-cyan-600 font-mono">
              {time.toLocaleDateString('zh-CN')}
            </div>
          </div>

{/* 后台入口已移除 */}
        </div>
      </header>

      <main className="flex-1 p-3 min-h-0 overflow-hidden relative z-10 flex flex-col gap-3">

        {/* KPI 统计栏 */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-900/30 to-slate-900/50 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-cyan-300 flex items-center gap-1">
              <BriefcaseBusiness className="w-3 h-3" />
              监测公共空间
            </div>
            <div className="text-2xl font-bold text-white mt-1">{totalGdJobs.toLocaleString()}</div>
            <div className="text-[11px] text-cyan-200/80">公园 / 广场 / 景区</div>
          </div>
          <div className="rounded-lg border border-indigo-500/30 bg-gradient-to-r from-indigo-900/30 to-slate-900/50 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-indigo-300 flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              人流最多区域
            </div>
            <div className="text-2xl font-bold text-white mt-1">{topCity}</div>
            <div className="text-[11px] text-indigo-200/80">日均人流 {topCityDemand ? `${topCityDemand.toLocaleString()}` : '加载中'}</div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-900/30 to-slate-900/50 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              最活跃区域
            </div>
            <div className="text-2xl font-bold text-white mt-1">{topMajor}</div>
            <div className="text-[11px] text-emerald-200/80">人流占比约 {topMajorShare}%</div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-900/30 to-slate-900/50 px-4 py-3">
            <div className="text-[10px] uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              平均活力指数
            </div>
            <div className="text-2xl font-bold text-white mt-1">{avgSalaryWan}</div>
            <div className="text-[11px] text-amber-200/80">综合评分（百分制）</div>
          </div>
        </div>

        {/* 三列主体布局 */}
        <div className="flex gap-3 min-h-0 flex-1">

          {/* 左侧列 */}
          <aside className="flex flex-col gap-3" style={{ width: '26%', minWidth: 300 }}>
            <DashboardCard title="XGBoost/LightGBM 模型对比" icon={BarChart2} className="flex-[1.2] h-0">
              <ModelComparisonChart />
            </DashboardCard>
            <DashboardCard title="特征重要性 TOP10" icon={TrendingUp} className="flex-1 h-0">
              <FeatureImportanceChart />
            </DashboardCard>
          </aside>

          {/* 中间列 */}
          <section className="flex flex-col gap-3" style={{ width: '44%', minWidth: 480 }}>
            <DashboardCard title="成都市各区域空间活力热力图" icon={MapPin} className="flex-[1.8] h-0">
              <LoadingState loading={loading} data={data?.mapData} theme="dark">
                <ChinaHeatMap data={data?.mapData || []} theme="dark" />
              </LoadingState>
            </DashboardCard>
            <div className="flex gap-3 flex-1 h-0">
              <DashboardCard title={trendTitle} icon={TrendingUp} className="flex-1 h-full">
                <TrendChart theme="dark" data={data?.trend || []} />
              </DashboardCard>
              <DashboardCard title="天气对人流影响" icon={Cloud} className="flex-1 h-full">
                <WeatherImpactChart />
              </DashboardCard>
            </div>
          </section>

          {/* 右侧列 */}
          <aside className="flex flex-col gap-3" style={{ width: '30%', minWidth: 300 }}>
            <DashboardCard title="影响因素热词云" icon={Sparkles} className="flex-1 h-0">
              <WordCloud3D data={data?.wordCloud || []} />
            </DashboardCard>
            <DashboardCard title="关键发现与建议" icon={ShieldAlert} className="flex-1 h-0">
              <FindingsList />
            </DashboardCard>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default BigScreen;
