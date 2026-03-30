
import React, { useState, useEffect } from 'react';
import { Camera, Save, User, Smartphone, Lock } from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { User as UserType, userStorage } from '../utils/userStorage';
import { resolveSessionUser } from '../utils/sessionUser';

const UserProfile: React.FC = () => {
  const { message } = useUI();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Local form state
  const [formData, setFormData] = useState({
    nickname: '',
    phone: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data on mount
  useEffect(() => {
    const user = resolveSessionUser();
    if (user) {
      setCurrentUser(user);
      setFormData(prev => ({
        ...prev,
        nickname: user.nickname || '',
        phone: user.phone || ''
      }));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      message.error("两次输入的密码不一致");
      return;
    }

    // Construct updated user object
    const updatedUser: UserType = {
      ...currentUser,
      nickname: formData.nickname,
      phone: formData.phone,
      // Only update password if new one is provided
      password: formData.newPassword ? formData.newPassword : currentUser.password
    };

    // 1. Update in the main "database" (localStorage users array)
    try {
      userStorage.updateUser(updatedUser);
      
      // 2. Update the session (localStorage currentUser)
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // 3. Update local state
      setCurrentUser(updatedUser);
      // Clear password fields
      setFormData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
      
      message.success("个人资料保存成功");
      // Optionally emit an event to update Header, or rely on page refresh/context
      // For now, page refresh will show updated data in header, this page updates immediately.
    } catch (err) {
      message.error("保存失败");
    }
  };

  const handleAvatarChange = () => {
    if (!currentUser) return;
    // Mock upload behavior
    const newSeed = Math.random().toString(36).substring(7);
    const newAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`;
    
    const updatedUser = { ...currentUser, avatar: newAvatarUrl };
    
    // Update both storages
    userStorage.updateUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
    
    message.success("头像更新成功");
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-sm text-slate-500">
        未读取到登录用户信息，请重新登录后再进入个人资料页面。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full">
       <div className="flex items-center gap-2 mb-2">
         <User className="w-6 h-6 text-blue-600" />
         <h2 className="text-xl font-bold text-slate-800">个人资料设置</h2>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row gap-12 overflow-y-auto">
        
        {/* Left: Avatar Section */}
        <div className="w-full md:w-1/3 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-8">
            <div className="relative group cursor-pointer" onClick={handleAvatarChange}>
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-slate-50 shadow-md">
                    <ImageWithFallback 
                        src={currentUser.avatar} 
                        alt="Avatar" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="w-8 h-8 text-white" />
                </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 text-center">
                点击上方头像进行更换<br/>
                <span className="text-xs text-slate-400">支持 JPG, PNG 格式，最大 2MB</span>
            </p>
            <div className="mt-8 text-center">
                <h3 className="text-lg font-bold text-slate-800">{currentUser.nickname || currentUser.username}</h3>
                <p className="text-slate-400 text-sm bg-blue-50 text-blue-600 inline-block px-3 py-1 rounded-full mt-2 font-medium">
                    {currentUser.role === 'admin' ? '超级管理员' : '普通用户'}
                </p>
            </div>
        </div>

        {/* Right: Form Section */}
        <div className="flex-1 max-w-2xl">
            <h3 className="text-lg font-medium text-slate-800 mb-6 border-l-4 border-blue-500 pl-3">基本信息</h3>
            <form onSubmit={handleSave} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-400" /> 昵称
                        </label>
                        <input 
                            type="text" 
                            value={formData.nickname}
                            onChange={e => setFormData({...formData, nickname: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-slate-400" /> 手机号码
                        </label>
                        <input 
                            type="text" 
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-6"></div>

                <h3 className="text-lg font-medium text-slate-800 mb-6 border-l-4 border-blue-500 pl-3">安全设置</h3>
                
                <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-400" /> 当前密码
                        </label>
                        <input 
                            type="password" 
                            value={formData.oldPassword}
                            onChange={e => setFormData({...formData, oldPassword: e.target.value})}
                            placeholder="如果不修改密码，请留空"
                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">新密码</label>
                            <input 
                                type="password" 
                                value={formData.newPassword}
                                onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">确认新密码</label>
                            <input 
                                type="password" 
                                value={formData.confirmPassword}
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                className="w-full px-4 py-2 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        type="submit"
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Save className="w-4 h-4" /> 保存修改
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
