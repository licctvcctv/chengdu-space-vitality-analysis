
import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { 
  Search, TrendingUp, Cpu, Calendar, 
  AlertTriangle, Lightbulb, Activity, CheckCircle2, Brain, Loader2
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';
import { miningService } from '../api/miningService';
import { ForecastAiInsight, PredictionResult } from '../types';
import { aiInsightService } from '../api/aiInsightService';

// === Charts Component ===

const PredictionChart: React.FC<{ data: PredictionResult }> = ({ data }) => {
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
        formatter: (params: any[]) => {
            let res = `<div class="font-bold border-b pb-1 mb-1">${params[0].axisValue}</div>`;
            params.forEach(p => {
                if (p.value !== null && p.value !== undefined) {
                    const isPred = p.seriesName === '预测需求';
                    res += `<div class="flex justify-between gap-4 text-xs mt-1">
                              <span style="color:${p.color}">${p.marker} ${p.seriesName}</span>
                              <span class="font-mono font-bold">${p.value.toLocaleString()}</span>
                            </div>
                            ${isPred ? '<div class="text-[10px] text-slate-400 mt-0.5 pl-4">Algorithm: Linear Regression (Spark)</div>' : ''}
                            `;
                }
            });
            return res;
        }
      },
      legend: {
        data: ['历史真实需求', 'Spark 预测需求'],
        bottom: 0,
        textStyle: { color: '#64748b' }
      },
      grid: {
        top: '15%', left: '3%', right: '4%', bottom: '10%', containLabel: true
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
        name: '需求指数',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { formatter: (val: number) => (val / 10000).toFixed(1) + 'w' }
      },
      series: [
        {
          name: '历史真实需求',
          type: 'line',
          smooth: true,
          data: data.realData,
          symbol: 'none', // Hide symbol for clean line
          lineStyle: { width: 3, color: '#3b82f6' }, // Blue Solid
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ])
          },
          markPoint: {
            data: [{ type: 'max', name: '当前最高' }],
            symbolSize: 40,
            itemStyle: { color: '#3b82f6' }
          }
        },
        {
          name: 'Spark 预测需求',
          type: 'line',
          smooth: true,
          data: data.predData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#f59e0b', type: 'dashed' }, // Orange Dashed
          itemStyle: { color: '#f59e0b', borderColor: '#fff', borderWidth: 2 },
          markPoint: {
            data: [{ type: 'max', name: '预测峰值' }],
            symbolSize: 50,
            itemStyle: { color: '#f59e0b' },
            label: { formatter: '预测峰值', fontSize: 10 }
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
  }, [data]);

  return <div ref={chartRef} className="w-full h-full" />;
};

// === Main Component ===

/**
 * MiningPrediction (招聘需求预测页面)
 *
 * @description
 * 大数据挖掘模块：基于 Spark MLlib 线性回归算法的事业单位招聘需求预测。
 * 核心功能：
 * 1. 岗位查询：输入任意事业单位岗位关键词进行实时预测计算。
 * 2. 趋势拟合图：展示"历史需求"与"算法预测需求"的曲线对比，虚线部分为未来预测值。
 * 3. 预测结论卡片：展示预计需求峰值时间、需求峰值及模型信心指数。
 * 4. 决策建议：根据预测结果自动生成招聘响应建议。
 */
const MiningPrediction: React.FC = () => {
  const { message } = useUI();
  
  // State
  const [topic, setTopic] = useState('教师（教育类）');
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<ForecastAiInsight | null>(null);
  
  const handlePredict = async () => {
    if (!topic) {
        message.error("请输入岗位名称");
        return;
    }
    setLoading(true);
    setAiLoading(true);

    try {
      const res = await miningService.getPrediction(topic);
      setPredictionResult(res);
      const actual = res.realData.filter((item): item is number => typeof item === 'number');
      const predicted = res.predData.filter((item): item is number => typeof item === 'number');
      const insight = await aiInsightService.generateForecastInsight({
        topic,
        peakTime: res.stats.peakTime,
        peakValue: res.stats.peakValue,
        confidence: res.stats.confidence,
        recentActual: actual.slice(-4),
        futurePredicted: predicted
      });
      setAiInsight(insight);
      message.success(`岗位 "${topic}" 招聘需求预测完成`);
    } catch (err) {
      setLoading(false);
      message.error("预测计算失败");
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    handlePredict();
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* 1. Header & Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
         <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">招聘需求预测</h2>
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">
                Model: Spark MLlib Linear Regression
            </span>
         </div>

         <div className="flex gap-4">
             <div className="relative flex-1 group">
                 <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="请输入事业单位岗位名称 (例如: 教师、医护人员)"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 transition-all"
                 />
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
             </div>
             <button 
                onClick={handlePredict}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-70"
             >
                {loading ? <Cpu className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                {loading ? '计算中...' : '开始预测'}
             </button>
         </div>
      </div>

      {/* 2. Main Content: Chart + Stats */}
      {predictionResult ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
            
            {/* Chart Area (2/3) */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                   <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" /> 实际需求与未来趋势拟合
                   </h3>
                   <div className="flex items-center gap-4 text-xs">
                       <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 历史实况</span>
                       <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-orange-400"></span> 算法预测</span>
                   </div>
               </div>
               <div className="flex-1 p-4 relative">
                   {loading && (
                      <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center flex-col gap-2 backdrop-blur-sm">
                          <Cpu className="w-8 h-8 text-blue-500 animate-spin" />
                          <span className="text-sm text-slate-500">Spark 集群计算中...</span>
                      </div>
                   )}
                   <PredictionChart data={predictionResult} />
               </div>
            </div>

            {/* Stats & Insight (1/3) */}
            <div className="flex flex-col gap-6">
                
                {/* Prediction Card */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-100 to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                    
                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 relative z-10">
                        <TrendingUp className="w-4 h-4 text-orange-500" /> 预测结论 (Prediction)
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                            <span className="text-xs text-slate-500 block mb-1">预计峰值时间</span>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <span className="text-xl font-mono font-bold text-slate-800">{predictionResult.stats.peakTime}</span>
                            </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded border border-slate-100">
                            <span className="text-xs text-slate-500 block mb-1">预计需求峰值</span>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-slate-400" />
                                <span className="text-xl font-mono font-bold text-orange-600">{(predictionResult.stats.peakValue / 10000).toFixed(1)}w</span>
                            </div>
                        </div>

                        <div className="p-3 bg-blue-50 rounded border border-blue-100">
                            <span className="text-xs text-blue-600 block mb-1">模型信心指数</span>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                <span className="text-2xl font-mono font-bold text-blue-700">{predictionResult.stats.confidence}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actionable Insight Alert */}
                <div className="flex-1 bg-yellow-50 rounded-lg border border-yellow-200 p-5 flex flex-col">
                    <h3 className="font-bold text-yellow-800 text-sm flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4" /> AI 预测解读
                    </h3>
                    
                    {aiLoading ? (
                      <div className="flex-1 text-sm text-yellow-900/80 leading-relaxed flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-yellow-700" />
                        AI 正在生成预测解读...
                      </div>
                    ) : aiInsight ? (
                      <div className="flex-1 text-sm text-yellow-900/80 leading-relaxed space-y-3">
                        <p>{aiInsight.summary}</p>

                        <div className="rounded bg-white/60 border border-yellow-200 px-3 py-2">
                          <div className="text-xs text-yellow-700 font-semibold mb-1">趋势信号</div>
                          <ul className="space-y-1 text-xs">
                            {aiInsight.trendSignals.map((item) => (
                              <li key={item}>- {item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="border-t border-yellow-200/50 pt-3 mt-1 space-y-2">
                          <div className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            风险提醒
                          </div>
                          <ul className="space-y-1 text-xs">
                            {aiInsight.riskPoints.map((item) => (
                              <li key={item}>- {item}</li>
                            ))}
                          </ul>
                          <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            建议动作
                          </div>
                          <ul className="space-y-1 text-xs">
                            {aiInsight.actions.map((item) => (
                              <li key={item}>- {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 text-sm text-yellow-900/80 leading-relaxed">
                        点击“开始预测”后将自动生成 AI 预测解读。
                      </div>
                    )}
                </div>

            </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
            {loading && <div className="text-slate-400">初始化模型...</div>}
        </div>
      )}
    </div>
  );
};

export default MiningPrediction;
