import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const WeatherImpactChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el);

    fetch('/api/weather_impact')
      .then(r => r.json())
      .then(data => {
        const types = data.weather_types;
        const flows = data.avg_flow;

        const colors = types.map((w: string) => {
          if (w.includes('晴')) return '#fbbf24';
          if (w.includes('云') || w.includes('阴')) return '#64748b';
          if (w.includes('雪')) return '#e2e8f0';
          return '#38bdf8';
        });

        chart.setOption({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15,23,42,0.95)',
            borderColor: '#06b6d4',
            textStyle: { color: '#e2e8f0', fontSize: 11 },
            formatter: (params: any) => {
              const p = params[0];
              return `<b style="color:#fbbf24">${p.name}</b><br/>日均人流：<b style="color:#22d3ee">${Math.round(p.value).toLocaleString()}</b> 人次`;
            }
          },
          grid: { left: 68, right: 10, top: 4, bottom: 4 },
          xAxis: { type: 'value', show: false },
          yAxis: {
            type: 'category',
            data: types.slice().reverse(),
            axisLabel: { color: '#94a3b8', fontSize: 8 },
            axisLine: { show: false },
            axisTick: { show: false }
          },
          series: [{
            type: 'bar',
            data: flows.slice().reverse().map((v: number, i: number) => ({
              value: v,
              itemStyle: { color: colors.slice().reverse()[i], borderRadius: [0, 3, 3, 0] }
            })),
            barWidth: 8
          }]
        });
      });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => { ro.disconnect(); chart.dispose(); };
  }, []);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default WeatherImpactChart;
