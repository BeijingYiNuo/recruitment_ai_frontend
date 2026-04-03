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
      if (response.user !== undefined && response.user !== null) {
        localStorage.setItem('user', JSON.stringify(response.user))
      } else {
        localStorage.removeItem('user')
      }
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
    let user = null
    const userStr = localStorage.getItem('user')
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        user = JSON.parse(userStr)
      } catch (e) {
        console.error('Failed to parse user from localStorage', e)
      }
    }

    // 如果成功拿到带 ID 的 user 对象直接返回
    if (user && user.id !== undefined) {
      return user
    }

    // 后端有可能在登录时没有额外附加 user 信息，尝试从 JWT token 中提取 ID 解码
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1]
        // 兼容 URL-safe Base64
        const dec = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
        const payload = JSON.parse(dec)
        
        // 通常 FastAPI 生成的 JWT，用户唯一标识在 user_id, id, 或者 sub 里面
        const extractedId = payload.user_id ?? payload.id ?? payload.sub
        if (extractedId !== undefined) {
          return { id: extractedId, username: payload.username ?? payload.sub, role: payload.role }
        }
      } catch (e) {
        console.error('Failed to decode JWT token to extract user ID', e)
      }
    }

    return null
  }
}

export default authService
export const { isAuthenticated, getCurrentUser } = authService
