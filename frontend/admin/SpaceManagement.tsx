import React, { useState, useEffect } from 'react';
import { MapPin, Search, Edit3, Eye, Star, Navigation, Filter } from 'lucide-react';

interface SpaceItem {
  name: string; id?: string; district: string; type: string; address?: string;
  lon: number; lat: number; dist_to_center_km: number; base_flow: number;
  vitality?: number; level?: string; space_vitality_index?: number; vitality_level?: string;
  flow_density?: number; social_activity?: number; time_activity?: number; weather_resilience?: number;
}

const DISTRICTS = ['','锦江区','青羊区','武侯区','成华区','金牛区','双流区','龙泉驿区','温江区'];
const TYPES = ['','景区','广场','公园'];

const SpaceManagement: React.FC = () => {
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [filtered, setFiltered] = useState<SpaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [distFilter, setDistFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SpaceItem | null>(null);
  const [editing, setEditing] = useState<SpaceItem | null>(null);

  useEffect(() => {
    fetch('/api/space_list').then(r => r.json()).then(data => {
      setSpaces(data);
      setFiltered(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let f = spaces;
    if (distFilter) f = f.filter(s => s.district === distFilter);
    if (typeFilter) f = f.filter(s => s.type === typeFilter);
    if (search) f = f.filter(s => s.name.includes(search));
    setFiltered(f);
  }, [distFilter, typeFilter, search, spaces]);

  const vitality = (s: SpaceItem) => s.vitality || s.space_vitality_index || 0;
  const level = (s: SpaceItem) => s.level || s.vitality_level || '未知';

  return (
    <div className="space-y-4">
      {/* 标题和筛选 */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <MapPin className="w-6 h-6 text-green-500" /> 休闲空间信息管理
        </h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">行政区</label>
            <select value={distFilter} onChange={e => setDistFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">全部区域</option>
              {DISTRICTS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">类型</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">全部类型</option>
              {TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">搜索</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="输入公园名称..."
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
            </div>
          </div>
          <div className="text-sm text-slate-500 flex items-center gap-1 pb-2">
            <Filter className="w-4 h-4" /> 共 {filtered.length} / {spaces.length} 个空间
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* 列表 */}
        <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">排名</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">名称</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">行政区</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">类型</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">距市中心</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">活力指数</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">等级</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">加载中...</td></tr>
              ) : filtered.map((s, i) => (
                <tr key={s.name} className={`border-b border-slate-100 hover:bg-blue-50/50 cursor-pointer ${selected?.name === s.name ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelected(s)}>
                  <td className="px-4 py-2.5 text-slate-400">{i+1}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{s.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{s.district}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.type==='景区'?'bg-red-100 text-red-700':s.type==='广场'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>{s.type}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{(s.dist_to_center_km||0).toFixed(1)} km</td>
                  <td className="px-4 py-2.5 font-bold text-blue-600">{vitality(s).toFixed(1)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs ${level(s)==='高'?'bg-red-100 text-red-600':level(s)==='较高'?'bg-orange-100 text-orange-600':level(s)==='中等'?'bg-green-100 text-green-600':'bg-slate-100 text-slate-500'}`}>{level(s)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={e => { e.stopPropagation(); setSelected(s); }} className="text-blue-500 hover:text-blue-700 mr-2"><Eye className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); setEditing(s); }} className="text-green-500 hover:text-green-700"><Edit3 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 详情侧边栏 */}
        {selected && (
          <div className="w-80 bg-white rounded-lg border border-slate-200 shadow-sm p-5 shrink-0">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" /> {selected.name}
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">行政区</span><span className="font-medium">{selected.district}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">类型</span><span className="font-medium">{selected.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">地址</span><span className="font-medium text-right text-xs max-w-[180px]">{selected.address || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">经度</span><span className="font-mono">{selected.lon}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">纬度</span><span className="font-mono">{selected.lat}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">距市中心</span><span>{(selected.dist_to_center_km||0).toFixed(2)} km</span></div>
              <div className="flex justify-between"><span className="text-slate-500">基础日流量</span><span className="font-bold">{Math.round(selected.base_flow||0).toLocaleString()}</span></div>
              <hr className="border-slate-100" />
              <div className="flex justify-between"><span className="text-slate-500">活力指数</span><span className="font-bold text-blue-600 text-lg">{vitality(selected).toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">活力等级</span><span className="font-medium">{level(selected)}</span></div>
              <hr className="border-slate-100" />
              <div className="text-xs text-slate-500 font-medium mb-1">四维指标</div>
              {[
                {label:'人流密度', key:'flow_density', color:'bg-blue-500'},
                {label:'社交活跃度', key:'social_activity', color:'bg-purple-500'},
                {label:'时间活跃度', key:'time_activity', color:'bg-green-500'},
                {label:'环境适应性', key:'weather_resilience', color:'bg-amber-500'},
              ].map(item => {
                const val = (selected as any)[item.key] || 0;
                return (
                  <div key={item.key}>
                    <div className="flex justify-between text-xs mb-0.5"><span className="text-slate-500">{item.label}</span><span>{val.toFixed(1)}</span></div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{width:`${Math.min(100,val)}%`}} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl p-6 w-[480px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">编辑空间信息 — {editing.name}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                {label:'名称', value:editing.name},
                {label:'行政区', value:editing.district},
                {label:'类型', value:editing.type},
                {label:'地址', value:editing.address || ''},
                {label:'经度', value:String(editing.lon)},
                {label:'纬度', value:String(editing.lat)},
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                  <input defaultValue={f.value} className="w-full border border-slate-300 rounded-lg p-2 text-sm" />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">取消</button>
              <button onClick={() => { setEditing(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceManagement;
