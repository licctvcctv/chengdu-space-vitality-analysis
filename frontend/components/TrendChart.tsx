import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { TrendData } from '../types';

interface Props {
  theme?: 'dark' | 'light';
  data?: TrendData[];
}

// 2024-2025 广东省事业单位月度日均人流数量（硬编码示例）
const MONTHLY_DATA = [
  { time: '2024-01', value: 1280 },
  { time: '2024-02', value: 860 },
  { time: '2024-03', value: 2140 },
  { time: '2024-04', value: 1920 },
  { time: '2024-05', value: 2380 },
  { time: '2024-06', value: 1760 },
  { time: '2024-07', value: 3120 },
  { time: '2024-08', value: 2840 },
  { time: '2024-09', value: 3560 },
  { time: '2024-10', value: 2980 },
  { time: '2024-11', value: 2200 },
  { time: '2024-12', value: 1640 },
  { time: '2025-01', value: 1480 },
  { time: '2025-02', value: 940 },
  { time: '2025-03', value: 2620 },
  { time: '2025-04', value: 2180 },
  { time: '2025-05', value: 2860 },
  { time: '2025-06', value: 2060 },
  { time: '2025-07', value: 3480 },
  { time: '2025-08', value: 3140 },
  { time: '2025-09', value: 3920 },
  { time: '2025-10', value: 3360 },
  { time: '2025-11', value: 2540 },
  { time: '2025-12', value: 1820 }
];

const DEFAULT_TREND: TrendData[] = MONTHLY_DATA.map((item) => ({
  time: item.time,
  heat: item.value,
  forecast: null
}));

const TrendChart: React.FC<Props> = ({ theme = 'dark', data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const isLight = theme === 'light';

  const trendData = (data && data.length > 0 ? data : DEFAULT_TREND).slice(0, 48);
  const timeAxis = trendData.map((d) => d.time);
  const heatSeries = trendData.map((d) => (d.heat === null || Number.isNaN(d.heat) ? null : d.heat));
  const forecastSeries = trendData.map((d) => (d.forecast === null || Number.isNaN(d.forecast) ? null : d.forecast));
  const hasForecast = forecastSeries.some((value) => value !== null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const textColor = isLight ? '#64748b' : '#94a3b8';
    const splitLineColor = isLight ? 'rgba(148,163,184,0.3)' : 'rgba(51,65,85,0.4)';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
        borderColor: isLight ? '#e2e8f0' : '#8b5cf6',
        textStyle: { color: isLight ? '#1e293b' : '#e2e8f0', fontSize: 11 },
        formatter: (params: any) => {
          const actual = params.find((item: any) => item.seriesName === '月度人流量');
          const forecast = params.find((item: any) => item.seriesName === '趋势预测');
          const time = (params[0] && params[0].axisValueLabel) ? params[0].axisValueLabel : '';
          const lines = [`<b style="color:#fbbf24">${time}</b>`];
          if (actual) {
            lines.push(`日均人流：<b style="color:#a78bfa">${actual.value ?? '暂无'}</b> 个`);
          }
          if (forecast) {
            lines.push(`预测值：<b style="color:#f59e0b">${forecast.value ?? '暂无'}</b> 个`);
          }
          return lines.join('<br/>');
        },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: isLight ? '#94a3b8' : '#475569' }
        }
      },
      legend: {
        data: hasForecast ? ['月度人流量', '趋势预测'] : ['月度人流量'],
        textStyle: { color: textColor, fontSize: 10 },
        right: 10,
        top: 2
      },
      grid: {
        top: '16%',
        left: '3%',
        right: '4%',
        bottom: '22%',
        containLabel: true
      },
      dataZoom: [
        {
          type: 'slider',
          start: Math.max(0, ((timeAxis.length - 12) / Math.max(1, timeAxis.length)) * 100),
          end: 100,
          bottom: 4,
          height: 20,
          borderColor: isLight ? '#cbd5e1' : '#334155',
          backgroundColor: isLight ? '#f1f5f9' : 'rgba(15,23,42,0.6)',
          fillerColor: isLight ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.2)',
          handleStyle: { color: '#8b5cf6', borderColor: '#8b5cf6' },
          textStyle: { color: textColor, fontSize: 9 },
          labelFormatter: (value: number) => timeAxis[Math.round((value / 100) * Math.max(0, timeAxis.length - 1))] ?? ''
        },
        {
          type: 'inside',
          start: Math.max(0, ((timeAxis.length - 12) / Math.max(1, timeAxis.length)) * 100),
          end: 100
        }
      ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeAxis,
        axisLine: { lineStyle: { color: isLight ? '#cbd5e1' : '#475569' } },
        axisLabel: { color: textColor, fontSize: 9, rotate: 30 },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '人流量（人次）',
        nameTextStyle: { color: textColor, fontSize: 9 },
        axisLine: { show: false },
        axisLabel: { color: textColor, fontSize: 9 },
        splitLine: {
          lineStyle: { color: splitLineColor, type: 'dashed' }
        }
      },
      series: [
        {
          name: '月度人流量',
          type: 'line',
          smooth: true,
          showSymbol: true,
          symbolSize: 5,
          symbol: 'circle',
          data: heatSeries,
          lineStyle: {
            width: 3,
            color: '#8b5cf6',
            shadowBlur: 12,
            shadowColor: 'rgba(139,92,246,0.5)'
          },
          itemStyle: { color: '#8b5cf6' },
          areaStyle: {
            opacity: 1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139,92,246,0.55)' },
              { offset: 0.5, color: 'rgba(139,92,246,0.15)' },
              { offset: 1, color: 'rgba(139,92,246,0.02)' }
            ])
          },
          markPoint: {
            symbol: 'pin',
            symbolSize: 36,
            label: { fontSize: 9, color: '#fff' },
            data: [
              { type: 'max', name: '最高' },
              { type: 'min', name: '最低' }
            ]
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#fbbf24', type: 'dashed', width: 1.5 },
            label: { color: '#fbbf24', fontSize: 9 },
            data: [{ type: 'average', name: '年均' }]
          }
        },
        ...(hasForecast
          ? [
              {
                name: '趋势预测',
                type: 'line',
                smooth: true,
                showSymbol: false,
                data: forecastSeries,
                lineStyle: {
                  width: 2.5,
                  color: '#f59e0b',
                  type: 'dashed'
                },
                itemStyle: { color: '#f59e0b' },
                areaStyle: {
                  opacity: 0.15,
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(245,158,11,0.4)' },
                    { offset: 1, color: 'rgba(245,158,11,0.03)' }
                  ])
                }
              }
            ]
          : [])
      ]
    };

    chartInstance.current.setOption(option);

    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          chartInstance.current?.resize();
        }
      }
    });
    ro.observe(el);

    const timer = setTimeout(() => chartInstance.current?.resize(), 200);

    return () => {
      ro.disconnect();
      clearTimeout(timer);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [theme, timeAxis.join('|'), heatSeries.join('|'), forecastSeries.join('|'), hasForecast]);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default TrendChart;
