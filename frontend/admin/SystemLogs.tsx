import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, Download, Filter, 
  User, Calendar, Clock, Monitor 
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';

// === Mock Data ===
interface Log {
  id: number;
  user: string;
  role: 'admin' | 'sys' | 'user';
  module: string;
  action: string;
  ip: string;
  status: 'success' | 'fail';
  time: string;
  duration: string;
}

const generateLogs = (count: number): Log[] => {
  const modules = ['用户权限', '采集配置', '数据治理', '系统登录', '招聘洞察'];
  const actions = ['删除岗位数据', '修改采集配置', '导出周报', '重置密码', '登录成功', '触发采集任务'];
  return Array.from({ length: count }, (_, i) => ({
    id: 102400 + i,
    user: i % 10 === 0 ? 'System' : `Admin_${Math.floor(Math.random()*5)}`,
    role: i % 10 === 0 ? 'sys' : 'admin',
    module: modules[Math.floor(Math.random() * modules.length)],
    action: actions[Math.floor(Math.random() * actions.length)],
    ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    status: Math.random() > 0.1 ? 'success' : 'fail',
    time: new Date(Date.now() - Math.floor(Math.random() * 100000000)).toLocaleString(),
    duration: `${Math.floor(Math.random() * 500)}ms`
  }));
};

const MOCK_LOGS = generateLogs(240);

const SystemLogs: React.FC = () => {
  const { message } = useUI();
  
  // Filters
  const [searchUser, setSearchUser] = useState('');
  const [dateRange, setDateRange] = useState('');
  
  // Data
  const logs = useMemo(() => {
    return MOCK_LOGS.filter(log => 
      log.user.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [searchUser]);

  const handleExport = () => {
    message.success("日志导出任务已创建，请稍后在下载中心查看");
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <FileText className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">系统日志</h2>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
           <div className="flex items-center gap-4">
               <div className="relative group">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                       <User className="w-4 h-4" />
                   </div>
                   <input 
                      type="text" 
                      placeholder="操作人用户名" 
                      value={searchUser}
                      onChange={e => setSearchUser(e.target.value)}
                      className="pl-9 pr-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 w-40"
                   />
               </div>
               
               <div className="relative group">
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                       <Calendar className="w-4 h-4" />
                   </div>
                   <input 
                      type="date" 
                      className="pl-9 pr-3 py-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 text-slate-600"
                   />
               </div>

               <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1 transition-colors">
                   <Search className="w-4 h-4" /> 搜索
               </button>
           </div>

           <button 
               onClick={handleExport}
               className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-400 rounded text-sm flex items-center gap-1 transition-all"
           >
               <Download className="w-4 h-4" /> 导出日志
           </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#f5f7fa] text-[#909399] sticky top-0 z-10 font-medium">
                    <tr>
                        <th className="px-6 py-3 border-b border-[#ebeef5]">日志 ID</th>
                        <th className="px-6 py-3 border-b border-[#ebeef5]">操作时间</th>
                        <th className="px-6 py-3 border-b border-[#ebeef5]">操作人</th>
                        <th className="px-6 py-3 border-b border-[#ebeef5]">功能模块</th>
                        <th className="px-6 py-3 border-b border-[#ebeef5]">操作内容</th>
                        <th className="px-6 py-3 border-b border-[#ebeef5]">IP 地址</th>
                        <th className="px-6 py-3 border-b border-[#ebeef5]">状态</th>
                        <th className="px-6 py-3 border-b border-[#ebeef5] text-right">耗时</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef5]">
                    {logs.map(log => (
                        <tr key={log.id} className="hover:bg-[#f5f7fa] transition-colors group">
                            <td className="px-6 py-3 font-mono text-xs text-slate-500">{log.id}</td>
                            <td className="px-6 py-3 text-slate-600 font-mono text-xs">{log.time}</td>
                            <td className="px-6 py-3">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${log.role === 'sys' ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                                    <span className="font-medium text-slate-700">{log.user}</span>
                                </div>
                            </td>
                            <td className="px-6 py-3 text-slate-600">{log.module}</td>
                            <td className="px-6 py-3 font-medium text-slate-800">{log.action}</td>
                            <td className="px-6 py-3 font-mono text-xs text-slate-500">{log.ip}</td>
                            <td className="px-6 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${log.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {log.status === 'success' ? '成功' : '失败'}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-right text-xs text-slate-400 font-mono">
                                {log.duration}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400">无符合条件的日志记录</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-3 border-t border-slate-100 flex justify-end text-xs text-slate-500 bg-slate-50">
            显示 {logs.length} 条记录 / 共 {MOCK_LOGS.length} 条
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;
