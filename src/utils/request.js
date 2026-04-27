import axios from 'axios'
import router from '../router'
import { ElMessage } from 'element-plus'

// 创建统一的 Axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      const { status, data } = error.response
      
      // 401: Token 失效、过期或未授权
      if (status === 401) {
        console.warn('[Axios Response] 401 Unauthorized - Redirecting to login')
        
        // 1. 清理本地数据
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // 2. 避免在登录页重复提示和跳转
        if (router.currentRoute.value.path !== '/login') {
          ElMessage.error(data?.detail || data?.message || '登录已过期，请重新登录')
          router.push('/login')
        }
      } 
      // 403: 权限不足
      else if (status === 403) {
        ElMessage.error('权限不足，无法访问该资源')
      }
      // 其他错误
      else if (status >= 500) {
        ElMessage.error('服务器内部错误，请稍后再试')
      }
    } else {
      ElMessage.error('网络连接超时或异常，请检查网络')
    }

    return Promise.reject(error.response?.data || error)
  }
)

export default request
