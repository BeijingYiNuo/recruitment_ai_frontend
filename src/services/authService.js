import axios from 'axios'

const API_URL = 'http://localhost:8001/api/auth'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器，添加token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 认证服务
const authService = {
  // 注册
  register: async (userData) => {
    try {
      const response = await apiClient.post('/register', userData)
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },

  // 登录
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/login', credentials)
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },

  // 忘记密码
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/forgot-password', { email })
      return response.data
    } catch (error) {
      throw error.response.data
    }
  },

  // 重置密码
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/reset-password', { token, new_password: newPassword })
      return response.data
    } catch (error) {
      throw error.response.data
    }
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
