import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { BarChart3, Search, TrendingUp, MapPin, Star, Info } from 'lucide-react';

interface SpaceItem {
  name: string; district: string; type: string; dist_to_center_km: number;
  space_vitality_index?: number; vitality_level?: string; base_flow?: number;
  flow_density_index?: number; social_activity_index?: number;
  time_activity_index?: number; weather_resilience_index?: number;
}

interface MonthlyItem { month: string; avg_flow: number; }
interface BusinessData { stats: any; monthly: MonthlyItem[]; }

const DISTRICTS = ['全部','锦江区','青羊区','武侯区','成华区','金牛区','双流区','龙泉驿区','温江区'];

const VitalityAnalysis: React.FC = () => {
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [filtered, setFiltered] = useState<SpaceItem[]>([]);
  const [distFilter, setDistFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [selectedPoi, setSelectedPoi] = useState('');
  const [poiData, setPoiData] = useState<BusinessData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const rankChartRef = useRef<HTMLDivElement>(null);
  const trendChartRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<HTMLDivElement>(null);

  // 加载全部空间
  useEffect(() => {
    fetch('/api/space_list').then(r => r.json()).then(data => {
      const sorted = data.sort((a: any, b: any) => (b.space_vitality_index||b.vitality||0) - (a.space_vitality_index||a.vitality||0));
      setSpaces(sorted);
      setFiltered(sorted);
    });
  }, []);

  // 筛选
  useEffect(() => {
    let f = spaces;
    if (distFilter !== '全部') f = f.filter(s => s.district === distFilter);
    if (search) f = f.filter(s => s.name.includes(search));
    setFiltered(f);
  }, [distFilter, search, spaces]);

  // 排名柱状图
  useEffect(() => {
    if (!rankChartRef.current || filtered.length === 0) return;
    const chart = echarts.init(rankChartRef.current);
    const top20 = filtered.slice(0, 20);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 110, right: 30, top: 10, bottom: 10 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: top20.map(s => s.name).reverse(), axisLabel: { fontSize: 11 } },
      series: [{
        type: 'bar', data: top20.map(s => (s.space_vitality_index || 0)).reverse(), barWidth: 14,
        itemStyle: { color: new echarts.graphic.LinearGradient(0,0,1,0,[{offset:0,color:'#dbeafe'},{offset:1,color:'#3b82f6'}]), borderRadius: [0,4,4,0] },
        label: { show: true, position: 'right', fontSize: 10 }
      }]
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(rankChartRef.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [filtered]);

  // 加载单个POI详情
  const loadPoiDetail = async (name: string) => {
    setSelectedPoi(name);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/business_insight?poi=${encodeURIComponent(name)}`);
      setPoiData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoadingDetail(false); }
  };

  // POI月度趋势图
  useEffect(() => {
    if (!trendChartRef.current || !poiData?.monthly?.length) return;
    const chart = echarts.init(trendChartRef.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 15, top: 15, bottom: 30 },
      xAxis: { type: 'category', data: poiData.monthly.map(m => m.month), axisLabel: { fontSize: 9, rotate: 40 } },
      yAxis: { type: 'value', name: '日均人流', nameTextStyle: { fontSize: 10 } },
      series: [{
        type: 'line', data: poiData.monthly.map(m => Math.round(m.avg_flow)), smooth: true,
        areaStyle: { opacity: 0.15, color: '#3b82f6' }, lineStyle: { color: '#3b82f6', width: 2 },
        markPoint: { data: [{ type: 'max', name: '峰值' }, { type: 'min', name: '低谷' }], symbolSize: 40, label: { fontSize: 9 } },
        markLine: { data: [{ type: 'average', name: '均值' }], label: { fontSize: 9 } }
      }]
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(trendChartRef.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [poiData]);

  // 四维雷达图
  useEffect(() => {
    if (!radarChartRef.current || !selectedPoi) return;
    const s = spaces.find(x => x.name === selectedPoi);
    if (!s) return;
    const chart = echarts.init(radarChartRef.current);
    chart.setOption({
      radar: {
        indicator: [
          { name: '人流密度', max: 100 }, { name: '社交活跃度', max: 100 },
          { name: '时间活跃度', max: 100 }, { name: '环境适应性', max: 100 }
        ],
        radius: '65%',
      },
      series: [{
        type: 'radar',
        data: [{
          value: [s.flow_density_index||0, s.social_activity_index||0, s.time_activity_index||0, s.weather_resilience_index||0],
          name: s.name,
          areaStyle: { opacity: 0.2 }
        }]
      }]
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(radarChartRef.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [selectedPoi, spaces]);

  const st = poiData?.stats;

  return (
    <div className="space-y-4">
      {/* 排名区域 */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-500" /> 公共休闲空间活力排名
        </h2>
        <div className="flex gap-3 mb-4">
          <select value={distFilter} onChange={e => setDistFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索公园名称..."
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm" />
          </div>
          <span className="text-sm text-slate-400 self-center">共 {filtered.length} 个空间</span>
        </div>
        <div ref={rankChartRef} className="w-full h-[420px]" />
      </div>

      {/* 单个公园选择 */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-green-500" /> 单个空间活力详情
        </h2>
        <div className="flex gap-3 mb-4">
          <select value={selectedPoi} onChange={e => loadPoiDetail(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm min-w-[200px]">
            <option value="">选择公园/广场/景区...</option>
            {spaces.map(s => <option key={s.name} value={s.name}>{s.name}（{s.district} · {s.type}）</option>)}
          </select>
          {loadingDetail && <span className="text-sm text-slate-400 self-center">加载中...</span>}
        </div>

        {st && (
          <div className="space-y-4">
            {/* KPI */}
            <div className="grid grid-cols-5 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <div className="text-xs text-blue-600">日均人流</div>
                <div className="text-xl font-bold text-blue-800">{Math.round(st.avg_flow||0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <div className="text-xs text-slate-500">工作日</div>
                <div className="text-lg font-bold">{Math.round(st.workday_avg||0).toLocaleString()}</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                <div className="text-xs text-green-600">周末</div>
                <div className="text-lg font-bold text-green-800">{Math.round(st.weekend_avg||0).toLocaleString()}</div>
                <div className="text-xs text-green-500">x{((st.weekend_avg||0)/(st.workday_avg||1)).toFixed(2)}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
                <div className="text-xs text-red-600">节假日</div>
                <div className="text-lg font-bold text-red-800">{Math.round(st.holiday_avg||0).toLocaleString()}</div>
                <div className="text-xs text-red-500">x{((st.holiday_avg||0)/(st.workday_avg||1)).toFixed(2)}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
                <div className="text-xs text-amber-600">历史峰值</div>
                <div className="text-lg font-bold text-amber-800">{Math.round(st.peak_flow||0).toLocaleString()}</div>
              </div>
            </div>

            {/* 图表 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> 月度人流趋势</div>
                <div ref={trendChartRef} className="w-full h-56" />
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-1"><Star className="w-4 h-4" /> 四维活力雷达</div>
                <div ref={radarChartRef} className="w-full h-56" />
              </div>
            </div>
          </div>
        )}

        {!selectedPoi && (
          <div className="text-center py-12 text-slate-400">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <div>请选择一个公共空间查看活力详情</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VitalityAnalysis;
