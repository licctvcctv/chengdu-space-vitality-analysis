import React from 'react';
import { Share2 } from 'lucide-react';
import GeoPanel from '../components/analysis/GeoPanel';
import GraphPanel from '../components/analysis/GraphPanel';
import { MOCK_MAP_DATA, MOCK_GRAPH_DATA } from '../constants';

const AnalysisDeep: React.FC = () => {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center gap-2 mb-2">
         <Share2 className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">深度关联分析</h2>
         <span className="text-sm text-slate-400 ml-2">岗位技能与地域洞察</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <GeoPanel data={MOCK_MAP_DATA} />
        <GraphPanel data={MOCK_GRAPH_DATA} />
      </div>
    </div>
  );
};

export default AnalysisDeep;
