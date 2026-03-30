
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { GraphData } from '../types';

interface Props {
  data: GraphData;
  theme?: 'dark' | 'light';
}

const KnowledgeGraph: React.FC<Props> = ({ data, theme = 'dark' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const isLight = theme === 'light';
    const textColor = isLight ? '#475569' : '#e2e8f0';
    const legendColor = isLight ? '#64748b' : '#94a3b8';

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.9)',
        borderColor: isLight ? '#e2e8f0' : '#8b5cf6',
        textStyle: { color: isLight ? '#1e293b' : '#e2e8f0' },
        boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
      },
      legend: {
        show: true,
        data: data.categories.map(c => c.name),
        textStyle: { color: legendColor },
        right: 10,
        top: 10,
        orient: 'vertical'
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: data.nodes.map(node => ({
            ...node,
            label: { show: true, color: textColor },
            itemStyle: {
              shadowBlur: 10,
              // Keep neon colors in dark, solid colors in light
              shadowColor: isLight ? 'transparent' : (node.category === 0 ? '#f43f5e' : node.category === 1 ? '#eab308' : '#3b82f6')
            }
          })),
          links: data.links,
          categories: data.categories,
          roam: true,
          label: {
            show: true,
            position: 'right',
            formatter: '{b}',
            color: textColor
          },
          labelLayout: { hideOverlap: true },
          force: {
            repulsion: 400,
            edgeLength: 120,
            gravity: 0.1
          },
          lineStyle: {
            color: 'source',
            curveness: 0.3,
            width: 2,
            opacity: 0.5
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: { width: 5, opacity: 1 }
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

export default KnowledgeGraph;
