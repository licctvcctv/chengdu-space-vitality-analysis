import React, { useState, useEffect } from 'react';
import BigScreen from './components/BigScreen';
import AdminLayout from './admin/AdminLayout';
import AuthPage from './components/AuthPage';
import { useUI } from './components/ui/UIProvider';
import { userStorage } from './utils/userStorage';
import { resolveSessionUser } from './utils/sessionUser';

const App: React.FC = () => {
  const { message } = useUI();
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [userRole, setUserRole] = useState<'user' | 'admin' | null>(() => localStorage.getItem('userRole') as 'user' | 'admin' | null);
  const [currentView, setCurrentView] = useState<'vis' | 'admin'>(() => {
    const saved = localStorage.getItem('currentView');
    if (saved === 'vis' || saved === 'admin') return saved;
    return localStorage.getItem('userRole') === 'admin' ? 'admin' : 'vis';
  });

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
    if (currentView === 'admin') {
      document.body.classList.add('admin-mode');
    } else {
      document.body.classList.remove('admin-mode');
    }
    if (isLoggedIn) {
      const sessionUser = resolveSessionUser();
      if (!sessionUser) { handleLogout(true, "登录会话已失效"); return; }
      const allUsers = userStorage.getUsers();
      const freshUser = allUsers.find(u => u.id === sessionUser.id);
      if (!freshUser) { handleLogout(true, "账号不存在"); }
      else if (!freshUser.status) { handleLogout(true, "账号已被禁用"); }
      else { localStorage.setItem('currentUser', JSON.stringify(freshUser)); }
    }
  }, [currentView, isLoggedIn]);

  const handleLogin = (role: 'user' | 'admin') => {
    setIsLoggedIn(true);
    setUserRole(role);
    setCurrentView(role === 'admin' ? 'admin' : 'vis');
  };

  const handleLogout = (forced = false, msg = "") => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentView('vis');
    if (forced) message.error(msg || "已退出");
    else message.success("已安全退出");
  };

  if (!isLoggedIn) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return currentView === 'vis' ? (
    <BigScreen onSwitchMode={() => setCurrentView('admin')} />
  ) : (
    <AdminLayout
      userRole={userRole}
      onSwitchMode={() => setCurrentView('vis')}
      onLogout={() => handleLogout(false)}
    />
  );
};

export default App;
