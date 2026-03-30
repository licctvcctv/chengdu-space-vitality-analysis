
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, RefreshCw, Pencil, Trash2, KeyRound, X, 
  ChevronLeft, ChevronRight, MoreHorizontal 
} from 'lucide-react';
import { useUI } from '../components/ui/UIProvider';
import { userStorage, User } from '../utils/userStorage';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

// === Element Plus Style Components (Reused) ===
const ElButton = ({ children, type = 'default', icon: Icon, onClick, className = '', size = 'default' }: any) => {
  const baseStyle = "inline-flex items-center justify-center rounded transition-all duration-200 font-medium focus:outline-none";
  const sizeStyles = { small: "px-2 py-1 text-xs gap-1", default: "px-4 py-2 text-sm gap-2" };
  const typeStyles = {
    primary: "bg-[#409EFF] hover:bg-[#66b1ff] text-white border border-[#409EFF]",
    success: "bg-[#67C23A] hover:bg-[#85ce61] text-white border border-[#67C23A]",
    danger:  "bg-[#F56C6C] hover:bg-[#f78989] text-white border border-[#F56C6C]",
    warning: "bg-[#E6A23C] hover:bg-[#ebb563] text-white border border-[#E6A23C]",
    default: "bg-white hover:bg-blue-50 text-[#606266] hover:text-[#409EFF] border border-[#dcdfe6] hover:border-[#c6e2ff]",
    text: "bg-transparent text-[#409EFF] hover:text-[#66b1ff] px-0 py-0 border-none shadow-none",
    dangerText: "bg-transparent text-[#F56C6C] hover:text-[#f78989] px-0 py-0 border-none shadow-none",
    warningText: "bg-transparent text-[#E6A23C] hover:text-[#ebb563] px-0 py-0 border-none shadow-none",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${sizeStyles[size as keyof typeof sizeStyles]} ${typeStyles[type as keyof typeof typeStyles]} ${className}`}>
      {Icon && <Icon className={size === 'small' ? "w-3 h-3" : "w-4 h-4"} />}
      {children}
    </button>
  );
};

const ElTag = ({ type, children }: { type: 'danger' | 'primary' | 'success' | 'info', children?: React.ReactNode }) => {
  const styles = {
    danger: "bg-[#fef0f0] border-[#fde2e2] text-[#F56C6C]",
    primary: "bg-[#ecf5ff] border-[#d9ecff] text-[#409EFF]",
    success: "bg-[#f0f9eb] border-[#e1f3d8] text-[#67C23A]",
    info: "bg-[#f4f4f5] border-[#e9e9eb] text-[#909399]",
  };
  return <span className={`px-2 py-0.5 text-xs rounded border ${styles[type]}`}>{children}</span>;
};

const ElSwitch = ({ value, onChange }: { value: boolean, onChange: () => void }) => (
  <div onClick={onChange} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-300 ${value ? 'bg-[#409EFF]' : 'bg-[#dcdfe6]'}`}>
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${value ? 'left-[22px]' : 'left-0.5'}`}></div>
  </div>
);

const UserManagement: React.FC = () => {
  const { message, confirm } = useUI();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<User>>({});

  // === Load Data from LocalStorage ===
  const loadUsers = () => {
    const data = userStorage.getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Logic: Filter & Pagination
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.username.toLowerCase().includes(searchName.toLowerCase()) ||
      user.phone.includes(searchName)
    );
  }, [users, searchName]);

  const total = filteredUsers.length;
  const paginatedData = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(total / pageSize);

  // === Actions ===

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm('此操作将永久删除该用户，是否继续？', { type: 'warning', confirmText: '删除' });
    if (isConfirmed) {
      const newUsers = users.filter(u => u.id !== id);
      setUsers(newUsers);
      userStorage.saveUsers(newUsers);
      message.success("删除成功");
    }
  };

  const handleStatusToggle = (user: User) => {
    const newStatus = !user.status;
    const updatedUser = { ...user, status: newStatus };
    userStorage.updateUser(updatedUser);
    
    // Update local state immediately
    setUsers(users.map(u => u.id === user.id ? updatedUser : u));
    message.info(newStatus ? `已启用用户 ${user.username}` : `已禁用用户 ${user.username}`);
  };

  const handleResetPassword = async (user: User) => {
    const isConfirmed = await confirm(`确定要重置用户 ${user.username} 的密码吗？`, { type: 'info' });
    if (isConfirmed) {
      const updatedUser = { ...user, password: '123456' };
      userStorage.updateUser(updatedUser);
      setUsers(users.map(u => u.id === user.id ? updatedUser : u));
      message.success(`密码已重置为: 123456`);
    }
  };

  const handleSave = () => {
    if (!formData.username || !formData.phone) {
      message.error("请填写必填项");
      return;
    }

    if (modalMode === 'add') {
      try {
        const newUser = userStorage.addUser({
          username: formData.username!,
          password: '123456', // Default pwd
          phone: formData.phone!,
          role: formData.role || 'user',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
        });
        setUsers([newUser, ...users]);
        message.success("新增用户成功 (默认密码 123456)");
      } catch (err: any) {
        message.error(err.message);
        return;
      }
    } else {
      // Edit
      const updatedUser = { ...formData } as User;
      userStorage.updateUser(updatedUser);
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      message.success("更新成功");
    }
    setIsModalOpen(false);
  };

  // === Modal Handlers ===
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ role: 'user', status: true });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setFormData({ ...user });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-100">
      
      {/* Top Search Bar */}
      <div className="flex flex-wrap gap-4 items-center mb-6 p-4 bg-[#f5f7fa] rounded-md border border-[#ebeef5]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#606266] font-medium">搜索用户:</span>
          <input 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="px-3 py-1.5 border border-[#dcdfe6] rounded text-sm focus:outline-none focus:border-[#409EFF] w-56"
            placeholder="输入用户名或手机号"
          />
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <ElButton type="primary" icon={Search} onClick={() => setCurrentPage(1)}>查询</ElButton>
          <ElButton type="default" icon={RefreshCw} onClick={() => { setSearchName(''); loadUsers(); }}>刷新</ElButton>
          <div className="w-[1px] h-6 bg-[#dcdfe6] mx-2"></div>
          <ElButton type="success" icon={Plus} onClick={openAddModal}>新增用户</ElButton>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-[#ebeef5] rounded-t-md relative">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#f5f7fa] text-[#909399] sticky top-0 z-10 font-medium">
            <tr>
              <th className="px-4 py-3 border-b">ID</th>
              <th className="px-4 py-3 border-b">用户</th>
              <th className="px-4 py-3 border-b">角色</th>
              <th className="px-4 py-3 border-b">手机号</th>
              <th className="px-4 py-3 border-b">注册时间</th>
              <th className="px-4 py-3 border-b">状态</th>
              <th className="px-4 py-3 border-b text-center w-64">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebeef5]">
            {paginatedData.map((user) => (
              <tr key={user.id} className="hover:bg-[#f5f7fa] transition-colors">
                <td className="px-4 py-3 text-[#606266] font-mono">{user.id}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <ImageWithFallback 
                    src={user.avatar} 
                    alt={user.username} 
                    className="w-8 h-8 rounded-full bg-slate-100" 
                  />
                  <span className="font-medium">{user.username}</span>
                </td>
                <td className="px-4 py-3">
                  <ElTag type={user.role === 'admin' ? 'danger' : 'primary'}>
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </ElTag>
                </td>
                <td className="px-4 py-3 text-[#606266]">{user.phone}</td>
                <td className="px-4 py-3 text-[#909399]">{user.regDate}</td>
                <td className="px-4 py-3">
                  <ElSwitch value={user.status} onChange={() => handleStatusToggle(user)} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center items-center gap-2">
                    <ElButton type="text" size="small" icon={Pencil} onClick={() => openEditModal(user)}>编辑</ElButton>
                    <ElButton type="warningText" size="small" icon={KeyRound} onClick={() => handleResetPassword(user)}>重置密码</ElButton>
                    <ElButton type="dangerText" size="small" icon={Trash2} onClick={() => handleDelete(user.id)}>删除</ElButton>
                  </div>
                </td>
              </tr>
            ))}
             {paginatedData.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center px-2">
        <span className="text-sm text-[#606266]">共 {total} 条</span>
        <div className="flex items-center gap-1">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded border bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-2 text-sm">第 {currentPage} 页 / 共 {totalPages || 1} 页</span>
          <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded border bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-[500px] rounded shadow-2xl relative z-10 flex flex-col animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-lg font-medium">{modalMode === 'add' ? '新增用户' : '编辑用户'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-blue-500" /></button>
            </div>
            
            <div className="p-6 space-y-4">
               <div className="flex items-center">
                 <label className="w-24 text-right pr-3 text-[#606266] text-sm">用户名</label>
                 <input 
                   disabled={modalMode === 'edit'}
                   value={formData.username || ''} 
                   onChange={e => setFormData({...formData, username: e.target.value})}
                   className="flex-1 px-3 py-2 border rounded text-sm focus:border-blue-500 disabled:bg-gray-100"
                   placeholder="请输入用户名"
                 />
               </div>
               <div className="flex items-center">
                 <label className="w-24 text-right pr-3 text-[#606266] text-sm">手机号</label>
                 <input 
                   value={formData.phone || ''} 
                   onChange={e => setFormData({...formData, phone: e.target.value})}
                   className="flex-1 px-3 py-2 border rounded text-sm focus:border-blue-500"
                   placeholder="请输入手机号"
                 />
               </div>
               <div className="flex items-center">
                 <label className="w-24 text-right pr-3 text-[#606266] text-sm">角色</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="role" checked={formData.role === 'user'} onChange={() => setFormData({...formData, role: 'user'})} /> 普通用户
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="role" checked={formData.role === 'admin'} onChange={() => setFormData({...formData, role: 'admin'})} /> 管理员
                    </label>
                 </div>
               </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3 bg-[#f5f7fa] rounded-b">
              <ElButton onClick={() => setIsModalOpen(false)}>取消</ElButton>
              <ElButton type="primary" onClick={handleSave}>确定</ElButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
