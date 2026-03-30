import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon: Icon, children, className = '' }) => {
  return (
    <div className={`tech-border flex flex-col p-4 rounded-lg overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 mb-3 border-b border-slate-700/50 pb-2">
        {Icon && <Icon className="w-5 h-5 text-cyan-400" />}
        <h2 className="text-lg font-bold text-cyan-100 tracking-wide uppercase">{title}</h2>
        <div className="flex-1" />
        <div className="flex gap-1">
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-cyan-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;