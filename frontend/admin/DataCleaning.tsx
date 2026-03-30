import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, Trash2, CopyX, CheckCircle, 
  Terminal, Play, Pause, Activity, Server, Brain, Loader2, AlertTriangle
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';
import { aiInsightService } from '../api/aiInsightService';
import { DataCleaningAiInsight } from '../types';

// === Log Generator Utility ===
const generateLog = () => {
  const actions = [
    { type: 'INFO', msg: 'Spark Streaming batch started. Batch ID: ' + Math.floor(Math.random() * 10000) },
    { type: 'INFO', msg: `Filtering duplicate job ID ${Math.floor(Math.random() * 90000) + 10000}...` },
    { type: 'INFO', msg: 'Normalizing salary unit and location fields...' },
    { type: 'INFO', msg: 'Parsing education / experience requirements...' },
    { type: 'WARN', msg: 'Sensitive keyword detected in job description. Masking applied.' },
    { type: 'WARN', msg: `High latency detected in partition ${Math.floor(Math.random() * 10)}.` },
    { type: 'SUCCESS', msg: `Batch processing completed. Written ${Math.floor(Math.random() * 500)} job records to HBase.` },
    { type: 'INFO', msg: 'Detecting abnormal salary intervals...' },
  ];
  const rand = Math.random();
  // Probabilities: 70% INFO, 20% SUCCESS, 10% WARN
  const index = rand > 0.3 ? (rand > 0.9 ? 4 : (rand > 0.8 ? 5 : Math.floor(Math.random() * 4))) : 6;
  
  const now = new Date();
  const timeStr = `[${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}]`;
  
  return {
    time: timeStr,
    ...actions[index]
  };
};

// === Components ===

const StatCard = ({ title, value, icon: Icon, colorClass, subText }: any) => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{subText}</div>
    </div>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

const DataCleaning: React.FC = () => {
  const { message } = useUI();

  // Stats State
  const [stats, setStats] = useState({
    raw: 125430,
    spam: 32100,
    dup: 11200,
    valid: 82130
  });

  // Log State
  const [logs, setLogs] = useState<{time: string, type: string, msg: string}[]>([
    { time: '[SYSTEM]', type: 'INFO', msg: 'Initializing Spark Context...' },
    { time: '[SYSTEM]', type: 'INFO', msg: 'Connecting to Kafka Topic: recruitment_raw_stream...' },
    { time: '[SYSTEM]', type: 'SUCCESS', msg: 'Connection established. Waiting for data...' },
  ]);
  
  const [isRunning, setIsRunning] = useState(true);
  const [bufferUsage, setBufferUsage] = useState(45);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<DataCleaningAiInsight | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulation Effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // 1. Add Log
      const newLog = generateLog();
      setLogs(prev => [...prev.slice(-100), newLog]); // Keep last 100 logs

      // 2. Update Stats (Simulate accumulation)
      setStats(prev => ({
        raw: prev.raw + Math.floor(Math.random() * 20),
        spam: prev.spam + (Math.random() > 0.7 ? 1 : 0),
        dup: prev.dup + (Math.random() > 0.8 ? 1 : 0),
        valid: prev.valid + Math.floor(Math.random() * 15)
      }));

      // 3. Update Buffer
      setBufferUsage(prev => {
        const change = Math.floor(Math.random() * 10) - 5;
        const next = Math.max(20, Math.min(90, prev + change));
        return next;
      });

    }, 800); // Speed of logs

    return () => clearInterval(interval);
  }, [isRunning]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredRate = stats.raw > 0 ? (stats.spam / stats.raw) * 100 : 0;
  const duplicateRate = stats.raw > 0 ? (stats.dup / stats.raw) * 100 : 0;
  const validRate = stats.raw > 0 ? (stats.valid / stats.raw) * 100 : 0;

  const handleGenerateAiInsight = async () => {
    setAiLoading(true);
    try {
      const insight = await aiInsightService.generateDataCleaningInsight({
        raw: stats.raw,
        spam: stats.spam,
        dup: stats.dup,
        valid: stats.valid,
        bufferUsage,
        recentLogs: logs.slice(-10).map((log) => `${log.time} [${log.type}] ${log.msg}`)
      });
      setAiInsight(insight);
      message.success('AI 清洗诊断已生成');
    } catch (error) {
      message.error('AI 诊断生成失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* 1. Header & Controls */}
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">数据清洗作业日志</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ml-2 ${isRunning ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                STATUS: {isRunning ? 'PROCESSING' : 'PAUSED'}
            </span>
         </div>
         <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all active:scale-95 ${
                isRunning ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200' : 'bg-green-500 hover:bg-green-600 shadow-green-200'
            } shadow-md`}
         >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? '暂停清洗' : '恢复任务'}
         </button>
      </div>

      {/* 2. Top Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
         <StatCard 
            title="已采集原始岗位量" 
            value={stats.raw.toLocaleString()} 
            subText="+124/s"
            icon={Database} 
            colorClass="bg-blue-500" 
         />
         <StatCard 
            title="已过滤低质量岗位" 
            value={stats.spam.toLocaleString()} 
            subText={`过滤率 ${filteredRate.toFixed(1)}%`}
            icon={Trash2} 
            colorClass="bg-red-500" 
         />
         <StatCard 
            title="重复岗位去重数" 
            value={stats.dup.toLocaleString()} 
            subText={`去重率 ${duplicateRate.toFixed(1)}%`}
            icon={CopyX} 
            colorClass="bg-orange-500" 
         />
         <StatCard 
            title="入库有效岗位量" 
            value={stats.valid.toLocaleString()} 
            subText={`有效率 ${validRate.toFixed(1)}%`}
            icon={CheckCircle} 
            colorClass="bg-green-500" 
         />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              AI 清洗诊断
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              基于当前清洗指标与实时日志，自动生成风险研判与策略建议。
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateAiInsight}
            disabled={aiLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {aiLoading ? '生成中...' : 'AI 生成清洗诊断'}
          </button>
        </div>

        {aiInsight ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 flex items-center justify-between">
              <div className="text-xs text-blue-700">综合评分</div>
              <div className="text-2xl font-bold text-blue-700">{aiInsight.score}/100</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 leading-relaxed">
              {aiInsight.summary}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="text-xs text-amber-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  风险点
                </div>
                <ul className="space-y-1 text-xs text-amber-800">
                  {aiInsight.risks.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-xs text-emerald-700 mb-2">建议动作</div>
                <ul className="space-y-1 text-xs text-emerald-800">
                  {aiInsight.suggestions.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="text-[11px] text-slate-400">
              生成时间：{new Date(aiInsight.generatedAt).toLocaleString()} · 模型：{aiInsight.model}
            </div>
          </div>
        ) : (
          <div className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            点击“AI 生成清洗诊断”后，将展示当前岗位数据清洗风险与优化建议。
          </div>
        )}
      </div>

      {/* 3. Terminal Log Console */}
      <div className="flex-1 bg-[#0f172a] rounded-lg shadow-inner border border-slate-700 flex flex-col overflow-hidden relative font-mono text-sm">
         {/* Terminal Header */}
         <div className="bg-[#1e293b] px-4 py-2 border-b border-slate-700 flex justify-between items-center select-none">
             <div className="flex items-center gap-2">
                 <Terminal className="w-4 h-4 text-slate-400" />
                 <span className="text-slate-300 font-bold">Spark Worker Node-01 Output</span>
             </div>
             <div className="flex gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                 <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></div>
                 <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></div>
             </div>
         </div>
         
         {/* Log Body */}
         <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
             {logs.map((log, i) => (
                 <div key={i} className="flex gap-3 hover:bg-white/5 px-1 rounded transition-colors break-words">
                     <span className="text-slate-500 shrink-0 select-none">{log.time}</span>
                     <span className={`font-bold shrink-0 w-16 ${
                         log.type === 'INFO' ? 'text-blue-400' :
                         log.type === 'WARN' ? 'text-yellow-400' :
                         log.type === 'SUCCESS' ? 'text-green-400' : 'text-slate-300'
                     }`}>
                        [{log.type}]
                     </span>
                     <span className={`flex-1 ${
                         log.type === 'WARN' ? 'text-yellow-100' : 
                         log.type === 'SUCCESS' ? 'text-green-100' : 'text-slate-300'
                     }`}>
                         {log.msg}
                     </span>
                 </div>
             ))}
             {/* Cursor Effect */}
             {isRunning && (
                 <div className="animate-pulse text-blue-500 font-bold pl-1">_</div>
             )}
         </div>
      </div>

      {/* 4. Bottom Buffer Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm shrink-0">
          <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-slate-700">Spark 内存缓冲池占用 (Buffer Usage)</span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600">{bufferUsage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
              {/* Background Grid */}
              <div className="absolute inset-0 w-full h-full opacity-30" style={{backgroundImage: 'linear-gradient(90deg, transparent 50%, #fff 50%)', backgroundSize: '10px 10px'}}></div>
              
              {/* Progress Bar */}
              <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
                      bufferUsage > 80 ? 'bg-red-500' : bufferUsage > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${bufferUsage}%` }}
              >
                  {/* Glossy Effect */}
                  <div className="absolute top-0 left-0 right-0 h-[50%] bg-white/20"></div>
                  {/* Stripes Animation */}
                  <div className="absolute inset-0 w-full h-full animate-[progressStripes_1s_linear_infinite]" 
                       style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '20px 20px'}}>
                  </div>
              </div>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-mono">
              <span>0%</span>
              <span className="flex items-center gap-1"><Server className="w-3 h-3"/> Allocated: 16GB</span>
              <span>100%</span>
          </div>
      </div>
      
      {/* CSS for custom animation */}
      <style>{`
        @keyframes progressStripes {
          from { background-position: 20px 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  );
};

export default DataCleaning;
