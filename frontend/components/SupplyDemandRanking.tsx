import React from 'react';
import { CityDemandRatio } from '../types';

interface Props {
  data: CityDemandRatio[];
}

const getRiskClass = (ratio: number) => {
  if (ratio >= 1.9) return 'text-red-300 border-red-500/40 bg-red-500/10';
  if (ratio >= 1.75) return 'text-amber-300 border-amber-500/40 bg-amber-500/10';
  return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10';
};

const SupplyDemandRanking: React.FC<Props> = ({ data }) => {
  const sorted = [...data].sort((a, b) => b.ratio - a.ratio).slice(0, 5);
  const maxRatio = sorted.length > 0 ? sorted[0].ratio : 1;

  return (
    <div className="h-full flex flex-col">
      <div className="text-[11px] text-slate-400 mb-2 px-1">城市供需比越高，招聘竞争越激烈</div>
      <div className="space-y-2.5 overflow-y-auto pr-1">
        {sorted.map((item, index) => {
          const width = `${Math.max(12, (item.ratio / maxRatio) * 100)}%`;
          return (
            <div key={item.city} className="rounded border border-slate-700/60 bg-slate-900/40 p-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center ${
                      index < 3 ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-100 font-semibold">{item.city}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] border font-mono ${getRiskClass(item.ratio)}`}>
                  {item.ratio.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 rounded" style={{ width }} />
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex justify-between">
                <span>需求 {item.demand.toLocaleString()}</span>
                <span>供给 {item.talentSupply.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SupplyDemandRanking;
