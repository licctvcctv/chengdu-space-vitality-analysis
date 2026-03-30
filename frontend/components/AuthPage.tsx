import React from 'react';
import { User, Lock, Eye, EyeOff, Shield, RefreshCw, Zap, Bug, Phone, ArrowLeft } from 'lucide-react';
import ParticleBackground from './ParticleBackground';
import { useAuthLogic } from '../hooks/useAuthLogic';

interface Props {
  onLogin: (role: 'user' | 'admin') => void;
}

const AuthPage: React.FC<Props> = ({ onLogin }) => {
  const {
    isLoginView,
    setIsLoginView,
    loading,
    showPwd,
    setShowPwd,
    formData,
    captchaCode,
    generateCaptcha,
    resetForm,
    handleInputChange,
    handleLogin,
    handleRegister,
    devQuickFill
  } = useAuthLogic({ onLoginSuccess: onLogin });

  const inputStyle = "w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-sm text-black font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all placeholder:text-slate-400 placeholder:font-normal";

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020617] flex items-center justify-center font-sans">
      <ParticleBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-900/80 to-black/90 pointer-events-none"></div>

      <div className="relative z-10 w-[400px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden flex flex-col transition-all duration-500">
        
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"></div>

        <div className="p-8 pb-6">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {isLoginView ? '成都城市公共休闲空间活力分析系统' : '新用户注册'}
                </h1>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">
                  {isLoginView ? 'GD Institution Job Data Analysis & Visualization Platform' : 'Create Your Account'}
                </p>
            </div>

            <form onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-4">
                
                {/* Username */}
                <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="用户名 / 账号" 
                        value={formData.username}
                        onChange={e => handleInputChange('username', e.target.value)}
                        className={inputStyle}
                    />
                </div>

                {/* Password */}
                <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type={showPwd ? "text" : "password"} 
                        placeholder="密码" 
                        value={formData.password}
                        onChange={e => handleInputChange('password', e.target.value)}
                        className={inputStyle}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>

                {/* Register Extra Fields */}
                {!isLoginView && (
                  <div className="animate-[fadeIn_0.3s_ease-out] space-y-4">
                      <div className="relative group">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          <input 
                              type="text" 
                              placeholder="手机号码" 
                              value={formData.phone}
                              onChange={e => handleInputChange('phone', e.target.value)}
                              className={inputStyle}
                          />
                      </div>
                  </div>
                )}

                {/* Captcha (Login Only) */}
                {isLoginView && (
                  <div className="flex gap-3">
                      <div className="relative group flex-1">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          <input 
                              type="text" 
                              placeholder="验证码" 
                              value={formData.captcha}
                              onChange={e => handleInputChange('captcha', e.target.value)}
                              className={inputStyle}
                          />
                      </div>
                      <div 
                          className="w-28 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-all relative overflow-hidden group select-none"
                          onClick={generateCaptcha}
                      >
                          <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '3px 3px'}}></div>
                          <span className="text-xl font-mono font-black text-blue-600 tracking-widest italic transform -rotate-2 relative z-10">
                              {captchaCode}
                          </span>
                      </div>
                  </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                    {loading ? '处理中...' : (isLoginView ? '立即登录' : '立即注册')}
                </button>
            </form>
        </div>

        <div className="px-8 pb-8 pt-2">
             <div className="flex justify-between text-sm text-slate-500 mb-6">
                {isLoginView ? (
                  <>
                    <button onClick={() => { setIsLoginView(false); resetForm(); }} className="hover:text-blue-600 transition-colors">注册账号</button>
                    <button className="hover:text-blue-600 transition-colors">忘记密码?</button>
                  </>
                ) : (
                  <button onClick={() => { setIsLoginView(true); resetForm(); }} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> 返回登录
                  </button>
                )}
             </div>

             {/* Dev Tools - Login Only */}
             {isLoginView && (
               <div className="border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2 mb-3 text-xs text-slate-400 font-bold uppercase tracking-wider">
                      <Bug className="w-3 h-3" /> 测试专用通道
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => devQuickFill('admin')} className="p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-all text-xs font-bold text-purple-700">
                          填入管理员
                      </button>
                      <button onClick={() => devQuickFill('user')} className="p-2 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded transition-all text-xs font-bold text-cyan-700">
                          填入用户
                      </button>
                  </div>
               </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
