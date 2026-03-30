import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { X, Download, Printer, FileText, Loader2, BarChart3, AlertTriangle } from 'lucide-react';
import { ReportItem } from '../../types';
import { useUI } from '../ui/UIProvider';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: ReportItem | null;
}

const ReportPreviewModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const { message } = useUI();
  const pieRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const pieInstance = useRef<echarts.ECharts | null>(null);
  const barInstance = useRef<echarts.ECharts | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !data || !pieRef.current || !barRef.current) return;
    const summary = data.summary;
    if (!summary) return;

    if (!pieInstance.current) pieInstance.current = echarts.init(pieRef.current);
    if (!barInstance.current) barInstance.current = echarts.init(barRef.current);

    pieInstance.current.setOption({
      animation: false,
      color: ['#94a3b8', '#10b981', '#3b82f6', '#8b5cf6', '#f43f5e'],
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, left: 'center', textStyle: { fontSize: 10 } },
      series: [
        {
          type: 'pie',
          radius: ['42%', '66%'],
          center: ['50%', '46%'],
          label: { show: false },
          data: summary.salaryBuckets.map((item) => ({ name: item.range, value: item.ratio }))
        }
      ]
    });

    barInstance.current.setOption({
      animation: false,
      grid: { top: 24, right: 16, bottom: 28, left: 36 },
      xAxis: {
        type: 'category',
        data: summary.cityRanking.map((item) => item.name),
        axisLabel: { fontSize: 10, color: '#64748b' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed' } },
        axisLabel: { fontSize: 10, color: '#64748b' }
      },
      series: [
        {
          type: 'bar',
          data: summary.cityRanking.map((item) => item.value),
          barWidth: 16,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: '#3b82f6'
          }
        }
      ]
    });

    const timer = setTimeout(() => {
      pieInstance.current?.resize();
      barInstance.current?.resize();
    }, 260);

    return () => {
      clearTimeout(timer);
      pieInstance.current?.dispose();
      barInstance.current?.dispose();
      pieInstance.current = null;
      barInstance.current = null;
    };
  }, [isOpen, data]);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-paper');
    if (!element || !data) return;
    setIsDownloading(true);
    message.info('正在生成 PDF，请稍候...');

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.id}.pdf`);
      message.success('PDF 下载成功');
    } catch (error) {
      message.error('PDF 生成失败，请重试');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => window.print();

  if (!isOpen || !data) return null;
  const summary = data.summary;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl h-[90vh] flex flex-col bg-slate-200/50 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>报表预览</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded">
              <Printer className="w-4 h-4" /> 打印
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isDownloading ? '生成中...' : '下载 PDF'}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 flex justify-center">
          <div id="report-paper" className="bg-white w-full max-w-[700px] min-h-[900px] shadow-lg px-12 py-14 text-slate-800 relative">
            <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">招聘市场分析报告</h1>
                <p className="text-slate-500 font-mono text-sm uppercase tracking-wider">Recruitment Intelligence Report</p>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-1">
                <p>报告编号: <span className="font-mono text-slate-900">{data.id}</span></p>
                <p>生成时间: {data.createTime}</p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8">
              <h2 className="text-lg font-bold text-blue-900 mb-1">{data.title}</h2>
              <p className="text-sm text-blue-700">统计周期：<span className="font-mono">{data.timeRange}</span></p>
            </div>

            {summary ? (
              <>
                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 mb-3 text-lg border-b border-gray-100 pb-2">核心指标</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 border border-slate-100 rounded">总岗位数：<strong>{summary.coreMetrics.totalJobs.toLocaleString()}</strong></div>
                    <div className="p-3 border border-slate-100 rounded">新增岗位数：<strong>{summary.coreMetrics.newJobs.toLocaleString()}</strong></div>
                    <div className="p-3 border border-slate-100 rounded">活跃城市：<strong>{summary.coreMetrics.activeCities}</strong></div>
                    <div className="p-3 border border-slate-100 rounded">平均薪资：<strong>{summary.coreMetrics.avgSalaryK}K</strong></div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg border-b border-gray-100 pb-2">图表摘要</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="border border-slate-100 rounded-lg p-3">
                      <div className="text-xs font-bold text-slate-500 mb-2 text-center">薪资区间占比</div>
                      <div ref={pieRef} className="w-full h-32" />
                    </div>
                    <div className="border border-slate-100 rounded-lg p-3">
                      <div className="text-xs font-bold text-slate-500 mb-2 text-center">城市需求排行</div>
                      <div ref={barRef} className="w-full h-32" />
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 mb-3 text-lg border-b border-gray-100 pb-2">城市与行业排行</h3>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <div className="text-xs font-bold text-slate-500 mb-2">城市排行 Top5</div>
                      <div className="space-y-1">
                        {summary.cityRanking.map((item, index) => (
                          <div key={item.name} className="flex justify-between border-b border-slate-100 pb-1">
                            <span>{index + 1}. {item.name}</span>
                            <span className="font-mono text-slate-600">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 mb-2">行业排行 Top5</div>
                      <div className="space-y-1">
                        {summary.industryRanking.map((item, index) => (
                          <div key={item.name} className="flex justify-between border-b border-slate-100 pb-1">
                            <span>{index + 1}. {item.name}</span>
                            <span className="font-mono text-slate-600">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-bold text-slate-800 mb-3 text-lg border-b border-gray-100 pb-2">技能热度变化</h3>
                  <div className="space-y-2 text-sm">
                    {summary.skillHeatChanges.map((item) => (
                      <div key={item.skill} className="flex justify-between border-b border-slate-100 pb-1">
                        <span>{item.skill}</span>
                        <span className="font-mono text-blue-700">+{item.delta}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-10">
                  <h3 className="font-bold text-slate-800 mb-3 text-lg border-b border-gray-100 pb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    风险提示
                  </h3>
                  <div className="space-y-2 text-sm">
                    {summary.riskAlerts.map((item, index) => (
                      <p key={index} className="text-slate-700">- {item}</p>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 py-12 text-center">该报告暂无摘要数据，建议重新生成周报或月报。</div>
            )}

            <div className="border-t-2 border-slate-100 pt-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-700 tracking-widest">JOBINSIGHT REPORT CENTER</span>
              </div>
              <p className="text-xs text-slate-400">Powered by React + ECharts + Recruitment Analytics Service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;
