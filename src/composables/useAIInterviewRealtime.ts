/**
 * AI 面试实时 WebSocket 通道。
 * 负责 /api/ai-interview/realtime/{runtime_session_id} 的连接、
 * 音频事件上行、统一事件下行分发、断线重连与心跳保活。
 */

export interface AIRealtimeHandlers {
  onMessage: (msg: Record<string, any>) => void
  onOpen?: () => void
  onReconnecting?: (attempt: number) => void
  onClose?: () => void
  onError?: (err: any) => void
}

const RECONNECT_BASE_MS = 1000 // 首次重连等待
const RECONNECT_MAX_MS = 10000 // 重连等待上限（指数退避封顶）
const RECONNECT_MAX_ATTEMPTS = 5 // 最多重连次数，超过后放弃并触发 onClose
const HEARTBEAT_INTERVAL_MS = 20000 // ping 间隔
const HEARTBEAT_TIMEOUT_MS = 45000 // 超过该时长未收到任何服务端消息，判定断线

export function useAIInterviewRealtime() {
  let socket: WebSocket | null = null
  let handlers: AIRealtimeHandlers | null = null
  let runtimeSessionId = ''
  let candidateToken = ''

  let seq = 0 // 上行事件 seq（前端维护的单调递增序号）
  let closedByUser = false // 主动 close / 页面卸载时不再重连
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let lastMessageAt = 0

  function buildUrl(rid: string, token: string): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/api/ai-interview/realtime/${rid}?token=${encodeURIComponent(token)}`
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    lastMessageAt = Date.now()
    heartbeatTimer = setInterval(() => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return
      // 长时间无任何消息（含 pong）→ 判定连接已死，关闭以触发重连
      if (Date.now() - lastMessageAt > HEARTBEAT_TIMEOUT_MS) {
        socket.close()
        return
      }
      // 主动 ping，服务端回 pong 即可视为存活
      socket.send(JSON.stringify({ type: 'ping' }))
    }, HEARTBEAT_INTERVAL_MS)
  }

  function clearTimers() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    stopHeartbeat()
  }

  function scheduleReconnect() {
    if (closedByUser) return
    if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      // 重连多次仍失败，放弃并通知调用方
      handlers?.onClose?.()
      return
    }
    reconnectAttempts += 1
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** (reconnectAttempts - 1), RECONNECT_MAX_MS)
    handlers?.onReconnecting?.(reconnectAttempts)
    reconnectTimer = setTimeout(() => _open(), delay)
  }

  function _open() {
    if (socket) {
      const old = socket
      socket = null
      try {
        old.onclose = null
        old.close()
      } catch {
        /* ignore */
      }
    }

    socket = new WebSocket(buildUrl(runtimeSessionId, candidateToken))
    socket.onopen = () => {
      reconnectAttempts = 0
      startHeartbeat()
      handlers?.onOpen?.()
    }
    socket.onmessage = (ev: MessageEvent) => {
      lastMessageAt = Date.now()
      let msg: Record<string, any>
      try {
        msg = JSON.parse(ev.data)
      } catch {
        return
      }
      handlers?.onMessage(msg)
    }
    socket.onclose = () => {
      socket = null
      stopHeartbeat()
      if (closedByUser) {
        handlers?.onClose?.()
        return
      }
      scheduleReconnect()
    }
    socket.onerror = (err) => handlers?.onError?.(err)
  }

  function connect(rid: string, token: string, h: AIRealtimeHandlers): void {
    runtimeSessionId = rid
    candidateToken = token
    handlers = h
    closedByUser = false
    reconnectAttempts = 0
    clearTimers()
    _open()
  }

  function sendAudioDelta(pcm: ArrayBuffer): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(
      JSON.stringify({
        type: 'candidate.audio.delta',
        session_id: runtimeSessionId,
        seq: ++seq,
        audio_format: 'pcm_s16le',
        sample_rate: 16000,
        data: arrayBufferToBase64(pcm),
      }),
    )
  }

  function sendEnd(reason = 'candidate_submit'): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ type: 'session.end', reason }))
  }

  function sendInterrupt(): void {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify({ type: 'assistant.interrupt' }))
  }

  function close(): void {
    closedByUser = true
    clearTimers()
    if (socket) {
      const s = socket
      socket = null
      try {
        s.onclose = null
        s.close()
      } catch {
        /* ignore */
      }
    }
    handlers?.onClose?.()
  }

  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)))
    }
    return btoa(binary)
  }

  return { connect, sendAudioDelta, sendEnd, sendInterrupt, close }
}
