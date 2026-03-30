
import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronRight, Search, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { Page } from '../components/admin/AdminSidebar';
import { useUI } from '../components/ui/UIProvider';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

interface Props {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activePage: Page;
  userRole: 'admin' | 'user' | null;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const AdminHeader: React.FC<Props> = ({ 
  sidebarOpen, 
  toggleSidebar, 
  activePage, 
  userRole, 
  onNavigate,
  onLogout 
}) => {
  const { confirm } = useUI();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    setIsDropdownOpen(false);
    const isConfirmed = await confirm('确定要退出系统吗？', {
      type: 'warning',
      confirmText: '退出登录',
      title: '提示'
    });

    if (isConfirmed) {
      onLogout();
    }
  };

  const handleMenuClick = (page: Page) => {
    setIsDropdownOpen(false);
    onNavigate(page);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm shrink-0">
       <div className="flex items-center gap-4">
          <button 
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
            <span>数据分析与可视化后台</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <span className="font-medium text-gray-900 capitalize">
               {activePage.replace('-', ' ')}
            </span>
          </div>
       </div>

       <div className="flex items-center gap-6">
          <div className="relative hidden sm:block">
             <input 
                type="text" 
                placeholder="全站搜索..." 
                className="pl-4 pr-10 py-1.5 bg-gray-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 rounded-full text-sm transition-all w-48 focus:w-64" 
             />
             <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          
          <button className="relative p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
             <Bell className="w-5 h-5" />
             <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
             <div 
                className="flex items-center gap-3 border-l border-gray-200 pl-6 cursor-pointer group select-none"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
             >
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {userRole === 'admin' ? '系统管理员' : '分析员'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {userRole === 'admin' ? '招聘系统管理角色' : '招聘数据分析角色'}
                    </div>
                </div>
                <div className="relative">
                    <div className={`w-9 h-9 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm transition-all ${isDropdownOpen ? 'ring-2 ring-blue-200' : 'group-hover:ring-2 group-hover:ring-blue-200'}`}>
                        <ImageWithFallback 
                          src={userRole === 'admin' ? "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" : "https://api.dicebear.com/7.x/avataaars/svg?seed=User"} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-gray-100 shadow-sm">
                        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>
             </div>

             {/* Dropdown Menu Body */}
             {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-[fadeIn_0.2s_ease-out] origin-top-right z-50">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{userRole === 'admin' ? 'admin' : 'user'}</p>
                    </div>
                    
                    <button 
                        onClick={() => handleMenuClick('personal-profile')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                    >
                        <User className="w-4 h-4" /> 个人中心
                    </button>
                    
                    <div className="h-px bg-gray-100 my-1"></div>
                    
                    <button 
                        onClick={handleLogoutClick}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                        <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                </div>
             )}
          </div>
       </div>
    </header>
  );
};

export default AdminHeader;
