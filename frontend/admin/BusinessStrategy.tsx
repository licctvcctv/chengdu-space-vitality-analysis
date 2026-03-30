import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Store, TrendingUp, CloudSun, Calendar, Target, Lightbulb, ArrowRight, RefreshCw } from 'lucide-react';

interface POIStats {
  poi_name: string; poi_type: string; district: string;
  avg_flow: number; workday_avg: number; weekend_avg: number; holiday_avg: number;
  sunny_avg: number; rainy_avg: number; peak_flow: number; min_flow: number;
}
interface MonthlyData { month: string; avg_flow: number; }
interface POIOption { name: string; district: string; type: string; space_vitality_index: number; }

const BusinessStrategy: React.FC = () => {
  const [poiList, setPoiList] = useState<POIOption[]>([]);
  const [selected, setSelected] = useState('人民公园');
  const [stats, setStats] = useState<POIStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/poi_full').then(r => r.json()).then((data: any[]) => {
      const list = data.filter(p => (p.space_vitality_index || 0) > 20)
        .sort((a, b) => (b.space_vitality_index || 0) - (a.space_vitality_index || 0))
        .slice(0, 20)
        .map(p => ({ name: p.name, district: p.district, type: p.type, space_vitality_index: p.space_vitality_index || 0 }));
      setPoiList(list);
    }).catch(() => {});
  }, []);

  const loadData = async (poi: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business_insight?poi=${encodeURIComponent(poi)}`);
      const data = await res.json();
      setStats(data.stats);
      setMonthly(data.monthly || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (selected) loadData(selected); }, [selected]);

  // 月度趋势图
  useEffect(() => {
    if (!chartRef.current || monthly.length === 0) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 15, top: 10, bottom: 25 },
      xAxis: { type: 'category', data: monthly.map(m => m.month), axisLabel: { fontSize: 9, rotate: 40 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 9 } },
      series: [{
        type: 'line', data: monthly.map(m => Math.round(m.avg_flow)), smooth: true,
        areaStyle: { opacity: 0.15 }, lineStyle: { width: 2 }
      }]
    });
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(chartRef.current);
    return () => { ro.disconnect(); chart.dispose(); };
  }, [monthly]);

  const generateStrategies = () => {
    if (!stats) return [];
    const s: {title:string; desc:string; priority:'high'|'medium'|'low'}[] = [];
    const weekendRatio = stats.weekend_avg / (stats.workday_avg || 1);
    const holidayRatio = stats.holiday_avg / (stats.workday_avg || 1);
    const weatherRatio = stats.sunny_avg / (stats.rainy_avg || 1);

    if (holidayRatio > 2) s.push({ title: '节假日高峰运营', desc: `节假日人流 ${Math.round(stats.holiday_avg)} 是工作日 ${Math.round(stats.workday_avg)} 的 ${holidayRatio.toFixed(1)} 倍。建议增加临时服务设施、延长营业时间、增配安保人员。`, priority: 'high' });
    if (weatherRatio > 2) s.push({ title: '天气联动营销', desc: `晴天人流 ${Math.round(stats.sunny_avg)} 是雨天 ${Math.round(stats.rainy_avg)} 的 ${weatherRatio.toFixed(1)} 倍。晴天加大户外活动推广，雨天推出室内消费优惠引流。`, priority: 'high' });
    if (weekendRatio > 1.2) s.push({ title: '周末引流策略', desc: `周末人流 ${Math.round(stats.weekend_avg)} 是工作日的 ${weekendRatio.toFixed(2)} 倍。周末可设置市集、演出等体验型活动提升消费转化。`, priority: 'medium' });

    // 基于月度数据找淡旺季
    if (monthly.length > 6) {
      const sorted = [...monthly].sort((a, b) => b.avg_flow - a.avg_flow);
      const peak = sorted[0];
      const low = sorted[sorted.length - 1];
      s.push({ title: '旺季资源集中', desc: `全年人流最高月 ${peak.month}（均值 ${Math.round(peak.avg_flow)}），建议集中投放广告和促销资源。`, priority: 'high' });
      s.push({ title: '淡季激活方案', desc: `全年人流最低月 ${low.month}（均值 ${Math.round(low.avg_flow)}），可策划特色主题活动或优惠促销拉动人气。`, priority: 'medium' });
    }

    if (stats.peak_flow > stats.avg_flow * 3) s.push({ title: '极端高峰预警', desc: `历史最高日人流 ${Math.round(stats.peak_flow)}（均值的 ${(stats.peak_flow / stats.avg_flow).toFixed(1)} 倍），需制定大客流应急预案。`, priority: 'high' });
    s.push({ title: '社交媒体运营', desc: `该空间在微博/小红书有打卡数据，建议设置网红打卡点、联合本地 KOL 推广，提升线上曝光转化线下人流。`, priority: 'medium' });
    s.push({ title: '周边商户联动', desc: `联合 ${stats.district} 周边餐饮、零售商户推出联名优惠卡，实现客流互导。`, priority: 'low' });

    return s;
  };

  const strategies = generateStrategies();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Store className="w-6 h-6 text-purple-500" /> 商家运营策略调整
        </h2>
        <p className="text-sm text-slate-500 mb-4">选择目标空间，系统基于 45,820 条人流热力数据和活力分析模型，自动生成运营策略建议。</p>

        <div className="flex gap-2 flex-wrap mb-4">
          {poiList.slice(0, 12).map(p => (
            <button key={p.name} onClick={() => setSelected(p.name)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected === p.name ? 'bg-purple-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {p.name} <span className="opacity-60">({p.district})</span>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 p-4">
          <RefreshCw className="w-4 h-4 animate-spin" /> 加载数据中...
        </div>
      )}

      {stats && !loading && (
        <>
          {/* 核心数据卡片 */}
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 flex items-center gap-1"><Target className="w-3 h-3" /> 日均人流</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{Math.round(stats.avg_flow).toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> 工作日均值</div>
              <div className="text-xl font-bold text-slate-700 mt-1">{Math.round(stats.workday_avg).toLocaleString()}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm bg-blue-50">
              <div className="text-xs text-blue-600 flex items-center gap-1"><Calendar className="w-3 h-3" /> 周末均值</div>
              <div className="text-xl font-bold text-blue-800 mt-1">{Math.round(stats.weekend_avg).toLocaleString()}</div>
              <div className="text-xs text-blue-500">x{(stats.weekend_avg / (stats.workday_avg||1)).toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-red-200 shadow-sm bg-red-50">
              <div className="text-xs text-red-600 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> 节假日均值</div>
              <div className="text-xl font-bold text-red-800 mt-1">{Math.round(stats.holiday_avg).toLocaleString()}</div>
              <div className="text-xs text-red-500">x{(stats.holiday_avg / (stats.workday_avg||1)).toFixed(2)}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow-sm bg-amber-50">
              <div className="text-xs text-amber-600 flex items-center gap-1"><CloudSun className="w-3 h-3" /> 晴天 vs 雨天</div>
              <div className="text-sm font-bold text-amber-800 mt-1">{Math.round(stats.sunny_avg)} / {Math.round(stats.rainy_avg)}</div>
              <div className="text-xs text-amber-500">比值 {(stats.sunny_avg / (stats.rainy_avg||1)).toFixed(1)}x</div>
            </div>
          </div>

          {/* 月度趋势 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-2">{selected} — 月度人流趋势</h3>
            <div ref={chartRef} className="w-full h-48" />
          </div>

          {/* 策略建议 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" /> 运营策略建议（基于数据分析自动生成）
            </h3>
            <div className="space-y-3">
              {strategies.map((s, i) => (
                <div key={i} className={`p-4 rounded-lg border-l-4 ${s.priority === 'high' ? 'border-red-400 bg-red-50' : s.priority === 'medium' ? 'border-amber-400 bg-amber-50' : 'border-slate-300 bg-slate-50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" /> {s.title}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.priority === 'high' ? 'bg-red-200 text-red-800' : s.priority === 'medium' ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                      {s.priority === 'high' ? '高优先' : s.priority === 'medium' ? '中优先' : '低优先'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessStrategy;
