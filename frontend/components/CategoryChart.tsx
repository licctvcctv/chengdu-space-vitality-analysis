import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { CategoryData } from '../types';

interface Props {
  theme?: 'dark' | 'light';
  educationData?: CategoryData[];
  majorData?: CategoryData[];
}

const DEFAULT_EDUCATION_DATA: CategoryData[] = [
  { name: '景区', value: 11 },
  { name: '广场', value: 43 },
  { name: '公园', value: 4 },
];

const DEFAULT_MAJOR_DATA: CategoryData[] = [
  { name: '青羊区', value: 4684 },
  { name: '锦江区', value: 4075 },
  { name: '武侯区', value: 2811 },
  { name: '成华区', value: 2357 },
  { name: '金牛区', value: 2155 },
  { name: '双流区', value: 1664 },
  { name: '龙泉驿区', value: 1523 },
  { name: '温江区', value: 799 }
];

const sanitize = (raw: CategoryData[] | undefined, fallback: CategoryData[]): CategoryData[] => {
  if (!raw || raw.length === 0) {
    return [...fallback];
  }
  const valid = raw
    .filter((item) => item && item.name && Number.isFinite(item.value))
    .map((item) => ({
      name: item.name.trim(),
      value: Math.max(1, Math.round(item.value))
    }))
    .filter((item) => item.name.length > 0)
    .slice(0, 12);
  return valid.length > 0 ? valid : [...fallback];
};

const CategoryChart: React.FC<Props> = ({ theme = 'dark', educationData, majorData }) => {
  const barRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const barInstance = useRef<echarts.ECharts | null>(null);
  const radarInstance = useRef<echarts.ECharts | null>(null);

  const isLight = theme === 'light';
  const textColor = isLight ? '#64748b' : '#94a3b8';
  const tooltipBg = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15, 23, 42, 0.95)';
  const tooltipBorder = isLight ? '#e2e8f0' : '#06b6d4';
  const tooltipText = isLight ? '#1e293b' : '#e2e8f0';

  const edData = useMemo(() => sanitize(educationData, DEFAULT_EDUCATION_DATA), [educationData]);
  const major = useMemo(() => sanitize(majorData, DEFAULT_MAJOR_DATA).slice(0, 8), [majorData]);
  const majorIndicators = useMemo(
    () => major.map((item) => ({ name: item.name })),
    [major]
  );

  useEffect(() => {
    const barEl = barRef.current;
    if (!barEl) return;
    if (!barInstance.current) {
      barInstance.current = echarts.init(barEl);
    }
    if (!radarRef.current) return;
    if (!radarInstance.current) {
      radarInstance.current = echarts.init(radarRef.current);
    }

    const barOption: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: 'POI类型分布',
        textStyle: { color: isLight ? '#374151' : '#e2e8f0', fontSize: 12, fontWeight: 'bold' },
        left: 'center',
        top: 4
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText, fontSize: 11 },
        formatter: (params: any) => {
          const p = params[0];
          return `<b style="color:#fbbf24">${p.name}</b><br/>空间数量：<b style="color:#22d3ee">${p.value.toLocaleString()}</b> 个`;
        }
      },
      grid: {
        top: 36,
        left: 8,
        right: 16,
        bottom: 8,
        containLabel: true
      },
      xAxis: {
        type: 'value',
        alignTicks: false,
        axisLabel: { color: textColor, fontSize: 9 },
        splitLine: {
          lineStyle: { color: isLight ? '#e2e8f0' : 'rgba(51,65,85,0.4)', type: 'dashed' }
        },
        axisLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: edData.map((d) => d.name),
        axisLabel: { color: textColor, fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        {
          type: 'bar',
          data: edData.map((d, i) => ({
            value: d.value,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                {
                  offset: 0,
                  color: ['#0284c7', '#0891b2', '#6366f1', '#7c3aed', '#db2777'][i % 5]
                },
                {
                  offset: 1,
                  color: ['#38bdf8', '#22d3ee', '#a5b4fc', '#c084fc', '#f9a8d4'][i % 5]
                }
              ])
            }
          })),
          barMaxWidth: 20,
          label: {
            show: true,
            position: 'right',
            color: textColor,
            fontSize: 9,
            formatter: (params: any) => params.value.toLocaleString()
          },
          emphasis: {
            itemStyle: { shadowBlur: 8, shadowColor: 'rgba(34,211,238,0.4)' }
          }
        }
      ]
    };

    const radarOption: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: '区域人流 TOP8',
        textStyle: { color: isLight ? '#374151' : '#e2e8f0', fontSize: 12, fontWeight: 'bold' },
        left: 'center',
        top: 4
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText, fontSize: 11 }
      },
      radar: {
        indicator: majorIndicators,
        center: ['50%', '55%'],
        radius: '62%',
        splitNumber: 4,
        axisName: {
          color: textColor,
          fontSize: 10
        },
        splitArea: {
          areaStyle: {
            color: isLight
              ? ['rgba(219,234,254,0.3)', 'rgba(219,234,254,0.1)']
              : ['rgba(14,116,144,0.15)', 'rgba(14,116,144,0.05)']
          }
        },
        splitLine: {
          lineStyle: {
            color: isLight ? 'rgba(148,163,184,0.4)' : 'rgba(51,65,85,0.6)'
          }
        },
        axisLine: {
          lineStyle: {
            color: isLight ? 'rgba(148,163,184,0.4)' : 'rgba(51,65,85,0.6)'
          }
        }
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: major.map((item) => item.value),
              name: '日均人流',
              itemStyle: { color: '#22d3ee' },
              areaStyle: {
                color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                  { offset: 0, color: 'rgba(34,211,238,0.5)' },
                  { offset: 1, color: 'rgba(34,211,238,0.05)' }
                ])
              },
              lineStyle: { color: '#22d3ee', width: 2 },
              symbol: 'circle',
              symbolSize: 5
            }
          ]
        }
      ]
    };

    barInstance.current.setOption(barOption);
    radarInstance.current.setOption(radarOption);

    const ro = new ResizeObserver(() => {
      barInstance.current?.resize();
      radarInstance.current?.resize();
    });
    if (barEl) ro.observe(barEl);
    if (radarRef.current) ro.observe(radarRef.current);

    const timer = setTimeout(() => {
      barInstance.current?.resize();
      radarInstance.current?.resize();
    }, 200);

    return () => {
      ro.disconnect();
      clearTimeout(timer);
      barInstance.current?.dispose();
      radarInstance.current?.dispose();
      barInstance.current = null;
      radarInstance.current = null;
    };
  }, [
    isLight,
    textColor,
    tooltipBg,
    tooltipBorder,
    tooltipText,
    edData,
    major.map((item) => `${item.name}:${item.value}`).join('|'),
    majorIndicators.map((item) => `${item.name}:${item.max}`).join('|')
  ]);

  return (
    <div className="w-full h-full flex gap-1">
      <div ref={barRef} className="flex-1 h-full" />
      <div ref={radarRef} className="flex-1 h-full" />
    </div>
  );
};

export default CategoryChart;
