
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ComparisonData } from '../types';

interface Props {
  data: ComparisonData;
  theme?: 'dark' | 'light';
}

const ComparisonRadar: React.FC<Props> = ({ data, theme = 'dark' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const isLight = theme === 'light';
    const axisColor = isLight ? '#64748b' : '#22d3ee';
    const splitColor = isLight ? 'rgba(148, 163, 184, 0.2)' : 'rgba(6, 182, 212, 0.2)';

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
         trigger: 'item',
         backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)',
         borderColor: isLight ? '#e2e8f0' : '#8b5cf6',
         textStyle: { color: isLight ? '#1e293b' : '#e2e8f0' }
      },
      legend: {
        bottom: 5,
        data: [data.topicA, data.topicB],
        textStyle: { color: isLight ? '#475569' : '#94a3b8' }
      },
      radar: {
        indicator: data.radarIndicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: axisColor,
          fontSize: 10
        },
        splitLine: {
          lineStyle: {
            color: [splitColor, splitColor, splitColor, splitColor].reverse()
          }
        },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: splitColor } }
      },
      series: [
        {
          name: '岗位对比',
          type: 'radar',
          lineStyle: { width: 3 },
          symbol: 'circle',
          symbolSize: 6,
          data: [
            {
              value: data.radarDataA,
              name: data.topicA,
              itemStyle: { color: '#22d3ee' },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(34, 211, 238, 0.5)' },
                    { offset: 1, color: 'rgba(34, 211, 238, 0.1)' }
                ])
              }
            },
            {
              value: data.radarDataB,
              name: data.topicB,
              itemStyle: { color: '#d946ef' },
              areaStyle: {
                 color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(217, 70, 239, 0.5)' },
                    { offset: 1, color: 'rgba(217, 70, 239, 0.1)' }
                ])
              }
            }
          ]
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

export default ComparisonRadar;
