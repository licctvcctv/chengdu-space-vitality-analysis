
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface Props {
  theme?: 'dark' | 'light';
  data?: {
    categories: string[];
    values: number[][];
    outliers: Array<[number, number]>;
  };
}

// 三类事业单位薪资分布数据（单位：元/月）
// 格式：[最小值, Q1, 中位数, Q3, 最大值]
const BOX_DATA_DEFAULT = {
  categories: ['参公管理', '公益一类', '公益二类'],
  // [min, Q1, median, Q3, max]
  values: [
    [4500, 6200, 8800, 12500, 22000],  // 参公管理
    [3800, 5400, 7600, 10800, 18000],  // 公益一类
    [3200, 4800, 6500, 9200, 16500],   // 公益二类
  ],
  // 异常点（超出须线的个别样本）
  outliers: [
    [0, 26000], [0, 28500],             // 参公管理异常高值
    [1, 22000], [1, 1800],              // 公益一类异常值
    [2, 19000], [2, 2200], [2, 1600],  // 公益二类异常值
  ]
};

const COLORS = ['#22d3ee', '#a78bfa', '#34d399'];

const SalaryBoxPlot: React.FC<Props> = ({ theme = 'dark', data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const isLight = theme === 'light';
  const chartData = {
    categories: data?.categories?.length ? data.categories : BOX_DATA_DEFAULT.categories,
    values: data?.values?.length ? data.values : BOX_DATA_DEFAULT.values,
    outliers: data?.outliers?.length ? data.outliers : BOX_DATA_DEFAULT.outliers
  };

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
      title: {
        text: '各类事业单位薪资分布',
        subtext: '参公管理 / 公益一类 / 公益二类',
        textStyle: { color: isLight ? '#374151' : '#e2e8f0', fontSize: 13, fontWeight: 'bold' },
        subtextStyle: { color: textColor, fontSize: 10 },
        left: 'center',
        top: 4
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
        borderColor: isLight ? '#e2e8f0' : '#06b6d4',
        textStyle: { color: isLight ? '#1e293b' : '#e2e8f0', fontSize: 11 },
        formatter: (params: any) => {
          if (params.seriesType === 'boxplot') {
            const [min, q1, median, q3, max] = params.data;
            const name = chartData.categories[params.dataIndex];
            return `
              <div style="font-weight:bold;color:#fbbf24;margin-bottom:4px">${name}</div>
              <table style="font-size:11px;line-height:1.8">
                <tr><td style="color:${textColor}">最大值：</td><td><b style="color:#34d399">¥${max.toLocaleString()}</b></td></tr>
                <tr><td style="color:${textColor}">上四分位：</td><td><b style="color:#22d3ee">¥${q3.toLocaleString()}</b></td></tr>
                <tr><td style="color:${textColor}">中位数：</td><td><b style="color:#a78bfa">¥${median.toLocaleString()}</b></td></tr>
                <tr><td style="color:${textColor}">下四分位：</td><td><b style="color:#22d3ee">¥${q1.toLocaleString()}</b></td></tr>
                <tr><td style="color:${textColor}">最小值：</td><td><b style="color:#f87171">¥${min.toLocaleString()}</b></td></tr>
              </table>
            `;
          }
          if (params.seriesType === 'scatter') {
            const catName = chartData.categories[params.data[0]] || '';
            return `<b style="color:#f87171">${catName}</b><br/>异常值：<b>¥${params.data[1].toLocaleString()}</b>`;
          }
          return '';
        }
      },
      legend: {
        show: false,
        top: 52,
        textStyle: { color: textColor, fontSize: 10 },
        itemStyle: { borderWidth: 0 }
      },
      grid: {
        top: '22%',
        left: '3%',
        right: '5%',
        bottom: '8%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.categories,
        axisLine: { lineStyle: { color: isLight ? '#cbd5e1' : '#475569' } },
        axisLabel: { color: textColor, fontSize: 11, fontWeight: 'bold' },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'value',
        name: '月薪（元）',
        nameTextStyle: { color: textColor, fontSize: 10 },
        axisLabel: {
          color: textColor,
          fontSize: 9,
          formatter: (v: number) => v >= 10000 ? `${(v / 10000).toFixed(1)}w` : `${v}`
        },
        splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' } },
        axisLine: { show: false }
      },
      series: [
        {
          name: '薪资箱线',
          type: 'boxplot',
          // 每条箱线单独着色
          data: chartData.values.map((val, i) => ({
            value: val,
            itemStyle: {
              color: isLight ? COLORS[i] + '44' : COLORS[i] + '28',
              borderColor: COLORS[i],
              borderWidth: 2
            }
          })),
          emphasis: {
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 10,
              shadowColor: 'rgba(34,211,238,0.4)'
            }
          }
        },
        {
          name: '异常值',
          type: 'scatter',
          data: chartData.outliers,
          symbolSize: 7,
          itemStyle: { color: '#f87171', opacity: 0.8 },
          label: { show: false }
        }
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
  }, [theme, chartData.values, chartData.outliers, chartData.categories]);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default SalaryBoxPlot;
