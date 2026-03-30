
import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { 
  Server, Cpu, Activity, Zap, 
  CheckCircle, XCircle, Clock, Database,
  ArrowUp, ArrowDown
} from 'lucide-react';

// === Components ===

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-500 font-medium mb-1">{title}</p>
      <div className="text-2xl font-bold text-slate-800 font-mono">{value}</div>
      {subValue && (
        <div className={`text-xs mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
          {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : trend === 'down' ? <ArrowDown className="w-3 h-3" /> : null}
          {subValue}
        </div>
      )}
    </div>
    <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

// === Charts ===

const ClusterCpuChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    // Initial Data
    const generateData = () => {
      let now = new Date();
      let res = [];
      let len = 20;
      while (len--) {
        res.unshift(now.toLocaleTimeString().replace(/^\D*/, ''));
        now = new Date(now.getTime() - 2000);
      }
      return res;
    };
    
    const categories = generateData();
    const data1 = Array.from({length: 20}, () => Math.floor(Math.random() * 30 + 40));
    const data2 = Array.from({length: 20}, () => Math.floor(Math.random() * 30 + 30));
    const data3 = Array.from({length: 20}, () => Math.floor(Math.random() * 40 + 50));

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'line' }
      },
      legend: {
        data: ['Worker-01', 'Worker-02', 'Worker-03'],
        bottom: 0,
        icon: 'circle'
      },
      grid: {
        top: '10%',
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: categories,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        max: 100,
        name: 'CPU (%)',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      series: [
        {
          name: 'Worker-01',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: data1,
          lineStyle: { color: '#3b82f6', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' }
            ])
          }
        },
        {
          name: 'Worker-02',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: data2,
          lineStyle: { color: '#06b6d4', width: 2 }
        },
        {
          name: 'Worker-03',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: data3,
          lineStyle: { color: '#8b5cf6', width: 2 }
        }
      ]
    };

    let initRetryTimer: ReturnType<typeof setTimeout> | null = null;

    const initChart = () => {
      if (!chartRef.current) return false;
      const dom = chartRef.current;
      if (dom.clientWidth === 0 || dom.clientHeight === 0) return false;
      if (chartInstance.current?.isDisposed?.()) {
        chartInstance.current = null;
      }
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(dom);
      }
      chartInstance.current.setOption(option, true);
      return true;
    };

    const ensureChartReady = () => {
      if (initChart()) return;
      initRetryTimer = setTimeout(ensureChartReady, 120);
    };

    ensureChartReady();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width === 0 || entry.contentRect.height === 0) continue;
        if (!chartInstance.current || chartInstance.current.isDisposed?.()) {
          initChart();
          continue;
        }
        chartInstance.current.resize();
      }
    });
    resizeObserver.observe(el);

    const resizeTimer = setTimeout(() => {
      if (!chartInstance.current || chartInstance.current.isDisposed?.()) {
        initChart();
        return;
      }
      chartInstance.current.resize();
    }, 200);

    // Simulation Interval
    const interval = setInterval(() => {
      if (!chartInstance.current || chartInstance.current.isDisposed?.()) return;

      const axisData = (new Date()).toLocaleTimeString().replace(/^\D*/, '');
      
      const updateSeries = (seriesIndex: number, min: number, max: number) => {
          const oldData = (option.series[seriesIndex] as any).data;
          oldData.shift();
          oldData.push(Math.floor(Math.random() * (max - min) + min));
      };

      (option.xAxis as any).data.shift();
      (option.xAxis as any).data.push(axisData);
      
      updateSeries(0, 40, 70);
      updateSeries(1, 30, 60);
      updateSeries(2, 50, 90);

      chartInstance.current.setOption({
        xAxis: { data: (option.xAxis as any).data },
        series: option.series
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(resizeTimer);
      if (initRetryTimer) clearTimeout(initRetryTimer);
      resizeObserver.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return <div ref={chartRef} className="w-full h-full" />;
};

const BatchDurationChart: React.FC = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;

    const data = Array.from({length: 15}, () => Math.floor(Math.random() * 500 + 200)); // ms

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b0}: {c0} ms'
      },
      grid: {
        top: '15%',
        left: '3%',
        right: '4%',
        bottom: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: Array.from({length: 15}, (_, i) => `Batch-${i}`),
        axisTick: { alignWithLabel: true },
        axisLabel: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'Duration (ms)',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      series: [
        {
          name: 'Processing Time',
          type: 'bar',
          barWidth: '60%',
          data: data,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#fbbf24' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          markLine: {
            data: [{ type: 'average', name: 'Avg' }],
            lineStyle: { color: '#94a3b8' }
          }
        }
      ]
    };

    let initRetryTimer: ReturnType<typeof setTimeout> | null = null;

    const initChart = () => {
      if (!chartRef.current) return false;
      const dom = chartRef.current;
      if (dom.clientWidth === 0 || dom.clientHeight === 0) return false;
      if (chartInstance.current?.isDisposed?.()) {
        chartInstance.current = null;
      }
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(dom);
      }
      chartInstance.current.setOption(option, true);
      return true;
    };

    const ensureChartReady = () => {
      if (initChart()) return;
      initRetryTimer = setTimeout(ensureChartReady, 120);
    };

    ensureChartReady();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width === 0 || entry.contentRect.height === 0) continue;
        if (!chartInstance.current || chartInstance.current.isDisposed?.()) {
          initChart();
          continue;
        }
        chartInstance.current.resize();
      }
    });
    resizeObserver.observe(el);

    const resizeTimer = setTimeout(() => {
      if (!chartInstance.current || chartInstance.current.isDisposed?.()) {
        initChart();
        return;
      }
      chartInstance.current.resize();
    }, 200);

    const interval = setInterval(() => {
        if (!chartInstance.current || chartInstance.current.isDisposed?.()) return;

        const newData = (option.series[0] as any).data;
        newData.shift();
        newData.push(Math.floor(Math.random() * 500 + 200));
        chartInstance.current.setOption({
            series: [{ data: newData }]
        });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(resizeTimer);
      if (initRetryTimer) clearTimeout(initRetryTimer);
      resizeObserver.disconnect();
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  return <div ref={chartRef} className="w-full h-full" />;
};

// === Mock Data Table ===
const TASKS = [
    { id: 'collect-20260212001', duration: '450ms', throughput: '15MB/s', status: 'success', time: '10:01:23' },
    { id: 'collect-20260212002', duration: '520ms', throughput: '12MB/s', status: 'success', time: '10:01:25' },
    { id: 'collect-20260212003', duration: '2100ms', throughput: '2MB/s', status: 'fail', time: '10:01:28' },
    { id: 'collect-20260212004', duration: '410ms', throughput: '16MB/s', status: 'success', time: '10:01:30' },
    { id: 'collect-20260212005', duration: '390ms', throughput: '18MB/s', status: 'success', time: '10:01:32' },
];

// === Main Page ===

const SystemMonitor: React.FC = () => {
  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
         <Activity className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">采集任务监控</h2>
         <span className="text-sm text-slate-400 font-mono ml-2">Scheduler: collector://cluster-node-01</span>
      </div>

      {/* 1. Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
            title="采集节点数 (Nodes)" 
            value="3" 
            subValue="Status: Healthy"
            trend="up"
            icon={Server} 
            colorClass="bg-blue-500" 
         />
         <StatCard 
            title="运行中采集任务" 
            value="2" 
            subValue="Queue: 0"
            icon={Zap} 
            colorClass="bg-yellow-500" 
         />
         <StatCard 
            title="数据入湖速率 (Rate)" 
            value="1.2k/s" 
            subValue="Records Processed"
            trend="up"
            icon={Activity} 
            colorClass="bg-green-500" 
         />
         <StatCard 
            title="缓存占用 (Memory)" 
            value="78%" 
            subValue="98GB / 128GB"
            trend="down" // High usage warning
            icon={Database} 
            colorClass="bg-purple-500" 
         />
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[320px]">
          {/* Node Resources */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" /> 采集节点资源占用 (CPU Load)
                  </h3>
                  <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-xs text-slate-400">Live</span>
                  </div>
              </div>
              <div className="flex-1 min-h-0">
                  <ClusterCpuChart />
              </div>
          </div>

          {/* Batch Processing */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" /> 采集批处理延迟
                  </h3>
                  <span className="text-xs text-slate-400">Batch Interval: 2s</span>
              </div>
              <div className="flex-1 min-h-0">
                  <BatchDurationChart />
              </div>
          </div>
      </div>

      {/* 3. Task Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[200px]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700 text-sm">最近完成的采集任务</h3>
          </div>
          <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                      <tr>
                          <th className="px-6 py-3 border-b border-slate-100">任务 ID</th>
                          <th className="px-6 py-3 border-b border-slate-100">完成时间</th>
                          <th className="px-6 py-3 border-b border-slate-100">处理时长</th>
                          <th className="px-6 py-3 border-b border-slate-100">吞吐量</th>
                          <th className="px-6 py-3 border-b border-slate-100">状态</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {TASKS.map(task => (
                          <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 font-mono text-slate-600">{task.id}</td>
                              <td className="px-6 py-3 text-slate-500">{task.time}</td>
                              <td className="px-6 py-3 font-medium text-slate-700">{task.duration}</td>
                              <td className="px-6 py-3 text-slate-600">{task.throughput}</td>
                              <td className="px-6 py-3">
                                  <span className={`flex items-center gap-1.5 font-medium text-xs px-2 py-0.5 rounded-full w-fit ${
                                      task.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                      {task.status === 'success' ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                                      {task.status.toUpperCase()}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
