import React, { useState, useEffect } from 'react';
import { MapPin, Sun, Cloud, Umbrella, Calendar, Clock, Star, ThumbsUp, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

const DISTRICTS = ['锦江区','青羊区','武侯区','成华区','金牛区','双流区','龙泉驿区','温江区'];
const WEATHERS = ['晴天','晴间多云','多云','阴天','小雨','中雨','大雨'];
const TIME_TYPES = ['工作日','周末','节假日'];

interface POIItem {
  name: string; type: string; district: string; dist_to_center_km: number;
  space_vitality_index: number; vitality_level: string;
}

interface PlanResult {
  pois: POIItem[];
  weather_factor: number; time_factor: number;
  weather_stats: { weather: string; avg_flow: number }[];
  season_stats: { season: string; avg_flow: number }[];
}

const TravelPlan: React.FC = () => {
  const [district, setDistrict] = useState('青羊区');
  const [weather, setWeather] = useState('晴天');
  const [timeType, setTimeType] = useState('周末');
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 方案评判
  const [evalInput, setEvalInput] = useState('');
  const [evalResult, setEvalResult] = useState<{score:number; feedback:string[]; suggestion:string}|null>(null);
  const [allPois, setAllPois] = useState<POIItem[]>([]);

  // 加载全部POI数据用于评判
  useEffect(() => {
    fetch('/api/poi_full').then(r => r.json()).then(setAllPois).catch(() => {});
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/travel_recommend?district=${encodeURIComponent(district)}&weather=${encodeURIComponent(weather)}&time_type=${encodeURIComponent(timeType)}`);
      const data = await res.json();
      setPlan(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const computeScore = () => {
    if (!plan) return 0;
    let base = 60;
    base += plan.weather_factor > 1 ? 12 : plan.weather_factor > 0.8 ? 5 : -8;
    base += plan.time_factor > 2 ? 8 : plan.time_factor > 1.2 ? 5 : 0;
    if (plan.pois.length > 0) base += Math.min(10, plan.pois[0].space_vitality_index / 6);
    return Math.min(98, Math.max(30, Math.round(base)));
  };

  const evaluatePlan = () => {
    if (!evalInput.trim()) return;
    const input = evalInput;
    const feedback: string[] = [];
    let score = 65;

    // 基于真实POI数据评判
    const mentionedPois = allPois.filter(p => input.includes(p.name));
    if (mentionedPois.length > 0) {
      const avgVitality = mentionedPois.reduce((s, p) => s + (p.space_vitality_index || 0), 0) / mentionedPois.length;
      feedback.push(`提及 ${mentionedPois.length} 个空间，平均活力指数 ${avgVitality.toFixed(1)}（数据来源：活力评估模型）`);
      score += avgVitality > 50 ? 10 : avgVitality > 30 ? 5 : -3;
      mentionedPois.forEach(p => {
        feedback.push(`${p.name}（${p.district} · ${p.type}）活力指数 ${(p.space_vitality_index||0).toFixed(1)}，等级「${p.vitality_level || '未知'}」`);
      });
    } else {
      feedback.push('未识别到具体公共空间名称，建议明确目标地点以获得更精准评估');
    }

    if (input.includes('晴') || input.includes('好天气')) { feedback.push('晴天条件下人流量约为雨天的 2.5 倍（t检验 p<0.001），出行体验佳'); score += 5; }
    if (input.includes('雨') || input.includes('下雨')) { feedback.push('雨天人流量平均下降 60%，建议准备室内备选方案'); score -= 8; }
    if (input.includes('节假日') || input.includes('假期') || input.includes('国庆') || input.includes('春节')) { feedback.push('节假日人流量为工作日的 2.3 倍，建议错峰出行并注意安全管理'); score += 3; }
    if (input.includes('周末')) { feedback.push('周末人流为工作日的 1.34 倍，上午 10 点前到达可避开高峰'); score += 2; }
    if (input.includes('春') || input.includes('3月') || input.includes('4月') || input.includes('5月')) { feedback.push('春季（3-5月）为全年人流最高季节（均值 3,375），非常适合出行'); score += 5; }
    if (input.includes('夏') || input.includes('7月') || input.includes('8月')) { feedback.push('夏季高温导致人流降至全年最低（均值 2,005），建议选择有遮荫的公园类空间'); score -= 3; }
    if (input.includes('温江') || input.includes('龙泉驿')) { feedback.push('远郊区域距市中心 >15km，人流约为核心区的 30-50%，交通耗时较长'); score -= 3; }
    if (input.includes('锦江') || input.includes('青羊')) { feedback.push('核心区空间活力高（青羊区均值 34.2，锦江区均值 37.4），公共交通便利'); score += 4; }

    if (feedback.length <= 1) { feedback.push('建议补充：目标空间、出行时间、天气条件等信息，以获得更全面的评估'); }

    score = Math.max(30, Math.min(95, score));
    const suggestion = score >= 80 ? '方案整体合理，推荐执行。所选空间活力指数较高，出行条件良好。' :
                       score >= 60 ? '方案基本可行，建议参考上述反馈进行优化，特别关注天气和时间因素。' :
                       '方案存在较多风险因素，建议重新规划目标空间和出行时间。';
    setEvalResult({ score, feedback, suggestion });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
          <MapPin className="w-6 h-6 text-blue-500" /> 市民出行方案生成
        </h2>
        <p className="text-sm text-slate-500 mb-4">基于 58 个公共休闲空间的活力指数、790 天天气数据和人流热力分析，为您智能推荐最佳出行方案。</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">选择区域</label>
            <select value={district} onChange={e => setDistrict(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">天气条件</label>
            <select value={weather} onChange={e => setWeather(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
              {WEATHERS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">出行时间类型</label>
            <select value={timeType} onChange={e => setTimeType(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm">
              {TIME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button onClick={generatePlan} disabled={loading}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-50">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? '查询中...' : '生成出行方案'}
        </button>
      </div>

      {plan && plan.pois && plan.pois.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">推荐出行方案 — {district}</h3>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
              <Star className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-bold text-sm">综合评分 {computeScore()}/100</span>
            </div>
          </div>

          <div className="flex gap-2 mb-4 text-xs flex-wrap">
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded flex items-center gap-1">
              {weather.includes('晴') ? <Sun className="w-3 h-3" /> : weather.includes('雨') ? <Umbrella className="w-3 h-3" /> : <Cloud className="w-3 h-3" />} {weather}（系数 {plan.weather_factor}x）
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {timeType}（系数 {plan.time_factor}x）
            </span>
            <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" /> 共 {plan.pois.length} 个推荐空间
            </span>
          </div>

          <div className="space-y-2 mb-4">
            {plan.pois.map((p: any, i: number) => (
              <div key={p.name} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">{i+1}</div>
                <div className="flex-1">
                  <div className="font-medium text-slate-800">{p.name}
                    <span className="text-xs text-slate-400 ml-2">{p.type} · {p.district} · 距市中心 {(p.dist_to_center_km||0).toFixed(1)}km</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-blue-600">活力 {(p.space_vitality_index||0).toFixed(1)}</div>
                  <div className="text-xs text-slate-400">{p.vitality_level || ''}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-sm font-medium text-amber-800 mb-1 flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> 出行贴士（基于真实数据分析）</div>
            <div className="text-xs text-amber-700 space-y-1">
              <div>晴天平均人流 4,040 人次，雨天仅 1,594 人次（差异 153%，p{'<'}0.001）</div>
              <div>{timeType === '节假日' ? '节假日人流为工作日的 2.3 倍，建议提前规划路线并错峰出行' : timeType === '周末' ? '周末人流为工作日的 1.34 倍，上午出发体验更佳' : '工作日人流较少，适合深度体验'}</div>
              <div>最佳出行温度区间：15-25度（人流量峰值区间）</div>
            </div>
          </div>
        </div>
      )}

      {/* 方案智能评判 */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-500" /> 方案智能评判
        </h2>
        <p className="text-sm text-slate-500 mb-3">输入您的出行计划，系统将基于空间活力模型（XGBoost R²=0.917）、天气影响分析和人流预测数据进行智能评估。</p>
        <textarea value={evalInput} onChange={e => setEvalInput(e.target.value)} rows={3}
          placeholder="例如：周末想去青羊区的人民公园喝茶，下午去大慈寺逛太古里，天气预报是晴天，大概春天3月份去..."
          className="w-full border border-slate-300 rounded-lg p-3 text-sm mb-3 resize-none" />
        <button onClick={evaluatePlan} className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm">
          智能评判
        </button>

        {evalResult && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-3xl font-bold ${evalResult.score >= 80 ? 'text-green-600' : evalResult.score >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                {evalResult.score}<span className="text-lg text-slate-400">分</span>
              </div>
              <div className={`text-sm font-medium px-3 py-1 rounded ${evalResult.score >= 80 ? 'bg-green-100 text-green-700' : evalResult.score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                {evalResult.suggestion}
              </div>
            </div>
            <div className="space-y-1.5">
              {evalResult.feedback.map((f, i) => (
                <div key={i} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">{'>'}</span> {f}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelPlan;
