import React, { useState } from 'react';
import { ArrowRightLeft, Radar, Activity, Zap } from 'lucide-react';
import DashboardCard from './DashboardCard';
import ComparisonRadar from './ComparisonRadar';
import ComparisonTrend from './ComparisonTrend';
import { MOCK_COMPARISON_DATA } from '../constants';
import { ComparisonData } from '../types';

const ComparisonView: React.FC = () => {
  const [topicA, setTopicA] = useState(MOCK_COMPARISON_DATA.topicA);
  const [topicB, setTopicB] = useState(MOCK_COMPARISON_DATA.topicB);
  const [chartData, setChartData] = useState<ComparisonData>(MOCK_COMPARISON_DATA);
  const [loading, setLoading] = useState(false);

  const handleCompare = () => {
    if (!topicA || !topicB) return;
    setLoading(true);
    // Simulate API fetch delay
    setTimeout(() => {
      setChartData({
        ...MOCK_COMPARISON_DATA,
        topicA,
        topicB,
        // Regenerate random data for "new" charts effect
        radarDataA: Array.from({length: 5}, () => Math.floor(Math.random() * 60 + 40)),
        radarDataB: Array.from({length: 5}, () => Math.floor(Math.random() * 60 + 40)),
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      
      {/* Input Control Bar (Styled like Element Plus) */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-lg border border-slate-700/50 backdrop-blur-sm shrink-0">
         <div className="flex items-center gap-2 flex-1">
            <span className="text-cyan-400 font-bold text-sm whitespace-nowrap">岗位 A</span>
            <div className="relative w-full group">
                <input 
                  type="text" 
                  value={topicA}
                  onChange={(e) => setTopicA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
                  placeholder="输入岗位名称..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
            </div>
         </div>

         <div className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
            </div>
         </div>

         <div className="flex items-center gap-2 flex-1">
            <span className="text-fuchsia-400 font-bold text-sm whitespace-nowrap">岗位 B</span>
             <div className="relative w-full group">
                <input 
                  type="text" 
                  value={topicB}
                  onChange={(e) => setTopicB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-colors shadow-inner"
                  placeholder="输入岗位名称..."
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#d946ef]"></div>
            </div>
         </div>

         <button 
           onClick={handleCompare}
           disabled={loading}
           className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold rounded shadow-lg shadow-cyan-900/50 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
         >
           {loading ? '分析中...' : '开始对比'}
           <Zap className="w-4 h-4" />
         </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
         
         {/* Left Column: Topic A Stats + Radar (40%) */}
         <div className="w-2/5 flex flex-col gap-4">
             {/* Stats Cards Row */}
             <div className="flex gap-4 h-32 shrink-0">
                 <div className="flex-1 tech-border p-4 bg-slate-900/30 rounded flex flex-col justify-center items-center gap-1">
                    <span className="text-xs text-cyan-500 uppercase tracking-wider">综合热度 (A)</span>
                    <span className="text-2xl font-mono font-bold text-white">92.4</span>
                    <span className="text-[10px] text-green-400 flex items-center">↑ 12%</span>
                 </div>
                 <div className="flex-1 tech-border p-4 bg-slate-900/30 rounded flex flex-col justify-center items-center gap-1">
                    <span className="text-xs text-fuchsia-500 uppercase tracking-wider">综合热度 (B)</span>
                    <span className="text-2xl font-mono font-bold text-white">88.7</span>
                    <span className="text-[10px] text-red-400 flex items-center">↓ 3%</span>
                 </div>
             </div>

             <DashboardCard title="维度对比雷达" icon={Radar} className="flex-1">
                 <ComparisonRadar data={chartData} />
             </DashboardCard>
         </div>

         {/* Right Column: Dual Trend (60%) */}
         <div className="w-3/5 flex flex-col gap-4">
             <div className="h-32 shrink-0 tech-border p-4 bg-slate-900/30 rounded">
                 <h3 className="text-cyan-100 text-sm font-bold mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" /> 
                    AI 对比结论
                 </h3>
                 <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    → <span className="text-cyan-400">{chartData.topicA}</span> 在“岗位需求峰值”和“技能成长空间”上表现更优，适合技术深耕型候选人。<br/>
                    → <span className="text-fuchsia-400">{chartData.topicB}</span> 在“薪资稳定性”维度更高，适合追求长期稳定的职业路径。
                 </p>
             </div>

             <DashboardCard title="双波形需求趋势" icon={Activity} className="flex-1">
                 <ComparisonTrend data={chartData} />
             </DashboardCard>
         </div>
      </div>

    </div>
  );
};

export default ComparisonView;
