
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { SentimentData } from '../types';

interface Props {
  data: SentimentData[];
}

const SentimentChart: React.FC<Props> = ({ data }) => {
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
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#38bdf8',
        textStyle: { color: '#e2e8f0' }
      },
      legend: {
        bottom: '0%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#94a3b8', fontSize: 11 }
      },
      series: [
        {
          name: '薪资分布',
          type: 'pie',
          radius: ['50%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: '#020617',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
              color: '#e2e8f0'
            },
            scaleSize: 5
          },
          labelLine: { show: false },
          data: data
        }
      ]
    };

    chartInstance.current.setOption(option);

    // ResizeObserver logic
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            if(entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                chartInstance.current?.resize();
            }
        }
    });
    resizeObserver.observe(el);

    // Force flush
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

export default SentimentChart;
