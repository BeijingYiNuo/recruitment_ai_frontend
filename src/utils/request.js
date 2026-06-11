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
        console.error('[Axios Response] 401 Unauthorized detected.', data)
        
        // 1. 彻底清理本地登录凭证
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // 2. 避免在已经是登录页时陷入无限死循环跳转
        if (window.location.pathname !== '/login') {
          // 只提示核心信息
          ElMessage.error(data?.detail || data?.message || '登录已失效，系统即将返回登录页...')
          
          // 3. 放弃会导致遮罩卡死、并发拦截失败的 router.push 软跳转
          // 直接下达底层页面重定向指令，确保能暴力粉碎所有的弹窗（ElDialog）和 DOM 锁定状态
          setTimeout(() => {
            window.location.href = '/login'
          }, 500)
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
    } else if (!error.config?._skipGlobalError) {
      ElMessage.error('网络连接超时或异常，请检查网络')
    }

    return Promise.reject(error.response?.data || error)
  }
)

export default request
