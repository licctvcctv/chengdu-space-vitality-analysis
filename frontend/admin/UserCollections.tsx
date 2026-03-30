
import React, { useState, useEffect } from 'react';
import { Bookmark, Activity, Trash2, Calendar, MessageSquare, ArrowRight, TrendingUp } from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';
import { collectionStorage, CollectionItem } from '../utils/collectionStorage';

interface Props {
  onViewDetail?: (topic: string) => void;
}

const UserCollections: React.FC<Props> = ({ onViewDetail }) => {
  const { message, confirm } = useUI();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load collections from localStorage using the correct key
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
            const data = collectionStorage.getUserCollections(user.id);
            setCollections(data);
        }
      } catch (e) {
        console.error("Failed to load user info", e);
      }
    }
    setLoading(false);
  }, []);

  const handleRemove = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent card click event
    const isConfirmed = await confirm('确定要取消收藏该岗位吗？', { type: 'warning', confirmText: '取消收藏' });
    if (isConfirmed) {
        collectionStorage.removeCollection(id);
        setCollections(collections.filter(c => c.id !== id));
        message.success("已取消收藏");
    }
  };

  const handleView = (topic: string) => {
    if (onViewDetail) {
      onViewDetail(topic);
    } else {
      message.error("无法跳转：导航未配置");
    }
  };

  if (loading) return null;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-2 mb-2">
         <Bookmark className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">我的岗位收藏</h2>
         <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-bold font-mono">{collections.length}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-8 pr-2 min-h-0">
        {collections.map(item => (
            <div 
                key={item.id} 
                onClick={() => handleView(item.title)}
                className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col overflow-hidden h-fit"
            >
                {/* Decoration Gradient */}
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4 gap-3">
                        <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                            {item.title}
                        </h3>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="bg-orange-50 text-orange-600 text-xs px-2 py-1 rounded-md font-mono font-bold border border-orange-100 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                {(item.heat / 10000).toFixed(1)}w
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        {item.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                                #{tag}
                            </span>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>收藏于 {item.collectTime.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg text-slate-600 border border-slate-100/50">
                            <MessageSquare className="w-3.5 h-3.5 mt-1 shrink-0 text-slate-400" />
                            <span className="line-clamp-2 text-xs leading-relaxed italic">{item.note || '暂无备注说明...'}</span>
                        </div>
                    </div>
                </div>
                
                {/* Bottom Action Area */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-slate-50 transition-colors">
                    <button 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm shadow-blue-200 group-hover:shadow-md transition-all active:scale-95"
                    >
                        <Activity className="w-4 h-4" /> 
                        深度研判
                        <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </button>
                    
                    <button 
                         onClick={(e) => handleRemove(e, item.id)}
                         className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                         title="取消收藏"
                    >
                        <Trash2 className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>
        ))}

        {collections.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-300 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                    <Bookmark className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-lg font-medium text-slate-500">暂无收藏岗位</p>
                <p className="text-sm mt-1">请在「数据治理 → 招聘数据管理」中添加关注</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default UserCollections;
