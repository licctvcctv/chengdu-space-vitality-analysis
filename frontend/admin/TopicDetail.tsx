
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  TrendingUp,
  PieChart,
  Share2,
  Activity,
  Download,
  Target,
  Sparkles,
  Loader2
} from 'lucide-react';
import { LoadingState } from '../components/ui/LoadingState';
import TrendChart from '../components/TrendChart';
import SentimentChart from '../components/SentimentChart';
import KnowledgeGraph from '../components/KnowledgeGraph';
import {
  DeepSeekAdvice,
  GraphData,
  ResumeJobMatchResult,
  ResumeProfile,
  SentimentData,
  TrendData
} from '../types';
import { resumeService } from '../api/resumeService';
import { resumeStorage } from '../utils/resumeStorage';
import { useUI } from '../components/ui/UIProvider';

interface Props {
  topic: string;
  onBack: () => void;
}

// === Helper to generate job-specific mock data ===
const generateMockData = (topicName: string) => {
  // 1. Demand Trend
  const trend: TrendData[] = Array.from({ length: 24 }, (_, i) => {
    const baseHeat = 7000 + Math.random() * 3000;
    const timeBonus = i > 11 && i < 17 ? 4000 : 0;
    return {
      time: `${String(i).padStart(2, '0')}:00`,
      heat: Math.floor(baseHeat + timeBonus),
      forecast: null
    };
  });

  // 2. Salary Distribution
  const sentiment: SentimentData[] = [
    { name: '10-20K', value: Math.floor(Math.random() * 20 + 20), itemStyle: { color: '#10b981' } },
    { name: '20-35K', value: Math.floor(Math.random() * 20 + 35), itemStyle: { color: '#3b82f6' } },
    { name: '35K+', value: Math.floor(Math.random() * 20 + 20), itemStyle: { color: '#ef4444' } }
  ];

  // 3. Skill Graph
  const nodes = [
    { id: '0', name: topicName, symbolSize: 90, value: 100, category: 0 },
    { id: '1', name: 'JavaScript', symbolSize: 60, value: 95, category: 1 },
    { id: '2', name: 'TypeScript', symbolSize: 55, value: 88, category: 1 },
    { id: '3', name: 'React', symbolSize: 50, value: 80, category: 2 },
    { id: '4', name: 'Node.js', symbolSize: 45, value: 75, category: 2 },
    { id: '5', name: 'MySQL', symbolSize: 45, value: 72, category: 3 },
    { id: '6', name: 'Redis', symbolSize: 40, value: 68, category: 3 },
    { id: '7', name: 'Docker', symbolSize: 38, value: 60, category: 3 },
    { id: '8', name: 'Kubernetes', symbolSize: 36, value: 58, category: 3 },
    { id: '9', name: 'CI/CD', symbolSize: 35, value: 52, category: 2 }
  ];

  const links = [
    { source: '0', target: '1' },
    { source: '0', target: '2' },
    { source: '0', target: '4' },
    { source: '0', target: '9' },
    { source: '1', target: '3' },
    { source: '2', target: '5' },
    { source: '4', target: '6' },
    { source: '4', target: '7' },
    { source: '6', target: '8' },
  ];

  const categories = [
    { name: '目标岗位' },
    { name: '核心语言' },
    { name: '工程框架' },
    { name: '数据与云工具' }
  ];

  return { trend, sentiment, graph: { nodes, links, categories } };
};

const TopicDetail: React.FC<Props> = ({ topic, onBack }) => {
  const { message } = useUI();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    trend: TrendData[];
    sentiment: SentimentData[];
    graph: GraphData;
  } | null>(null);
  const [resumeProfile, setResumeProfile] = useState<ResumeProfile | null>(() => resumeStorage.getLatest());
  const [skillMatchResult, setSkillMatchResult] = useState<ResumeJobMatchResult | null>(null);
  const [deepSeekAdvice, setDeepSeekAdvice] = useState<DeepSeekAdvice | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setDeepSeekAdvice(null);
    // Simulate API fetch based on topic name
    const timer = setTimeout(() => {
      setData(generateMockData(topic || "未知岗位"));
      setLoading(false);
    }, 800);
    setResumeProfile(resumeStorage.getLatest());
    return () => clearTimeout(timer);
  }, [topic]);

  useEffect(() => {
    if (!resumeProfile) {
      setSkillMatchResult(null);
      return;
    }

    let canceled = false;
    const currentTopic = topic || '未知岗位';
    const requiredSkills = resumeService.getRequiredSkillsByJob(currentTopic);

    resumeService
      .matchResumeToJob(resumeProfile, currentTopic, requiredSkills)
      .then((result) => {
        if (!canceled) {
          setSkillMatchResult(result);
        }
      })
      .catch(() => {
        if (!canceled) {
          setSkillMatchResult(null);
        }
      });

    return () => {
      canceled = true;
    };
  }, [topic, resumeProfile]);

  const handleGenerateAdvice = async () => {
    if (!resumeProfile || !skillMatchResult) {
      message.warning('请先在个人中心完成简历解析，再查看岗位匹配建议');
      return;
    }

    setAdviceLoading(true);
    try {
      const topHeat = (data?.trend || [])
        .filter((item) => typeof item.heat === 'number')
        .sort((a, b) => (b.heat || 0) - (a.heat || 0))[0];

      const advice = await resumeService.generateDeepSeekAdvice({
        jobTitle: skillMatchResult.jobTitle,
        resumeSkills: resumeProfile.extractedSkills,
        missingSkills: skillMatchResult.missingSkills,
        marketSignals: [
          `${skillMatchResult.jobTitle} 在重点城市需求持续活跃`,
          topHeat ? `需求峰值时段出现在 ${topHeat.time}` : '需求峰值时段处于白天工作时段',
          '岗位描述对工程化与业务协同能力要求提升'
        ]
      });
      setDeepSeekAdvice(advice);
      message.success('DeepSeek 岗位进修建议生成成功');
    } catch (error) {
      message.error('DeepSeek 分析失败，请稍后重试');
    } finally {
      setAdviceLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* === 1. Header === */}
      <div className="bg-white px-6 py-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors group"
              title="返回上一页"
            >
               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
               <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  岗位深度洞察：
                  <span className="text-blue-600 underline decoration-blue-200 underline-offset-4">{topic}</span>
               </h1>
               <p className="text-xs text-slate-500 mt-1">
                  监测ID: {Math.abs(topic.split('').reduce((a,b)=>a+(b.charCodeAt(0)),0)) * 133} · 实时招聘数据同步中
               </p>
            </div>
         </div>
         
         <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded shadow transition-all">
            <Download className="w-4 h-4" /> 导出岗位报告
         </button>
      </div>

      {/* === 2. Charts Layout === */}
      <div className="flex-1 flex flex-col gap-6 min-h-0 overflow-y-auto pb-4">
          
          {/* Row 1: Trend & Sentiment */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px] shrink-0">
              
              {/* Left: 24h Trend Chart */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-slate-800 text-sm">24小时需求趋势追踪</h3>
                  </div>
                  <div className="flex-1 p-4 min-h-0">
                      <LoadingState loading={loading} data={data?.trend} theme="light">
                          <TrendChart data={data?.trend || []} />
                      </LoadingState>
                  </div>
              </div>

              {/* Right: Sentiment Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                      <PieChart className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-slate-800 text-sm">薪资区间分布</h3>
                  </div>
                  <div className="flex-1 p-4 min-h-0 relative">
                      <LoadingState loading={loading} data={data?.sentiment} theme="light">
                          <SentimentChart data={data?.sentiment || []} />
                      </LoadingState>
                      {!loading && (
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">基于岗位薪资聚类分析</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Target className="w-5 h-5 text-violet-600" />
                      简历技能匹配（岗位需求 vs 个人能力）
                  </h3>
                  <button
                      onClick={handleGenerateAdvice}
                      disabled={adviceLoading || !skillMatchResult}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded flex items-center gap-1 disabled:opacity-60"
                  >
                      {adviceLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {adviceLoading ? '分析中...' : 'DeepSeek 进修建议'}
                  </button>
              </div>

              {!resumeProfile && (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      暂未检测到已上传简历。请前往「个人中心 → AI简历诊断」上传简历并完成技能解析后，再查看岗位匹配结果。
                  </div>
              )}

              {resumeProfile && skillMatchResult && (
                  <>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          <div className="rounded border border-emerald-200 bg-emerald-50 p-3">
                              <div className="text-xs text-emerald-700 mb-1">匹配度评分</div>
                              <div className="text-2xl font-bold text-emerald-700">{skillMatchResult.matchScore}%</div>
                          </div>
                          <div className="rounded border border-blue-200 bg-blue-50 p-3">
                              <div className="text-xs text-blue-700 mb-1">已覆盖技能</div>
                              <div className="text-sm text-blue-700 leading-relaxed">
                                  {skillMatchResult.matchedSkills.join('、') || '暂无'}
                              </div>
                          </div>
                          <div className="rounded border border-amber-200 bg-amber-50 p-3">
                              <div className="text-xs text-amber-700 mb-1">待补齐技能</div>
                              <div className="text-sm text-amber-700 leading-relaxed">
                                  {skillMatchResult.missingSkills.join('、') || '暂无'}
                              </div>
                          </div>
                      </div>

                      {deepSeekAdvice && (
                          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                              <div className="text-sm font-bold text-blue-900 mb-1">DeepSeek 结论</div>
                              <p className="text-sm text-blue-800 leading-relaxed mb-3">{deepSeekAdvice.summary}</p>
                              <div className="space-y-1">
                                  {deepSeekAdvice.gapSkills.slice(0, 3).map((item) => (
                                      <div key={item.skill} className="text-xs text-blue-700">
                                          - <span className="font-semibold">{item.skill}</span>：{item.action}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </>
              )}
          </div>

          {/* Row 2: Propagation Graph */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col h-[500px] shrink-0">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-purple-600" />
                      <h3 className="font-bold text-slate-800 text-sm">核心技能路径与关键节点</h3>
                  </div>
                  <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 目标岗位
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span> 核心语言
                      </span>
                      <span className="flex items-center gap-1 text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 工程框架
                      </span>
                  </div>
              </div>
              <div className="flex-1 p-4 min-h-0">
                  <LoadingState loading={loading} data={data?.graph} theme="light">
                      <KnowledgeGraph data={data?.graph!} theme="light" />
                  </LoadingState>
              </div>
          </div>

          {/* AI Insight Footer */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3 shrink-0">
              <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                  <h4 className="font-bold text-blue-900 text-sm mb-1">AI 综合洞察结论</h4>
                  <p className="text-sm text-blue-800 leading-relaxed">
                      岗位 <strong className="font-bold">{topic}</strong> 当前需求持续活跃，
                      技能图谱显示该岗位对 <strong className="font-bold">工程化能力与数据能力</strong> 同时要求较高。
                      建议在招聘投放时重点突出技术成长路径，并持续监控薪资异常与候选人供给变化。
                  </p>
              </div>
          </div>

      </div>
    </div>
  );
};

export default TopicDetail;
