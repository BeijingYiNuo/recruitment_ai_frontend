import { authApi } from '../api/auth'

// 认证服务业务层
const authService = {
  // 注册
  register: async (userData) => {
    return await authApi.register(userData)
  },

  // 登录
  login: async (credentials) => {
    const response = await authApi.login(credentials)
    if (response.access_token) {
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  },

  // 忘记密码
  forgotPassword: async (email) => {
    return await authApi.forgotPassword(email)
  },

  // 重置密码
  resetPassword: async (token, newPassword) => {
    return await authApi.resetPassword(token, newPassword)
  },

  // 登出
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // 检查是否已认证
  isAuthenticated: () => {
    return localStorage.getItem('token') !== null
  },

  // 获取当前用户
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }
}

export default authService
export const { isAuthenticated, getCurrentUser } = authService
