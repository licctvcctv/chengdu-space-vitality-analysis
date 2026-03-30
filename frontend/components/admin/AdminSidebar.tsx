import React, { useState } from 'react';
import {
  MonitorPlay,
  Share2,
  MapPin,
  Activity,
  ArrowRightLeft,
  Clock,
  Tag,
  Grid,
  TrendingUp,
  Database,
  LayoutDashboard,
  User,
  ChevronDown,
  Server
} from 'lucide-react';

export type Page =
  | 'analysis-relation'
  | 'analysis-region'
  | 'analysis-sentiment'
  | 'analysis-compare'
  | 'analysis-evolution'
  | 'analysis-detail'
  | 'mining-keywords'
  | 'mining-clustering'
  | 'mining-prediction'
  | 'data-history'
  | 'data-cleaning'
  | 'data-sensitive'
  | 'data-crawler'
  | 'ops-monitor'
  | 'ops-logs'
  | 'ops-users'
  | 'personal-profile'
  | 'travel-plan'
  | 'business-strategy'
  | 'personal-reports';

interface Props {
  activePage: Page | string;
  sidebarOpen: boolean;
  userRole: 'admin' | 'user' | null;
  onNavigate: (page: Page) => void;
  onSwitchMode: () => void;
}

const subMenuHeaderClass = (isOpen: boolean) =>
  `flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100/50 hover:text-blue-600 transition-colors ${
    isOpen ? 'text-slate-900' : ''
  }`;

const itemClass = (active: boolean) =>
  `pl-12 pr-4 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2 ${
    active ? 'text-blue-600 bg-blue-50/80 font-medium' : 'text-slate-500 hover:text-slate-800'
  }`;

const AdminSidebar: React.FC<Props> = ({ activePage, sidebarOpen, userRole, onNavigate, onSwitchMode }) => {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    insight: true,
    mining: false,
    governance: false,
    ops: false,
    personal: false
  });
  const isAdmin = userRole === 'admin';

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col shadow-sm
        ${sidebarOpen ? 'w-64' : 'w-16'}
      `}
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-100 shrink-0 bg-white relative z-10">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
            J
          </div>
          {sidebarOpen && <span className="font-bold text-lg text-slate-800 tracking-tight">粤岗数析</span>}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 py-2">
        {sidebarOpen && <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2 mb-1">实时看板</div>}
        <div
          onClick={onSwitchMode}
          className="relative flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 cursor-pointer text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          title="空间活力大屏"
        >
          <MonitorPlay className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span>空间活力大屏</span>}
        </div>

        {sidebarOpen && <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">空间数据洞察</div>}
        <div>
          {sidebarOpen ? (
            <div className={subMenuHeaderClass(openMenus.insight)} onClick={() => toggleMenu('insight')}>
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-slate-500" />
                <span>地域 / 竞争度 / 对比 / 趋势 / 关联</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openMenus.insight ? 'rotate-180' : ''}`} />
            </div>
          ) : (
            <div className="flex justify-center py-3 cursor-pointer hover:bg-slate-50">
              <Share2 className="w-5 h-5 text-slate-500" />
            </div>
          )}
          {sidebarOpen && openMenus.insight && (
            <div className="bg-slate-50/50 py-1">
              {[
                { id: 'analysis-region', label: '地域分析', icon: MapPin },
                { id: 'analysis-sentiment', label: '活力因素分析', icon: Activity },
                { id: 'analysis-compare', label: '区域对比分析', icon: ArrowRightLeft },
                { id: 'analysis-evolution', label: '活力趋势演变', icon: Clock },
                { id: 'analysis-relation', label: '空间关联分析', icon: Share2 }
              ].map((item) => (
                <div key={item.id} onClick={() => onNavigate(item.id as Page)} className={itemClass(activePage === item.id)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {sidebarOpen && <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">数据挖掘引擎</div>}
        <div>
          {sidebarOpen ? (
            <div className={subMenuHeaderClass(openMenus.mining)} onClick={() => toggleMenu('mining')}>
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5 text-slate-500" />
                <span>关键词挖掘 / 聚类分析 / 需求预测</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openMenus.mining ? 'rotate-180' : ''}`} />
            </div>
          ) : (
            <div className="flex justify-center py-3 cursor-pointer hover:bg-slate-50">
              <Server className="w-5 h-5 text-slate-500" />
            </div>
          )}
          {sidebarOpen && openMenus.mining && (
            <div className="bg-slate-50/50 py-1">
              {[
                { id: 'mining-keywords', label: '影响因子挖掘', icon: Tag },
                { id: 'mining-clustering', label: '空间聚类分析', icon: Grid },
                { id: 'mining-prediction', label: '人流量预测', icon: TrendingUp }
              ].map((item) => (
                <div key={item.id} onClick={() => onNavigate(item.id as Page)} className={itemClass(activePage === item.id)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <>
            {sidebarOpen && <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">数据治理</div>}
            <div>
              {sidebarOpen ? (
                <div className={subMenuHeaderClass(openMenus.governance)} onClick={() => toggleMenu('governance')}>
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-slate-500" />
                    <span>数据管理 / 数据清洗 / 采集配置</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openMenus.governance ? 'rotate-180' : ''}`} />
                </div>
              ) : (
                <div className="flex justify-center py-3 hover:bg-slate-50">
                  <Database className="w-5 h-5 text-slate-500" />
                </div>
              )}
              {sidebarOpen && openMenus.governance && (
                <div className="bg-slate-50/50 py-1">
                  {[
                    { id: 'data-history', label: '空间数据管理' },
                    { id: 'data-cleaning', label: '数据清洗' },
                    { id: 'data-crawler', label: '采集配置' }
                  ].map((item) => (
                    <div key={item.id} onClick={() => onNavigate(item.id as Page)} className={itemClass(activePage === item.id)}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sidebarOpen && <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">系统运维</div>}
            <div>
              {sidebarOpen ? (
                <div className={subMenuHeaderClass(openMenus.ops)} onClick={() => toggleMenu('ops')}>
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-5 h-5 text-slate-500" />
                    <span>采集任务监控 / 日志 / 用户权限</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openMenus.ops ? 'rotate-180' : ''}`} />
                </div>
              ) : (
                <div className="flex justify-center py-3 hover:bg-slate-50">
                  <LayoutDashboard className="w-5 h-5 text-slate-500" />
                </div>
              )}
              {sidebarOpen && openMenus.ops && (
                <div className="bg-slate-50/50 py-1">
                  {[
                    { id: 'ops-monitor', label: '采集任务监控' },
                    { id: 'ops-logs', label: '系统日志' },
                    { id: 'ops-users', label: '用户权限管理' }
                  ].map((item) => (
                    <div key={item.id} onClick={() => onNavigate(item.id as Page)} className={itemClass(activePage === item.id)}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {sidebarOpen && <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-1">个人中心</div>}
        <div>
          {sidebarOpen ? (
            <div className={subMenuHeaderClass(openMenus.personal)} onClick={() => toggleMenu('personal')}>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-slate-500" />
                <span>个人报表与收藏</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openMenus.personal ? 'rotate-180' : ''}`} />
            </div>
          ) : (
            <div className="flex justify-center py-3 hover:bg-slate-50">
              <User className="w-5 h-5 text-slate-500" />
            </div>
          )}
          {sidebarOpen && openMenus.personal && (
            <div className="bg-slate-50/50 py-1">
              {[
                { id: 'personal-profile', label: '个人资料' },
                { id: 'travel-plan', label: '市民出行方案' },
                { id: 'business-strategy', label: '商家策略建议' },
                { id: 'personal-reports', label: '周报/月报中心' }
              ].map((item) => (
                <div key={item.id} onClick={() => onNavigate(item.id as Page)} className={itemClass(activePage === item.id)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
