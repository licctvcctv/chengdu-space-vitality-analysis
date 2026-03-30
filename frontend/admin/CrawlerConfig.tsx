import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Play, Pause, RefreshCw, Layers, 
  Globe, Database, CheckCircle, XCircle, 
  Terminal, AlertTriangle, Save
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';

// === Mock Data ===
const MOCK_COOKIES = [
  { id: 1, account: 'gdhrss_collector_01', status: 'online', lastUsed: '10s ago', successRate: '99.8%' },
  { id: 2, account: 'gdzww_agent_v2', status: 'online', lastUsed: '45s ago', successRate: '98.5%' },
  { id: 3, account: 'gdjyj_spider_v3', status: 'online', lastUsed: '2min ago', successRate: '97.2%' },
  { id: 4, account: 'backup_account_a', status: 'offline', lastUsed: '2d ago', successRate: '0%' },
  { id: 5, account: 'backup_account_b', status: 'offline', lastUsed: '5d ago', successRate: '0%' },
];

const CrawlerConfig: React.FC = () => {
  const { message, confirm } = useUI();
  
  // Config State
  const [frequency, setFrequency] = useState(60);
  const [sources, setSources] = useState<string[]>(['gdhrss']);
  const [isRunning, setIsRunning] = useState(true);
  
  // Terminal State
  const [logs, setLogs] = useState<string[]>(['> System initialized.', '> Waiting for commands...']);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSourceToggle = (source: string) => {
    if (sources.includes(source)) {
      setSources(sources.filter(s => s !== source));
    } else {
      setSources([...sources, source]);
    }
  };

  const addLog = (text: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, `[${timestamp}] ${text}`]);
  };

  const handleExecute = async () => {
    const isConfirmed = await confirm('确定要立即执行全量事业单位招聘数据采集任务吗？这可能会消耗较多采集额度。', {
      type: 'warning',
      confirmText: '立即执行',
      title: '执行确认'
    });

    if (isConfirmed) {
      message.success("任务已下发");
      addLog('> COMMAND: FORCE_COLLECT_START');
      addLog('> Connecting to 广东人社局 data gateway...');

      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step === 1) addLog("> Authenticating with Cookie Pool (ID: 1, 2, 3)... OK");
        if (step === 2) addLog('> Fetching public job listings from 广东省人力资源和社会保障厅... 200 items retrieved.');
        if (step === 3) addLog('> Parsing position and education fields... Done.');
        if (step === 4) {
          addLog("> Data synchronization completed. Task finished.");
          clearInterval(interval);
        }
      }, 800);
    }
  };

  const handleToggleTask = () => {
    const newState = !isRunning;
    setIsRunning(newState);
    addLog(`> SYSTEM: Crawler Task ${newState ? 'RESUMED' : 'PAUSED'} by admin.`);
    message.info(newState ? '采集任务已恢复' : '采集任务已暂停');
  };

  const handleSaveConfig = () => {
    message.success("配置已保存并生效");
    addLog(`> CONFIG: Frequency updated to ${frequency}s. Sources: ${sources.join(', ')}`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex items-center gap-2 mb-2">
         <Bot className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">广东人社局数据采集配置</h2>
         <span className={`px-2 py-0.5 rounded text-xs font-bold ml-2 ${isRunning ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isRunning ? 'RUNNING' : 'STOPPED'}
         </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
         
         {/* Left Column: Configuration & Actions */}
         <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* 1. Basic Config Card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> 采集策略配置
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Frequency */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">全量采集频率 (秒)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                value={frequency}
                                onChange={(e) => setFrequency(Number(e.target.value))}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all"
                            />
                            <span className="text-xs text-slate-400">建议值: 60-300s</span>
                        </div>
                    </div>

                    {/* Data Sources */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">目标数据源</label>
                        <div className="flex gap-4">
                            {[
                                { id: 'gdhrss', label: '广东人社局', icon: Globe },
                                { id: 'gdzww', label: '广东政务网', icon: Database },
                                { id: 'gdjyj', label: '教育考试院', icon: Layers }
                            ].map(src => (
                                <label 
                                    key={src.id}
                                    className={`
                                        flex items-center gap-2 px-3 py-2 rounded border cursor-pointer transition-all text-sm
                                        ${sources.includes(src.id) 
                                            ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}
                                    `}
                                >
                                    <input 
                                        type="checkbox" 
                                        className="hidden" 
                                        checked={sources.includes(src.id)}
                                        onChange={() => handleSourceToggle(src.id)}
                                    />
                                    <src.icon className="w-3.5 h-3.5" />
                                    {src.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={handleSaveConfig}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center gap-2 active:scale-95 transition-all"
                    >
                        <Save className="w-4 h-4" /> 保存配置
                    </button>
                </div>
            </div>

            {/* 2. Control & Terminal */}
            <div className="flex-1 bg-slate-900 rounded-lg shadow-sm border border-slate-800 flex flex-col overflow-hidden">
                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-slate-300 text-xs font-mono flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> CRAWLER_OUTPUT_STREAM
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                             onClick={handleToggleTask}
                             className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${isRunning ? 'bg-yellow-600 text-white hover:bg-yellow-500' : 'bg-green-600 text-white hover:bg-green-500'}`}
                        >
                            {isRunning ? <><Pause className="w-3 h-3"/> 暂停任务</> : <><Play className="w-3 h-3"/> 恢复任务</>}
                        </button>
                        <button 
                             onClick={handleExecute}
                             className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                            <RefreshCw className="w-3 h-3" /> 立即执行
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-4 font-mono text-xs text-green-400 overflow-y-auto space-y-1 bg-black/50 min-h-[200px]">
                    {logs.map((log, i) => (
                        <div key={i} className="break-all opacity-90 hover:opacity-100">{log}</div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>

         </div>

         {/* Right Column: Cookie Pool Status */}
         <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Database className="w-4 h-4 text-orange-500" /> 采集账号资源池状态
                 </h3>
                 <p className="text-xs text-slate-400 mt-1">监控采集账号存活状态与人社局接口负载情况</p>
             </div>
             
             <div className="p-4 space-y-3 overflow-y-auto flex-1">
                 {MOCK_COOKIES.map(cookie => (
                     <div key={cookie.id} className="border border-slate-100 rounded p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                         <div className="flex items-center gap-3">
                             <div className={`w-2 h-2 rounded-full ${cookie.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                             <div>
                                 <div className="text-sm font-medium text-slate-700">{cookie.account}</div>
                                 <div className="text-[10px] text-slate-400 flex gap-2">
                                     <span>ID: {cookie.id}</span>
                                     <span>Last: {cookie.lastUsed}</span>
                                 </div>
                             </div>
                         </div>
                         <div className="text-right">
                             <div className={`text-xs font-bold ${cookie.status === 'online' ? 'text-green-600' : 'text-red-500'}`}>
                                 {cookie.status === 'online' ? '正常' : '失效'}
                             </div>
                             <div className="text-[10px] text-slate-400">SR: {cookie.successRate}</div>
                         </div>
                     </div>
                 ))}
                 
                 <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-xs text-yellow-700 flex items-start gap-2">
                     <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                     <p>
                         注意：资源池中有 2 个账号已失效，建议及时更换账号凭证，避免影响广东人社局数据采集成功率。
                     </p>
                 </div>
             </div>
         </div>

      </div>
    </div>
  );
};

export default CrawlerConfig;
