import axios from 'axios'
import router from '../router'
import { ElMessage } from 'element-plus'
import { getMockResponse } from '../mock/mockData'

const isMockMode = import.meta.env.VITE_MOCK_MODE === 'true'

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
    // 调用方显式传入了 Authorization（如候选人 JWT）时不覆盖
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器 — 成功通路
request.interceptors.response.use(
  response => response.data,
  // 错误拦截：Mock 模式下返回示例数据，否则正常报错
  async error => {
    // Mock 模式：尝试返回示例数据
    if (isMockMode && error.response && error.response.status >= 500) {
      const url = error.config?.url || ''
      const mockData = getMockResponse(url)
      if (mockData !== null && mockData !== undefined) {
        console.log('[Mock] ✓', url, `→ ${Array.isArray(mockData) ? mockData.length + '条' : 'object'}`)
        return mockData
      }
      console.log('[Mock] ✗ 无匹配:', url)
    }

    if (error.response) {
      const { status, data } = error.response

      if (status === 401) {
        console.error('[Axios Response] 401 Unauthorized detected.', data)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          ElMessage.error(data?.detail || data?.message || '登录已失效，系统即将返回登录页...')
          setTimeout(() => { window.location.href = '/login' }, 500)
        }
      }
      // 402: 余额不足
      else if (status === 402) {
        const msg = data?.message || data?.detail || '余额不足'
        ElMessage.error(msg)
      }
      // 403: 权限不足
      else if (status === 403) {
        if (!isMockMode) ElMessage.error('权限不足，无法访问该资源')
      } else if (status >= 500) {
        if (!isMockMode) ElMessage.error('服务器内部错误，请稍后再试')
      }
    } else if (!isMockMode && !error.config?._skipGlobalError) {
      ElMessage.error('网络连接超时或异常，请检查网络')
    }

    return Promise.reject(error.response?.data || error)
  }
)

export default request
