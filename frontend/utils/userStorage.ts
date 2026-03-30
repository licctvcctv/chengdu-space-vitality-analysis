// This utility handles all user persistence logic
export interface User {
  id: number;
  username: string;
  password?: string; // Optional for display, required for storage
  avatar: string;
  role: 'admin' | 'user';
  phone: string;
  regDate: string;
  status: boolean; // true = active, false = disabled
  nickname?: string;
}

const STORAGE_KEY = 'app_users_v1';

// Initial Seed Data (Only used if localStorage is empty)
const INITIAL_USERS: User[] = [
  {
    id: 1001,
    username: 'admin',
    password: '123456',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    role: 'admin',
    phone: '13800138000',
    regDate: '2024-01-01',
    status: true,
    nickname: '超级管理员'
  },
  {
    id: 1002,
    username: 'user',
    password: '123456',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
    role: 'user',
    phone: '13900139000',
    regDate: '2024-02-15',
    status: true,
    nickname: '普通用户'
  }
];

export const userStorage = {
  // Get all users
  getUsers: (): User[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(stored);
  },

  // Save all users
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  },

  // Add a new user
  addUser: (user: Omit<User, 'id' | 'regDate' | 'status'>): User => {
    const users = userStorage.getUsers();
    
    // Check duplicate
    if (users.some(u => u.username === user.username)) {
      throw new Error('用户名已存在');
    }

    const newUser: User = {
      ...user,
      id: Date.now(), // Simple ID generation
      regDate: new Date().toISOString().split('T')[0],
      status: true
    };

    users.unshift(newUser);
    userStorage.saveUsers(users);
    return newUser;
  },

  // Update a user
  updateUser: (updatedUser: User) => {
    const users = userStorage.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      userStorage.saveUsers(users);
    }
  },

  // Login Check
  validateLogin: (username: string, password: string): { success: boolean; user?: User; error?: string } => {
    const users = userStorage.getUsers();
    const target = users.find(u => u.username === username);

    if (!target) {
      return { success: false, error: '用户不存在' };
    }

    if (target.password !== password) {
      return { success: false, error: '密码错误' };
    }

    if (!target.status) {
      return { success: false, error: '账号已被封禁，请联系管理员' };
    }

    return { success: true, user: target };
  }
};
