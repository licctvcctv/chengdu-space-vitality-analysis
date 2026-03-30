import React, { useEffect, useRef, useState } from 'react';
import { HotSearchItem } from '../types';
import { Flame, Zap } from 'lucide-react';

interface Props {
  data: HotSearchItem[];
}

const HotSearchList: React.FC<Props> = ({ data }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const maxHeat = Math.max(...data.map((item) => item.heat), 1);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let scrollAmount = 0;
    const speed = 0.5;
    let animationId: number;

    const scroll = () => {
      if (!isPaused && el) {
        scrollAmount += speed;
        if (scrollAmount >= el.scrollHeight - el.clientHeight) {
          scrollAmount = 0;
        }
        el.scrollTop = scrollAmount;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [data, isPaused]);

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 2:
        return 'bg-slate-300/20 text-slate-200 border-slate-300/50';
      case 3:
        return 'bg-amber-700/20 text-amber-500 border-amber-700/50';
      default:
        return 'text-slate-500 bg-slate-800/30 border-transparent';
    }
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="grid grid-cols-12 gap-2 text-[11px] text-slate-400 mb-2 px-2 shrink-0">
        <div className="col-span-1 text-center">排</div>
        <div className="col-span-3">岗位</div>
        <div className="col-span-2">公司</div>
        <div className="col-span-2 text-center">城市</div>
        <div className="col-span-2 text-right">薪资</div>
        <div className="col-span-2 text-right">热度</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-hidden relative space-y-2 pr-2">
        {data.map((item) => (
          <div
            key={item.id}
            className={`group grid grid-cols-12 gap-2 items-center p-2 rounded transition-all border ${
              item.rank <= 3 ? 'bg-slate-800/50' : 'bg-slate-800/20 hover:bg-slate-700/50'
            }`}
          >
            <div className="col-span-1 flex justify-center">
              <span
                className={`
                  flex items-center justify-center w-6 h-6 rounded font-mono font-bold text-sm border
                  ${getRankStyles(item.rank)}
                `}
              >
                {item.rank}
              </span>
            </div>

            <div className="col-span-3 flex items-center gap-1.5 truncate">
              <span className={`text-xs truncate font-medium ${item.rank <= 3 ? 'text-white' : 'text-slate-300 group-hover:text-cyan-300'}`}>
                {item.keyword}
              </span>
              {item.tag === 'boiling' && <Flame className="w-3 h-3 text-red-500 shrink-0 animate-pulse" />}
              {item.tag === 'hot' && <Zap className="w-3 h-3 text-orange-500 shrink-0" />}
              {item.tag === 'new' && <span className="text-[9px] px-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">新</span>}
              {item.tag === 'urgent' && <span className="text-[9px] px-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">急</span>}
            </div>

            <div className="col-span-2 text-xs text-slate-300 truncate">{item.company || '-'}</div>
            <div className="col-span-2 text-center text-xs text-slate-400 truncate">{item.city || '-'}</div>
            <div className="col-span-2 text-right font-mono text-xs text-green-400">{item.salary || '-'}</div>
            <div className="col-span-2 text-right">
              <div className="font-mono text-xs text-cyan-300">{item.heat.toLocaleString()}</div>
              <div className="mt-1 h-1 bg-slate-800 rounded overflow-hidden">
                <div
                  className="h-full rounded bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${Math.max(8, (item.heat / maxHeat) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default HotSearchList;
