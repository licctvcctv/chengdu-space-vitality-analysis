
import React, { useEffect, useState } from 'react';
import { MapPin, TrendingUp, AlignLeft, BarChart2 } from 'lucide-react';
import ChinaHeatMap from '../components/ChinaHeatMap';
import { analysisService } from '../api/analysisService';
import { MapData } from '../types';
import { LoadingState } from '../components/ui/LoadingState';

/**
 * AnalysisGeo (广东省地域分析页面)
 *
 * @description
 * 事业单位招聘需求地域维度分析模块（聚焦广东省）。
 * 核心功能：
 * 1. 左侧展示广东省地图热力分布 (基于 ECharts Map)，可视化不同地市的招聘需求强度。
 * 2. 右侧展示各地市需求排行榜，包含需求指数及该地市下的热门岗位摘要。
 *
 * 数据来源：
 * 调用 analysisService.getGeoMapData() 获取按地市聚合的事业单位招聘数据。
 */
const AnalysisGeo: React.FC = () => {
  const [data, setData] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analysisService.getGeoMapData().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const sortedRegions = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <MapPin className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">广东省地域分析</h2>
         <span className="text-sm text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded ml-2">Geographic Distribution</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Main Map (70%) */}
        <div className="lg:flex-[3] bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                 <MapPin className="w-4 h-4 text-blue-500" /> 广东省各地市招聘热力分布图
              </h3>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> 高需求</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#e2e8f0]"></span> 低需求</span>
              </div>
           </div>
           <div className="flex-1 min-h-[400px] relative p-4">
              <LoadingState loading={loading} data={data}>
                  <ChinaHeatMap data={data} theme="light" />
              </LoadingState>
           </div>
        </div>

        {/* Side Ranking (30%) */}
        <div className="lg:flex-[1] bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                 <BarChart2 className="w-4 h-4 text-indigo-500" /> 各地市招聘需求排行
              </h3>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4">
               <LoadingState loading={loading} data={sortedRegions}>
                   <div className="space-y-4">
                       {sortedRegions.map((item, index) => (
                           <div key={item.name} className="relative">
                               <div className="flex justify-between items-end mb-1">
                                   <div className="flex items-center gap-2">
                                       <span className={`
                                           w-5 h-5 flex items-center justify-center rounded text-xs font-bold
                                           ${index < 3 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                                       `}>
                                           {index + 1}
                                       </span>
                                       <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                   </div>
                                   <span className="text-sm font-mono font-bold text-indigo-600">{item.value}</span>
                               </div>
                               
                               {/* Progress Bar */}
                               <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
                                   <div 
                                       className={`h-full rounded-full ${index < 3 ? 'bg-indigo-500' : 'bg-indigo-300'}`} 
                                       style={{ width: `${item.value}%` }}
                                   ></div>
                               </div>
                               
                               {/* Topic Snippet */}
                               {item.topics && item.topics.length > 0 && (
                                   <div className="text-xs text-slate-400 flex items-center gap-1 pl-7">
                                       <TrendingUp className="w-3 h-3" />
                                       <span className="truncate">{item.topics[0]}</span>
                                   </div>
                               )}
                           </div>
                       ))}
                   </div>
               </LoadingState>
           </div>
           
           <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
               <strong className="text-slate-600">数据说明：</strong> 需求指数由事业单位岗位发布量、招聘活跃度与编制需求增速加权计算（0-100 相对值），数据来源：广东省人力资源和社会保障厅。
           </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisGeo;
