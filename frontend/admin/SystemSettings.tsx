import React, { useState } from 'react';
import { 
  Save, Upload, Monitor, Layout, Settings, 
  RefreshCw, Trash2, Check, ChevronDown 
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';

// === Helper Component: Switch ===
const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) => (
  <div className="flex items-center justify-between">
    {label && <span className="text-sm text-slate-700 font-medium">{label}</span>}
    <button 
      onClick={onChange}
      className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}></div>
    </button>
  </div>
);

const SystemSettings: React.FC = () => {
  const { message, confirm } = useUI();
  const [loadingCache, setLoadingCache] = useState(false);

  // === Form State ===
  const [config, setConfig] = useState({
    systemName: '广东省事业单位岗位数据分析与可视化系统',
    itemsPerPage: 20,
    themeColor: '#3b82f6', // blue-500
    sidebarCollapsed: false,
    showBreadcrumb: true,
  });

  const handleSave = () => {
    message.success("系统配置已保存并生效");
  };

  const handleClearCache = () => {
    setLoadingCache(true);
    setTimeout(() => {
      setLoadingCache(false);
      message.success("缓存清理成功 (释放 23MB 空间)");
    }, 2000);
  };

  const handleReset = async () => {
    const isConfirmed = await confirm('确定要重置所有系统设置吗？此操作不可恢复。', {
      type: 'warning',
      confirmText: '重置',
      title: '重置确认'
    });

    if (isConfirmed) {
      setConfig({
        systemName: '广东省事业单位岗位数据分析与可视化系统',
        itemsPerPage: 20,
        themeColor: '#3b82f6',
        sidebarCollapsed: false,
        showBreadcrumb: true,
      });
      message.success("所有设置已重置为默认值");
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <Settings className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">系统设置</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-8">
        
        {/* === 1. Basic Settings === */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-700 text-sm">基础设置 (Basic Settings)</h3>
           </div>
           
           <div className="p-6 space-y-6">
              {/* System Name */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                 <label className="text-sm font-medium text-slate-600 md:text-right">系统名称</label>
                 <div className="md:col-span-2">
                    <input 
                      type="text" 
                      value={config.systemName}
                      onChange={(e) => setConfig({...config, systemName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                 </div>
              </div>

              {/* System Logo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                 <label className="text-sm font-medium text-slate-600 md:text-right pt-2">系统 Logo</label>
                 <div className="md:col-span-2">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer group">
                       <Upload className="w-8 h-8 mb-2 group-hover:text-blue-500" />
                       <span className="text-xs">点击或拖拽图片上传</span>
                    </div>
                 </div>
              </div>

              {/* Items Per Page */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                 <label className="text-sm font-medium text-slate-600 md:text-right">每页显示条数</label>
                 <div className="md:col-span-2 relative">
                    <select 
                      value={config.itemsPerPage}
                      onChange={(e) => setConfig({...config, itemsPerPage: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 appearance-none bg-white"
                    >
                       <option value={10}>10 条 / 页</option>
                       <option value={20}>20 条 / 页</option>
                       <option value={50}>50 条 / 页</option>
                       <option value={100}>100 条 / 页</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                 </div>
              </div>
           </div>
        </div>

        {/* === 2. Appearance === */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Layout className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-700 text-sm">显示设置 (Appearance)</h3>
           </div>
           
           <div className="p-6 space-y-6">
              {/* Theme Color */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                 <label className="text-sm font-medium text-slate-600 md:text-right">主题色</label>
                 <div className="md:col-span-2 flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config.themeColor}
                      onChange={(e) => setConfig({...config, themeColor: e.target.value})}
                      className="w-10 h-10 p-0.5 rounded border border-slate-200 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 font-mono">{config.themeColor.toUpperCase()}</span>
                 </div>
              </div>

              {/* Sidebar Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                 <label className="text-sm font-medium text-slate-600 md:text-right">侧边栏默认状态</label>
                 <div className="md:col-span-2">
                    <Switch 
                      label={config.sidebarCollapsed ? "默认收起" : "默认展开"}
                      checked={config.sidebarCollapsed} 
                      onChange={() => setConfig({...config, sidebarCollapsed: !config.sidebarCollapsed})} 
                    />
                 </div>
              </div>

              {/* Breadcrumb Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                 <label className="text-sm font-medium text-slate-600 md:text-right">顶部面包屑</label>
                 <div className="md:col-span-2">
                    <Switch 
                      label={config.showBreadcrumb ? "显示" : "隐藏"}
                      checked={config.showBreadcrumb} 
                      onChange={() => setConfig({...config, showBreadcrumb: !config.showBreadcrumb})} 
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* === 3. Advanced === */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-slate-700 text-sm">高级选项 (Advanced)</h3>
           </div>
           
           <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-6">
                 <div className="md:col-span-1 md:text-right">
                    <span className="text-sm font-medium text-slate-600 block">系统缓存</span>
                    <span className="text-xs text-slate-400">Temp Files, Logs</span>
                 </div>
                 <div className="md:col-span-2">
                    <button 
                      onClick={handleClearCache}
                      disabled={loadingCache}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded border border-slate-200 flex items-center gap-2 transition-colors disabled:opacity-60"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingCache ? 'animate-spin' : ''}`} />
                      {loadingCache ? '正在清理...' : '清除系统缓存'}
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                 <div className="md:col-span-1 md:text-right">
                    <span className="text-sm font-medium text-slate-600 block">重置配置</span>
                    <span className="text-xs text-slate-400">Factory Reset</span>
                 </div>
                 <div className="md:col-span-2">
                    <button 
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded border border-red-200 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      重置所有设置
                    </button>
                 </div>
              </div>
           </div>
        </div>

        {/* Global Save Action */}
        <div className="fixed bottom-8 right-8 z-50">
           <button 
             onClick={handleSave}
             className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95"
           >
             <Save className="w-5 h-5" /> 保存更改
           </button>
        </div>

      </div>
    </div>
  );
};

export default SystemSettings;
