
import { useState, useEffect, type FormEvent } from 'react';
import { authService } from '../api/authService';
import { useUI } from '../components/ui/UIProvider';
import { persistSessionUser } from '../utils/sessionUser';

interface AuthHandlers {
  onLoginSuccess: (role: 'user' | 'admin') => void;
}

export const useAuthLogic = ({ onLoginSuccess }: AuthHandlers) => {
  const { message } = useUI();
  
  const [isLoginView, setIsLoginView] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    nickname: '',
    captcha: ''
  });

  // Captcha Generator
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const resetForm = () => {
    setFormData({ username: '', password: '', phone: '', nickname: '', captcha: '' });
    generateCaptcha();
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Login Action
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.captcha || formData.captcha.toUpperCase() !== captchaCode) {
        message.error("验证码错误");
        generateCaptcha();
        return;
    }

    setLoading(true);
    
    try {
      const result = await authService.login(formData.username, formData.password);
      
      if (result.success && result.user) {
        // BUG FIX: Strictly check status before proceeding
        if (!result.user.status) {
           message.error("该账号已被封禁，请联系管理员");
           generateCaptcha();
           setLoading(false);
           return;
        }

        persistSessionUser(result.user);
        
        message.success(`欢迎回来，${result.user.nickname || result.user.username}`);
        onLoginSuccess(result.user.role);
      } else {
        message.error(result.error || "登录失败");
        generateCaptcha();
      }
    } catch (e) {
      message.error("系统错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  // Register Action
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.password || !formData.phone) {
      message.error("请填写完整信息");
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        username: formData.username,
        password: formData.password,
        phone: formData.phone,
        nickname: formData.nickname || `用户${Math.floor(Math.random()*1000)}`,
        role: 'user', 
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
      });
      message.success("注册成功，请登录");
      setIsLoginView(true);
      resetForm();
    } catch (err: any) {
      message.error(err.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  // Dev Tool
  const devQuickFill = (role: 'admin' | 'user') => {
    handleInputChange('username', role);
    handleInputChange('password', '123456');
    handleInputChange('captcha', captchaCode);
    setTimeout(() => {
        message.info(`已预填 ${role} 账号，请点击登录`);
    }, 100);
  };

  return {
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
  };
};
