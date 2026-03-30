import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { MapData } from '../types';

interface Props {
  data: MapData[];
  theme?: 'dark' | 'light';
}

// 成都市8区默认数据
const CD_DISTRICT_DATA: MapData[] = [
  { name: '锦江区', value: 4075, topics: ['景区3个', '广场3个'] },
  { name: '青羊区', value: 4684, topics: ['景区4个', '广场3个', '公园2个'] },
  { name: '武侯区', value: 2811, topics: ['广场5个', '公园2个'] },
  { name: '成华区', value: 2357, topics: ['广场7个', '公园3个'] },
  { name: '金牛区', value: 2155, topics: ['景区2个', '广场5个', '公园1个'] },
  { name: '双流区', value: 1664, topics: ['景区1个', '广场6个', '公园2个'] },
  { name: '龙泉驿区', value: 1523, topics: ['广场5个', '公园2个'] },
  { name: '温江区', value: 799, topics: ['广场1个', '公园1个'] },
];

const normalizeDistrictName = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.endsWith('区')) return trimmed;
  return `${trimmed}区`;
};

const normalizeMapData = (raw: MapData[]): MapData[] => {
  const seen = new Set<string>();
  return raw
    .filter((item) => item && item.name)
    .map((item) => ({
      name: normalizeDistrictName(item.name),
      value: Number.isFinite(item.value) ? Math.max(0, Math.round(item.value)) : 0,
      topics: Array.isArray(item.topics) ? item.topics.filter(Boolean) : []
    }))
    .filter((item) => {
      if (!item.name || seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
};

const ChinaHeatMap: React.FC<Props> = ({ data, theme = 'dark' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isLight = theme === 'light';
  const sourceData = normalizeMapData(data && data.length > 0 ? data : CD_DISTRICT_DATA);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    let resizeObserver: ResizeObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const initChart = async () => {
      try {
        if (!echarts.getMap('chengdu')) {
          // 从 Flask 后端获取成都 GeoJSON
          const response = await fetch('/api/chengdu_geo');
          if (!response.ok) throw new Error('成都地图数据加载失败');
          const geoJson = await response.json();
          echarts.registerMap('chengdu', geoJson);
        }

        if (!chartInstance.current) {
          chartInstance.current = echarts.init(el);
        }

        const maxValue = Math.max(...sourceData.map((d) => d.value));
        const option: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'item',
            backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15, 23, 42, 0.95)',
            borderColor: isLight ? '#e2e8f0' : '#06b6d4',
            textStyle: { color: isLight ? '#1e293b' : '#e2e8f0', fontSize: 12 },
            formatter: (params: any) => {
              const item = sourceData.find((item) => item.name === params.name);
              if (!item) return params.name;
              const topicsHtml = item.topics
                .map((t) => `<span style="color:#22d3ee">• ${t}</span>`)
                .join('<br/>');
              return `
                <div style="font-weight:bold;color:#fbbf24;margin-bottom:4px">${item.name}</div>
                <div>日均人流：<b style="color:#22d3ee">${item.value.toLocaleString()} 人次</b></div>
                <div style="margin-top:5px;font-size:11px;opacity:0.85;border-top:1px solid #334155;padding-top:4px">
                  空间分布：<br/>${topicsHtml}
                </div>
              `;
            }
          },
          visualMap: {
            min: 0,
            max: Math.max(1, maxValue),
            text: ['高', '低'],
            realtime: false,
            calculable: true,
            orient: 'vertical',
            left: 8,
            bottom: 20,
            textStyle: { color: isLight ? '#64748b' : '#94a3b8', fontSize: 10 },
            inRange: {
              color: isLight
                ? ['#dbeafe', '#3b82f6', '#1d4ed8']
                : ['#0c4a6e', '#0284c7', '#22d3ee']
            }
          },
          series: [
            {
              name: '日均人流',
              type: 'map',
              map: 'chengdu',
              roam: true,
              zoom: 1.1,
              center: [104.07, 30.55],
              label: {
                show: true,
                color: isLight ? '#374151' : 'rgba(255,255,255,0.75)',
                fontSize: 10
              },
              emphasis: {
                label: { color: isLight ? '#0f172a' : '#fff', fontSize: 12 },
                itemStyle: {
                  areaColor: isLight ? '#bfdbfe' : '#0e7490',
                  borderColor: isLight ? '#3b82f6' : '#22d3ee',
                  borderWidth: 2
                }
              },
              itemStyle: {
                areaColor: isLight ? '#e0f2fe' : 'rgba(14, 116, 144, 0.3)',
                borderColor: isLight ? '#93c5fd' : '#164e63',
                borderWidth: 1.5,
                shadowColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(6, 182, 212, 0.3)',
                shadowBlur: 8
              },
              data: sourceData
            }
          ]
        };

        chartInstance.current.setOption(option);
        setLoading(false);

        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0) {
              chartInstance.current?.resize();
            }
          }
        });
        resizeObserver.observe(el);

        timer = setTimeout(() => {
          chartInstance.current?.resize();
        }, 300);
      } catch (err) {
        console.error('成都地图加载失败', err);
        setError(true);
        setLoading(false);
      }
    };

    initChart();

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (timer) clearTimeout(timer);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [theme, sourceData.map((item) => `${item.name}:${item.value}`).join('|'), isLight]);

  if (error) {
    const sorted = [...sourceData].sort((a, b) => b.value - a.value);
    return (
      <div className={`w-full h-full rounded-lg border p-3 overflow-y-auto ${isLight ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-900/50'}`}>
        <div className={`text-sm font-bold mb-2 ${isLight ? 'text-slate-700' : 'text-cyan-200'}`}>
          成都市各区域人流分布（地图服务不可用）
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {sorted.map((item, i) => (
            <div key={item.name} className={`rounded border px-2 py-1.5 flex items-center justify-between text-xs ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-700 bg-slate-800/60'}`}>
              <span className={isLight ? 'text-slate-600' : 'text-slate-300'}>{i + 1}. {item.name}</span>
              <span className={`font-mono font-bold ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center font-mono text-xs z-10 backdrop-blur-sm ${isLight ? 'text-blue-500 bg-white/80' : 'text-cyan-500 bg-slate-900/50'}`}>
          正在加载成都市地图数据...
        </div>
      )}
      <div ref={chartRef} className="w-full h-full" />
    </div>
  );
};

export default ChinaHeatMap;
