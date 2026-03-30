
import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface Props {
  theme?: 'dark' | 'light';
  data?: Array<{
    name: string;
    value?: number;
    itemStyle?: {
      color?: string;
    };
    children?: Array<{
      name: string;
      value: number;
      itemStyle?: {
        color?: string;
      };
      children?: Array<{
        name: string;
        value: number;
        itemStyle?: {
          color?: string;
        };
      }>;
    }>;
  }>;
}

// 旭日图数据：地区 → 单位类型 → 学历
const SUNBURST_DATA = [
  {
    name: '珠三角',
    itemStyle: { color: '#0284c7' },
    children: [
      {
        name: '参公管理',
        itemStyle: { color: '#0ea5e9' },
        children: [
          { name: '博士', value: 120, itemStyle: { color: '#38bdf8' } },
          { name: '硕士', value: 380, itemStyle: { color: '#7dd3fc' } },
          { name: '本科', value: 860, itemStyle: { color: '#bae6fd' } },
        ]
      },
      {
        name: '公益一类',
        itemStyle: { color: '#0891b2' },
        children: [
          { name: '博士', value: 95, itemStyle: { color: '#22d3ee' } },
          { name: '硕士', value: 420, itemStyle: { color: '#67e8f9' } },
          { name: '本科', value: 1240, itemStyle: { color: '#a5f3fc' } },
          { name: '大专', value: 280, itemStyle: { color: '#cffafe' } },
        ]
      },
      {
        name: '公益二类',
        itemStyle: { color: '#0e7490' },
        children: [
          { name: '硕士', value: 180, itemStyle: { color: '#06b6d4' } },
          { name: '本科', value: 920, itemStyle: { color: '#67e8f9' } },
          { name: '大专', value: 460, itemStyle: { color: '#a5f3fc' } },
        ]
      }
    ]
  },
  {
    name: '粤东',
    itemStyle: { color: '#7c3aed' },
    children: [
      {
        name: '参公管理',
        itemStyle: { color: '#8b5cf6' },
        children: [
          { name: '硕士', value: 85, itemStyle: { color: '#a78bfa' } },
          { name: '本科', value: 320, itemStyle: { color: '#c4b5fd' } },
        ]
      },
      {
        name: '公益一类',
        itemStyle: { color: '#7c3aed' },
        children: [
          { name: '博士', value: 25, itemStyle: { color: '#8b5cf6' } },
          { name: '硕士', value: 140, itemStyle: { color: '#a78bfa' } },
          { name: '本科', value: 480, itemStyle: { color: '#c4b5fd' } },
          { name: '大专', value: 120, itemStyle: { color: '#ddd6fe' } },
        ]
      },
      {
        name: '公益二类',
        itemStyle: { color: '#6d28d9' },
        children: [
          { name: '本科', value: 360, itemStyle: { color: '#8b5cf6' } },
          { name: '大专', value: 200, itemStyle: { color: '#a78bfa' } },
        ]
      }
    ]
  },
  {
    name: '粤西',
    itemStyle: { color: '#059669' },
    children: [
      {
        name: '参公管理',
        itemStyle: { color: '#10b981' },
        children: [
          { name: '硕士', value: 60, itemStyle: { color: '#34d399' } },
          { name: '本科', value: 280, itemStyle: { color: '#6ee7b7' } },
        ]
      },
      {
        name: '公益一类',
        itemStyle: { color: '#059669' },
        children: [
          { name: '硕士', value: 110, itemStyle: { color: '#10b981' } },
          { name: '本科', value: 420, itemStyle: { color: '#34d399' } },
          { name: '大专', value: 160, itemStyle: { color: '#6ee7b7' } },
        ]
      },
      {
        name: '公益二类',
        itemStyle: { color: '#047857' },
        children: [
          { name: '本科', value: 310, itemStyle: { color: '#10b981' } },
          { name: '大专', value: 240, itemStyle: { color: '#34d399' } },
        ]
      }
    ]
  },
  {
    name: '粤北',
    itemStyle: { color: '#b45309' },
    children: [
      {
        name: '参公管理',
        itemStyle: { color: '#d97706' },
        children: [
          { name: '硕士', value: 40, itemStyle: { color: '#f59e0b' } },
          { name: '本科', value: 210, itemStyle: { color: '#fbbf24' } },
        ]
      },
      {
        name: '公益一类',
        itemStyle: { color: '#b45309' },
        children: [
          { name: '硕士', value: 80, itemStyle: { color: '#d97706' } },
          { name: '本科', value: 350, itemStyle: { color: '#f59e0b' } },
          { name: '大专', value: 130, itemStyle: { color: '#fbbf24' } },
        ]
      },
      {
        name: '公益二类',
        itemStyle: { color: '#92400e' },
        children: [
          { name: '本科', value: 270, itemStyle: { color: '#d97706' } },
          { name: '大专', value: 180, itemStyle: { color: '#f59e0b' } },
        ]
      }
    ]
  }
];

const SUNBURST_DATA_DEFAULT = SUNBURST_DATA;
const RecruitmentSunburst: React.FC<Props> = ({ theme = 'dark', data }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const isLight = theme === 'light';
  const chartData = (data && data.length > 0) ? data : SUNBURST_DATA_DEFAULT;

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(el);
    }

    const textColor = isLight ? '#374151' : '#e2e8f0';
    const subTextColor = isLight ? '#64748b' : '#94a3b8';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        text: '地区→单位类型→学历',
        subtext: '招聘结构旭日图',
        textStyle: { color: textColor, fontSize: 12, fontWeight: 'bold' },
        subtextStyle: { color: subTextColor, fontSize: 10 },
        left: 'center',
        top: 4
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.95)',
        borderColor: isLight ? '#e2e8f0' : '#06b6d4',
        textStyle: { color: isLight ? '#1e293b' : '#e2e8f0', fontSize: 11 },
        formatter: (params: any) => {
          const { name, value, treePathInfo } = params;
          if (!value) return name;
          const path = treePathInfo
            .slice(1)
            .map((n: any) => n.name)
            .join(' → ');
          return `
            <div style="font-weight:bold;color:#fbbf24;margin-bottom:3px">${path || name}</div>
            <div>岗位数量：<b style="color:#22d3ee">${value.toLocaleString()} 个</b></div>
          `;
        }
      },
      series: [
        {
          type: 'sunburst',
          data: chartData,
          center: ['50%', '56%'],
          radius: ['15%', '88%'],
          sort: 'desc',
          emphasis: {
            focus: 'ancestor',
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(255,255,255,0.3)'
            }
          },
          label: {
            rotate: 'radial',
            fontSize: 9,
            color: isLight ? '#1e293b' : '#e2e8f0',
            overflow: 'truncate',
            minAngle: 8
          },
          itemStyle: {
            borderColor: isLight ? '#fff' : '#0f172a',
            borderWidth: 1.5,
            borderRadius: 4,
            opacity: 0.9
          },
          levels: [
            {},
            {
              r0: '15%',
              r: '38%',
              label: { align: 'right', fontSize: 11, fontWeight: 'bold' }
            },
            {
              r0: '38%',
              r: '63%',
              label: { align: 'right', fontSize: 10 }
            },
            {
              r0: '63%',
              r: '88%',
              label: { position: 'outside', fontSize: 9, padding: 2 },
              itemStyle: { borderWidth: 3 }
            }
          ]
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
  }, [theme, chartData]);

  return <div ref={chartRef} className="w-full h-full" />;
};

export default RecruitmentSunburst;
