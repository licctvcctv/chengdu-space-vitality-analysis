
import { delay } from '../utils/delay';
import { userStorage, User } from '../utils/userStorage';
import { requestWithMock, unwrapResponse } from './apiClient';

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  token?: string; // Mock token
}

/**
 * Auth Service
 * 负责用户认证授权相关逻辑
 * 包含登录、注册、Token 管理等
 */
export const authService = {
  
  /**
   * 用户登录接口
   * 
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<LoginResult>} 登录结果，成功则包含用户信息和 Token
   */
  login: async (username: string, password: string): Promise<LoginResult> => {
    const response = await requestWithMock<LoginResult>({
      endpoint: '/api/recruitment/auth/login',
      method: 'POST',
      retries: 1,
      mockHandler: async () => {
        await delay(350);
        const result = userStorage.validateLogin(username, password);
        if (result.success && result.user) {
          return { ...result, token: 'mock-jwt-token-' + Date.now() };
        }
        return result;
      }
    });
    return unwrapResponse(response);
  },

  /**
   * 用户注册接口
   * 
   * @param {Partial<User>} userData - 注册用户信息
   * @returns {Promise<User>} 注册成功的用户对象
   */
  register: async (userData: Omit<User, 'id' | 'regDate' | 'status'>): Promise<User> => {
    const response = await requestWithMock<User>({
      endpoint: '/api/recruitment/auth/register',
      method: 'POST',
      retries: 1,
      mockHandler: async () => {
        await delay(500);
        return userStorage.addUser(userData);
      }
    });
    return unwrapResponse(response);
  }
};
