import React, { useEffect, useState } from 'react';

interface Finding {
  category: string;
  finding: string;
  significance: string;
  recommendation: string;
}

const borderColors = [
  'border-cyan-500', 'border-violet-500', 'border-emerald-500',
  'border-amber-500', 'border-rose-500', 'border-blue-500',
  'border-teal-500', 'border-pink-500'
];

const FindingsList: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);

  useEffect(() => {
    fetch('/api/findings')
      .then(r => r.json())
      .then(setFindings)
      .catch(() => {});
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto space-y-1.5 pr-1 text-xs">
      {findings.map((f, i) => (
        <div
          key={i}
          className={`px-2.5 py-2 rounded border-l-2 ${borderColors[i % borderColors.length]} bg-slate-800/40 hover:bg-slate-800/70 transition-colors`}
        >
          <div className="font-bold text-cyan-200 text-[11px]">{f.category}</div>
          <div className="text-slate-300 mt-0.5 leading-relaxed">{f.finding}</div>
          <div className="text-slate-500 mt-1 italic text-[10px]">
            建议：{f.recommendation}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FindingsList;
