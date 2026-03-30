
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ComparisonData } from '../types';

interface Props {
  data: ComparisonData;
  theme?: 'dark' | 'light';
}

const ComparisonTrend: React.FC<Props> = ({ data, theme = 'dark' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const isLight = theme === 'light';
    const axisColor = isLight ? '#64748b' : '#94a3b8';
    const splitLineColor = isLight ? '#e2e8f0' : 'rgba(51, 65, 85, 0.3)';

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)',
        borderColor: isLight ? '#e2e8f0' : '#8b5cf6',
        textStyle: { color: isLight ? '#1e293b' : '#e2e8f0' }
      },
      legend: {
        data: [data.topicA, data.topicB],
        textStyle: { color: axisColor },
        top: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.trendData.map(d => d.time),
        axisLine: { lineStyle: { color: isLight ? '#cbd5e1' : '#475569' } },
        axisLabel: { color: axisColor }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: { color: axisColor },
        splitLine: { 
          show: true, 
          lineStyle: { color: splitLineColor, type: 'dashed' } 
        }
      },
      series: [
        {
          name: data.topicA,
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: data.trendData.map(d => d.valueA),
          lineStyle: { width: 3, color: '#22d3ee' },
          areaStyle: {
            opacity: 0.2,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(34, 211, 238, 0.8)' },
              { offset: 1, color: 'rgba(34, 211, 238, 0)' }
            ])
          }
        },
        {
          name: data.topicB,
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: data.trendData.map(d => d.valueB),
          lineStyle: { width: 3, color: '#d946ef' },
          areaStyle: {
            opacity: 0.2,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(217, 70, 239, 0.8)' },
              { offset: 1, color: 'rgba(217, 70, 239, 0)' }
            ])
          }
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
  }, [data, theme]);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default ComparisonTrend;
