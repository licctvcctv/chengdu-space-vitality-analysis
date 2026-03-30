import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Zap, Radar, Activity, Loader2, Brain } from 'lucide-react';
import ComparisonRadar from '../components/ComparisonRadar';
import ComparisonTrend from '../components/ComparisonTrend';
import { analysisService } from '../api/analysisService';
import { ComparisonAiInsight, ComparisonData } from '../types';
import { aiInsightService } from '../api/aiInsightService';
import { useUI } from '../components/ui/UIProvider';

/**
 * AnalysisCompare (地市招聘对比分析页面)
 *
 * @description
 * 提供广东省不同地市（如广州、深圳、珠海等）的多维度招聘对比分析。
 * 核心功能：
 * 1. 顶部输入栏：允许用户自定义输入两个对比地市 (地市 A vs 地市 B)。
 * 2. 维度雷达图：对比两个地市在"岗位热度"、"编制规模"、"学历要求"等5个维度的表现。
 * 3. AI 智能结论：根据数据自动生成文本形式的对比分析报告。
 * 4. 双波形趋势图：在同一时间轴上展示两个地市的招聘需求走势，方便观察变化差异。
 */
const AnalysisCompare: React.FC = () => {
  const { message } = useUI();
  const [topicA, setTopicA] = useState('广州市');
  const [topicB, setTopicB] = useState('深圳市');
  const [chartData, setChartData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<ComparisonAiInsight | null>(null);

  // Initial Load
  useEffect(() => {
    handleCompare();
  }, []);

  const handleCompare = async () => {
    if (!topicA || !topicB) return;
    setLoading(true);
    setAiLoading(true);
    try {
      const res = await analysisService.getComparisonData(topicA, topicB);
      setChartData(res);

      const insight = await aiInsightService.generateComparisonInsight({
        topicA: res.topicA,
        topicB: res.topicB,
        radarDataA: res.radarDataA,
        radarDataB: res.radarDataB,
        trendData: res.trendData
      });
      setAiInsight(insight);
    } catch (error) {
      message.error('岗位对比分析失败，请稍后重试');
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-blue-600" /> 地市招聘对比分析
            </h2>
            <span className="text-sm text-slate-400">地市招聘洞察</span>
         </div>

         <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
             {/* Input A */}
             <div className="flex-1">
                <label className="text-xs font-bold text-cyan-600 mb-1 block">地市 A</label>
                <input
                  type="text"
                  value={topicA}
                  onChange={(e) => setTopicA(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
             </div>

             <div className="pt-5">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">VS</div>
             </div>

             {/* Input B */}
             <div className="flex-1">
                <label className="text-xs font-bold text-fuchsia-600 mb-1 block">地市 B</label>
                <input
                  type="text"
                  value={topicB}
                  onChange={(e) => setTopicB(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all"
                />
             </div>

             <div className="pt-5">
               <button 
                 onClick={handleCompare}
                 disabled={loading}
                 className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 {loading ? '分析中...' : '开始对比'}
                 <Zap className="w-4 h-4" />
               </button>
             </div>
         </div>
      </div>

      {/* Charts Area */}
      {chartData ? (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
           
           {/* Left: Radar (4 cols) */}
           <div className="lg:col-span-4 flex flex-col gap-6">
               {/* Score Cards */}
               <div className="flex gap-4">
                   <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
                      <span className="text-xs text-slate-400 uppercase">综合得分 (A)</span>
                      <span className="text-2xl font-bold text-cyan-600">92.4</span>
                   </div>
                   <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center">
                      <span className="text-xs text-slate-400 uppercase">综合得分 (B)</span>
                      <span className="text-2xl font-bold text-fuchsia-600">88.7</span>
                   </div>
               </div>

               <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[300px]">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <Radar className="w-4 h-4 text-purple-500" /> 维度雷达图
                   </div>
                   <div className="flex-1 p-2">
                       <ComparisonRadar data={chartData} theme="light" />
                   </div>
               </div>
           </div>

           {/* Right: Trend (8 cols) */}
           <div className="lg:col-span-8 flex flex-col gap-6">
               {/* AI Conclusion */}
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                   <h4 className="text-blue-800 text-sm font-bold mb-1 flex items-center gap-2">
                      <Brain className="w-4 h-4" /> AI 智能对比结论
                   </h4>
                   {aiLoading ? (
                     <div className="text-xs text-blue-700 flex items-center gap-2">
                       <Loader2 className="w-3.5 h-3.5 animate-spin" />
                       AI 正在生成岗位对比结论...
                     </div>
                   ) : aiInsight ? (
                     <div className="space-y-2 text-xs text-blue-800 leading-relaxed">
                       <p>{aiInsight.summary}</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                         <div className="rounded border border-cyan-100 bg-cyan-50 px-2 py-1.5">
                           <div className="font-semibold text-cyan-700 mb-1">{chartData.topicA} 优势</div>
                           <ul className="space-y-1">
                             {aiInsight.advantagesA.map((item) => (
                               <li key={item}>- {item}</li>
                             ))}
                           </ul>
                         </div>
                         <div className="rounded border border-fuchsia-100 bg-fuchsia-50 px-2 py-1.5">
                           <div className="font-semibold text-fuchsia-700 mb-1">{chartData.topicB} 优势</div>
                           <ul className="space-y-1">
                             {aiInsight.advantagesB.map((item) => (
                               <li key={item}>- {item}</li>
                             ))}
                           </ul>
                         </div>
                       </div>
                       <div className="rounded border border-blue-100 bg-white px-2 py-1.5">
                         <div className="font-semibold text-blue-700 mb-1">AI 建议</div>
                         <ul className="space-y-1">
                           {aiInsight.suggestions.map((item) => (
                             <li key={item}>- {item}</li>
                           ))}
                         </ul>
                       </div>
                     </div>
                   ) : (
                     <p className="text-xs text-blue-700">点击“开始对比”后将自动生成 AI 对比结论。</p>
                   )}
               </div>

               <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[300px]">
                   <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" /> 12个月招聘需求趋势对比
                   </div>
                   <div className="flex-1 p-4">
                       <ComparisonTrend data={chartData} theme="light" />
                   </div>
               </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
            {loading ? <Loader2 className="w-8 h-8 animate-spin text-blue-500" /> : '请输入岗位并开始对比'}
        </div>
      )}
    </div>
  );
};

export default AnalysisCompare;
