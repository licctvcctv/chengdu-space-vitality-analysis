import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CategoryData } from '../types';

interface Props {
  data: CategoryData[];
}

const PALETTE = ['#22d3ee', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#f43f5e'];

const IndustryDemandChart: React.FC<Props> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    chartInstance.current.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: any) =>
          `<div style="font-weight:700">${params.name}</div><div>占比: ${params.percent}%</div><div>需求指数: ${params.value}</div>`
      },
      legend: {
        bottom: 0,
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          color: '#94a3b8',
          fontSize: 11
        }
      },
      series: [
        {
          type: 'pie',
          radius: ['48%', '70%'],
          center: ['50%', '42%'],
          minAngle: 6,
          avoidLabelOverlap: false,
          itemStyle: {
            borderColor: '#020617',
            borderWidth: 2
          },
          label: { show: false },
          labelLine: { show: false },
          data: data.map((item, index) => ({
            ...item,
            itemStyle: { color: PALETTE[index % PALETTE.length] }
          }))
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '36%',
          style: {
            text: '行业总量',
            fill: '#64748b',
            fontSize: 11,
            fontWeight: 500
          }
        },
        {
          type: 'text',
          left: 'center',
          top: '45%',
          style: {
            text: `${total}`,
            fill: '#f8fafc',
            fontSize: 22,
            fontWeight: 700
          }
        }
      ]
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          chartInstance.current?.resize();
        }
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

export default IndustryDemandChart;
