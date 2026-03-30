
import React from 'react';
import { Loader2, Database } from 'lucide-react';

interface Props {
  loading: boolean;
  data?: any; // Check if data is empty (if array) or null
  children: React.ReactNode;
  className?: string;
  theme?: 'dark' | 'light'; // Default light
}

export const LoadingState: React.FC<Props> = ({ 
  loading, 
  data, 
  children, 
  className = "w-full h-full",
  theme = 'light'
}) => {
  const isDark = theme === 'dark';
  
  // Logic to determine if data is "empty"
  const isEmpty = !loading && data !== undefined && (
    data === null || 
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && Object.keys(data).length === 0)
  );

  if (loading) {
    return (
      <div className={`relative flex items-center justify-center rounded-lg min-h-[100%] animate-[fadeIn_0.3s] ${className}`}>
        {/* Loading Overlay */}
        <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center ${isDark ? 'bg-slate-900/50' : 'bg-white/60'} backdrop-blur-[1px] rounded-lg`}>
           <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-500' : 'text-blue-500'}`} />
           <span className={`text-xs font-medium mt-2 ${isDark ? 'text-cyan-400/70' : 'text-slate-400'}`}>Loading...</span>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-lg min-h-[100%] ${className} ${isDark ? 'bg-slate-800/20 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
         <Database className="w-10 h-10 mb-2 opacity-20" />
         <span className="text-sm">暂无数据</span>
      </div>
    );
  }

  return <>{children}</>;
};
