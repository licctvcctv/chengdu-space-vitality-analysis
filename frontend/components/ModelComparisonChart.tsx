import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

const ModelComparisonChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const chart = echarts.init(el);

    fetch('/api/model_comparison')
      .then(r => r.json())
      .then(data => {
        const names = data.map((m: any) => {
          const raw = m['模型'] || '';
          return raw
            .replace('XGBoost-实验', 'XGB-E')
            .replace('LightGBM-实验', 'LGB-E')
            .replace('-仅基础特征', '-基础')
            .replace('-基础+天气', '-+天气')
            .replace('-基础+社交', '-+社交')
            .replace('-全部特征', '-全部');
        });
        const r2 = data.map((m: any) => m['R²']);
        const rmse = data.map((m: any) => m['RMSE']);

        chart.setOption({
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(15,23,42,0.95)',
            borderColor: '#06b6d4',
            textStyle: { color: '#e2e8f0', fontSize: 11 }
          },
          legend: {
            data: ['R²', 'RMSE'],
            textStyle: { color: '#94a3b8', fontSize: 10 },
            top: 0, right: 4
          },
          grid: { left: 42, right: 42, top: 28, bottom: 52 },
          xAxis: {
            type: 'category', data: names,
            axisLabel: { color: '#64748b', fontSize: 8, rotate: 40 },
            axisLine: { lineStyle: { color: '#334155' } },
            axisTick: { show: false }
          },
          yAxis: [
            {
              type: 'value', name: 'R²',
              nameTextStyle: { color: '#64748b', fontSize: 9 },
              min: 0.8, max: 0.95,
              axisLabel: { color: '#64748b', fontSize: 9, formatter: (v: number) => v.toFixed(2) },
              splitLine: { lineStyle: { color: 'rgba(51,65,85,0.3)' } }
            },
            {
              type: 'value', name: 'RMSE',
              nameTextStyle: { color: '#64748b', fontSize: 9 },
              axisLabel: { color: '#64748b', fontSize: 9 },
              splitLine: { show: false }
            }
          ],
          series: [
            {
              name: 'R²', type: 'bar', data: r2, barWidth: 10,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#22d3ee' },
                  { offset: 1, color: '#0891b2' }
                ]),
                borderRadius: [3, 3, 0, 0]
              }
            },
            {
              name: 'RMSE', type: 'line', yAxisIndex: 1, data: rmse,
              lineStyle: { color: '#f43f5e', width: 2, type: 'dashed' },
              itemStyle: { color: '#f43f5e' },
              symbol: 'diamond', symbolSize: 5
            }
          ]
        });
      });

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => { ro.disconnect(); chart.dispose(); };
  }, []);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default ModelComparisonChart;
