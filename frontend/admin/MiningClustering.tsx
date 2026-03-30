
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Grid, Layers, Database } from 'lucide-react';
import { miningService } from '../api/miningService';
import { ClusterPoint } from '../types';
import { LoadingState } from '../components/ui/LoadingState';

const ClusterBubbleChart: React.FC<{ data: ClusterPoint[] }> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const option = {
      backgroundColor: 'transparent',
      grid: {
        left: '5%', right: '10%', top: '10%', bottom: '10%'
      },
      tooltip: {
        formatter: function (param: any) {
          return `<div class="font-bold border-b pb-1 mb-1">${param.data[3]}</div>
                  <div>类别: ${param.data[4]}</div>
                  <div>岗位需求强度: ${param.data[2]}</div>
                  <div class="text-xs text-gray-400 mt-1">坐标: (${param.data[0]}, ${param.data[1]})</div>`;
        }
      },
      legend: {
        right: 10,
        data: ['教育类', '医疗卫生', '行政管理', '科研技术'],
        textStyle: { color: '#64748b' }
      },
      xAxis: {
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { show: false },
        axisTick: { show: false }
      },
      yAxis: {
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { show: false },
        axisTick: { show: false },
        scale: true
      },
      series: [
        {
          name: '教育类',
          data: data.filter(d => d[4] === '教育类'),
          type: 'scatter',
          symbolSize: function (data: any) { return data[2] * 1.5; },
          emphasis: {
            focus: 'series',
            label: { show: true, formatter: function (param: any) { return param.data[3]; }, position: 'top' }
          },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(244, 63, 94, 0.5)',
            color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
              { offset: 0, color: 'rgb(251, 113, 133)' },
              { offset: 1, color: 'rgb(225, 29, 72)' }
            ])
          },
          label: { show: true, formatter: function (param: any) { return param.data[3]; }, color: '#fff', fontSize: 10, fontWeight: 'bold' }
        },
        {
          name: '医疗卫生',
          data: data.filter(d => d[4] === '医疗卫生'),
          type: 'scatter',
          symbolSize: function (data: any) { return data[2] * 1.5; },
          emphasis: { focus: 'series' },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(59, 130, 246, 0.5)',
            color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
              { offset: 0, color: 'rgb(96, 165, 250)' },
              { offset: 1, color: 'rgb(37, 99, 235)' }
            ])
          },
          label: { show: true, formatter: function (param: any) { return param.data[3]; }, color: '#fff', fontSize: 10, fontWeight: 'bold' }
        },
        {
          name: '行政管理',
          data: data.filter(d => d[4] === '行政管理'),
          type: 'scatter',
          symbolSize: function (data: any) { return data[2] * 1.5; },
          emphasis: { focus: 'series' },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(168, 85, 247, 0.5)',
            color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
              { offset: 0, color: 'rgb(192, 132, 252)' },
              { offset: 1, color: 'rgb(147, 51, 234)' }
            ])
          },
          label: { show: true, formatter: function (param: any) { return param.data[3]; }, color: '#fff', fontSize: 10, fontWeight: 'bold' }
        },
        {
          name: '科研技术',
          data: data.filter(d => d[4] === '科研技术'),
          type: 'scatter',
          symbolSize: function (data: any) { return data[2] * 1.5; },
          emphasis: { focus: 'series' },
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(34, 197, 94, 0.5)',
            color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
              { offset: 0, color: 'rgb(74, 222, 128)' },
              { offset: 1, color: 'rgb(22, 163, 74)' }
            ])
          },
          label: { show: true, formatter: function (param: any) { return param.data[3]; }, color: '#fff', fontSize: 10, fontWeight: 'bold' }
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
 * MiningClustering (岗位聚类分析页面)
 *
 * @description
 * 大数据挖掘模块：无监督学习 K-means 聚类展示（针对事业单位岗位）。
 * 核心功能：
 * 1. 聚类气泡图：将岗位向量降维映射到二维平面，展示不同事业单位岗位簇分布。
 * 2. 交互式筛选：支持点击图例筛选岗位类别。
 *
 * 算法背景：
 * Spark MLlib 执行 K-means 算法，将海量事业单位岗位自动划分为若干簇，
 * 辅助发现事业单位招聘需求的结构性变化。
 */
const MiningClustering: React.FC = () => {
  const [clusterData, setClusterData] = useState<ClusterPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    miningService.getClusters().then(res => {
        setClusterData(res);
        setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
         <Grid className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">岗位聚类分析</h2>
         <span className="text-sm text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded ml-2">Unsupervised Learning</span>
      </div>

      {/* Main Chart Card */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-0">
         <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" /> 事业单位岗位 K-means 聚类分布图
             </h3>
             <div className="text-xs text-slate-400 flex items-center gap-4">
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> 教育类</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> 医疗卫生</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 行政管理</span>
                 <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> 科研技术</span>
             </div>
         </div>
         <div className="flex-1 min-h-[400px]">
             <LoadingState loading={loading} data={clusterData}>
                 <ClusterBubbleChart data={clusterData} />
             </LoadingState>
         </div>
         
         {/* Algorithm Footer Note */}
         <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-start gap-3">
             <Database className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
             <div className="text-xs text-slate-500 leading-relaxed">
                 <strong className="text-slate-700 block mb-1">算法说明：</strong>
                 本页面数据由 Spark MLlib 库通过 <span className="font-mono text-blue-600 bg-blue-50 px-1 rounded">K-means</span> 聚类算法实时计算得出。
                 系统自动将海量事业单位岗位描述映射到高维语义空间，并降维可视化为二维气泡图。气泡大小代表该类下的招聘需求强度，距离越近代表岗位能力要求越相似。
             </div>
         </div>
      </div>
    </div>
  );
};

export default MiningClustering;
