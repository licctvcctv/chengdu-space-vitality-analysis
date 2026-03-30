
import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { 
  Clock, TrendingUp, MessageCircle, Flag, CheckCircle2, Circle
} from 'lucide-react';
import { analysisService } from '../api/analysisService';
import { EvolutionNode } from '../types';
import { LoadingState } from '../components/ui/LoadingState';

const CITY_PROFILES = [
  { code: 'nation', label: '广东省（全省）', factor: 1, sourceMix: { boss: 37, liepin: 24, zhilian: 21, lagou: 18 } },
  { code: 'guangzhou', label: '广州市', factor: 1.18, sourceMix: { boss: 35, liepin: 27, zhilian: 19, lagou: 19 } },
  { code: 'shenzhen', label: '深圳市', factor: 1.13, sourceMix: { boss: 34, liepin: 29, zhilian: 18, lagou: 19 } },
  { code: 'foshan', label: '佛山市', factor: 1.04, sourceMix: { boss: 39, liepin: 23, zhilian: 17, lagou: 21 } },
  { code: 'dongguan', label: '东莞市', factor: 1.02, sourceMix: { boss: 41, liepin: 19, zhilian: 16, lagou: 24 } },
  { code: 'zhuhai', label: '珠海市', factor: 0.98, sourceMix: { boss: 38, liepin: 20, zhilian: 22, lagou: 20 } },
  { code: 'huizhou', label: '惠州市', factor: 0.93, sourceMix: { boss: 40, liepin: 16, zhilian: 25, lagou: 19 } }
] as const;

const INDUSTRY_PROFILES = [
  { code: 'all', label: '全类别', factor: 1, volatility: 1, insight: '综合口径，便于观察整体事业单位供需变化。' },
  { code: 'education', label: '教育类', factor: 1.16, volatility: 1.2, insight: '中小学及高校教师招聘需求旺盛，暑期高峰明显。' },
  { code: 'health', label: '医疗卫生', factor: 1.15, volatility: 1.1, insight: '医护岗位稳步增长，需求持续释放。' },
  { code: 'admin', label: '行政管理', factor: 1.05, volatility: 0.92, insight: '供需波动较温和，稳定编制岗位占比高。' },
  { code: 'science', label: '科研技术', factor: 1.08, volatility: 1.06, insight: '研究院所岗位增速快，高学历需求突出。' },
  { code: 'cultural', label: '文化事业', factor: 0.92, volatility: 0.86, insight: '招聘节奏偏平稳，需求释放更持续。' }
] as const;

const PHASE_BIAS = [120, 280, 460, 620, 520, 280, 40, -180];

// === Charts Components ===

const HeatTrendChart: React.FC<{ timeline: EvolutionNode[], activeId: number }> = ({ timeline, activeId }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    if (timeline.length === 0) return;

    // Map timeline to forecast trend
    const dataX = timeline.map(t => t.time);
    const dataY = timeline.map(t => t.heat);
    const peakNode = timeline.reduce((peak, current) => (current.heat > peak.heat ? current : peak), timeline[0]);
    const valleyNode = timeline.reduce((valley, current) => (current.heat < valley.heat ? current : valley), timeline[0]);
    const activeNode = timeline[Math.max(0, Math.min(activeId, timeline.length - 1))];

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const point = Array.isArray(params) ? params[0] : params;
          const value = Number(point?.value || 0);
          return `${point?.axisValue}<br/>预测热度：${value.toLocaleString()}`;
        }
      },
      grid: {
        top: '15%', left: '3%', right: '4%', bottom: '5%', containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dataX,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: {
        type: 'value',
        name: '预测热度',
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
            return `${value}`;
          }
        },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      series: [
        {
          name: '预测热度',
          type: 'line',
          smooth: true,
          data: dataY,
          lineStyle: { width: 3, color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ])
          },
          markPoint: {
            symbolSize: 54,
            label: {
              formatter: (item: any) => item?.name || '',
              color: '#334155',
              fontSize: 10
            },
            data: [
              {
                name: '峰值',
                coord: [peakNode.time, peakNode.heat],
                itemStyle: { color: '#ef4444' }
              },
              {
                name: '低谷',
                coord: [valleyNode.time, valleyNode.heat],
                itemStyle: { color: '#14b8a6' }
              },
              {
                name: '当前',
                coord: [activeNode.time, activeNode.heat],
                itemStyle: { color: '#f59e0b' }
              }
            ]
          },
          markLine: {
            symbol: 'none',
            label: { color: '#64748b' },
            lineStyle: { type: 'dashed', color: '#94a3b8' },
            data: [{ type: 'average', name: '日均' }]
          }
        }
      ]
    };

    chartInstance.current.setOption(option);
    
    const resizeObserver = new ResizeObserver((entries) => {
        for(let entry of entries) {
            if(entry.contentRect.width > 0) chartInstance.current?.resize();
        }
    });
    resizeObserver.observe(el);

    const timer = setTimeout(() => {
        chartInstance.current?.resize();
    }, 200);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [timeline, activeId]);

  return <div ref={chartRef} className="w-full h-full" />;
};

const PhaseWordCloud: React.FC<{ keywords: { name: string; value: number }[] }> = ({ keywords }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const option = {
      tooltip: { show: true },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center', top: 'center',
        width: '95%', height: '95%',
        sizeRange: [12, 40],
        rotationRange: [-45, 45],
        gridSize: 8,
        textStyle: {
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          color: () => {
             const colors = ['#3b82f6', '#06b6d4', '#8b5cf6', '#f43f5e', '#10b981'];
             return colors[Math.floor(Math.random() * colors.length)];
          }
        },
        data: keywords
      }]
    };

    chartInstance.current.setOption(option);

    const resizeObserver = new ResizeObserver((entries) => {
        for(let entry of entries) {
            if(entry.contentRect.width > 0) chartInstance.current?.resize();
        }
    });
    resizeObserver.observe(el);

    const timer = setTimeout(() => {
        chartInstance.current?.resize();
    }, 200);

    return () => {
        resizeObserver.disconnect();
        clearTimeout(timer);
        chartInstance.current?.dispose();
        chartInstance.current = null;
    };
  }, [keywords]);

  return <div ref={chartRef} className="w-full h-full" />;
};

// === Main Page Component ===

/**
 * AnalysisEvolution (岗位需求演进追踪页面)
 * 
 * @description
 * 按时间轴追踪岗位需求变化生命周期。
 * 核心功能：
 * 1. 时间轴导航：展示招聘需求从“启动”到“分化”的关键节点。
 * 2. 需求演变趋势图：结合关键节点的折线图，展示需求指数变化。
 * 3. 阶段词云快照：展示该时间点的热门技能关键词。
 * 4. 阶段智能总结：输出当前阶段的招聘洞察结论。
 */
const AnalysisEvolution: React.FC = () => {
  const [timelineData, setTimelineData] = useState<EvolutionNode[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState(0);
  const [selectedCity, setSelectedCity] = useState<(typeof CITY_PROFILES)[number]['code']>('nation');
  const [selectedIndustry, setSelectedIndustry] = useState<(typeof INDUSTRY_PROFILES)[number]['code']>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analysisService.getEvolutionData().then(res => {
      setTimelineData(res);
      const processIndex = res.findIndex((node) => node.status === 'process');
      const latestFinishedIndex = res.reduce((latest, node, index) => (node.status === 'finish' ? index : latest), 0);
      setActiveNodeIndex(processIndex >= 0 ? processIndex : latestFinishedIndex);
      setLoading(false);
    });
  }, []);

  const cityProfile = useMemo(
    () => CITY_PROFILES.find((item) => item.code === selectedCity) ?? CITY_PROFILES[0],
    [selectedCity]
  );
  const industryProfile = useMemo(
    () => INDUSTRY_PROFILES.find((item) => item.code === selectedIndustry) ?? INDUSTRY_PROFILES[0],
    [selectedIndustry]
  );

  const scopedTimeline = useMemo(() => {
    return timelineData.map((node, index) => {
      const stageBias = (PHASE_BIAS[index] ?? 0) * industryProfile.volatility;
      const scopedHeat = Math.max(
        3600,
        Math.round(node.heat * cityProfile.factor * industryProfile.factor + stageBias)
      );
      const keywordScale = 0.92 + (cityProfile.factor - 1) * 0.4 + (industryProfile.factor - 1) * 0.5;
      const scopedKeywords = node.keywords
        .map((keyword, keywordIndex) => ({
          ...keyword,
          value: Math.max(
            20,
            Math.round(keyword.value * keywordScale + (keywordIndex === 0 ? industryProfile.volatility * 3 : 0))
          )
        }))
        .sort((a, b) => b.value - a.value);
      return {
        ...node,
        heat: scopedHeat,
        keywords: scopedKeywords
      };
    });
  }, [timelineData, cityProfile, industryProfile]);

  const activeNodeData = scopedTimeline[activeNodeIndex];
  const activeDemandDelta = useMemo(() => {
    if (activeNodeIndex <= 0 || !scopedTimeline[activeNodeIndex - 1] || !activeNodeData) return 0;
    return activeNodeData.heat - scopedTimeline[activeNodeIndex - 1].heat;
  }, [activeNodeData, activeNodeIndex, scopedTimeline]);
  const activeDemandDeltaLabel = activeDemandDelta >= 0 ? `+${activeDemandDelta}` : `${activeDemandDelta}`;

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-2">
         <div className="flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">招聘趋势演变</h2>
            <span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded ml-2">
              Forecast: {cityProfile.label} · {industryProfile.label} · 事业单位招聘趋势演变
            </span>
         </div>
         <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              地市口径
              <select
                className="h-8 px-2 rounded border border-slate-200 text-sm text-slate-700 bg-white"
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value as (typeof CITY_PROFILES)[number]['code'])}
              >
                {CITY_PROFILES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              岗位类别
              <select
                className="h-8 px-2 rounded border border-slate-200 text-sm text-slate-700 bg-white"
                value={selectedIndustry}
                onChange={(event) => setSelectedIndustry(event.target.value as (typeof INDUSTRY_PROFILES)[number]['code'])}
              >
                {INDUSTRY_PROFILES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
         </div>
      </div>

      {/* 2. Horizontal Timeline (Element Plus Style) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
         <LoadingState loading={loading} data={scopedTimeline}>
             <div className="relative flex justify-between items-center px-8 py-4">
                
                {/* Connecting Line background */}
                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-200 -z-0 -translate-y-[15px]"></div>
                
                {scopedTimeline.map((node, index) => {
                   const isActive = index === activeNodeIndex;
                   const isPassed = index < activeNodeIndex;
                   
                   let iconColorClass = 'text-slate-300 bg-white border-slate-300'; // Default wait
                   if (isActive) iconColorClass = 'text-blue-600 bg-white border-blue-600 ring-4 ring-blue-50'; // Process
                   else if (isPassed) iconColorClass = 'text-green-500 bg-white border-green-500'; // Finish

                   return (
                      <div 
                        key={node.id} 
                        className="relative z-10 flex flex-col items-center cursor-pointer group"
                        onClick={() => setActiveNodeIndex(index)}
                      >
                         {/* Node Circle */}
                         <div className={`
                            w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300
                            ${iconColorClass}
                         `}>
                            {isPassed ? (
                               <CheckCircle2 className="w-5 h-5" />
                            ) : (
                               isActive ? <Circle className="w-4 h-4 fill-current" /> : <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                            )}
                         </div>
                         
                         {/* Text Info */}
                         <div className="mt-3 text-center space-y-1">
                            <div className={`text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-600'}`}>
                               {node.title}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{node.time}</div>
                            <div className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              node.status === 'finish'
                                ? 'bg-emerald-50 text-emerald-600'
                                : node.status === 'process'
                                ? 'bg-blue-50 text-blue-600'
                                : node.status === 'error'
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {node.status === 'finish' ? '历史观测' : node.status === 'process' ? '预测中' : node.status === 'error' ? '模型异常' : '待预测'}
                            </div>
                         </div>
                      </div>
                   );
                })}
             </div>
         </LoadingState>
      </div>

      {/* 3. Main Content: Charts & Details */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
         
         {/* Left: Heat Trend (2/3) */}
         <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
               <TrendingUp className="w-4 h-4 text-blue-500" />
               <h3 className="font-bold text-slate-700 text-sm">未来热门岗位热度曲线</h3>
            </div>
            <div className="flex-1 p-4">
               <LoadingState loading={loading} data={timelineData}>
                   <HeatTrendChart timeline={scopedTimeline} activeId={activeNodeIndex} />
               </LoadingState>
            </div>
            {/* Phase Summary Footer */}
            <div className="p-4 bg-blue-50 border-t border-blue-100 flex items-start gap-3">
               <Flag className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
               <LoadingState loading={loading} data={activeNodeData} className="!min-h-0 !h-auto">
                   <div>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1 block">
                        预测结论 ({activeNodeData?.time} - {activeNodeData?.title})
                      </span>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        {activeNodeData?.summary}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-white text-slate-700 border border-blue-100">
                          当前预测热度：{activeNodeData?.heat.toLocaleString()}
                        </span>
                        <span className={`px-2 py-1 rounded border ${
                          activeDemandDelta >= 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          较上一阶段：{activeDemandDeltaLabel}
                        </span>
                      </div>
                   </div>
               </LoadingState>
            </div>
         </div>

         {/* Right: Word Cloud (1/3) */}
         <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  <h3 className="font-bold text-slate-700 text-sm">热门岗位关键词</h3>
               </div>
               <span className="text-xs text-slate-400">Forecast @ {activeNodeData?.time}</span>
            </div>
            <div className="flex-1 p-2 bg-slate-50/50">
               <LoadingState loading={loading} data={activeNodeData?.keywords}>
                   <PhaseWordCloud keywords={activeNodeData?.keywords || []} />
               </LoadingState>
            </div>
            
            {/* Stats List */}
            <div className="border-t border-slate-100 divide-y divide-slate-50">
               {!loading && activeNodeData?.keywords.slice(0, 3).map((kw, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                     <span className="text-slate-600 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${i===0?'bg-red-500':i===1?'bg-orange-500':'bg-yellow-500'}`}></span>
                        {kw.name}
                     </span>
                     <span className="font-mono text-slate-400">{kw.value}</span>
                  </div>
               ))}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-2">
               <h4 className="text-xs font-bold text-slate-700 tracking-wide">热门预测模型说明</h4>
               <p className="text-xs text-slate-600 leading-relaxed">
                 预测公式：预测热度 = 历史热度 × 0.55 + 新增岗位增速 × 0.30 + 企业活跃度 × 0.15
               </p>
               <p className="text-xs text-slate-600">
                 当前口径：{cityProfile.label} · {industryProfile.label}。采用 LSTM + XGBoost 融合预测，{industryProfile.insight}
               </p>
               <div className="grid grid-cols-2 gap-2 text-xs">
                 {[
                   ['广东人社局', cityProfile.sourceMix.boss],
                   ['广东政务网', cityProfile.sourceMix.liepin],
                   ['教育考试院', cityProfile.sourceMix.zhilian],
                   ['其他来源', cityProfile.sourceMix.lagou]
                 ].map(([name, percent]) => (
                   <div key={name} className="flex items-center justify-between px-2 py-1 rounded border border-slate-200 bg-white text-slate-600">
                     <span>{name}</span>
                     <span className="font-semibold text-slate-700">{percent}%</span>
                   </div>
                 ))}
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default AnalysisEvolution;
