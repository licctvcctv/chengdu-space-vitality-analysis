
import React, { useEffect, useState } from 'react';
import { Share2, Network, Zap, GitCommit } from 'lucide-react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import { analysisService } from '../api/analysisService';
import { GraphData, GraphNode } from '../types';
import { LoadingState } from '../components/ui/LoadingState';

/**
 * AnalysisRelation (岗位关联分析页面)
 *
 * @description
 * 招聘洞察模块核心页面。
 * 通过力导向图展示事业单位岗位体系与能力要求之间的关联关系。
 * 侧边栏提供核心岗位节点 Top 榜单，辅助政策制定与编制规划。
 */
const AnalysisRelation: React.FC = () => {
  const [data, setData] = useState<GraphData | null>(null);
  const [sortedNodes, setSortedNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await analysisService.getRelationGraph();
        setData(result);
        // 按权重排序节点，用于右侧榜单
        setSortedNodes([...result.nodes].sort((a, b) => b.value - a.value));
      } catch (error) {
        console.error("Failed to fetch relation data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryColor = (catIndex: number) => {
    switch(catIndex) {
      case 0: return 'text-rose-600 bg-rose-50 border-rose-200';
      case 1: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2: return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <Share2 className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">岗位关联分析</h2>
         <span className="text-sm text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded ml-2">Knowledge Graph</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Main Graph (70%) */}
        <div className="lg:flex-[3] bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                 <Network className="w-4 h-4 text-blue-500" /> 事业单位岗位关联网络
              </h3>
              <div className="flex gap-3 text-xs">
                  {!loading && data && data.categories.map((cat, i) => (
                      <span key={i} className="flex items-center gap-1.5 text-slate-600">
                          <span className={`w-2 h-2 rounded-full ${i===0?'bg-rose-500':i===1?'bg-yellow-500':'bg-blue-500'}`}></span>
                          {cat.name}
                      </span>
                  ))}
              </div>
           </div>
           <div className="flex-1 min-h-[400px] relative p-4">
              <LoadingState loading={loading} data={data}>
                  <KnowledgeGraph data={data!} theme="light" />
              </LoadingState>
           </div>
        </div>

        {/* Side List (30%) */}
        <div className="lg:flex-[1] bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col overflow-hidden">
           <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
                 <Zap className="w-4 h-4 text-amber-500" /> 核心岗位节点 TOP 榜
              </h3>
           </div>
           <div className="flex-1 overflow-y-auto p-2">
              <LoadingState loading={loading} data={sortedNodes}>
                  <table className="w-full text-left text-sm border-collapse">
                      <thead className="text-xs text-slate-400 font-medium bg-white sticky top-0">
                          <tr>
                              <th className="px-3 py-2">排名</th>
                              <th className="px-3 py-2">岗位节点</th>
                              <th className="px-3 py-2 text-right">招聘强度</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                          {sortedNodes.map((node, index) => (
                              <tr key={node.id} className="hover:bg-slate-50 transition-colors group cursor-default">
                                  <td className="px-3 py-3">
                                      <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${index < 3 ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                          {index + 1}
                                      </span>
                                  </td>
                                  <td className="px-3 py-3">
                                      <div className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{node.name}</div>
                                      <div className={`text-[10px] mt-0.5 px-1.5 py-0.5 rounded border inline-block ${getCategoryColor(node.category)}`}>
                                        {data?.categories[node.category]?.name || '未知'}
                                      </div>
                                  </td>
                                  <td className="px-3 py-3 text-right">
                                      <span className="font-mono font-bold text-slate-600">{node.value}</span>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </LoadingState>
           </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisRelation;
