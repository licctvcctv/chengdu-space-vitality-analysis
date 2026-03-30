import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const FeatureImportanceChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el);

    fetch('/api/feature_importance')
      .then(r => r.json())
      .then(data => {
        const features = data.features.slice().reverse();
        const importance = data.importance.slice().reverse();

        chart.setOption({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15,23,42,0.95)',
            borderColor: '#8b5cf6',
            textStyle: { color: '#e2e8f0', fontSize: 11 }
          },
          grid: { left: 78, right: 38, top: 4, bottom: 4 },
          xAxis: {
            type: 'value', show: false
          },
          yAxis: {
            type: 'category', data: features,
            axisLabel: { color: '#94a3b8', fontSize: 9 },
            axisLine: { show: false },
            axisTick: { show: false }
          },
          series: [{
            type: 'bar', data: importance, barWidth: 10,
            itemStyle: {
              borderRadius: [0, 3, 3, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: 'rgba(139,92,246,0.1)' },
                { offset: 1, color: '#8b5cf6' }
              ])
            },
            label: {
              show: true, position: 'right',
              color: '#a78bfa', fontSize: 9,
              formatter: (p: any) => p.value.toFixed(3)
            }
          }]
        });
      });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => { ro.disconnect(); chart.dispose(); };
  }, []);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default FeatureImportanceChart;
