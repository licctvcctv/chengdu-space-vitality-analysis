
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import { Tag, BarChart3, ListOrdered, FileText, Database, Sparkles } from 'lucide-react';
import { miningService } from '../api/miningService';
import { WordCloudItem } from '../types';
import { LoadingState } from '../components/ui/LoadingState';

const TFIDFWordCloud: React.FC<{ data: WordCloudItem[] }> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const option = {
      tooltip: {
        show: true,
        formatter: (params: any) => {
            return `<div class="font-bold">${params.name}</div>
                    <div class="text-xs text-slate-400 mt-1">TF-IDF Value</div>
                    <div class="font-mono text-blue-500 font-bold text-lg">${params.value}</div>
                    <div class="text-xs text-slate-500">Occurrences: ${params.data.count}</div>`;
        }
      },
      series: [
        {
          type: 'wordCloud',
          shape: 'circle',
          left: 'center',
          top: 'center',
          width: '95%',
          height: '95%',
          sizeRange: [10, 75], 
          rotationRange: [-45, 90],
          rotationStep: 45,
          gridSize: 6,
          drawOutOfBound: false,
          layoutAnimation: true,
          textStyle: {
            fontFamily: 'Noto Sans SC, sans-serif',
            fontWeight: 'bold',
            color: function () {
              const colors = [
                '#2563eb', '#0891b2', '#7c3aed', '#e11d48', '#059669', '#d97706', '#475569', '#9333ea',
              ];
              return colors[Math.floor(Math.random() * colors.length)];
            }
          },
          emphasis: {
            focus: 'self',
            textStyle: { textShadowBlur: 10, textShadowColor: 'rgba(0,0,0,0.2)' }
          },
          data: data
        }
      ]
    };

    chartInstance.current.setOption(option);
    
    const resizeObserver = new ResizeObserver((entries) => {
        for(let entry of entries) {
            if(entry.contentRect.width > 0) chartInstance.current?.resize();
        }
    });
    resizeObserver.observe(el);

    const timer = setTimeout(() => {
        chartInstance.current?.resize();
    }, 200);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-full" />;
};

/**
 * MiningKeywords (岗位关键词挖掘页面)
 *
 * @description
 * 大数据挖掘模块：基于 TF-IDF (Term Frequency-Inverse Document Frequency) 算法的岗位关键词提取。
 * 核心功能：
 * 1. 词云展示：可视化展示经过计算后的高权重事业单位岗位关键词。
 * 2. 权重排行：右侧列表展示 Top 20 岗位关键词及其具体的 TF-IDF 权重值。
 *
 * 算法背景：
 * Spark MLlib 负责对海量事业单位招聘数据进行分词、停用词过滤，并计算每个岗位词的 TF-IDF 值，
 * 以反映该岗位关键词在当前招聘市场中的重要程度。
 */
const MiningKeywords: React.FC = () => {
  const [keywords, setKeywords] = useState<WordCloudItem[]>([]);
  const [loading, setLoading] = useState(true);

  const keywordStats = useMemo(() => {
    const total = keywords.length;
    const high = keywords.filter((item) => item.value >= 0.6).length;
    const middle = keywords.filter((item) => item.value >= 0.3 && item.value < 0.6).length;
    const tail = Math.max(0, total - high - middle);
    const maxCount = Math.max(...keywords.map((item) => item.count || 0), 1);
    const topKeyword = keywords[0]?.name || '--';
    return { total, high, middle, tail, maxCount, topKeyword };
  }, [keywords]);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const data = await miningService.getKeywords();
        setKeywords(data);
      } catch (error) {
        console.error("Failed to load keywords");
      } finally {
        setLoading(false);
      }
    };
    fetchKeywords();
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
            <Tag className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">岗位关键词挖掘 (TF-IDF)</h2>
            <span className="text-sm text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded ml-2">算法: Spark TF-IDF</span>
         </div>

         <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 shadow-sm animate-fade-in">
             <Database className="w-4 h-4" />
             <span className="text-xs font-bold font-mono">关键词提取量：{keywordStats.total} 项</span>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[11px] text-slate-500">核心词簇</div>
          <div className="text-base font-bold text-slate-800 mt-1">{keywordStats.topKeyword}</div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-3">
          <div className="text-[11px] text-blue-600">高权重词 (≥0.6)</div>
          <div className="text-base font-bold text-blue-700 mt-1">{keywordStats.high}</div>
        </div>
        <div className="bg-white border border-cyan-200 rounded-lg p-3">
          <div className="text-[11px] text-cyan-600">中权重词 (0.3-0.6)</div>
          <div className="text-base font-bold text-cyan-700 mt-1">{keywordStats.middle}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="text-[11px] text-slate-500">长尾词 (&lt;0.3)</div>
          <div className="text-base font-bold text-slate-700 mt-1">{keywordStats.tail}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
         
         {/* Left: Word Cloud (65%) */}
         <div className="lg:flex-[2] bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" /> 热门岗位词云分布
                 </h3>
                 <div className="flex gap-4 text-xs text-slate-400">
                     <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> 核心词</span>
                     <span className="flex items-center gap-1"><span className="w-2 h-2 bg-slate-400 rounded-full"></span> 长尾词</span>
                 </div>
             </div>
             <div className="flex-1 min-h-[400px]">
                 <LoadingState loading={loading} data={keywords}>
                     <TFIDFWordCloud data={keywords} />
                 </LoadingState>
             </div>
         </div>

         {/* Right: Ranking Table (35%) */}
         <div className="lg:flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                 <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-orange-500" /> Top 30 热门岗位词权重
                 </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 <LoadingState loading={loading} data={keywords}>
                     {keywords.slice(0, 30).map((item, index) => (
                        <div key={item.name} className="flex flex-col gap-1 group">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="flex items-center gap-2 font-medium text-slate-700">
                                    <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold transition-colors ${
                                        index < 3 ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                    }`}>
                                        {index + 1}
                                    </span>
                                    {item.name}
                                </span>
                                <div className="text-right">
                                  <div className="font-mono font-bold text-blue-600">{item.value.toFixed(3)}</div>
                                  <div className="text-[10px] text-slate-400">频次 {(item.count || 0).toLocaleString()}</div>
                                </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${index < 3 ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-slate-300'}`}
                                    style={{ width: `${(item.value / 1) * 100}%` }}
                                ></div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 transition-all duration-500"
                                style={{ width: `${Math.min(100, ((item.count || 0) / keywordStats.maxCount) * 100)}%` }}
                              />
                            </div>
                        </div>
                     ))}
                 </LoadingState>
             </div>
             <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                 展示 Top 30 / 共提取 {keywords.length} 个岗位关键词（上条为 TF-IDF，下条为词频占比）
             </div>
         </div>

      </div>
    </div>
  );
};

export default MiningKeywords;
