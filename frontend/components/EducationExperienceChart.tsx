import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { CategoryData } from '../types';

interface Props {
  educationData: CategoryData[];
  experienceData: CategoryData[];
}

const COLORS = ['#22d3ee', '#3b82f6', '#8b5cf6', '#f43f5e', '#10b981'];

const MiniBar: React.FC<{ title: string; data: CategoryData[] }> = ({ title, data }) => (
  <div className="h-1/2 min-h-0">
    <div className="text-xs text-slate-400 mb-1">{title}</div>
    <ResponsiveContainer width="100%" height="85%">
      <BarChart data={data} margin={{ top: 8, right: 10, left: 8, bottom: 4 }}>
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#e2e8f0' }}
          formatter={(value: number) => [`${value}%`, '占比']}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const EducationExperienceChart: React.FC<Props> = ({ educationData, experienceData }) => {
  return (
    <div className="w-full h-full flex flex-col gap-2">
      <MiniBar title="学历结构" data={educationData} />
      <MiniBar title="经验结构" data={experienceData} />
    </div>
  );
};

export default EducationExperienceChart;
