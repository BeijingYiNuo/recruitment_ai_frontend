import { fetchEventSource } from '@microsoft/fetch-event-source'

const BASE_URL = 'http://localhost:8001/api'

/**
 * 封装统一的 SSE 连接函数
 * @param {string} url - 基于 BASE_URL 的路径
 * @param {Object} options - 回调事件 (onopen, onmessage, onerror, onclose 等)
 * @returns {AbortController} 可以通过返回实例调用 .abort() 取消连接
 */
export function createSSEConnection(url, options = {}) {
  const token = localStorage.getItem('token')
  const abortController = new AbortController()

  fetchEventSource(`${BASE_URL}${url}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream'
    },
    signal: abortController.signal,
    openWhenHidden: true, // 页面切到后台时不要断开
    ...options
  })

  return abortController
}
