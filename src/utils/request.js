import axios from 'axios'
import router from '../router'

// 1. 创建统一的 Axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 统一基础路径，从环境变量读取，默认为 /api
  timeout: 10000,                       // 统一超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 2. 请求拦截器：自动携带 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    console.log('[Axios Request]', config.method?.toUpperCase(), config.url, { hasToken: !!token })
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 3. 响应拦截器：统一处理错误 (如 401 登录失效)
request.interceptors.response.use(
  response => response.data, // 简化返回值提取
  error => {
    if (error.response) {
      // 401: Token 失效或未授权
      if (error.response.status === 401) {
         console.warn('[Axios Response] 401 Unauthorized - Clearing Token', error.config.url)
         localStorage.removeItem('token')
         localStorage.removeItem('user')
         // 跳转回登录页
         if (router.currentRoute.value.name !== 'login') {
           router.push('/login')
         }
      }
    }
    // 继续抛出具体的错误对象或通用错误，供业务层 catch
    return Promise.reject(error.response?.data || error)
  }
)

export default request
