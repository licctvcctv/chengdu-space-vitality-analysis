import React from 'react';
import { GeoPoint } from '../types';

interface Props {
  points: GeoPoint[];
}

const GeoMap: React.FC<Props> = ({ points }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Simplified abstract map background - just a visual representation */}
        <svg viewBox="0 0 100 80" className="w-[90%] h-[90%] opacity-30 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            {/* Rough outline of China for visual context - abstract polygon */}
            <path 
                d="M30,15 L45,10 L60,12 L75,5 L85,15 L90,25 L85,45 L70,55 L65,70 L50,75 L35,65 L20,55 L10,35 L20,20 Z" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="0.5"
                strokeDasharray="2 1"
            />
            
            {/* Grid Lines */}
            <line x1="0" y1="20" x2="100" y2="20" stroke="#1e293b" strokeWidth="0.1" />
            <line x1="0" y1="40" x2="100" y2="40" stroke="#1e293b" strokeWidth="0.1" />
            <line x1="0" y1="60" x2="100" y2="60" stroke="#1e293b" strokeWidth="0.1" />
            <line x1="20" y1="0" x2="20" y2="80" stroke="#1e293b" strokeWidth="0.1" />
            <line x1="40" y1="0" x2="40" y2="80" stroke="#1e293b" strokeWidth="0.1" />
            <line x1="60" y1="0" x2="60" y2="80" stroke="#1e293b" strokeWidth="0.1" />
            <line x1="80" y1="0" x2="80" y2="80" stroke="#1e293b" strokeWidth="0.1" />
        </svg>

        {/* Data Points */}
        <div className="absolute inset-0 w-[90%] h-[90%] m-auto">
            {points.map((point) => (
                <div 
                    key={point.id}
                    className="absolute flex flex-col items-center group cursor-pointer"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                >
                    <div className="relative flex items-center justify-center">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4] animate-ping opacity-75 absolute"></div>
                        <div className="w-2 h-2 bg-white rounded-full relative z-10"></div>
                    </div>
                    <div className="mt-2 text-[10px] text-cyan-200 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none transform translate-y-1">
                        {point.name} <span className="text-yellow-400">{point.value}</span>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Radar Scanner Effect */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-[spin_8s_linear_infinite] w-[120%] h-[120%] -left-[10%] -top-[10%] pointer-events-none bg-[conic-gradient(from_0deg,transparent_0deg,rgba(6,182,212,0.1)_60deg,transparent_60.1deg)]"></div>
    </div>
  );
};

export default GeoMap;