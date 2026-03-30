
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import {
  Activity,
  PieChart,
  AlertTriangle,
  MessageSquareWarning,
  TrendingUp,
  Info,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { analysisService } from '../api/analysisService';
import { SentimentDashboardData } from '../types';
import { LoadingState } from '../components/ui/LoadingState';
import { useUI } from '../components/ui/UIProvider';
import { MOCK_SENTIMENT_DASHBOARD } from '../mock/analysisMock';

// === Charts Components (Receiving Props) ===

const TrendStackedChart: React.FC<{ data: SentimentDashboardData['trend'] }> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
      },
      legend: {
        data: ['高竞争 (High)', '中等 (Medium)', '低竞争 (Low)'],
        bottom: 0,
        textStyle: { color: '#64748b' }
      },
      grid: {
        top: '10%', left: '3%', right: '4%', bottom: '10%', containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.times,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      series: [
        {
          name: '低竞争 (Low)',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: { width: 0 },
          showSymbol: false,
          areaStyle: { opacity: 0.8, color: '#ef4444' }, // Red
          itemStyle: { color: '#ef4444' },
          data: data.negative
        },
        {
          name: '中等 (Medium)',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: { width: 0 },
          showSymbol: false,
          areaStyle: { opacity: 0.8, color: '#3b82f6' }, // Blue
          itemStyle: { color: '#3b82f6' },
          data: data.neutral
        },
        {
          name: '高竞争 (High)',
          type: 'line',
          stack: 'Total',
          smooth: true,
          lineStyle: { width: 0 },
          showSymbol: false,
          areaStyle: { opacity: 0.8, color: '#10b981' }, // Green
          itemStyle: { color: '#10b981' },
          data: data.positive
        }
      ]
    };

    chartInstance.current.setOption(option);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          chartInstance.current?.resize();
        }
      }
    });
    resizeObserver.observe(el);

    const timer = setTimeout(() => {
      chartInstance.current?.resize();
    }, 180);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-full" />;
};

interface CompetitionMix {
  high: number;
  medium: number;
  low: number;
  total: number;
}

const SentimentPieChart: React.FC<{ mix: CompetitionMix }> = ({ mix }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const option = {
      tooltip: { trigger: 'item' },
      legend: { top: '5%', left: 'center', show: false },
      series: [
        {
          name: '竞争度占比',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}\n{d}%'
            }
          },
          labelLine: { show: false },
          data: [
            { value: mix.high, name: '高竞争', itemStyle: { color: '#10b981' } },
            { value: mix.medium, name: '中等', itemStyle: { color: '#3b82f6' } },
            { value: mix.low, name: '低竞争', itemStyle: { color: '#ef4444' } }
          ]
        }
      ]
    };

    chartInstance.current.setOption(option);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          chartInstance.current?.resize();
        }
      }
    });
    resizeObserver.observe(el);

    const timer = setTimeout(() => {
      chartInstance.current?.resize();
    }, 180);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [mix]);

  return <div ref={chartRef} className="w-full h-full" />;
};

const getTrendDelta = (values: number[]) => {
  if (values.length < 2) return 0;
  return values[values.length - 1] - values[0];
};

const buildCompetitionMix = (trend: SentimentDashboardData['trend']): CompetitionMix => {
  const lastIndex = Math.max(0, trend.times.length - 1);
  const high = trend.positive[lastIndex] ?? 0;
  const medium = trend.neutral[lastIndex] ?? 0;
  const low = trend.negative[lastIndex] ?? 0;
  const total = Math.max(1, high + medium + low);
  return { high, medium, low, total };
};

// === Main Component ===

/**
 * AnalysisSentiment (岗位竞争度分析页面)
 *
 * @description
 * 针对事业单位招聘市场的岗位竞争度进行深度监测。
 * 核心功能：
 * 1. 竞争度趋势堆叠图 (Stacked Line Chart)：展示高竞争/中等/低竞争岗位随时间的变化比例。
 * 2. 竞争度占比饼图：统计当前总体的岗位竞争度分布。
 * 3. 异常预警列表：自动识别竞争度波动异常的时间点并发出警报。
 * 4. 热门竞争词条：分析影响竞争度的主要关键词 (Top 5)。
 */
const AnalysisSentiment: React.FC = () => {
  const { message } = useUI();
  const [data, setData] = useState<SentimentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSalaryDashboard = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await analysisService.getSentimentDashboard();
      setData(res);
      if (silent) {
        message.success('竞争度数据已更新');
      }
    } catch (error) {
      setData(MOCK_SENTIMENT_DASHBOARD);
      message.warning('竞争度分析接口异常，已展示本地样例数据');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSalaryDashboard();
  }, []);

  const competitionMix = useMemo(() => {
    if (!data) return { high: 0, medium: 0, low: 0, total: 1 };
    return buildCompetitionMix(data.trend);
  }, [data]);

  const competitionPercent = useMemo(() => {
    const toPercent = (value: number) => Math.round((value / competitionMix.total) * 100);
    return {
      high: toPercent(competitionMix.high),
      medium: toPercent(competitionMix.medium),
      low: toPercent(competitionMix.low)
    };
  }, [competitionMix]);

  const highDelta = useMemo(() => (data ? getTrendDelta(data.trend.positive) : 0), [data]);
  const lowDelta = useMemo(() => (data ? getTrendDelta(data.trend.negative) : 0), [data]);
  const totalWarnings = useMemo(() => (data ? data.warnings.length : 0), [data]);
  const criticalWarnings = useMemo(
    () => (data ? data.warnings.filter((item) => item.type === 'critical').length : 0),
    [data]
  );
  const riskKeywordShare = useMemo(() => {
    if (!data || data.keywords.length === 0) return 0;
    const total = data.keywords.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return 0;
    return Math.round((data.keywords[0].count / total) * 100);
  }, [data]);

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
         <Activity className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">岗位竞争度分析</h2>
         <span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded ml-2">竞争度结构监测</span>
        </div>
        <button
          onClick={() => fetchSalaryDashboard(true)}
          disabled={loading || refreshing}
          className="px-3 py-1.5 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '刷新数据'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="text-xs text-slate-500">高竞争岗位占比（实时）</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{competitionPercent.high}%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="text-xs text-slate-500">低竞争岗位占比（实时）</div>
          <div className="text-2xl font-bold text-red-500 mt-1">{competitionPercent.low}%</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="text-xs text-slate-500">异常告警总数</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{totalWarnings}</div>
          <div className="text-[11px] text-amber-500 mt-0.5">严重告警 {criticalWarnings} 条</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            热门岗位集中度
          </div>
          <div className="text-2xl font-bold text-slate-700 mt-1">{riskKeywordShare}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top1 热门竞争岗位占比</div>
        </div>
      </div>

      {/* Top: Main Stacked Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 flex flex-col h-[45%]">
         <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-blue-500" /> 近期岗位竞争度变化趋势
             </h3>
             <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded font-medium border border-green-100">
                  高竞争 {highDelta >= 0 ? '↑' : '↓'} {Math.abs(highDelta)}%
                </span>
                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded font-medium border border-red-100">
                  低竞争 {lowDelta >= 0 ? '↑' : '↓'} {Math.abs(lowDelta)}%
                </span>
             </div>
         </div>
         <div className="flex-1 min-h-0">
             <LoadingState loading={loading} data={data?.trend}>
                 <TrendStackedChart data={data?.trend!} />
             </LoadingState>
         </div>
      </div>

      {/* Bottom: 3 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
         
         {/* 1. Analysis Metric (Pie) */}
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col">
            <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-500" /> 当前总体竞争度占比
            </h3>
            <div className="flex-1 relative">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <span className="text-xs text-slate-400">总样本</span>
                        <div className="text-lg font-bold text-slate-800">{competitionMix.total}</div>
                    </div>
                </div>
                <LoadingState loading={loading} data={competitionMix}>
                    <SentimentPieChart mix={competitionMix} />
                </LoadingState>
            </div>
            <div className="flex justify-around mt-2 text-xs text-slate-500 border-t border-slate-50 pt-3">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 高竞争 {competitionPercent.high}%</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 中等 {competitionPercent.medium}%</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 低竞争 {competitionPercent.low}%</div>
            </div>
         </div>

         {/* 2. Anomaly Warning (List) */}
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col">
            <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> 竞争度异常波动预警
            </h3>
            <div className="flex-1 overflow-y-auto pr-2">
                <LoadingState loading={loading} data={data?.warnings}>
                    <div className="space-y-3">
                        {data?.warnings.map((warn, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 rounded bg-slate-50 border border-slate-100">
                                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                    warn.type === 'critical' ? 'bg-red-500 animate-pulse' : 
                                    warn.type === 'warning' ? 'bg-orange-500' : 'bg-blue-400'
                                }`}></div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono font-bold text-slate-500 bg-white px-1.5 rounded border border-slate-200">{warn.time}</span>
                                        {warn.type === 'critical' && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">严重</span>}
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                        {warn.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                        
                        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0" />
                        建议关注特定地市事业单位岗位的竞争度波动情况，可能与编制政策调整或考试周期相关。
                        </div>
                    </div>
                </LoadingState>
            </div>
         </div>

         {/* 3. Emotion Keywords (List with Bar) */}
         <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex flex-col">
            <h3 className="font-bold text-slate-700 text-sm mb-4 flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-red-500" /> 热门竞争岗位关键词 (Top 5)
            </h3>
            <div className="flex-1 flex flex-col justify-between py-2">
                <LoadingState loading={loading} data={data?.keywords}>
                    {data?.keywords.map((kw, i) => (
                        <div key={i} className="group">
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-bold text-slate-700 flex items-center gap-2">
                                    <span className={`w-4 h-4 flex items-center justify-center rounded-sm text-[10px] ${i===0?'bg-red-100 text-red-600':i===1?'bg-orange-100 text-orange-600':'bg-slate-100 text-slate-500'}`}>
                                        {i+1}
                                    </span>
                                    {kw.word}
                                </span>
                                <span className="font-mono text-slate-400">{kw.count} 次</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className="h-full bg-red-400 rounded-full transition-all duration-1000 ease-out group-hover:bg-red-500" 
                                    style={{ width: `${kw.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </LoadingState>
            </div>
         </div>

      </div>
    </div>
  );
};

export default AnalysisSentiment;
